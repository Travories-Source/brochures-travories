/**
 * The Figma frame is a single continuous canvas (1440 x 7798), and the
 * reference export is one 1440pt-wide page — not a paginated A4 document. To
 * reproduce that we need the exact content height up front, which @react-pdf
 * does not expose.
 *
 * So we binary-search it: the smallest page height at which the document still
 * lays out as exactly one page *is* the content height. Each step renders the
 * real document, and the winning render is the one we hand back, so the
 * measurement can never disagree with the output.
 *
 * Both entry points share this: the browser renders to a Blob, the service
 * renders to a Buffer. Skipping it is what produced 1440 x 40000 PDFs — one
 * screenful of brochure followed by 30,000pt of blank page.
 */
export const MIN_PAGE_HEIGHT = 600;
export const MAX_PAGE_HEIGHT = 40000;
export const HEIGHT_TOLERANCE = 6;

/**
 * Count pages in a rendered PDF.
 *
 * @react-pdf does expose a `totalPages` render callback, but wiring one in adds
 * a `fixed` node to the page and that measurably changes pagination — the same
 * content fitted 7306pt with the callback present and needed 7566pt without it.
 * Counting page objects in the finished bytes measures the document we actually
 * ship. pdfkit writes these dictionaries uncompressed, so a scan is reliable.
 */
export function countPdfPages(bytes: Uint8Array): number {
  const text = new TextDecoder("latin1").decode(bytes);
  const matches = text.match(/\/Type\s*\/Page[^s]/g);
  return matches?.length || 1;
}

export interface FittedRender<T> {
  output: T;
  height: number;
  pages: number;
}

/**
 * Find the shortest page height that still holds the whole brochure, and return
 * that render. Binary search over ~13 renders.
 *
 * `renderAt` must return both the render and its page count; keeping them
 * together is what guarantees the returned document is the one that was
 * measured.
 */
export async function fitToOnePage<T>(
  renderAt: (height: number) => Promise<{ output: T; pages: number }>,
): Promise<FittedRender<T>> {
  let low = MIN_PAGE_HEIGHT;
  let high = MAX_PAGE_HEIGHT;

  // The upper bound doubles as the fallback: if even MAX_PAGE_HEIGHT cannot
  // hold the content, we ship that render rather than failing outright.
  let best = await renderAt(high);

  while (high - low > HEIGHT_TOLERANCE) {
    const mid = Math.round((low + high) / 2);
    const candidate = await renderAt(mid);
    if (candidate.pages <= 1) {
      high = mid;
      best = candidate;
    } else {
      low = mid;
    }
  }

  return { output: best.output, height: high, pages: best.pages };
}
