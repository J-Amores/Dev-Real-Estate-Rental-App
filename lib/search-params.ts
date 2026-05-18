import { PROPERTY_TYPES } from "@/lib/schemas";
import type { PropertyType, SearchFilters } from "@/lib/queries";

export type RawSearchParams = Record<string, string | string[] | undefined>;

function firstString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parsePositiveNumber(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function parseCoordinate(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function parsePropertyType(raw: string | undefined): PropertyType | undefined {
  if (!raw) return undefined;
  return (PROPERTY_TYPES as readonly string[]).includes(raw)
    ? (raw as PropertyType)
    : undefined;
}

export function parseSearchFilters(sp: RawSearchParams): SearchFilters {
  return {
    lat: parseCoordinate(firstString(sp.lat)),
    lng: parseCoordinate(firstString(sp.lng)),
    beds: parsePositiveNumber(firstString(sp.beds)),
    baths: parsePositiveNumber(firstString(sp.baths)),
    propertyType: parsePropertyType(firstString(sp.propertyType)),
    priceMin: parsePositiveNumber(firstString(sp.priceMin)),
    priceMax: parsePositiveNumber(firstString(sp.priceMax)),
  };
}

export function parseLocation(sp: RawSearchParams): string | undefined {
  return firstString(sp.location);
}

/**
 * Serializes raw searchParams into a URL query string (no leading `?`).
 * Skips undefined and joins array values to the first entry, matching the
 * single-value semantics the search filters use.
 */
export function serializeRawParams(sp: RawSearchParams): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    const v = firstString(value);
    if (v != null && v !== "") usp.set(key, v);
  }
  return usp.toString();
}
