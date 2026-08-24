import { StyleSheet } from "@react-pdf/renderer";

import { BROCHURE_COLOR as C, BROCHURE_FONT, BROCHURE_PAGE, BROCHURE_PAGED_PADDING_Y } from "./theme.js";

const sans = BROCHURE_FONT.sans;

/** Figma's header title column, centred in the 1284pt content column. */
const TITLE_BLOCK_WIDTH = 1107;

/**
 * Same column, shrunk on both sides by the width of the QR corner plus a
 * breathing gap, so it remains centred on the page while clearing the code.
 */
/** Vertical rhythm of the itinerary, and the two columns inside each day card. */
const DAY_LIST_INSET = 29;
const DAY_GAP = 40;
const DAY_COLUMN_GAP = 24;
const DAY_COLUMN_WIDTH =
  (BROCHURE_PAGE.contentWidth - DAY_LIST_INSET * 2 - 48 - DAY_COLUMN_GAP) / 2;

/** Two service cards per row, inside the panel's 20pt padding. */
const SERVICE_LIST_INSET = 29;
const SERVICE_CARD_GAP = 16;
const SERVICE_PANEL_INNER = BROCHURE_PAGE.contentWidth - SERVICE_LIST_INSET * 2 - 40;
const SERVICE_CARD_WIDTH = (SERVICE_PANEL_INNER - SERVICE_CARD_GAP) / 2;

const TITLE_QR_GAP = 32;
const TITLE_BLOCK_WIDTH_WITH_QR =
  BROCHURE_PAGE.width - 2 * (BROCHURE_PAGE.paddingX + BROCHURE_PAGE.qrSize + TITLE_QR_GAP);

/**
 * Every measurement is in Figma px, which map 1:1 to PDF points because the
 * page is emitted at the frame's own 1440pt width.
 *
 * `lineHeight` in @react-pdf is a unitless multiplier, so Figma's pixel leading
 * is expressed as leading/fontSize (e.g. 20px on 18px text -> 1.111).
 */
export const styles = StyleSheet.create({
  page: {
    backgroundColor: C.white,
    paddingTop: BROCHURE_PAGE.paddingTop,
    paddingBottom: BROCHURE_PAGE.paddingBottom,
    paddingHorizontal: BROCHURE_PAGE.paddingX,
    fontFamily: sans,
    color: C.text,
  },
  /**
   * Paginated pages take a tighter vertical margin than the continuous canvas.
   *
   * On a single tall page the top and bottom padding are read once; on twelve
   * pages they are paid twelve times, and 76pt of it decided whether two day
   * blocks fitted on a sheet or one did. 56pt is ~12mm on printed A4.
   */
  pagePaged: { paddingTop: BROCHURE_PAGED_PADDING_Y, paddingBottom: BROCHURE_PAGED_PADDING_Y },

  /* ── Header ─────────────────────────────────────────────────────────── */
  header: { alignItems: "center", gap: 40 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12, height: 34 },
  titleBlock: { alignItems: "center", gap: 16, width: TITLE_BLOCK_WIDTH },
  /**
   * The QR sits in the top-right corner outside the flow, so a full-width title
   * runs straight underneath it. Narrowing the block by the corner it has to
   * clear — on both sides, so the title stays centred on the page — makes long
   * titles wrap before they reach the code instead of colliding with it.
   */
  titleBlockWithQr: { width: TITLE_BLOCK_WIDTH_WITH_QR },
  subtitle: {
    fontSize: 24,
    fontStyle: "italic",
    color: C.text,
    letterSpacing: -0.48,
    textAlign: "center",
  },
  pricePill: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    backgroundColor: "rgba(126, 92, 217, 0.12)",
  },
  pricePillLabel: { fontSize: 20, fontWeight: 500, color: C.secondary, letterSpacing: -0.8 },
  pricePillUnit: { fontSize: 20, fontWeight: 400, color: C.secondary, letterSpacing: -0.8 },

  /* ── Shared section furniture ───────────────────────────────────────── */
  content: { marginTop: BROCHURE_PAGE.blockGap, gap: BROCHURE_PAGE.sectionGap },
  /**
   * A heading that lives inside one of the inset lists (days, services) so it
   * can travel with the first block. The negative inset cancels the list's own
   * margin, keeping it on the same left edge as every other section heading.
   */
  sectionHeadingInList: {
    marginLeft: -DAY_LIST_INSET,
    // The block's own gap supplies most of the space below the heading; this
    // tops it up to the 24pt every other section heading leaves.
    marginBottom: 4,
  },
  sectionHeading: {
    fontSize: 32,
    fontWeight: 600,
    lineHeight: 1.2,
    color: C.primary,
    letterSpacing: -1.28,
    marginBottom: 24,
  },

  /* ── Hero gallery ───────────────────────────────────────────────────── */
  gallery: { flexDirection: "row", gap: 16, height: 550 },
  galleryTall: { width: 417.33, height: 550, borderRadius: 16, objectFit: "cover" },
  galleryColumn: { width: 417.33, gap: 20 },
  galleryShort: { width: 417.33, height: 265, borderRadius: 16, objectFit: "cover" },

  /* ── Overview ───────────────────────────────────────────────────────── */
  overviewCopy: { fontSize: 20, lineHeight: 1.5, color: C.text, letterSpacing: -0.4 },

  /* ── Key facts ──────────────────────────────────────────────────────── */
  keyFacts: { flexDirection: "row", justifyContent: "space-between", paddingBottom: 24 },
  keyFactsColumns: { flexDirection: "row", gap: 60 },
  keyFactsLabels: { gap: 16 },
  keyFactsValues: { gap: 16 },
  keyFactRow: { flexDirection: "row", alignItems: "center", gap: 8, height: 30 },
  keyFactIconBox: { width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  keyFactLabel: { fontSize: 20, color: C.text, letterSpacing: -0.4 },
  keyFactValue: { fontSize: 20, fontWeight: 500, color: C.primary, letterSpacing: -0.8, height: 30 },
  keyFactsImage: { width: 535, height: 293, borderRadius: 16, objectFit: "cover" },

  /* ── Pricing ────────────────────────────────────────────────────────── */
  priceRow: { flexDirection: "row", gap: 20 },
  priceCard: {
    flexGrow: 1,
    flexBasis: 0,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.stroke,
    borderRadius: 8,
  },
  priceCardLabel: {
    paddingTop: 32,
    paddingBottom: 12,
    paddingHorizontal: 24,
    fontSize: 18,
    lineHeight: 1.111,
    color: C.text,
    letterSpacing: -0.54,
  },
  priceCardValue: {
    paddingBottom: 32,
    paddingHorizontal: 24,
    fontSize: 28,
    fontWeight: 500,
    lineHeight: 0.857,
    color: C.secondary,
    letterSpacing: -0.42,
  },

  /* ── Itinerary ──────────────────────────────────────────────────────── */
  dayList: { gap: DAY_GAP, marginHorizontal: DAY_LIST_INSET },
  /**
   * Day number and title sit above the card rather than in a 358pt column
   * beside it. Same reasoning as the service blocks: the column held three
   * short lines against a card six times its height, and it cost the card a
   * third of the page width — which is what pays for the two columns inside.
   */
  day: { gap: 20 },
  dayHeader: { flexDirection: "row", alignItems: "center", gap: 16 },
  dayIndex: {
    fontSize: 52,
    fontWeight: 700,
    color: "rgba(126, 92, 217, 0.16)",
    letterSpacing: 1.04,
  },
  // Takes the slack in the header row, so the duration keeps its natural width
  // and stays hard right however long the title runs.
  dayTitleBox: { flexGrow: 1, flexBasis: 0 },
  dayTitle: { fontSize: 22, fontWeight: 500, lineHeight: 1.045, color: C.violet, letterSpacing: -0.88 },
  dayDuration: { fontSize: 14, color: C.text, letterSpacing: -0.56 },
  dayCard: {
    borderWidth: 1,
    borderColor: C.stroke,
    borderRadius: 8,
    padding: 24,
  },
  /**
   * The narrative on the left, the route on the right.
   *
   * Splitting this way rather than one block per column is what balances the
   * two sides: description plus key facts measured closest to the stop
   * timeline plus activity chips across a real 9-day package, and a day is
   * only as tall as its taller column.
   */
  dayColumns: { flexDirection: "row", gap: DAY_COLUMN_GAP },
  dayColumn: { width: DAY_COLUMN_WIDTH, gap: 20 },
  dayBlock: { gap: 16 },
  dayBlockLabel: { fontSize: 18, fontWeight: 500, color: C.primary, letterSpacing: -0.72 },
  dayCopy: { fontSize: 16, lineHeight: 1.5, color: C.text, letterSpacing: -0.32 },
  dayMetaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dayMetaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  dayMetaText: { fontSize: 16, fontWeight: 500, color: C.text, letterSpacing: -0.32 },
  separatorDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.text },
  meterTrack: { width: 140, height: 8, borderRadius: 4, backgroundColor: C.stroke },
  meterFill: { height: 8, borderRadius: 4, backgroundColor: C.success },

  stopRow: { flexDirection: "row", gap: 20 },
  stopGutter: { flexDirection: "row", gap: 8, alignSelf: "stretch" },
  stopOrdinalBox: { width: 50, paddingBottom: 16, justifyContent: "center" },
  stopOrdinal: { fontSize: 14, color: C.text, letterSpacing: -0.56 },
  stopMarkerColumn: { width: 16, alignItems: "center", alignSelf: "stretch" },
  stopMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: C.secondary,
    backgroundColor: C.white,
  },
  stopConnector: { width: 1.5, flexGrow: 1, backgroundColor: C.secondary },
  stopLabelBox: { paddingBottom: 16, justifyContent: "center" },
  stopLabel: { fontSize: 16, fontWeight: 500, color: C.text, letterSpacing: -0.64 },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    backgroundColor: C.background,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  chipText: { fontSize: 14, fontWeight: 500, color: C.text, letterSpacing: -0.28 },

  /* ── Optional add-ons ───────────────────────────────────────────────── */
  addonList: { gap: 32 },
  addon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 32,
    padding: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.stroke,
    backgroundColor: C.background,
  },
  // The thumbnail stretches to whatever height the copy gives the card. A View
  // wrapper (rather than a bare stretched Image) keeps that height identical
  // between the measurement pass and the final render.
  addonThumbBox: { width: 113, alignSelf: "stretch", borderRadius: 4, overflow: "hidden", backgroundColor: C.stroke },
  // Absolutely positioned so the photo fills the box without contributing to
  // layout — a percentage-height Image would size itself from the intrinsic
  // aspect ratio and make the card taller than the measurement pass predicted.
  addonThumbImage: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, objectFit: "cover" },
  addonBody: { flexGrow: 1, flexBasis: 0, flexDirection: "row", alignItems: "center", gap: 16 },
  addonCopy: { flexGrow: 1, flexBasis: 0, gap: 4 },
  addonName: { fontSize: 18, fontWeight: 500, color: C.violet, letterSpacing: -0.72 },
  addonDescription: { fontSize: 16, lineHeight: 1.5, color: C.text, letterSpacing: -0.64 },
  addonPriceBox: { width: 181, alignItems: "flex-end", gap: 2 },
  addonPrice: { fontSize: 18, fontWeight: 500, color: C.secondary, letterSpacing: -0.72, textAlign: "right" },
  addonPriceUnit: { fontSize: 14, fontWeight: 400, color: C.text },
  addonNote: { fontSize: 14, fontStyle: "italic", color: C.muted, letterSpacing: -0.56, textAlign: "right" },

  /* ── Services ───────────────────────────────────────────────────────── */
  serviceList: { gap: 24, marginHorizontal: 29 },
  /**
   * The label stacks above the panel rather than sitting in a column beside it.
   *
   * As a side-by-side row the label's 460pt column stood empty under two short
   * lines while the panel ran on for hundreds of points, and it squeezed the
   * cards into a 677pt text column — 47% of the page width unused on every
   * line. Stacking costs the label's own height once per block and buys the
   * panel the full column, which is what makes the two-up card grid below fit.
   */
  service: { gap: 20 },
  serviceGhost: { fontSize: 52, fontWeight: 700, letterSpacing: -0.52, marginBottom: -22 },
  serviceLabel: { fontSize: 22, fontWeight: 500, lineHeight: 1.045, letterSpacing: -0.88 },
  servicePanel: {
    backgroundColor: C.background,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  /**
   * Two cards per row, as explicit rows rather than a wrapping flex container.
   *
   * flexWrap cannot paginate: @react-pdf clips whatever does not fit instead of
   * carrying it to the next page, which silently dropped 21 items from the
   * printable layout. Real rows are ordinary blocks, so each can be marked
   * unbreakable and moves whole.
   *
   * A row is as tall as its taller card, which measured within 8% of perfectly
   * balanced columns and needs no height estimation to lay out.
   */
  serviceCardRows: { gap: SERVICE_CARD_GAP },
  serviceCardRow: { flexDirection: "row", gap: SERVICE_CARD_GAP },
  serviceCard: {
    width: SERVICE_CARD_WIDTH,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.stroke,
    borderRadius: 8,
    padding: 24,
    gap: 4,
  },
  /**
   * A card with no partner in its row spans the panel instead of leaving half
   * of it blank — which is both tidier and shorter, since the wider text column
   * wraps fewer lines. Applies to a lone card and to the last of an odd number.
   */
  serviceCardWide: { width: SERVICE_PANEL_INNER },
  serviceCardHeading: { fontSize: 18, fontWeight: 500, letterSpacing: -0.72 },
  serviceItem: { flexDirection: "row" },
  serviceBullet: { width: 24, fontSize: 16, lineHeight: 1.5, color: C.text },
  // Sits in a row next to the bullet, so flex-basis here governs width.
  serviceItemText: { flexGrow: 1, flexBasis: 0, fontSize: 16, lineHeight: 1.5, color: C.text, letterSpacing: -0.64 },

  /* ── QR code ────────────────────────────────────────────────────────── */
  // Absolutely positioned so the centred header block is unaffected. @react-pdf
  // resolves these offsets against the page rect rather than the padding box,
  // so the padding is applied explicitly to line the code up with the content
  // column instead of sitting flush against the paper edge.
  qrBlock: {
    position: "absolute",
    top: BROCHURE_PAGE.paddingTop,
    right: BROCHURE_PAGE.paddingX,
    // Fixed rather than shrink-wrapped, so the corner the title has to clear is
    // the same width whatever the caption says.
    width: BROCHURE_PAGE.qrSize,
    alignItems: "center",
    gap: 6,
    // @react-pdf underlines every descendant of a <Link>, and a child style
    // cannot take it back — only the Link's own style can. Cleared here so the
    // underline can be put where it belongs, on `qrActionLabel`.
    textDecoration: "none",
  },
  priceNote: { marginTop: 12, fontSize: 16, fontStyle: "italic", color: C.muted, letterSpacing: -0.32 },
  /** The instruction, for someone holding a second device to scan with. */
  qrCaption: { fontSize: 11, fontWeight: 500, color: C.muted, letterSpacing: -0.22, textAlign: "center" },
  /**
   * The tap affordance, for the reader who is *on* the phone and so cannot scan
   * the code in front of them. Styled as a link — brand colour, underline,
   * external-link glyph — because nothing else in a PDF signals "tappable".
   */
  qrAction: { flexDirection: "row", alignItems: "center", gap: 4 },
  qrActionLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: C.secondary,
    letterSpacing: -0.22,
    textDecoration: "underline",
  },

  /* ── Footer ─────────────────────────────────────────────────────────── */
  footer: {
    marginTop: BROCHURE_PAGE.blockGap,
    marginHorizontal: 2,
    width: 1280,
    height: 472,
    borderRadius: 32,
    backgroundColor: C.violetDark,
    alignItems: "center",
    justifyContent: "center",
  },
  footerInner: { width: 879, gap: 24 },
  footerTitle: { fontSize: 40, fontWeight: 600, color: C.white, letterSpacing: -1.6, textAlign: "center" },
  footerBody: { fontSize: 18, fontWeight: 500, color: C.footerText, letterSpacing: -0.72, textAlign: "center" },
  footerContacts: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
  footerContact: { flexDirection: "row", alignItems: "center", gap: 8 },
  footerContactText: {
    fontSize: 18,
    fontWeight: 500,
    color: C.footerText,
    letterSpacing: -0.72,
    textDecoration: "underline",
  },
  footerContactDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.footerText },
  footerHostedBy: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: 500,
    color: C.footerText,
    letterSpacing: -0.36,
    textAlign: "center",
  },
  footerTagline: { fontSize: 20, fontWeight: 600, color: C.background, letterSpacing: -0.8, textAlign: "center" },
});
