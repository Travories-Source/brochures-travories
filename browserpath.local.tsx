import { join } from "node:path";
import React from "react";
import { pdf, renderToBuffer } from "@react-pdf/renderer";
import { PackageBrochureDocument } from "./src/brochure/PackageBrochureDocument.js";
import { registerBrochureFonts } from "./src/brochure/fonts.js";
import { buildBrochureModel } from "./src/brochure/model.js";
import { countPdfPages } from "./src/brochure/pageFit.js";
import { BROCHURE_A4_PAGE_HEIGHT } from "./src/brochure/theme.js";

registerBrochureFonts(join(process.cwd(), "assets", "fonts", "brochure"));

const pkg = {
  title: "Paged Path Probe", agencyName: "Travories", packageType: "Trekking",
  description: "A probe package.", totalDays: 9, minPeople: 2, maxNoOfPeople: 10,
  destinations: [{ name: "Nepal" }],
  prices: [{ groupSizeMin: 1, groupSizeMax: 10, pricePerPerson: 1000 }],
  days: Array.from({ length: 9 }, (_, i) => ({
    dayNumber: i + 1,
    description: "Trek onward through the valley, climbing steadily past terraced fields and rhododendron forest before reaching the night's tea house. ".repeat(2),
    travelDuration: "6", difficulty: "Moderate", accommodation: "Tea House", transportation: ["Walk"],
    locations: [{ displayName: "Start" }, { displayName: "Middle" }, { displayName: "End" }],
    activities: [{ activityName: "Nature Walk" }],
  })),
  thingsIncluded: [{ category: "Support", items: ["Guide", "Porter", "Permits"] }],
  thingsExcluded: [{ category: "General", items: ["Flights", "Insurance"] }],
  thingsToPack: [{ category: "Clothing", items: ["Boots", "Jacket"] }],
};

async function main() {
  const model = buildBrochureModel(pkg as any);
  const el = (paged: boolean) => React.createElement(PackageBrochureDocument, {
    model, images: {}, height: BROCHURE_A4_PAGE_HEIGHT, qr: null, packageUrl: null, paged });

  const viaBuffer = Buffer.from(await renderToBuffer(el(true) as any));
  console.log("renderToBuffer  (server path) pages:", countPdfPages(viaBuffer));

  const blob = await pdf(el(true) as any).toBlob();
  const viaBlob = new Uint8Array(await blob.arrayBuffer());
  console.log("pdf().toBlob()  (browser path) pages:", countPdfPages(viaBlob));
}
main();
