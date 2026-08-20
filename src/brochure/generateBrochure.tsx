import { pdf } from "@react-pdf/renderer";

import type { BrochurePackageSource } from "./source";

import { ensureBrochureFonts } from "./fonts";
import { buildBrochureModel, type BrochureModel } from "./model";
import { resolvePackageUrl } from "./packageLink";
import { PackageBrochureDocument } from "./PackageBrochureDocument";
import type { BrochureParty } from "./party";
import { buildQrMatrix, type QrMatrix } from "./qr";

/**
 * The Figma frame is a single continuous canvas (1440 x 7798), and the
 * reference export is one 1440pt-wide page — not a paginated A4 document. To
 * reproduce that we need the exact content height up front, which @react-pdf
 * does not expose.
 *
 * So we binary-search it: the smallest page height at which the document still
 * lays out as exactly one page *is* the content height. Each step renders the
 * real document — roughly 13 renders at ~100ms — and the winning render is the
 * one we hand back, so the measurement can never disagree with the output.
 */
const MIN_HEIGHT = 600;
const MAX_HEIGHT = 40000;
const HEIGHT_TOLERANCE = 6;

const proxied = (url: string) => `/api/media-proxy?url=${encodeURIComponent(url)}`;

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

/** Longest edge, in px, that any photo is downscaled to before embedding. */
const MAX_IMAGE_EDGE = 1400;

/**
 * Fallback re-encode for anything @react-pdf cannot decode.
 *
 * The model asks the CDN for JPEG renditions (see `asJpeg` in `model.ts`), so
 * this should not normally run. It stays as a safety net because @react-pdf
 * ships its own decoders and rejects formats the browser handles fine — WebP
 * outright, and 16-bit or interlaced PNGs with "Incomplete or corrupt PNG
 * file", after which the image silently vanishes from the page.
 *
 * The blob comes from our own origin via the proxy, so the canvas is untainted.
 */
async function normalizeImage(blob: Blob): Promise<string> {
  const bitmap = await createImageBitmap(blob);
  try {
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("2d context unavailable");
    context.drawImage(bitmap, 0, 0, width, height);

    return canvas.toDataURL("image/jpeg", 0.9);
  } finally {
    bitmap.close?.();
  }
}

/**
 * Fetch every referenced photo and normalise it to an embeddable data URL.
 *
 * Failures are non-fatal: a missing photo renders as a neutral placeholder
 * rather than aborting the whole brochure.
 */
async function loadImages(urls: string[]): Promise<Record<string, string>> {
  const entries = await Promise.all(
    urls.map(async (url) => {
      try {
        const response = await fetch(proxied(url));
        if (!response.ok) return null;

        const blob = await response.blob();

        // Fast path: the CDN already served a format @react-pdf can embed, so
        // hand the bytes straight over — no re-encode, no quality loss.
        if (/^image\/(jpeg|png)$/.test(blob.type)) {
          return [url, await blobToDataUrl(blob)] as const;
        }

        try {
          return [url, await normalizeImage(blob)] as const;
        } catch {
          // Undecodable and no canvas to convert it: a null here renders the
          // placeholder box, which beats @react-pdf dropping the image.
          return null;
        }
      } catch {
        return null;
      }
    }),
  );

  return Object.fromEntries(entries.filter(Boolean) as (readonly [string, string])[]);
}

/**
 * Count pages in a rendered PDF.
 *
 * @react-pdf does expose a `totalPages` render callback, but wiring one in adds
 * a `fixed` node to the page and that measurably changes pagination — the same
 * content fitted 7306pt with the callback present and needed 7566pt without it.
 * Counting page objects in the finished bytes measures the document we actually
 * ship. pdfkit writes these dictionaries uncompressed, so a scan is reliable.
 */
async function countPdfPages(blob: Blob): Promise<number> {
  const text = new TextDecoder("latin1").decode(await blob.arrayBuffer());
  const matches = text.match(/\/Type\s*\/Page[^s]/g);
  return matches?.length || 1;
}

interface Rendered {
  blob: Blob;
  pages: number;
}

interface RenderInputs {
  model: BrochureModel;
  images: Record<string, string>;
  qr: QrMatrix | null;
  packageUrl: string | null;
}

async function renderAt(inputs: RenderInputs, height: number): Promise<Rendered> {
  const blob = await pdf(
    <PackageBrochureDocument
      model={inputs.model}
      images={inputs.images}
      height={height}
      qr={inputs.qr}
      packageUrl={inputs.packageUrl}
    />,
  ).toBlob();
  return { blob, pages: await countPdfPages(blob) };
}

/**
 * Find the shortest page height that still holds the whole brochure, and return
 * that render. Binary search over ~13 renders, each around 100ms.
 */
async function fitToOnePage(inputs: RenderInputs): Promise<{ blob: Blob; height: number; pages: number }> {
  let low = MIN_HEIGHT;
  let high = MAX_HEIGHT;

  // The upper bound doubles as the fallback: if even MAX_HEIGHT cannot hold the
  // content, we ship that render rather than failing outright.
  let best = await renderAt(inputs, high);

  while (high - low > HEIGHT_TOLERANCE) {
    const mid = Math.round((low + high) / 2);
    const candidate = await renderAt(inputs, mid);
    if (candidate.pages <= 1) {
      high = mid;
      best = candidate;
    } else {
      low = mid;
    }
  }

  return { blob: best.blob, height: high, pages: best.pages };
}

export interface BrochureResult {
  blob: Blob;
  filename: string;
  height: number;
}

const slugify = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80) || "package";

/**
 * Build the brochure PDF for a package. Runs entirely in the browser.
 */
export async function generatePackageBrochure(
  pkg: BrochurePackageSource,
  party?: BrochureParty,
): Promise<BrochureResult> {
  await ensureBrochureFonts();

  const model = buildBrochureModel(pkg, party);

  const [images, packageUrl] = await Promise.all([loadImages(model.imageUrls), resolvePackageUrl(pkg)]);
  // No public page (draft or inactive package) means no QR — a code that leads
  // to a 404 is worse than none at all.
  const qr = packageUrl ? buildQrMatrix(packageUrl) : null;

  const { blob, height } = await fitToOnePage({ model, images, qr, packageUrl });

  return { blob, filename: `${slugify(model.title)}.pdf`, height };
}

/** Generate the brochure and hand it straight to the browser's downloader. */
export async function downloadPackageBrochure(
  pkg: BrochurePackageSource,
  party?: BrochureParty,
): Promise<void> {
  const { blob, filename } = await generatePackageBrochure(pkg, party);

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoking immediately can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
