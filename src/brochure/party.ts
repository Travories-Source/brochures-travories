import type { BrochurePackageSource } from "./source.js";

/**
 * Pricing for the brochure, mirroring the booking flow.
 *
 * Every rule here is lifted from `BookingForm.tsx` so a quotation can never
 * quote a different number from the page the traveller books on. The two rules
 * that are easy to get wrong:
 *
 *  - Only **adults** count toward the group-size tier. `BookingForm` sums the
 *    options with `countInTotal`, and only Adult carries it — children and
 *    infants ride along without moving the party into a cheaper bracket.
 *  - Child and infant discounts are matched on the **exact** age band (3-12 and
 *    0-2), not by overlap. Adults use the overlap match against 13-65.
 */

/** Traveller bands, matching the booking form's `options`. */
const BANDS = {
  adults: { min: 13, max: 65, countsInGroupSize: true },
  children: { min: 3, max: 12, countsInGroupSize: false },
  infants: { min: 0, max: 2, countsInGroupSize: false },
} as const;

type TravellerType = keyof typeof BANDS;

const LABELS: Record<TravellerType, [singular: string, plural: string]> = {
  adults: ["Adult", "Adults"],
  children: ["Child", "Children"],
  infants: ["Infant", "Infants"],
};

/**
 * What the download dialog collects. Optional — the brochure works without it.
 *
 * The two halves are independent, because the dialog asks two separate
 * questions: a lead can have a firm arrival date but no agreed head count, or
 * settled numbers with the dates still open. Omitted counts mean general
 * pricing (the group-size tier table); an omitted date means none is shown.
 */
export interface BrochureParty {
  adults?: number;
  children?: number;
  infants?: number;
  /** ISO `yyyy-mm-dd` from the date input. Often not fixed yet. */
  arrivalDate?: string;
}

/** Whether a party names any travellers, i.e. whether it can be priced. */
export const hasPartyCounts = (party?: BrochureParty): boolean =>
  !!party && (party.adults || 0) + (party.children || 0) + (party.infants || 0) > 0;

export interface PartyLine {
  /** "Adults × 2" */
  label: string;
  /** "20% off" / "free" — omitted at full fare. */
  note?: string;
  amount: number;
}

export interface PartyQuote {
  lines: PartyLine[];
  total: number;
  /** Everyone on the booking. */
  travellers: number;
  /** Adults only — this is what selects the price tier. */
  groupSize: number;
  pricePerPerson: number;
  /** Set when the adult count sits outside the package's own min/max. */
  groupSizeWarning?: string;
}

/** A group-size bracket, for the generic (no party chosen) pricing table. */
export interface PricingTier {
  label: string;
  pricePerPerson: number;
}

const plural = (type: TravellerType, count: number) => LABELS[type][count === 1 ? 0 : 1];

const fares = (pkg: BrochurePackageSource) =>
  (pkg.prices ?? []).map((tier) => Number(tier.pricePerPerson ?? 0));

/**
 * Per-person fare for a group of `groupSize` adults.
 *
 * Mirrors `currentPrice` in BookingForm: an empty tier list or an empty party
 * falls back to the highest fare, and a party that matches no bracket falls
 * back to the lowest.
 */
export function fareFor(pkg: BrochurePackageSource, groupSize: number): number {
  const prices = pkg.prices ?? [];
  const amounts = fares(pkg);
  if (prices.length === 0) return 0;
  if (groupSize === 0) return Math.max(...amounts);

  const tier = prices.find(
    (candidate) => groupSize >= candidate.groupSizeMin && groupSize <= candidate.groupSizeMax,
  );
  return tier ? Number(tier.pricePerPerson ?? 0) : Math.min(...amounts);
}

/** Discount percentage for a traveller type, using the booking form's matching. */
export function discountFor(pkg: BrochurePackageSource, type: TravellerType): number {
  const discounts = pkg.discounts ?? [];
  const band = BANDS[type];

  const match =
    type === "adults"
      ? discounts.find(
          (candidate) =>
            (band.min <= candidate.ageMax && band.max >= candidate.ageMin) ||
            (band.min >= candidate.ageMin && band.max <= candidate.ageMax),
        )
      : discounts.find((candidate) => candidate.ageMin === band.min && candidate.ageMax === band.max);

  return Math.min(100, Math.max(0, Number(match?.discountPercentage ?? 0)));
}

const priceAfterDiscount = (base: number, discount: number) =>
  Math.max(0, base - (base * discount) / 100);

const discountNote = (discount: number) =>
  discount >= 100 ? "free" : discount > 0 ? `${Math.round(discount)}% off` : undefined;

/** Price a specific party. */
export function quoteParty(pkg: BrochurePackageSource, party: BrochureParty): PartyQuote {
  const counts: Record<TravellerType, number> = {
    adults: Math.max(0, Math.floor(party.adults || 0)),
    children: Math.max(0, Math.floor(party.children || 0)),
    infants: Math.max(0, Math.floor(party.infants || 0)),
  };

  const travellers = counts.adults + counts.children + counts.infants;
  const groupSize = (Object.keys(counts) as TravellerType[])
    .filter((type) => BANDS[type].countsInGroupSize)
    .reduce((sum, type) => sum + counts[type], 0);

  const pricePerPerson = fareFor(pkg, groupSize);

  const lines: PartyLine[] = [];
  let total = 0;

  (Object.keys(counts) as TravellerType[]).forEach((type) => {
    const count = counts[type];
    if (count === 0) return;

    const discount = discountFor(pkg, type);
    const amount = priceAfterDiscount(pricePerPerson, discount) * count;
    total += amount;

    lines.push({ label: `${plural(type, count)} × ${count}`, note: discountNote(discount), amount });
  });

  const min = Number(pkg.minPeople || 0);
  const max = Number(pkg.maxNoOfPeople || 0);
  let groupSizeWarning: string | undefined;
  if (min && groupSize < min) groupSizeWarning = `This package runs with at least ${min} adults.`;
  else if (max && groupSize > max) groupSizeWarning = `This package takes at most ${max} adults.`;

  return { lines, total, travellers, groupSize, pricePerPerson, groupSizeWarning };
}

/** The package's group-size brackets, for a brochure with no party chosen. */
export function pricingTiers(pkg: BrochurePackageSource): PricingTier[] {
  return (pkg.prices ?? []).map((tier) => ({
    label:
      tier.groupSizeMin === tier.groupSizeMax
        ? `${tier.groupSizeMin} ${tier.groupSizeMin === 1 ? "traveller" : "travellers"}`
        : `${tier.groupSizeMin}–${tier.groupSizeMax} travellers`,
    pricePerPerson: Number(tier.pricePerPerson ?? 0),
  }));
}

/**
 * "Children (3–12) 20% off · Infants (0–2) free" — the age concessions, for the
 * generic pricing table where there are no per-traveller lines to carry them.
 */
export function discountSummary(pkg: BrochurePackageSource): string {
  const parts = (["children", "infants"] as TravellerType[])
    .map((type) => {
      const discount = discountFor(pkg, type);
      const note = discountNote(discount);
      if (!note) return null;
      return `${LABELS[type][1]} (${BANDS[type].min}–${BANDS[type].max} yrs) ${note}`;
    })
    .filter(Boolean);

  return parts.join(" · ");
}

/** "12 March 2027" — unambiguous on a quotation that crosses borders. */
export function formatArrivalDate(value?: string): string {
  if (!value) return "";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/** "2 Adults, 1 Child, 1 Infant" */
export function describeParty(party: BrochureParty): string {
  const parts: string[] = [];
  (["adults", "children", "infants"] as TravellerType[]).forEach((type) => {
    const count = Math.max(0, Math.floor(party[type] || 0));
    if (count > 0) parts.push(`${count} ${plural(type, count)}`);
  });
  return parts.join(", ");
}
