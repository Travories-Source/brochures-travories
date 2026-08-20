/**
 * The smallest common package shape required by the brochure.
 *
 * The agency dashboard and staff admin expose the same package information
 * through separately-versioned API types. Keeping this boundary structural
 * prevents the PDF package from importing either application's source tree.
 */
export interface BrochurePackageSource {
  id?: string;
  slug?: string | null;
  title?: string | null;
  agencyName?: string | null;
  packageType?: string | null;
  difficulty?: string | null;
  description?: string | null;
  minPeople?: number | null;
  maxNoOfPeople?: number | null;
  packageCategory?: string | null;
  totalDays?: number | null;
  destinations?: any[] | null;
  packageMedia?: any[] | null;
  packageCover?: any | null;
  days?: any[] | null;
  prices?: any[] | null;
  discounts?: any[] | null;
  addons?: any[] | null;
  thingsIncluded?: any[] | null;
  thingsExcluded?: any[] | null;
  thingsToPack?: any[] | null;
}
