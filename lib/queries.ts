import { prisma } from "@/lib/prisma";

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
