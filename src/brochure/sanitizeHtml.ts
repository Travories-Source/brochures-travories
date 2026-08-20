// Rich-text fields on a package (overview, day descriptions, add-on copy) are
// stored as HTML from the react-quill editor. The PDF renders plain text runs,
// so the markup has to be reduced to text *before* it reaches the document —
// otherwise raw `<p>` and `&nbsp;` end up printed on the brochure.
//
// This is deliberately DOM-free so the same code runs in the browser, in a
// route handler and in the render-check script under `scripts/`.

const NAMED_ENTITIES: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  middot: "·",
  bull: "•",
  deg: "°",
  times: "×",
  eacute: "é",
  reg: "®",
  copy: "©",
  trade: "™",
  euro: "€",
  pound: "£",
  yen: "¥",
  rupee: "₹",
};

const fromCodePoint = (code: number): string => {
  // Surrogate halves and out-of-range values would throw; drop them instead.
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return "";
  if (code >= 0xd800 && code <= 0xdfff) return "";
  return String.fromCodePoint(code);
};

const decodeEntities = (value: string): string =>
  value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-z][a-z0-9]*);/gi, (match, name) => NAMED_ENTITIES[String(name).toLowerCase()] ?? match);

const BLOCK_CLOSE = /<\/(?:p|div|h[1-6]|li|ul|ol|tr|table|blockquote|section|article|header|footer|pre)\s*>/gi;

const stripTags = (value: string): string =>
  value
    // Script/style bodies are content-free noise if they ever slip in.
    .replace(/<(script|style)[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<br\s*\/?>/gi, "\n")
    // Bullets survive as text so lists still read as lists in the PDF.
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(BLOCK_CLOSE, "\n")
    .replace(/<[^>]*>/g, "");

const looksLikeMarkup = (value: string): boolean => /<[a-z!/][^>]*>/i.test(value);

/**
 * Reduce an HTML fragment to display paragraphs.
 *
 * Tags are stripped before entities are decoded so that content which encodes
 * angle brackets (`&lt;p&gt;`) survives as literal text rather than being
 * mistaken for markup. Content that was double-encoded gets one extra pass.
 */
export function htmlToParagraphs(input?: string | null): string[] {
  if (!input) return [];

  let text = stripTags(String(input));
  text = decodeEntities(text);

  // Double-encoded content (`&lt;p&gt;Hello&lt;/p&gt;`) only reveals its tags
  // after the first decode. One more pass clears it; anything still tag-shaped
  // after that is literal text the author meant to show.
  if (looksLikeMarkup(text)) {
    text = decodeEntities(stripTags(text));
  }

  return text
    // Decoded &nbsp; is U+00A0, which would otherwise defeat whitespace collapsing.
    .replace(/\u00a0/g, " ")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter((line) => line.length > 0 && line !== "•");
}

/** Same reduction as `htmlToParagraphs`, flattened to a single string. */
export function htmlToText(input?: string | null): string {
  return htmlToParagraphs(input).join(" ");
}
