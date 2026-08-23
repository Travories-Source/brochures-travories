import { pdf } from "@react-pdf/renderer";

import type { BrochurePackageSource } from "./source.js";

import { ensureBrochureFonts } from "./fonts.js";
import { buildBrochureModel, type BrochureModel } from "./model.js";
import { countPdfPages, fitToOnePage } from "./pageFit.js";
import { resolvePackageUrl } from "./packageLink.js";
import { PackageBrochureDocument } from "./PackageBrochureDocument.js";
import type { BrochureParty } from "./party.js";
import { buildQrMatrix, type QrMatrix } from "./qr.js";

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

interface RenderInputs {
  model: BrochureModel;
  images: Record<string, string>;
  qr: QrMatrix | null;
  packageUrl: string | null;
}

/** One render of the brochure at a given page height, plus its page count. */
async function renderAt(inputs: RenderInputs, height: number): Promise<{ output: Blob; pages: number }> {
  const blob = await pdf(
    <PackageBrochureDocument
      model={inputs.model}
      images={inputs.images}
      height={height}
      qr={inputs.qr}
      packageUrl={inputs.packageUrl}
    />,
  ).toBlob();
  return { output: blob, pages: countPdfPages(new Uint8Array(await blob.arrayBuffer())) };
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

  const inputs: RenderInputs = { model, images, qr, packageUrl };
  const { output: blob, height } = await fitToOnePage((h) => renderAt(inputs, h));

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
