import { createHash, timingSafeEqual } from "node:crypto";
import { join } from "node:path";

import Fastify, { type FastifyInstance } from "fastify";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";

import { PackageBrochureDocument } from "./brochure/PackageBrochureDocument.js";
import { registerBrochureFonts } from "./brochure/fonts.js";
import { buildBrochureModel } from "./brochure/model.js";
import { countPdfPages, fitToOnePage } from "./brochure/pageFit.js";
import type { BrochureParty } from "./brochure/party.js";
import { buildQrMatrix } from "./brochure/qr.js";
import type { BrochurePackageSource } from "./brochure/source.js";
import { BROCHURE_A4_PAGE_HEIGHT } from "./brochure/theme.js";

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const fontDir = join(process.cwd(), "assets", "fonts", "brochure");

type RequestBody = {
  package: BrochurePackageSource;
  party?: BrochureParty;
  packageUrl?: string;
  /** "a4" paginates into printable pages; anything else keeps one tall page. */
  layout?: "continuous" | "a4";
  includeRouteMaps?: boolean;
};

const asDataUrl = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(15_000) });
    if (!response.ok) return null;
    const type = response.headers.get("content-type") ?? "";
    if (!/^image\/(jpeg|png)$/.test(type)) return null;
    const length = Number(response.headers.get("content-length") ?? 0);
    if (length > MAX_IMAGE_BYTES) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > MAX_IMAGE_BYTES) return null;
    return `data:${type};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
};

const loadImages = async (urls: string[]) =>
  Object.fromEntries(
    (await Promise.all(urls.map(async (url) => {
      const data = await asDataUrl(url);
      return data ? ([url, data] as const) : null;
    }))).filter(Boolean) as [string, string][],
  );

const isAuthorized = (received: string | undefined, expected: string) => {
  if (!received) return false;
  const receivedHash = createHash("sha256").update(received).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(receivedHash, expectedHash);
};

async function render(body: RequestBody): Promise<{ bytes: Buffer; filename: string }> {
  const model = buildBrochureModel(body.package, body.party);
  if (body.includeRouteMaps === false) model.days = model.days.map((day) => ({ ...day, routeMap: null }));
  const images = await loadImages(model.imageUrls);

  // Callers decide QR eligibility, because only they know the package's status:
  // a code is sent only for packages that have a public page to scan through
  // to. A URL here therefore always means "draw the code".
  const packageUrl = body.packageUrl?.trim() || null;
  const qr = packageUrl ? buildQrMatrix(packageUrl) : null;

  const paged = body.layout === "a4";
  const renderAt = async (height: number) => {
    const document = React.createElement(PackageBrochureDocument, {
      model,
      images,
      height,
      qr,
      packageUrl,
      paged,
    });
    const output = Buffer.from(await renderToBuffer(document as any));
    return { output, pages: countPdfPages(output) };
  };

  // Paginated output has a page height by definition. Otherwise the layout is
  // one continuous canvas and the page has to be trimmed to its content:
  // rendering at a fixed generous height leaves tens of thousands of points of
  // blank page below the brochure.
  const { output: bytes } = paged
    ? await renderAt(BROCHURE_A4_PAGE_HEIGHT)
    : await fitToOnePage(renderAt);
  const filename = `${model.title.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 80) || "package"}.pdf`;
  return { bytes: Buffer.from(bytes), filename };
}

export function createApp(token?: string): FastifyInstance {
  registerBrochureFonts(fontDir);
  const app = Fastify({ logger: true, bodyLimit: 2 * 1024 * 1024 });

  app.get("/health", async () => ({ ok: true }));

  app.post<{ Body: RequestBody }>("/v1/package-brochures", async (request, reply) => {
    if (!token) {
      return reply.code(503).send({ error: "Brochure service is not configured" });
    }
    const receivedToken = request.headers["x-brochure-service-token"];
    if (!isAuthorized(Array.isArray(receivedToken) ? receivedToken[0] : receivedToken, token)) {
      return reply.code(401).send({ error: "Unauthorized" });
    }
    if (!request.body?.package || typeof request.body.package !== "object") {
      return reply.code(400).send({ error: "A package payload is required" });
    }

    const result = await render(request.body);
    return reply
      .header("content-type", "application/pdf")
      .header("content-disposition", `attachment; filename="${result.filename}"`)
      .header("cache-control", "private, no-store")
      .send(result.bytes);
  });

  return app;
}

const token = process.env.BROCHURE_SERVICE_TOKEN;
if (import.meta.url === `file://${process.argv[1]}`) {
  if (!token) throw new Error("BROCHURE_SERVICE_TOKEN must be set");
  createApp(token)
    .listen({ host: process.env.HOST ?? "0.0.0.0", port: Number(process.env.PORT ?? 3001) })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
