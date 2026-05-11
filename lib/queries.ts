import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { PROPERTY_TYPES } from "@/lib/schemas";

export type PropertyDetail = {
  id: number;
  name: string;
  description: string;
  pricePerMonth: number;
  beds: number;
  baths: number;
  squareFeet: number;
  propertyType: string;
  photoUrls: string[];
  amenities: string[];
  highlights: string[];
  isPetsAllowed: boolean;
  isParkingIncluded: boolean;
  managerId: string;
  managerName: string;
  managerEmail: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  lat: number | null;
  lng: number | null;
};

type Row = Omit<PropertyDetail, "pricePerMonth" | "baths" | "lat" | "lng"> & {
  pricePerMonth: number | string;
  baths: number | string;
  lat: number | string | null;
  lng: number | string | null;
};

/**
 * Reads a Property with its Location (coords lifted from PostGIS) and Manager (name + email).
 * Returns null when no row matches. Manager FK chain: Property.managerId → Manager.userId → User.id.
 */
export async function getPropertyDetail(id: number): Promise<PropertyDetail | null> {
  if (!Number.isInteger(id) || id <= 0) return null;

  const rows = await prisma.$queryRaw<Row[]>`
    SELECT
      p.id, p.name, p.description, p."pricePerMonth", p.beds, p.baths,
      p."squareFeet", p."propertyType"::text AS "propertyType",
      p."photoUrls",
      ARRAY(SELECT unnest(p.amenities)::text)  AS "amenities",
      ARRAY(SELECT unnest(p.highlights)::text) AS "highlights",
      p."isPetsAllowed", p."isParkingIncluded", p."managerId",
      l.address, l.city, l.state, l.country, l."postalCode",
      ST_X(l.coordinates::geometry) AS "lng",
      ST_Y(l.coordinates::geometry) AS "lat",
      m.name  AS "managerName",
      m.email AS "managerEmail"
    FROM "Property" p
    JOIN "Location" l ON l.id = p."locationId"
    JOIN "Manager"  m ON m."userId" = p."managerId"
    WHERE p.id = ${id}
    LIMIT 1
  `;

  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    ...r,
    pricePerMonth: Number(r.pricePerMonth),
    baths: Number(r.baths),
    lat: r.lat == null ? null : Number(r.lat),
    lng: r.lng == null ? null : Number(r.lng),
  };
}

export type PropertyType = (typeof PROPERTY_TYPES)[number];

export type SearchFilters = {
  lat?: number;
  lng?: number;
  beds?: number;
  baths?: number;
  propertyType?: PropertyType;
  priceMin?: number;
  priceMax?: number;
};

export type SearchResult = {
  id: number;
  name: string;
  pricePerMonth: number;
  propertyType: string;
  photoUrls: string[];
  city: string;
  state: string;
  lat: number | null;
  lng: number | null;
};

type SearchRow = Omit<SearchResult, "pricePerMonth" | "lat" | "lng"> & {
  pricePerMonth: number | string;
  lat: number | string | null;
  lng: number | string | null;
};

const SEARCH_RADIUS_METERS = 40233; // ~25 miles
const SEARCH_LIMIT = 100;

/**
 * Reads the Property ⨝ Location rows matching the filter set. PostGIS ST_DWithin
 * is applied only when both lat and lng are present; otherwise the search is
 * unbounded geographically. Returns lat/lng for map markers and the card fields
 * required by `<PropertyCard variant="public" />`.
 */
export async function searchProperties(
  filters: SearchFilters,
): Promise<SearchResult[]> {
  const conditions: Prisma.Sql[] = [];

  if (
    typeof filters.lat === "number" &&
    typeof filters.lng === "number" &&
    Number.isFinite(filters.lat) &&
    Number.isFinite(filters.lng)
  ) {
    conditions.push(Prisma.sql`
      ST_DWithin(
        l.coordinates,
        ST_SetSRID(ST_MakePoint(${filters.lng}, ${filters.lat}), 4326)::geography,
        ${SEARCH_RADIUS_METERS}
      )
    `);
  }
  if (typeof filters.beds === "number" && filters.beds > 0) {
    conditions.push(Prisma.sql`p.beds >= ${filters.beds}`);
  }
  if (typeof filters.baths === "number" && filters.baths > 0) {
    conditions.push(Prisma.sql`p.baths >= ${filters.baths}`);
  }
  if (filters.propertyType) {
    conditions.push(
      Prisma.sql`p."propertyType" = ${filters.propertyType}::"PropertyType"`,
    );
  }
  if (typeof filters.priceMin === "number" && filters.priceMin > 0) {
    conditions.push(Prisma.sql`p."pricePerMonth" >= ${filters.priceMin}`);
  }
  if (typeof filters.priceMax === "number" && filters.priceMax > 0) {
    conditions.push(Prisma.sql`p."pricePerMonth" <= ${filters.priceMax}`);
  }

  const whereClause =
    conditions.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`
      : Prisma.empty;

  const rows = await prisma.$queryRaw<SearchRow[]>`
    SELECT
      p.id,
      p.name,
      p."pricePerMonth",
      p."propertyType"::text AS "propertyType",
      p."photoUrls",
      l.city,
      l.state,
      ST_X(l.coordinates::geometry) AS "lng",
      ST_Y(l.coordinates::geometry) AS "lat"
    FROM "Property" p
    JOIN "Location" l ON l.id = p."locationId"
    ${whereClause}
    ORDER BY p."postedDate" DESC
    LIMIT ${SEARCH_LIMIT}
  `;

  return rows.map((r) => ({
    ...r,
    pricePerMonth: Number(r.pricePerMonth),
    lat: r.lat == null ? null : Number(r.lat),
    lng: r.lng == null ? null : Number(r.lng),
  }));
}
