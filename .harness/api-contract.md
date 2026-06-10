# API Contract — evasion-mono (Astro + Preact skeleton)

Written by the Architect. This is the stable surface between the data layer, the
pages, and any future real backend. Call sites may only depend on what is listed
here. Authoritative entity shapes: `.harness/data-model.md` → implemented 1:1 in
`src/lib/types.ts`.

## Stack (chosen + verified)

- Astro **5.x** (`astro@^5.18`), static output (`output: "static"`, builds to `dist/`).
  Pinned to v5 because this environment runs Node 20.x (Astro 6 requires Node ≥22.12).
- `@astrojs/preact@^4` islands (`jsxImportSource: preact`), `lucide-preact` for icons.
- Tailwind CSS v4 via `@tailwindcss/vite` (NOT postcss; the legacy `postcss.config.mjs`
  is neutralized for Astro in `astro.config.mjs` and dies with the Next sources in M1).
- Inter self-hosted via `@fontsource/inter` (registers family `Inter`, matching the
  `--font-sans` stack in globals.css; `--font-inter` exposed from `Layout.astro`).
- Path alias `@/*` → `./src/*` (tsconfig `paths` **and** vite `resolve.alias`).

## Data layer — `src/lib/data/properties.ts` (PLACEHOLDER, in-memory)

All functions are `async` and MUST keep these exact signatures so a real API/DB can
replace the module without touching call sites:

```ts
import type { Property, PropertyQuery } from "@/lib/types";

export async function getProperties(query?: PropertyQuery): Promise<Property[]>;
export async function getPropertyById(id: string): Promise<Property | null>;
export async function getPropertyBySlug(slug: string): Promise<Property | null>;
export async function getFeaturedProperties(limit?: number): Promise<Property[]>;
```

Semantics (implemented against `SEED_PROPERTIES`, 5 entries `p-001`…`p-005`):
- `getProperties` applies, in order: `status`, `type`, `minPrice`/`maxPrice`,
  `beds`/`baths` (minimums), `city` (case-insensitive equality), `featured`
  (boolean match), then `sort` (`price-asc` | `price-desc` | `newest` by
  `createdAt`), then `offset`/`limit` slicing. No query → all seeds, seed order.
- `getPropertyById` / `getPropertyBySlug` return `null` (never throw) on miss.
- `getFeaturedProperties(limit)` ≡ `getProperties({ featured: true, sort: "newest", limit })`.
- Seed images only reference existing `/images/*.png` under `public/` (hero-mono,
  hero-side-2..4, mono-1..4, interior-view, rusted-metal).
- `price` is a whole-currency integer (`formatPrice()` in `src/lib/utils.ts` renders
  it); `for-rent` prices are monthly.

## Routes (static, all prerendered — verified in build output)

| Route | Source | Contract |
|-------|--------|----------|
| `/` | `src/pages/index.astro` | Landing page; sections in old `app/page.tsx` order; anchor ids `hero`, `technology`, `gallery`, `accessories`, `about`, `reserve` must exist for the Header island |
| `/properties` | `src/pages/properties/index.astro` | Lists `getProperties({ sort: "newest" })`; each card links to `/properties/{id}` |
| `/properties/[id]` | `src/pages/properties/[id].astro` | `getStaticPaths` over `getProperties()`; param is `Property.id` (NOT slug); renders title, price, address, cover image, beds/baths/area, features |

## Shared utilities — `src/lib/utils.ts`

```ts
export function cn(...inputs: ClassValue[]): string;          // clsx + tailwind-merge
export function formatPrice(price: number, currency?: string): string; // "$2,450,000"
```

## Island contracts (to be implemented in M3 under `src/components/islands/`)

- `Header` — `client:load`; no props; reads scroll position (>50px → pill style) and
  owns mobile-menu state; anchors to the ids listed above.
- `HeroSection` — `client:load`; no props; sticky 200vh scroll choreography per spec.
- `GallerySection` — `client:visible`; no props; rAF card stacking of `mono-1..4.png`.
- `FadeImage` — smallest island or vanilla `<script>`; props `{ src, alt, class }`.

## Verification commands (all green at skeleton hand-off)

- `npx pnpm build` → 7 routes (`/`, `/properties`, 5 detail pages)
- `npx pnpm check` → 0 errors / 0 warnings / 0 hints
- `npx pnpm preview` → `/`, `/properties`, `/properties/p-001` respond 200
- Legacy app for M0 baselines: `npx pnpm next:dev` (port 3000, `tsconfig.next.json`)
