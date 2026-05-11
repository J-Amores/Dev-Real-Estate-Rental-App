# Phase 5 — Property Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `app/properties/[id]/page.tsx` — a public, no-auth property detail page that reads a Property row joined to Location (PostGIS coords via `$queryRaw`) and Manager, and renders a hero+thumbnail gallery, key facts, description, amenities, highlights, single-marker map, and "Listed by" byline. Owning manager sees Edit/Delete; everyone sees disabled Favorite (Phase 8) and Apply (Phase 9) stubs.

**Architecture:** Next.js App Router RSC. One `$queryRaw` join (Property ⨝ Location ⨝ Manager) in `lib/queries.ts`. Two new client components: `PropertyGallery` (state-only thumbnail rail) and `PropertyMap` (mapbox-gl, single marker, no scrollZoom, fallback tile when token missing). Auth is read once via `auth()` to gate owner affordances.

**Tech Stack:** Next.js 15.5.15, React 19, Prisma 7 + PostGIS, Auth.js v5, Tailwind v4 with DESIGN.md tokens, `mapbox-gl` (new dep).

**Spec:** `docs/superpowers/specs/2026-05-11-phase-5-property-detail-design.md`. Read it before starting — every task below traces back to a spec section.

**Verification note:** This project has no test runner (no Jest/Vitest). Phases 1–4 verified via `npx tsc --noEmit`, `npm run lint`, `npm run build`, and the spec's smoke checklist. Phase 5 follows the same pattern. Do not introduce a test framework as part of Phase 5 — it's out of scope.

**Styling note:** Per `CLAUDE.md`, frontend UI work goes through `/impeccable:impeccable`. This plan focuses on structure + behavior with placeholder DESIGN.md token classes; Task 6 invokes `/impeccable:impeccable` to do the visual polish pass before the smoke checklist.

---

## File Structure

**New files:**
- `lib/queries.ts` — `getPropertyDetail(id)` + `PropertyDetail` type. Shared with Phase 7 search later.
- `components/property-gallery.tsx` — client, hero + thumbnail rail.
- `components/property-map.tsx` — client, single-marker mapbox-gl preview with fallback.
- `app/properties/[id]/page.tsx` — RSC route that composes the three.

**Modified files:** None expected. If `package.json` adds deps, that's the only edit.

**Env changes:**
- `.env.local` — add `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`.
- Vercel — add `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` to all 3 environments.

---

## Task 1: Install mapbox-gl and add the env token

**Files:**
- Modify: `package.json` (via npm)
- Modify: `.env.local`
- Verify: Vercel project env

- [ ] **Step 1: Install runtime + types**

Run:
```bash
npm install mapbox-gl
npm install --save-dev @types/mapbox-gl
```

Expected: both packages added to `dependencies` / `devDependencies` in `package.json`. No peer-dep warnings beyond the usual React 19 noise.

- [ ] **Step 2: Add the Mapbox token to `.env.local`**

User obtains a public Mapbox token from mapbox.com (Account → Tokens → "Default public token" or a new public token).

Append to `.env.local`:
```
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.<paste-token-here>
```

If `.env.local` doesn't exist locally, copy from production: `vercel env pull .env.local --environment=development` and then append the line.

Note: `AUTH_SECRET` may get overwritten if the user re-pulls; regenerate locally if signin breaks (see CLAUDE.md "Technical Facts" → AUTH_SECRET).

- [ ] **Step 3: Add the token to Vercel for all 3 environments**

Run (interactively — Vercel will prompt for the value each time):
```bash
vercel env add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN development
vercel env add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN preview
vercel env add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN production
```

Paste the same token at each prompt.

Verify:
```bash
vercel env ls | grep MAPBOX
```
Expected: three rows (development / preview / production) showing `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` as Encrypted. Per CLAUDE.md's Vercel gotcha, "Encrypted" can mask an empty value — verify with `vercel env pull --environment=production .env.vercel-check && grep MAPBOX .env.vercel-check && rm .env.vercel-check`.

- [ ] **Step 4: Commit the package changes**

Run:
```bash
git add package.json package-lock.json
git commit -m "Phase 5 - In Progress - install mapbox-gl"
```

`.env.local` is gitignored — nothing to commit there.

---

## Task 2: Create `lib/queries.ts` with `getPropertyDetail`

**Files:**
- Create: `lib/queries.ts`

- [ ] **Step 1: Write the query module**

Create `lib/queries.ts` with this exact content:

```ts
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
```

Why the `Row`/cast dance: Prisma's `$queryRaw` returns `Decimal` / `Float` columns as either `number` or `string` depending on driver settings. Coercing to `Number` once in the wrapper means the consumer (the page) gets a clean `PropertyDetail` and never has to think about it. Enum casts to `text` so Postgres doesn't return them in their raw enum form (which can confuse JSON serialization).

- [ ] **Step 2: Type-check**

Run:
```bash
npx tsc --noEmit
```
Expected: PASS with no new errors related to `lib/queries.ts`.

- [ ] **Step 3: Smoke the query against the running app (manual)**

The query is exercised end-to-end by Task 5's page render — no standalone test here since we have no test runner. If the column casing looks off when Task 5 renders, return here and adjust the SQL aliases.

- [ ] **Step 4: Commit**

```bash
git add lib/queries.ts
git commit -m "Phase 5 - In Progress - add getPropertyDetail query"
```

---

## Task 3: Build `components/property-gallery.tsx`

**Files:**
- Create: `components/property-gallery.tsx`

- [ ] **Step 1: Write the component**

Create `components/property-gallery.tsx`:

```tsx
"use client";

import { useState } from "react";

const PLACEHOLDER = "/placeholder.jpg";

type Props = {
  photoUrls: string[];
  altBase: string;
};

export function PropertyGallery({ photoUrls, altBase }: Props) {
  const photos = photoUrls.length > 0 ? photoUrls : [PLACEHOLDER];
  const [activeIndex, setActiveIndex] = useState(0);
  const safeIndex = Math.min(activeIndex, photos.length - 1);
  const hero = photos[safeIndex];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[16/10] overflow-hidden rounded-photo bg-surface-sunk">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={hero}
          src={hero}
          alt={`${altBase} — photo ${safeIndex + 1}`}
          className="h-full w-full object-cover"
          onError={(event) => {
            const target = event.currentTarget;
            if (target.src.endsWith(PLACEHOLDER)) return;
            target.src = PLACEHOLDER;
          }}
        />
      </div>

      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Property photos">
          {photos.map((src, idx) => {
            const isActive = idx === safeIndex;
            return (
              <button
                key={`${src}-${idx}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Show photo ${idx + 1}`}
                onClick={() => setActiveIndex(idx)}
                className={[
                  "relative h-16 w-24 shrink-0 overflow-hidden rounded-xs bg-surface-sunk",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-2 focus-visible:ring-offset-surface-paper",
                  isActive ? "ring-2 ring-accent-evergreen ring-offset-2 ring-offset-surface-paper" : "opacity-80 hover:opacity-100",
                ].join(" ")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    const target = event.currentTarget;
                    if (target.src.endsWith(PLACEHOLDER)) return;
                    target.src = PLACEHOLDER;
                  }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

Notes for the engineer:
- `"use client"` is required for `<img onError>` and `useState` — same gotcha that bit Phase 4.
- `key={hero}` on the hero `<img>` forces React to remount when the src changes; otherwise `onError` from a previous failed src can stick.
- `safeIndex` guards against `photoUrls` shrinking under us (it won't in practice, but the cost is one min() call).
- No `next/image` — the spec uses plain `<img>` for parity with PropertyCard and to keep the URL-only image pipeline (master spec §9).

- [ ] **Step 2: Type-check + lint**

```bash
npx tsc --noEmit && npm run lint
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/property-gallery.tsx
git commit -m "Phase 5 - In Progress - add PropertyGallery component"
```

---

## Task 4: Build `components/property-map.tsx`

**Files:**
- Create: `components/property-map.tsx`

- [ ] **Step 1: Write the component**

Create `components/property-map.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

type Props = {
  lat: number | null;
  lng: number | null;
  label?: string;
};

export function PropertyMap({ lat, lng, label }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const hasCoords = typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng);
  const canRender = Boolean(token) && hasCoords;

  useEffect(() => {
    if (!canRender || !containerRef.current) return;

    mapboxgl.accessToken = token!;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [lng!, lat!],
      zoom: 14,
      scrollZoom: false,
      dragRotate: false,
      attributionControl: { compact: true },
    });

    const marker = new mapboxgl.Marker().setLngLat([lng!, lat!]).addTo(map);
    if (label) marker.setPopup(new mapboxgl.Popup({ offset: 24 }).setText(label));

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [canRender, lat, lng, label, token]);

  if (!canRender) {
    return (
      <div
        className="flex aspect-[16/9] w-full items-center justify-center rounded-photo bg-surface-sunk text-caption text-ink-soft"
        role="img"
        aria-label="Map preview unavailable"
      >
        Map preview unavailable
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="aspect-[16/9] w-full overflow-hidden rounded-photo bg-surface-sunk"
      aria-label={label ? `Map showing ${label}` : "Property map"}
      role="img"
    />
  );
}
```

Notes:
- `mapboxgl.accessToken` is module-level state on the mapbox-gl side. Setting it inside the effect each mount is intentional defensive code; it's idempotent.
- `scrollZoom: false` is the spec-mandated UX choice. `dragRotate: false` removes a desktop gesture most users don't want for a single-marker preview.
- The fallback tile renders when the token is missing OR coords are null. Both cases are real (Phase 1 seed data without coords would hit the latter).
- Cleanup `map.remove()` is critical — `useEffect` re-runs would otherwise leak Map instances on prop changes.

- [ ] **Step 2: Type-check + lint**

```bash
npx tsc --noEmit && npm run lint
```

If TS complains about `mapboxgl.Map` types not found despite the @types install, check that `mapbox-gl` resolved a 3.x version — its bundled types should be picked up automatically. If both type sources fight each other, remove `@types/mapbox-gl` and rerun.

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/property-map.tsx
git commit -m "Phase 5 - In Progress - add PropertyMap component"
```

---

## Task 5: Build `app/properties/[id]/page.tsx`

**Files:**
- Create: `app/properties/[id]/page.tsx`

- [ ] **Step 1: Write the route**

Create `app/properties/[id]/page.tsx`:

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";

import { DeletePropertyButton } from "@/components/delete-property-button";
import { PropertyGallery } from "@/components/property-gallery";
import { PropertyMap } from "@/components/property-map";
import { buttonClassName } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getPropertyDetail } from "@/lib/queries";
import { humanize } from "@/lib/utils";

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const integerFormatter = new Intl.NumberFormat("en-US");

type RouteParams = { params: Promise<{ id: string }> };

export default async function PropertyDetailPage({ params }: RouteParams) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const property = await getPropertyDetail(id);
  if (!property) notFound();

  const session = await auth();
  const isOwner =
    session?.user?.id != null && String(session.user.id) === property.managerId;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/search"
          className="text-caption text-ink-soft hover:text-ink"
        >
          ← Back to search
        </Link>
        {isOwner && (
          <div className="flex items-center gap-1">
            <Link
              href={`/dashboard/properties/${property.id}/edit`}
              className={buttonClassName({ variant: "ghost" })}
            >
              Edit
            </Link>
            <DeletePropertyButton propertyId={property.id} variant="card" />
          </div>
        )}
      </div>

      {/* Gallery */}
      <PropertyGallery photoUrls={property.photoUrls} altBase={property.name} />

      {/* Title block */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-display text-ink">{property.name}</h1>
          <p className="text-body text-ink-soft tabular-nums">
            <span className="font-medium text-ink">
              {priceFormatter.format(property.pricePerMonth)} / mo
            </span>
            <span className="mx-1.5 text-ink-faint" aria-hidden>·</span>
            <span>
              {property.city}, {property.state}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled
            aria-disabled="true"
            title="Saving is coming soon"
            className={buttonClassName({ variant: "secondary" })}
          >
            ♡ Save
          </button>
          <button
            type="button"
            disabled
            aria-disabled="true"
            title="Applying is coming soon"
            className={buttonClassName({ variant: "primary" })}
          >
            Apply
          </button>
        </div>
      </header>

      {/* Facts row */}
      <ul className="flex flex-wrap gap-2" aria-label="Property facts">
        {[
          `${property.beds} bd`,
          `${property.baths} ba`,
          `${integerFormatter.format(property.squareFeet)} sqft`,
          humanize(property.propertyType),
        ].map((fact) => (
          <li
            key={fact}
            className="inline-flex items-center rounded-xs bg-surface-sunk px-2 py-1 text-caption text-ink-soft tabular-nums"
          >
            {fact}
          </li>
        ))}
      </ul>

      {/* Description */}
      <section className="flex flex-col gap-2">
        <h2 className="text-title text-ink">About this property</h2>
        <p className="text-body text-ink-soft whitespace-pre-line">
          {property.description}
        </p>
      </section>

      {/* Amenities */}
      {property.amenities.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-title text-ink">Amenities</h2>
          <ul className="flex flex-wrap gap-2">
            {property.amenities.map((value) => (
              <li
                key={value}
                className="inline-flex items-center rounded-xs bg-surface-sunk px-2 py-1 text-caption text-ink-soft"
              >
                {humanize(value)}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Highlights */}
      {property.highlights.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-title text-ink">Highlights</h2>
          <ul className="flex flex-wrap gap-2">
            {property.highlights.map((value) => (
              <li
                key={value}
                className="inline-flex items-center rounded-xs bg-surface-sunk px-2 py-1 text-caption text-ink-soft"
              >
                {humanize(value)}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Location */}
      <section className="flex flex-col gap-3">
        <h2 className="text-title text-ink">Location</h2>
        <p className="text-body text-ink-soft">
          {property.address}, {property.city}, {property.state} {property.postalCode}
        </p>
        <PropertyMap lat={property.lat} lng={property.lng} label={property.name} />
      </section>

      {/* Listed by */}
      <section className="flex flex-col gap-1 border-t border-hairline pt-6">
        <h2 className="text-title text-ink">Listed by</h2>
        <p className="text-body text-ink-soft">
          {property.managerName} ·{" "}
          <a
            href={`mailto:${property.managerEmail}`}
            className="text-accent-evergreen hover:underline"
          >
            {property.managerEmail}
          </a>
        </p>
      </section>
    </main>
  );
}
```

Notes:
- `params: Promise<{ id: string }>` is the Next.js 15 App Router shape — `params` is async. Don't downgrade to the old sync shape; it's a type error in 15.
- Token classes referenced (`text-display`, `text-title`, `text-body`, `text-caption`, `text-ink`, `text-ink-soft`, `text-ink-faint`, `bg-surface-sunk`, `rounded-xs`, `rounded-photo`, `border-hairline`, `text-accent-evergreen`, `tabular-nums`) all come from the @theme block established in earlier Phase 4 commits. Verify each exists; if any have been renamed, swap to the current name — don't invent new ones.
- The disabled CTAs use `buttonClassName` so they pick up the global disabled styling (`disabled:opacity-60 disabled:cursor-not-allowed`) without bespoke classes.

- [ ] **Step 2: Type-check + lint**

```bash
npx tsc --noEmit && npm run lint
```
Expected: PASS.

- [ ] **Step 3: Build**

```bash
npm run build
```
Expected: PASS. New route `/properties/[id]` appears in the route table as a dynamic route.

- [ ] **Step 4: Commit**

```bash
git add app/properties/[id]/page.tsx
git commit -m "Phase 5 - In Progress - add public property detail route"
```

---

## Task 6: Visual polish via `/impeccable:impeccable`

**Files:**
- Possibly modify: `app/properties/[id]/page.tsx`, `components/property-gallery.tsx`, `components/property-map.tsx` — only token swaps and layout refinements; no behavioral changes.

- [ ] **Step 1: Invoke the skill**

Per CLAUDE.md, all frontend UI work goes through `/impeccable:impeccable`. Invoke it now with full Phase 5 context: pass the three new files, the DESIGN.md North Star ("The Hospitable Operator"), and the spec section §4 (UI structure).

Ask the skill to:
1. Audit token usage against DESIGN.md (Tinted Neutral Rule, mixed-corners, sunken-fill, flat elevation).
2. Refine vertical rhythm between sections.
3. Validate that disabled CTAs read as deferred-stub rather than broken.
4. Confirm the owner action bar matches the "quiet but discoverable" intent.

- [ ] **Step 2: Apply suggested edits (token swaps and layout only)**

Restrict changes to className strings and small structural tweaks. Do NOT change:
- The `$queryRaw` shape.
- The Gallery/Map prop contracts.
- The `notFound()` / `auth()` logic.

If the skill suggests a behavioral change (e.g., enabling Save/Apply), refuse — those are Phase 8/9.

- [ ] **Step 3: Re-verify**

```bash
npx tsc --noEmit && npm run lint && npm run build
```
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/properties/[id]/page.tsx components/property-gallery.tsx components/property-map.tsx
git commit -m "Phase 5 - In Progress - impeccable polish pass on property detail"
```

If no changes were needed, skip the commit — don't make an empty commit.

---

## Task 7: Smoke checklist (spec §7) — gates "Phase 5 - Done"

**Files:** None — this is verification only.

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```
Expected: server listening on `http://localhost:3000`. No build errors in stdout.

- [ ] **Step 2: Identify a property id owned by the seeded manager**

In a second shell:
```bash
npx tsx -e "import{prisma} from './lib/prisma'; (async()=>{const u=await prisma.user.findUnique({where:{email:'john.smith@example.com'}});const p=await prisma.property.findFirst({where:{managerId:u?.id}});console.log({userId:u?.id,propertyId:p?.id,name:p?.name});await prisma.\$disconnect();})()"
```

Record the `propertyId` returned. Call this `OWNER_ID` below. If the manager owns no properties, pick a different seeded manager's email and re-run.

- [ ] **Step 3: Smoke item 1 — public anonymous view**

In a private browser window (no session cookie), visit `http://localhost:3000/properties/${OWNER_ID}`.

Verify:
- Page renders end-to-end (no error overlay, no missing-data placeholders).
- Gallery shows hero + thumbnail rail (if `photoUrls.length > 1`).
- Facts row, description, amenities (if any), highlights (if any), map, "Listed by" all visible.
- Owner action bar (Edit/Delete) is NOT present.
- Save and Apply buttons are visible and visibly disabled.

- [ ] **Step 4: Smoke item 2 — owning manager view**

Sign in as `john.smith@example.com` / `password123` at `/signin`. Visit `/properties/${OWNER_ID}`.

Verify: owner action bar appears top-right (Edit + Delete). Everything else as item 1.

- [ ] **Step 5: Smoke item 3 — tenant view**

Sign out. Sign in as `smoke@test.com` / `password123`. Visit `/properties/${OWNER_ID}`.

Verify: no owner action bar. Disabled CTAs unchanged.

- [ ] **Step 6: Smoke items 4–5 — invalid ids**

While signed in (any role), visit:
- `/properties/999999` → Next.js default 404 page (not a 500, not a blank page).
- `/properties/abc` → same 404.

- [ ] **Step 7: Smoke item 6 — thumbnail interaction**

Back on `/properties/${OWNER_ID}`, click each thumbnail in turn. Hero image should swap and the clicked thumbnail should show the active ring.

- [ ] **Step 8: Smoke item 7 — map behavior**

Verify on `/properties/${OWNER_ID}`:
- Marker visible at the property location.
- Click-and-drag pans the map.
- Mousewheel over the map does NOT zoom — page scrolls past it.
- No console errors mentioning mapbox or WebGL.

- [ ] **Step 9: Smoke item 8 — token fallback**

Stop the dev server. Temporarily edit `.env.local` to set `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=invalid`. Restart `npm run dev`. Visit `/properties/${OWNER_ID}`.

Verify: page renders; map area shows "Map preview unavailable" fallback tile; no console errors.

Restore the real token. Restart dev server.

- [ ] **Step 10: Smoke item 9 — gates**

```bash
npm run build && npm run lint && npx tsc --noEmit
```
Expected: all three exit 0.

- [ ] **Step 11: Record smoke results**

If every step above passed, Phase 5 is done. If any failed, return to the relevant task and fix before continuing.

---

## Task 8: Finalize Phase 5

**Files:** None new — this is the rollup commit + CLAUDE.md update.

- [ ] **Step 1: Update CLAUDE.md "Completed Phases" table**

Open `CLAUDE.md`. In the Completed Phases table, append a row for Phase 5. Use the latest commit's short SHA after the rollup commit lands — easier to fill in during Step 3.

Also update the "Current Phase" section: replace the Phase 5 plan block with a one-line "Next" pointing at Phase 6 (landing page, master spec §8).

- [ ] **Step 2: Type-check + lint final pass**

```bash
npx tsc --noEmit && npm run lint && npm run build
```
Expected: PASS.

- [ ] **Step 3: Rollup commit**

If intermediate `Phase 5 - In Progress` commits are clean and well-named, the rollup is just the CLAUDE.md edit:

```bash
git add CLAUDE.md
git commit -m "Phase 5 - Done - public property detail with gallery and map"
```

Don't squash. The intermediate commits document the build order and are useful in `git blame`.

- [ ] **Step 4: Confirm with user before pushing**

`git push origin main` would publish Phase 5 to GitLab → GitHub mirror → Vercel production. Per CLAUDE.md HARD RULES, don't push without explicit user confirmation.

Surface the push command to the user:
> "Phase 5 commits are local. Push to origin (GitLab → GitHub mirror → Vercel) now, or hold?"

Wait for confirmation before running `git push origin main`.

---

## Out-of-band risks to flag during execution

- **Token in client bundle.** `NEXT_PUBLIC_*` env vars ship to the browser. That's expected for Mapbox public tokens but worth a sanity check that the token is a `pk.*` public token, not a secret token.
- **Schema column casing.** Postgres preserves quoted identifiers. `$queryRaw` will return columns with the exact name written in the SELECT. If a field comes back `undefined` in dev, log the row keys first — don't assume the column doesn't exist.
- **Map re-mount on prop change.** Currently `lat`/`lng` are deps of the effect; if a parent ever re-renders with new coords, the Map gets torn down and rebuilt. That's correct for this phase (single property, never changes). Phase 7 (multi-marker search) will refactor — don't pre-optimize here.
- **Reduced motion.** PRODUCT.md requires `prefers-reduced-motion`. Mapbox respects this for its own animations by default; the only motion this page introduces is the hero image swap on thumbnail click, which is instant — no animation, no motion violation.

---

## Self-review notes

- All spec sections (§1–§11) have a corresponding task. §5 components × 2 → Tasks 3 + 4. §3 fetch → Task 2. §4 UI structure → Task 5. §7 smoke → Task 7. §8 prereqs → Task 1. §9 risks surfaced in "Out-of-band" section.
- No placeholders: every code block is the actual code to paste. Every command is the actual command to run.
- Type consistency: `PropertyDetail` defined in Task 2 is consumed in Task 5 (same shape). `propertyId: number` in Task 5 matches `DeletePropertyButton` and `getPropertyDetail` signatures. `lat: number | null` / `lng: number | null` consistent across the query, the page, and the Map component.
- TDD note: replaced "write failing test" pattern with "write code → type-check → lint → build → manual smoke" because the project has no test runner. Adding one would be Phase 5 scope creep and not what was asked.
