// Design tokens for the package brochure PDF.
//
// Every value here is lifted from the Figma source of truth
// (file QY7TPwExLrdAxm9JCUcLFO, node 6940:24688 "package pdf"). The frame is a
// single 1440pt-wide continuous canvas — the PDF is rendered as one tall page
// to match, so there is no pagination geometry to model.
//
// Keep this file in sync with Figma rather than nudging values to taste: the
// brochure is a customer-facing quotation and the design is the contract.

export const BROCHURE_PAGE = {
  /** Figma frame width. The PDF page is emitted at exactly this width. */
  width: 1440,
  /** Horizontal frame padding — 1440 - (78 * 2) = 1284pt content column. */
  paddingX: 78,
  paddingTop: 76,
  paddingBottom: 76,
  /** Width of the inner content column. */
  contentWidth: 1284,
  /** Vertical gap between top-level sections inside the content column. */
  sectionGap: 50,
  /** Gap between the header block, the content column and the footer. */
  blockGap: 80,
} as const;

export const BROCHURE_COLOR = {
  /** Section headings and day-card labels. */
  primary: "#5b4d81",
  /** colors/Violet/Normal — day titles, add-on names. */
  violet: "#65558f",
  /** colors/Violet/Dark — footer panel. */
  violetDark: "#4c406b",
  /** Price emphasis and the EXTRAS accent. */
  secondary: "#7e5cd9",
  /** Body copy. */
  text: "#47586e",
  /** De-emphasised copy ("includes taxes and charges"). */
  muted: "#909dad",
  /** Card and divider strokes. */
  stroke: "#e0e4e8",
  /** Tinted panel backgrounds and chips. */
  background: "#f5f5f5",
  white: "#ffffff",
  /** Inclusion accents. */
  success: "#44a33c",
  successDeep: "#3c9136",
  /** Exclusion accents. */
  danger: "#c62222",
  dangerDeep: "#841717",
  /** Footer body copy. */
  footerText: "#cfcadc",
} as const;

/** Families registered by `registerBrochureFonts()`. */
export const BROCHURE_FONT = {
  sans: "PoppinsBrochure",
  display: "BricolageGrotesqueBrochure",
} as const;

/**
 * Currency shown against every price. Package prices are stored in USD.
 *
 * The Figma mock renders an Indian rupee glyph with Indian digit grouping
 * ("₹ 1,35,000"); both are wrong for dollars, so amounts are grouped en-US
 * ("$135,000"). Fractions are shown only when the stored price actually has
 * them — rounding 149.99 to 150 would misstate a customer quotation.
 */
export const BROCHURE_CURRENCY = {
  symbol: "$",
  locale: "en-US",
} as const;

/**
 * Fill fraction of the 140pt difficulty meter on each itinerary day card,
 * keyed by the lowercased difficulty string coming off the package.
 */
export const DIFFICULTY_FILL: Record<string, number> = {
  easy: 0.3,
  beginner: 0.3,
  moderate: 0.55,
  intermediate: 0.55,
  hard: 0.8,
  difficult: 0.8,
  challenging: 0.8,
  extreme: 1,
  strenuous: 1,
};
