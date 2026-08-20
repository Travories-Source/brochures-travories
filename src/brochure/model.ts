// Maps a common package source onto the slots the Figma brochure defines.
//
// Kept separate from the document so the layout code deals only in ready-made
// strings — no fallbacks, no HTML, no null checks scattered through the JSX.

import type { BrochurePackageSource } from "./source.js";

import {
  describeParty,
  discountSummary,
  formatArrivalDate,
  pricingTiers,
  quoteParty,
  type BrochureParty,
  type PartyQuote,
  type PricingTier,
} from "./party.js";
import { htmlToParagraphs, htmlToText } from "./sanitizeHtml.js";
import { BROCHURE_COLOR, DIFFICULTY_FILL } from "./theme.js";

export interface BrochureFact {
  icon: "suitcase" | "speed" | "calendar" | "camping";
  label: string;
  value: string;
}

export interface BrochureDay {
  index: string;
  title: string;
  duration: string;
  description: string[];
  accommodation: string;
  transport: string;
  difficulty: string;
  difficultyFill: number;
  stops: string[];
  activities: string[];
}

export interface BrochureAddon {
  name: string;
  description: string;
  amount: number;
  unit: string;
  image: string | null;
}

export interface BrochureServiceGroup {
  category: string;
  items: string[];
}

export interface BrochureService {
  ghost: string;
  label: string;
  /** Category headings inside the white cards. */
  accent: string;
  /** The solid label under the ghost word. */
  accentDeep: string;
  /** The oversized watermark word, accent at 16%. */
  ghostColor: string;
  groups: BrochureServiceGroup[];
}

export interface BrochureModel {
  agencyName: string;
  title: string;
  subtitle: string;
  pricePerPerson: number | null;
  gallery: string[];
  overview: string[];
  facts: BrochureFact[];
  featureImage: string | null;
  /** Group-size brackets, shown when no specific party was chosen. */
  tiers: PricingTier[];
  /** "Children (3–12 yrs) 20% off · Infants (0–2 yrs) free" — may be empty. */
  concessions: string;
  days: BrochureDay[];
  addons: BrochureAddon[];
  services: BrochureService[];
  /** Present when the brochure was generated for a specific party. */
  quote?: PartyQuote;
  /** "2 Adults, 1 Child" — empty when no party was given. */
  travellers: string;
  /** "12 March 2027" — empty when no arrival date was given. */
  arrival: string;
  /** Every distinct remote image the document references, for preloading. */
  imageUrls: string[];
}

/**
 * Package media is stored as WebP, which @react-pdf cannot decode.
 *
 * The CDN is imgproxy, where appending `@jpg` to any rendition returns that
 * same rendition as JPEG — so we ask the backend for a format we can embed
 * rather than pulling WebP down and re-encoding megabytes in the browser.
 *
 * The API does expose a ready-made `url.jpeg`, but it is pinned to the 600x600
 * `general` crop (see `MediaUrlBuilder` in the backend). `rs:fill` at 1:1 hard
 * crops to a square, which would mangle the brochure's 5:3 gallery and portrait
 * slots — so we take `section` (1200x720) and convert that instead. imgproxy
 * never upscales, so smaller originals simply come back at their own size.
 */
const IMGPROXY_EXTENSION = /@[a-z0-9]+$/i;

const asJpeg = (url: string): string =>
  url.includes("/plain/") ? `${url.replace(IMGPROXY_EXTENSION, "")}@jpg` : url;

const mediaUrl = (media: any): string => {
  const variants = media?.url;
  const best =
    variants?.section || variants?.hero || variants?.original || variants?.jpeg || variants?.thumbnail;
  return best ? asJpeg(best) : "";
};

const titleCase = (value: string): string =>
  value
    .toLowerCase()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const clean = (value?: string | null): string => (value ?? "").trim();

/** `["A","B","C"]` → `"A, B & C"` — commas throughout, ampersand before the last. */
const joinReadable = (values: string[]): string => {
  if (values.length <= 1) return values[0] ?? "";
  return `${values.slice(0, -1).join(", ")} & ${values[values.length - 1]}`;
};

/** `["Jeep","Car"]` → `"Jeep / Car"`, de-duplicated and title-cased. */
const joinList = (values?: (string | null | undefined)[] | null, separator = " / "): string => {
  const seen = new Set<string>();
  for (const raw of values ?? []) {
    const value = clean(raw);
    if (value) seen.add(titleCase(value));
  }
  return Array.from(seen).join(separator);
};

const difficultyLabel = (value: string): string => {
  const label = clean(value);
  if (!label) return "Easy Level";
  return /level$/i.test(label) ? titleCase(label) : `${titleCase(label)} Level`;
};

const difficultyFill = (value: string): number => DIFFICULTY_FILL[clean(value).toLowerCase()] ?? 0.55;

/**
 * `travelDuration` arrives as a bare number ("6") on real packages, but the
 * design reads "Duration : 6 hours". Only add the unit when there isn't one.
 */
const durationLabel = (value: string): string => {
  const duration = clean(value);
  if (!duration) return "Flexible";
  return /^\d+(\.\d+)?$/.test(duration) ? `${duration} hours` : duration;
};

/**
 * Day content lives either on `moments` (newer packages) or flat on the day
 * itself. Flatten both shapes into one set of fields.
 *
 * Difficulty, accommodation and transportation matter here: on moment-shaped
 * packages the day-level fields are simply absent, so reading them off the day
 * would silently fall back to defaults on every single day.
 */
const flattenDay = (day: any) => {
  const moments: any[] = day.moments ?? [];
  const lead = moments[0];
  const hasMoments = moments.length > 0;

  return {
    locations: hasMoments ? moments.flatMap((moment) => moment.locations ?? []) : day.locations ?? [],
    activities: hasMoments ? moments.flatMap((moment) => moment.activities ?? []) : day.activities ?? [],
    description: hasMoments
      ? moments
          .map((moment) => clean(moment.description))
          .filter(Boolean)
          .join("\n")
      : clean(day.description),
    duration: clean(lead?.travelDuration) || clean(day.travelDuration),
    difficulty: clean(lead?.difficulty) || clean(day.difficulty),
    accommodation: clean(lead?.accommodation) || clean(day.accommodation),
    transportation: lead?.transportation?.length ? lead.transportation : day.transportation,
  };
};

/**
 * A day is a journey, not a point — name it by where it starts and ends rather
 * than by its first stop alone. Collapses when a day begins and ends in the
 * same place.
 */
const dayTitle = (stops: string[], activities: string[], dayNumber: number): string => {
  const first = stops[0];
  const last = stops[stops.length - 1];
  if (first && last && first !== last) return `${first} - ${last}`;
  return first || activities[0] || `Day ${dayNumber}`;
};

const toDay = (day: any, position: number): BrochureDay => {
  const flat = flattenDay(day);

  const stops = flat.locations.map((location: any) => clean(location?.displayName)).filter(Boolean);
  const activityNames = flat.activities.map((activity: any) => clean(activity?.activityName)).filter(Boolean);
  const dayNumber = day.dayNumber || position + 1;

  return {
    index: String(dayNumber).padStart(2, "0"),
    title: dayTitle(stops, activityNames, dayNumber),
    duration: durationLabel(flat.duration),
    description: htmlToParagraphs(flat.description),
    accommodation: flat.accommodation || "Yes",
    transport: joinList(flat.transportation) || "As per itinerary",
    difficulty: difficultyLabel(flat.difficulty),
    difficultyFill: difficultyFill(flat.difficulty),
    stops,
    activities: activityNames,
  };
};

const toServiceGroups = (groups?: any[] | null): BrochureServiceGroup[] =>
  (groups ?? [])
    .map((group) => ({
      category: clean(group?.category),
      items: (group?.items ?? []).map((item: string) => htmlToText(item)).filter(Boolean),
    }))
    // A category with no entries renders as a bare heading in an empty card,
    // which reads as a bug on a customer-facing quotation. Agencies routinely
    // leave categories in place with `items: [""]`.
    .filter((group) => group.items.length > 0);

/** `#44a33c` → `rgba(68, 163, 60, 0.16)` — the watermark treatment from Figma. */
const tint = (hex: string, alpha: number): string => {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export function buildBrochureModel(pkg: BrochurePackageSource, party?: BrochureParty): BrochureModel {
  const photos = [pkg.packageCover, ...(pkg.packageMedia ?? [])]
    .map(mediaUrl)
    .filter(Boolean);

  // The hero grid has four slots; repeat what exists rather than leaving holes.
  const gallery = photos.length
    ? Array.from({ length: 4 }, (_, index) => photos[index % photos.length])
    : [];

  const nights = Math.max(0, (pkg.totalDays || 0) - 1);
  const basePrice = pkg.prices?.[0]?.pricePerPerson;

  const addons: BrochureAddon[] = (pkg.addons ?? [])
    .filter((addon) => addon?.isActive !== false)
    .map((addon, index) => ({
      name: clean(addon.name),
      description: htmlToText(addon.description),
      amount: Number(addon.customPrice ?? addon.pricePerUnit ?? 0),
      unit: clean(addon.unitLabel) || "per person",
      image: photos[(index + 1) % Math.max(photos.length, 1)] ?? null,
    }));

  const services: BrochureService[] = [
    {
      ghost: "INCLUSION",
      label: "Things Included",
      accent: BROCHURE_COLOR.success,
      accentDeep: BROCHURE_COLOR.successDeep,
      ghostColor: tint(BROCHURE_COLOR.successDeep, 0.16),
      groups: toServiceGroups(pkg.thingsIncluded),
    },
    {
      ghost: "EXCLUSIONS",
      label: "Things Excluded",
      accent: BROCHURE_COLOR.danger,
      accentDeep: BROCHURE_COLOR.dangerDeep,
      ghostColor: tint(BROCHURE_COLOR.danger, 0.16),
      groups: toServiceGroups(pkg.thingsExcluded),
    },
    {
      ghost: "EXTRAS",
      label: "Good to Know",
      accent: BROCHURE_COLOR.secondary,
      accentDeep: BROCHURE_COLOR.violet,
      ghostColor: tint(BROCHURE_COLOR.secondary, 0.16),
      groups: toServiceGroups(pkg.thingsToPack),
    },
  ].filter((service) => service.groups.length > 0);

  const featureImage = photos[0] ?? null;

  const model: BrochureModel = {
    agencyName: clean(pkg.agencyName),
    title: clean(pkg.title) || "Travel package",
    subtitle:
      joinReadable(
        (pkg.destinations ?? []).map((destination) => clean(destination?.destinationName)).filter(Boolean),
      ) || "A memorable journey",
    pricePerPerson: basePrice == null ? null : Number(basePrice),
    gallery,
    overview: htmlToParagraphs(pkg.description),
    facts: [
      { icon: "suitcase", label: "Trip Style", value: titleCase(clean(pkg.packageType)) || "—" },
      { icon: "speed", label: "Difficulty", value: titleCase(clean(pkg.difficulty)) || "Easy" },
      {
        icon: "calendar",
        label: "Number Of Days",
        value: pkg.totalDays ? `${pkg.totalDays} Days & ${nights} Nights` : "—",
      },
      { icon: "camping", label: "Package Category", value: titleCase(clean(pkg.packageCategory)) || "—" },
    ],
    featureImage,
    tiers: pricingTiers(pkg),
    concessions: discountSummary(pkg),
    days: (pkg.days ?? []).map(toDay),
    addons,
    services,
    quote: party ? quoteParty(pkg, party) : undefined,
    travellers: party ? describeParty(party) : "",
    arrival: party ? formatArrivalDate(party.arrivalDate) : "",
    imageUrls: [],
  };

  model.imageUrls = Array.from(
    new Set([...model.gallery, model.featureImage, ...model.addons.map((addon) => addon.image)].filter(Boolean) as string[]),
  );

  return model;
}
