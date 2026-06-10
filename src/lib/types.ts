// Real-estate scaffolding — typed data contract.
// Authoritative source: .harness/data-model.md. Scaffolding only — no DB/API yet.

export type PropertyStatus = "for-sale" | "for-rent" | "pending" | "sold";

export type PropertyType =
  | "house"
  | "apartment"
  | "condo"
  | "townhouse"
  | "land"
  | "commercial";

export interface PropertyImage {
  src: string; // path under /public, e.g. "/images/mono-1.png"
  alt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string; // ISO-ish display string, e.g. "US"
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Property {
  id: string; // stable unique id (used by /properties/[id])
  slug: string; // url-safe, unique
  title: string;
  description: string;
  status: PropertyStatus;
  type: PropertyType;
  price: number; // integer minor-unit-free amount (e.g. 1250000)
  currency: string; // ISO 4217, e.g. "USD"
  address: Address;
  location?: GeoPoint; // optional until a map exists
  beds: number;
  baths: number;
  areaSqFt: number;
  lotSqFt?: number;
  yearBuilt?: number;
  features: string[]; // e.g. ["Pool", "Corten steel facade"]
  images: PropertyImage[]; // first image = cover
  featured?: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface PropertyQuery {
  status?: PropertyStatus;
  type?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  beds?: number; // minimum
  baths?: number; // minimum
  city?: string;
  featured?: boolean;
  sort?: "price-asc" | "price-desc" | "newest";
  limit?: number;
  offset?: number;
}
