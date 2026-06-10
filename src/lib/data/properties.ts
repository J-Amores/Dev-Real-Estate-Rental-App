// PLACEHOLDER: swap for real API/DB.
// In-memory seed data layer for the real-estate scaffolding. All functions are
// async so a real backend can replace this module without touching call sites.
// Contract: .harness/api-contract.md (authoritative model: .harness/data-model.md).

import type { Property, PropertyQuery } from "@/lib/types";

const SEED_PROPERTIES: Property[] = [
  {
    id: "p-001",
    slug: "monolith-house",
    title: "Monolith House",
    description:
      "A sculptural concrete residence reduced to its essential geometry. Double-height living volume, gallery-white interiors, and a single uninterrupted ribbon window framing the ridge line.",
    status: "for-sale",
    type: "house",
    price: 2450000,
    currency: "USD",
    address: {
      street: "1 Ridgeline Drive",
      city: "Topanga",
      state: "CA",
      postalCode: "90290",
      country: "US",
    },
    location: { lat: 34.0936, lng: -118.6012 },
    beds: 4,
    baths: 3,
    areaSqFt: 3850,
    lotSqFt: 21780,
    yearBuilt: 2021,
    features: ["Board-formed concrete", "Double-height atrium", "Ribbon glazing", "Radiant floors"],
    images: [
      { src: "/images/hero-mono.png", alt: "Monolith House — concrete facade" },
      { src: "/images/interior-view.png", alt: "Monolith House — interior view" },
    ],
    featured: true,
    createdAt: "2026-04-02T09:00:00.000Z",
    updatedAt: "2026-06-01T09:00:00.000Z",
  },
  {
    id: "p-002",
    slug: "grain-loft",
    title: "Grain Loft",
    description:
      "Top-floor loft in a converted print works. Blackened-steel stair, 4.2 m ceilings, and north-facing skylights that wash the space in even, shadowless light.",
    status: "for-sale",
    type: "apartment",
    price: 1250000,
    currency: "USD",
    address: {
      street: "88 Foundry Row, Unit 5A",
      city: "Portland",
      state: "OR",
      postalCode: "97209",
      country: "US",
    },
    beds: 2,
    baths: 2,
    areaSqFt: 1980,
    yearBuilt: 1936,
    features: ["4.2 m ceilings", "North skylights", "Blackened-steel stair", "Freight elevator"],
    images: [
      { src: "/images/mono-1.png", alt: "Grain Loft — main living volume" },
      { src: "/images/mono-2.png", alt: "Grain Loft — skylight detail" },
    ],
    featured: true,
    createdAt: "2026-03-18T09:00:00.000Z",
    updatedAt: "2026-05-22T09:00:00.000Z",
  },
  {
    id: "p-003",
    slug: "corten-courtyard-villa",
    title: "Corten Courtyard Villa",
    description:
      "Single-storey villa wrapped around a gravel courtyard. Corten steel facade weathering to a deep umber, with floor-to-ceiling sliders on all four courtyard elevations.",
    status: "for-rent",
    type: "house",
    price: 8500,
    currency: "USD",
    address: {
      street: "14 Quarry Lane",
      city: "Marfa",
      state: "TX",
      postalCode: "79843",
      country: "US",
    },
    beds: 3,
    baths: 2,
    areaSqFt: 2640,
    lotSqFt: 43560,
    yearBuilt: 2019,
    features: ["Corten steel facade", "Central courtyard", "Pool", "Desert xeriscape"],
    images: [
      { src: "/images/rusted-metal.png", alt: "Corten Courtyard Villa — weathered steel facade" },
      { src: "/images/hero-side-2.png", alt: "Corten Courtyard Villa — courtyard elevation" },
    ],
    createdAt: "2026-05-04T09:00:00.000Z",
    updatedAt: "2026-06-03T09:00:00.000Z",
  },
  {
    id: "p-004",
    slug: "ridge-cabin-04",
    title: "Ridge Cabin 04",
    description:
      "Off-grid timber cabin on a granite shelf. Charred-larch cladding, a single picture window facing the valley, and a wood-fired sauna cube twenty paces from the door.",
    status: "pending",
    type: "house",
    price: 685000,
    currency: "USD",
    address: {
      street: "4 Shelf Road",
      city: "Index",
      state: "WA",
      postalCode: "98256",
      country: "US",
    },
    beds: 1,
    baths: 1,
    areaSqFt: 760,
    lotSqFt: 87120,
    yearBuilt: 2023,
    features: ["Charred-larch cladding", "Off-grid solar", "Sauna cube", "Valley picture window"],
    images: [
      { src: "/images/mono-3.png", alt: "Ridge Cabin 04 — charred larch exterior" },
      { src: "/images/hero-side-3.png", alt: "Ridge Cabin 04 — valley elevation" },
    ],
    createdAt: "2026-02-10T09:00:00.000Z",
    updatedAt: "2026-05-30T09:00:00.000Z",
  },
  {
    id: "p-005",
    slug: "gallery-townhouse",
    title: "Gallery Townhouse",
    description:
      "Four-level townhouse organised around a sculptural white stair. Monochrome material palette throughout — honed basalt, white oak, and matte plaster.",
    status: "sold",
    type: "townhouse",
    price: 1890000,
    currency: "USD",
    address: {
      street: "22 Mercer Walk",
      city: "Brooklyn",
      state: "NY",
      postalCode: "11201",
      country: "US",
    },
    beds: 3,
    baths: 3,
    areaSqFt: 2880,
    yearBuilt: 2017,
    features: ["Sculptural stair", "Honed basalt", "Roof terrace", "Cellar studio"],
    images: [
      { src: "/images/mono-4.png", alt: "Gallery Townhouse — stair volume" },
      { src: "/images/hero-side-4.png", alt: "Gallery Townhouse — street elevation" },
    ],
    featured: true,
    createdAt: "2026-01-26T09:00:00.000Z",
    updatedAt: "2026-04-14T09:00:00.000Z",
  },
];

/** List properties, applying simple in-memory filtering/sorting per PropertyQuery. */
export async function getProperties(query?: PropertyQuery): Promise<Property[]> {
  let results = [...SEED_PROPERTIES];
  if (query) {
    if (query.status) results = results.filter((p) => p.status === query.status);
    if (query.type) results = results.filter((p) => p.type === query.type);
    if (query.minPrice !== undefined) results = results.filter((p) => p.price >= query.minPrice!);
    if (query.maxPrice !== undefined) results = results.filter((p) => p.price <= query.maxPrice!);
    if (query.beds !== undefined) results = results.filter((p) => p.beds >= query.beds!);
    if (query.baths !== undefined) results = results.filter((p) => p.baths >= query.baths!);
    if (query.city)
      results = results.filter(
        (p) => p.address.city.toLowerCase() === query.city!.toLowerCase(),
      );
    if (query.featured !== undefined)
      results = results.filter((p) => Boolean(p.featured) === query.featured);
    switch (query.sort) {
      case "price-asc":
        results.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        results.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        results.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
    }
    const offset = query.offset ?? 0;
    const limit = query.limit ?? results.length;
    results = results.slice(offset, offset + limit);
  }
  return results;
}

export async function getPropertyById(id: string): Promise<Property | null> {
  return SEED_PROPERTIES.find((p) => p.id === id) ?? null;
}

export async function getPropertyBySlug(slug: string): Promise<Property | null> {
  return SEED_PROPERTIES.find((p) => p.slug === slug) ?? null;
}

export async function getFeaturedProperties(limit?: number): Promise<Property[]> {
  return getProperties({ featured: true, sort: "newest", limit });
}
