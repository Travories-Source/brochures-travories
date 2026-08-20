import { Font } from "@react-pdf/renderer";

import { BROCHURE_FONT } from "./theme.js";

/**
 * Where the brochure TTFs live.
 *
 * In the browser this is a public path served by Next; the render-check script
 * passes an absolute filesystem directory instead. @react-pdf accepts either.
 */
export const DEFAULT_FONT_BASE = "/fonts/brochure";

let registeredBase: string | null = null;

/**
 * Register Poppins + Bricolage Grotesque for the brochure.
 *
 * Both families are namespaced ("…Brochure") so registering them can never
 * collide with the `next/font` Poppins the rest of the app uses.
 *
 * WOFF2 is not an option here — @react-pdf reads TTF/OTF only.
 */
export function registerBrochureFonts(base: string = DEFAULT_FONT_BASE): void {
  if (registeredBase === base) return;

  Font.register({
    family: BROCHURE_FONT.sans,
    fonts: [
      { src: `${base}/Poppins-Regular.ttf`, fontWeight: 400 },
      { src: `${base}/Poppins-Italic.ttf`, fontWeight: 400, fontStyle: "italic" },
      { src: `${base}/Poppins-Medium.ttf`, fontWeight: 500 },
      { src: `${base}/Poppins-SemiBold.ttf`, fontWeight: 600 },
      { src: `${base}/Poppins-Bold.ttf`, fontWeight: 700 },
    ],
  });

  Font.register({
    family: BROCHURE_FONT.display,
    fonts: [{ src: `${base}/BricolageGrotesque-SemiBold.ttf`, fontWeight: 600 }],
  });

  // The design has no hyphenation; @react-pdf hyphenates by default, which
  // would break words mid-line and drift the layout away from Figma.
  Font.registerHyphenationCallback((word: string) => [word]);

  registeredBase = base;
}

const FONT_FILES = [
  "Poppins-Regular.ttf",
  "Poppins-Italic.ttf",
  "Poppins-Medium.ttf",
  "Poppins-SemiBold.ttf",
  "Poppins-Bold.ttf",
  "BricolageGrotesque-SemiBold.ttf",
];

let verified = false;

/**
 * Register the fonts and confirm they are actually being served.
 *
 * @react-pdf fetches each `src` lazily during render, and a 404 surfaces as an
 * opaque font-parsing error with no hint about the cause. The most common cause
 * is mundane: `public/fonts/brochure/` was added while a dev server was already
 * running, and Next has to be restarted before it serves the new files. Checking
 * up front turns that into a message someone can act on.
 */
export async function ensureBrochureFonts(base: string = DEFAULT_FONT_BASE): Promise<void> {
  registerBrochureFonts(base);
  if (verified) return;

  const missing: string[] = [];
  await Promise.all(
    FONT_FILES.map(async (file) => {
      try {
        const response = await fetch(`${base}/${file}`, { method: "HEAD" });
        if (!response.ok) missing.push(file);
      } catch {
        missing.push(file);
      }
    }),
  );

  if (missing.length > 0) {
    throw new Error(
      `brochure fonts not served from ${base} (missing: ${missing.join(", ")}). ` +
        `If they exist on disk, restart the Next server so it picks up new files in public/.`,
    );
  }

  verified = true;
}
