import { createHash, timingSafeEqual } from "node:crypto";
import { join } from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { PackageBrochureDocument } from "./brochure/PackageBrochureDocument.js";
import { registerBrochureFonts } from "./brochure/fonts.js";
import { buildBrochureModel } from "./brochure/model.js";
import { countPdfPages, fitToOnePage } from "./brochure/pageFit.js";
import type { BrochureParty } from "./brochure/party.js";
import type { BrochurePackageSource } from "./brochure/source.js";

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
registerBrochureFonts(join(process.cwd(), "assets", "fonts", "brochure"));
type RequestBody = { package: BrochurePackageSource; party?: BrochureParty; packageUrl?: string };

const authorised = (received: string | null, expected: string) =>
  !!received && timingSafeEqual(createHash("sha256").update(received).digest(), createHash("sha256").update(expected).digest());

const toDataUrl = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(15_000) });
    const type = response.headers.get("content-type") ?? "";
    if (!response.ok || !/^image\/(jpeg|png)$/.test(type)) return null;
    if (Number(response.headers.get("content-length") ?? 0) > MAX_IMAGE_BYTES) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    return bytes.length <= MAX_IMAGE_BYTES ? `data:${type};base64,${bytes.toString("base64")}` : null;
  } catch { return null; }
};

const render = async (body: RequestBody) => {
  const model = buildBrochureModel(body.package, body.party);
  const entries = await Promise.all(model.imageUrls.map(async (url) => {
    const data = await toDataUrl(url);
    return data ? ([url, data] as const) : null;
  }));
  const images = Object.fromEntries(entries.filter(Boolean) as [string, string][]);
  // Trim the page to the content — a fixed height leaves the brochure sitting
  // on tens of thousands of points of blank page. See ./brochure/pageFit.ts.
  const renderAt = async (height: number) => {
    const document = React.createElement(PackageBrochureDocument, {
      model, images, height, qr: null, packageUrl: body.packageUrl ?? null,
    });
    const output = Buffer.from(await renderToBuffer(document as any));
    return { output, pages: countPdfPages(output) };
  };
  const { output: pdf } = await fitToOnePage(renderAt);
  const name = model.title.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 80) || "package";
  return { pdf, name };
};

export default {
  async fetch(request: Request) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") return Response.json({ ok: true });
    if (request.method !== "POST" || url.pathname !== "/v1/package-brochures") return Response.json({ error: "Not found" }, { status: 404 });
    const token = process.env.BROCHURE_SERVICE_TOKEN;
    if (!token) return Response.json({ error: "Brochure service is not configured" }, { status: 503 });
    if (!authorised(request.headers.get("x-brochure-service-token"), token)) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json() as RequestBody;
    if (!body?.package || typeof body.package !== "object") return Response.json({ error: "A package payload is required" }, { status: 400 });
    const result = await render(body);
    return new Response(result.pdf, { headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="${result.name}.pdf"`, "cache-control": "private, no-store" } });
  },
};
