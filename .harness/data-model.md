# Data model — real-estate scaffolding

Authoritative entity definitions for the ecommerce scaffolding. The Architect turns these
into the real TypeScript contract at `src/lib/types.ts`; the data layer placeholder lives
at `src/lib/data/properties.ts`. Scaffolding only — no DB, no API, no persistence.

## Property (core entity)

```ts
export type PropertyStatus = "for-sale" | "for-rent" | "pending" | "sold";

export type PropertyType =
  | "house"
  | "apartment"
  | "condo"
  | "townhouse"
  | "land"
  | "commercial";

export interface PropertyImage {
  src: string;   // path under /public, e.g. "/images/mono-1.png"
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
  id: string;            // stable unique id (used by /properties/[id])
  slug: string;          // url-safe, unique
  title: string;
  description: string;
  status: PropertyStatus;
  type: PropertyType;
  price: number;         // integer minor-unit-free amount (e.g. 1250000)
  currency: string;      // ISO 4217, e.g. "USD"
  address: Address;
  location?: GeoPoint;   // optional until a map exists
  beds: number;
  baths: number;
  areaSqFt: number;
  lotSqFt?: number;
  yearBuilt?: number;
  features: string[];    // e.g. ["Pool", "Corten steel facade"]
  images: PropertyImage[]; // first image = cover
  featured?: boolean;
  createdAt: string;     // ISO 8601
  updatedAt: string;     // ISO 8601
}
```

## Query / listing helpers

```ts
export interface PropertyQuery {
  status?: PropertyStatus;
  type?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;            // minimum
  baths?: number;           // minimum
  city?: string;
  featured?: boolean;
  sort?: "price-asc" | "price-desc" | "newest";
  limit?: number;
  offset?: number;
}
```

## Data layer placeholder (`src/lib/data/properties.ts`)

Async signatures so a real backend can replace the in-memory fixture without touching
call sites. All functions read from a module-local `SEED_PROPERTIES: Property[]` array
(3–6 entries) whose images reuse existing `public/images/*.png` assets (hero-side-1..4,
mono-1..4, hero-mono). Mark the file `// PLACEHOLDER: swap for real API/DB`.

```ts
export async function getProperties(query?: PropertyQuery): Promise<Property[]>;
export async function getPropertyById(id: string): Promise<Property | null>;
export async function getPropertyBySlug(slug: string): Promise<Property | null>;
export async function getFeaturedProperties(limit?: number): Promise<Property[]>;
```

Notes:
- `getProperties` should apply at least `status`, `featured`, `sort`, `limit` filtering
  against the seed data (simple, in-memory) so the stub pages are exercisable.
- IDs in seeds: short strings ("p-001"…), slugs derived from titles.
- Future entities (Agent, Inquiry/Lead, Favorite) are explicitly OUT of scope — do not
  scaffold them.
