# Phase 5 — Public property detail page

**Date:** 2026-05-11
**Scope:** Phase 5 of the real-estate MVP. First public read surface.
**Reference:** Master spec §8 (`docs/superpowers/specs/2026-05-05-real-estate-mvp-design.md`).
This document is an implementation-level addendum, not a replacement.

---

## 1. Goal

Ship `app/properties/[id]/page.tsx` — a public, no-auth-required property detail page that
reads the same row Phase 4 writes (`Property` ⨝ `Location`, coordinates pulled from PostGIS),
and exposes:

- Photo gallery (hero + thumbnail rail).
- Title, price, location, key facts, description, amenities, highlights.
- Single-marker map preview centered on the property.
- "Listed by" byline.
- For the **owning manager**: top-right Edit / Delete affordances linking to the existing
  Phase 4 edit page.
- For all viewers: visually present, **disabled** Favorite (Phase 8) and Apply (Phase 9)
  stubs. No live handlers yet.

Success criteria are captured in §7 (Smoke checklist). Phase 5 is done when every item passes.

---

## 2. Non-goals

These are explicitly out of scope to prevent scope creep:

- Live Favorite action (Phase 8).
- Apply form / `createApplicationAction` (Phase 9).
- Lightbox / fullscreen gallery.
- Custom 404 theming.
- Schema cascade fix on `Application` / `Lease` (deferred — see CLAUDE.md).
- Deduping `isPetsAllowed` / `WasherDryer` (deferred — see CLAUDE.md).
- Image uploads (URL-only per master spec §9).

---

## 3. Architecture

### Route

`app/properties/[id]/page.tsx` — React Server Component. No `loading.tsx`, no `error.tsx`
in this phase. Default Next.js 404 covers missing/invalid ids.

### Param handling

```ts
const id = Number(params.id);
if (!Number.isInteger(id) || id <= 0) notFound();
```

### Data fetch — single round-trip

Prisma can't surface PostGIS `geography` columns via `findUnique` (the column is typed
`Unsupported(...)` in the schema). Same workaround Phase 7 will reuse:

```ts
const rows = await prisma.$queryRaw<PropertyDetailRow[]>`
  SELECT p.*,
         l.id AS "location_id", l.address, l.city, l.state, l.country, l."postalCode",
         ST_X(l.coordinates::geometry) AS lng,
         ST_Y(l.coordinates::geometry) AS lat,
         m.name AS "manager_name", m.email AS "manager_email"
  FROM "Property" p
  JOIN "Location" l ON l.id = p."locationId"
  JOIN "Manager"  m ON m."userId" = p."managerId"
  WHERE p.id = ${id}
  LIMIT 1
`;
if (rows.length === 0) notFound();
const property = rows[0];
```

The exact column projection lives in `lib/queries.ts` (new file) — a single named function
`getPropertyDetail(id: number)` returning a typed shape. Keeps the route file thin and gives
Phase 7 a place to add `searchProperties()` later.

Note on the Manager schema: `Manager.userId` is the FK to `User.id` (a cuid string).
`Property.managerId` references `Manager.userId` (not `Manager.id`). The owner check
`session.user.id === property.managerId` is therefore a direct string compare.

### Session read

```ts
const session = await auth();
const isOwner = session?.user?.id != null && session.user.id === String(property.managerId);
```

`managerId` is the FK column on Property (`String @default(cuid())` per CLAUDE.md). Owner
match is by id, not email. Anonymous viewers: `session` is `null` → `isOwner` is `false`.

### Why no `revalidate`

Public, low-traffic page. Per-request rendering is fine. Phase 4 already calls
`revalidatePath` on create/update/delete; staleness isn't a concern at this scale.

---

## 4. UI structure

Single-column layout, max-w-content. Sections, top to bottom:

1. **Header row** — `← Back` link (left) + owner action bar `[Edit] [Delete]` (right, only
   when `isOwner`).
2. **Gallery** — `<PropertyGallery photoUrls={property.photoUrls} />`. Hero 16:10 + thumb
   rail. Empty `photoUrls` → single placeholder, no rail.
3. **Title block** — H1 name; price + city/state on a second line; disabled `♡ Save` and
   `Apply` buttons right-aligned.
4. **Facts row** — chip group: `{beds} bd · {baths} ba · {squareFeet} sqft · {propertyType}`.
5. **Description** — `property.description` as prose paragraph(s).
6. **Amenities** — chip group, `property.amenities[]` humanized.
7. **Highlights** — chip group, `property.highlights[]` humanized.
8. **Location** — full address text + `<PropertyMap lat={lat} lng={lng} label={name} />`.
9. **Listed by** — `manager_name` + `mailto:` link to `manager_email` (both pulled in the
   same `$queryRaw` join above).

All styling cites existing DESIGN.md tokens (`text-title`, `text-ink-soft`, `rounded-photo`,
`rounded-xs`, `bg-surface-sunk`, `border-hairline`, etc.). No new tokens introduced.
Visual polish runs through `/impeccable:impeccable` after the structural pass.

---

## 5. New components

### `components/property-gallery.tsx` (client)

- Props: `{ photoUrls: string[] }`.
- State: `const [activeIndex, setActiveIndex] = useState(0)`.
- Hero `<img>` shows `photoUrls[activeIndex] ?? PLACEHOLDER`.
- Thumbnail rail: maps `photoUrls`, each thumbnail is a `<button>` with `aria-pressed`
  reflecting active state; click sets index.
- Reuses the `<img onError>` swap-to-`/placeholder.jpg` pattern from `PropertyCard`.
- Empty `photoUrls`: render single placeholder, no rail.

### `components/property-map.tsx` (client)

- Props: `{ lat: number | null; lng: number | null; label?: string }`.
- Uses `mapbox-gl` with default `streets-v12` style at zoom 14, `scrollZoom: false`,
  `dragRotate: false`.
- Single default `mapboxgl.Marker` at `[lng, lat]`.
- `import "mapbox-gl/dist/mapbox-gl.css"` at top of file.
- Reads `process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`. If missing or if `lat`/`lng` is null,
  renders a fallback tile: `<div className="aspect-[16/9] rounded-photo bg-surface-sunk
  flex items-center justify-center text-caption text-ink-soft">Map preview unavailable</div>`.
- `useEffect` cleans up the Map on unmount (`map.remove()`).

### `lib/queries.ts` (new)

- Exports `getPropertyDetail(id: number)` returning `Promise<PropertyDetail | null>`.
- Encapsulates the `$queryRaw` above so the route file is declarative.
- `PropertyDetail` type lives here and is the shape passed into the page.

---

## 6. Inline (no new file)

- **Owner action bar**: two `<Link>`s with `buttonClassName({ variant: "ghost" })` (Edit) and
  `<DeletePropertyButton propertyId={id} variant="card" />` (existing component, reuses the
  "card" variant). No need to add a new variant.
- **Disabled CTAs**: `<button disabled title="Coming soon" aria-disabled="true">` for both
  Save and Apply. No handlers, no state, no toast.
- **Chip groups**: same pattern as PropertyCard's type chip — `inline-flex items-center
  rounded-xs bg-surface-sunk px-2 py-1 text-caption text-ink-soft`. Reuse `humanize()` from
  `lib/utils.ts` for enum values.

---

## 7. Smoke checklist (gates "Phase 5 - Done")

1. `/properties/1` unauthenticated → gallery, facts, description, amenities, highlights,
   map, byline all visible. No owner bar. Save + Apply buttons present but visibly disabled.
2. Signed in as the owning manager of property #1 → owner action bar appears top-right.
   (Verify which seeded manager owns id #1 — likely `john.smith@example.com`; confirm
   against seed output before claiming pass.)
3. Signed in as `smoke@test.com` (tenant) → no owner bar; disabled CTAs unchanged.
4. `/properties/999999` → Next.js default 404.
5. `/properties/abc` → Next.js default 404.
6. Click each thumbnail → hero image swaps to the chosen photo.
7. Map renders a marker at the correct coords. Drag-pan works. Mousewheel does NOT zoom the
   map. Page scroll passes over the map cleanly.
8. Set `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=invalid` → page still renders; map area shows the
   "Map preview unavailable" fallback. Restore the real token afterward.
9. `npm run build && npm run lint && npx tsc --noEmit` all green.

---

## 8. Dependencies & prerequisites

### npm

- `npm install mapbox-gl`
- `npm install --save-dev @types/mapbox-gl` (drop if `mapbox-gl`'s bundled types are
  sufficient under our `tsconfig`; decide during impl).

### Env (blocker)

`NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` is **not currently in `.env.local`** — verified.
CLAUDE.md's claim that it's already present is stale.

Required before map smoke-tests pass:

1. User obtains a public Mapbox token (mapbox.com → Account → Tokens → public default).
2. Add to `.env.local`: `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk....`
3. Add to Vercel:
   `vercel env add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN preview production development`
4. Defensive fallback in `property-map.tsx` covers the misconfig case so the page never
   crashes on a missing token.

### Public assets

`singlelisting-2.jpg`, `singlelisting-3.jpg` already in `public/`. No new asset work.

---

## 9. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Mapbox token absent in any env (local or Vercel) | Component renders fallback tile, never throws. Token add is in checklist. |
| `mapbox-gl` is heavy (~400 KB gz). | Phase 5 ships it on one route; Phase 7 search will reuse the same dep — no incremental cost there. Defer code-split decision unless Lighthouse complains. |
| `<img onError>` requires `"use client"` (gotcha from Phase 4) | Both new components are `"use client"`. |
| Owner-match uses `session.user.id` against `property.managerId` | `User.id` is `String @default(cuid())` per CLAUDE.md; managerId is the FK to it. Cast to `String()` to be safe. |
| Phase 4 `revalidatePath("/dashboard/properties")` doesn't include the public route | Acceptable — public page reads fresh per request. No `revalidate` config means SSR defaults. |
| `$queryRaw` SQL injection | `id` is coerced to a number and runtime-checked before interpolation. Prisma's tagged-template `$queryRaw` parameterizes the value regardless. |

---

## 10. Commit plan

Single commit when smoke checklist passes:

```
Phase 5 - Done - public property detail with gallery and map
```

If the work splits across sessions, intermediate commits use `Phase 5 - In Progress -
<brief>` per CLAUDE.md convention.

---

## 11. After Phase 5

Phase 6 lands the landing page (`app/page.tsx`) per master spec §8. Phase 7 builds
`/search` and will reuse `lib/queries.ts` for the `$queryRaw` join pattern and
`property-map.tsx` for the multi-marker map.
