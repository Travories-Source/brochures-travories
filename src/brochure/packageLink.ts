import type { BrochurePackageSource } from "./source";

const SITE_ORIGIN = "https://travories.com";

/** Shape returned by `GET /agency-package/resolve-path`. */
interface ResolvedPath {
  canonicalPath?: string | null;
}

/**
 * Public URL for a package, or null when it has no public page.
 *
 * The agency detail payload carries none of `url`, `activitySlug` or
 * `packageCode`, so the canonical `/{activitySlug}/{routeSlug}/{packageCode}`
 * path cannot be composed locally — `uniqueCode` ("VH-NPHHL8QJ") is a different
 * identifier from `packageCode` ("hij"), and guessing produces a link that
 * soft-404s. Instead we ask the resolver that already backs every package 301:
 * it accepts the legacy `/package/{slug}` alias, which the payload *does* have.
 *
 * Returns null for unpublished packages — the resolver answers null for
 * anything not live, and a QR code pointing at a 404 is worse than none.
 */
export async function resolvePackageUrl(pkg: BrochurePackageSource): Promise<string | null> {
  const slug = pkg.slug?.trim();
  if (!slug) return null;

  const base = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL)?.replace(/\/$/, "");
  if (!base) return null;

  try {
    const response = await fetch(
      `${base}/agency-package/resolve-path?path=${encodeURIComponent(`/package/${slug}`)}`,
      { cache: "no-store" },
    );
    if (!response.ok) return null;

    const text = await response.text();
    if (!text.trim()) return null;

    const resolved = JSON.parse(text) as ResolvedPath | null;
    const path = resolved?.canonicalPath?.trim();
    return path ? `${SITE_ORIGIN}${path}` : null;
  } catch {
    return null;
  }
}
