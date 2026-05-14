# Landing Globe — Design Spec

**Date:** 2026-05-14
**Phase:** 10 (replaces Phase 9 landing page)
**Author:** Brainstormed with John A
**Status:** Draft — awaiting review

---

## 1. Goal

Replace the Phase 9 marketing landing page (Hero / Features / Discover / CTA / Footer) with a single full-viewport interactive globe. Polaroid markers around the sphere preview rental locations and link into `/search`. Borrows the visual pattern from `design-update/global-landing.txt` (cobe + polaroid overlay) and re-skins to the existing `DESIGN.md` "Hospitable Operator" warm light palette.

## 2. Non-goals

- Dark mode (deferred — landing ships light only; whole-app dark rollout is a later phase).
- Sign-in / sign-up / host-CTA surfaces on `/` (deliberately dropped — see §11 Open issues).
- Real DB-backed marker data (deferred to Phase 11+; this spec ships mock data with a swap-ready interface).
- Mapbox / Nominatim integration on landing (`/search` already handles geocoding).
- Tests for cobe library internals (vendored code).

## 3. Approach (chosen)

**Globe-only landing.** Page is 100vh, content is a centered globe with 6 polaroid markers. No header, no nav, no search bar on the page itself, no footer. The polaroids are the sole interactive elements. Skip-link rescues keyboard / screen-reader users into `/search`.

Rejected alternatives:
- Globe-in-hero-with-sandwich-layout (had search bar + copy + globe) — user explicitly requested globe IS the entire page.
- Full-bleed globe with overlaid copy — backdrop contrast risks failing WCAG 2.2 AA.
- Asymmetric 2-column hero — smallest change but contradicts user direction.

## 4. Architecture

### Files deleted

- `components/landing/hero.tsx`
- `components/landing/features.tsx`
- `components/landing/discover.tsx`
- `components/landing/cta.tsx`
- `components/landing/footer.tsx`
- `public/landing-splash.jpg`

### Files rewritten

- `app/page.tsx` — minimal RSC. Drops `auth()`, `prisma`, `getRecentProperties`, `force-dynamic`, header markup. Renders `<main>` with centered `<GlobeStatic>` (SSR) wrapped so client can dynamically swap to `<GlobeClient>`.

### Files created

- `components/landing/globe-or-fallback.tsx` — client component. Reads `useReducedMotion()`. If reduced, renders `<GlobeStatic>` directly (cobe chunk never loads). Otherwise renders `<GlobeClient>` via `next/dynamic({ ssr: false, loading: () => <GlobeStatic /> })`. Imported and rendered by `app/page.tsx`.
- `components/landing/globe-client.tsx` — client component. Wraps `createGlobe()` from cobe. Renders canvas + absolutely-positioned polaroid overlays using CSS Anchor Positioning. Accepts `markers: PolaroidMarker[]`. Mounted only when motion is allowed.
- `components/landing/globe-static.tsx` — SSR-safe SVG fallback. Equirectangular dot pattern + 6 polaroid links positioned around the sphere via pre-computed transforms. Used for: (a) SSR initial paint inside `<GlobeOrFallback>`, (b) `next/dynamic` `loading` state during chunk fetch, (c) reduced-motion mode (terminal — never swaps to client).
- `components/landing/polaroid-marker.tsx` — small presentational component. Renders an `<a>` wrapping image + caption. Shared between client + static.
- `lib/landing-markers.ts` — `LANDING_MARKERS: PolaroidMarker[]` (6 cities). Single source of truth.
- `public/landing-globe/{tokyo,lisbon,new-york,cape-town,sydney,mexico-city}.jpg` — 240×240 CC0 city photos.
- `scripts/bake-globe-svg.ts` — build-time script that runs cobe once to extract dot positions, emits `components/landing/globe-dot-positions.ts` (consumed by `globe-static.tsx`). Run manually; output checked in.

### Dependencies added

```
cobe        ~3kb gzipped, single file, no transitive deps
```

`framer-motion` already in tree from Phase 9.

### Type contract

```ts
// lib/landing-markers.ts
export type PolaroidMarker = {
  id: string;
  location: [number, number]; // [lat, lng]
  image: string;              // /landing-globe/<id>.jpg
  caption: string;            // display name
  rotate: number;             // -8..+8 degrees
  href: string;               // /search?location=<encoded>
};

export const LANDING_MARKERS: PolaroidMarker[] = [
  { id: "tokyo",       location: [ 35.68, 139.65], image: "/landing-globe/tokyo.jpg",       caption: "Tokyo",       rotate: -5, href: "/search?location=Tokyo" },
  { id: "lisbon",      location: [ 38.72,  -9.14], image: "/landing-globe/lisbon.jpg",      caption: "Lisbon",      rotate:  4, href: "/search?location=Lisbon" },
  { id: "new-york",    location: [ 40.71, -74.01], image: "/landing-globe/new-york.jpg",    caption: "New York",    rotate: -3, href: "/search?location=New+York" },
  { id: "cape-town",   location: [-33.92,  18.42], image: "/landing-globe/cape-town.jpg",   caption: "Cape Town",   rotate:  6, href: "/search?location=Cape+Town" },
  { id: "sydney",      location: [-33.87, 151.21], image: "/landing-globe/sydney.jpg",      caption: "Sydney",      rotate: -4, href: "/search?location=Sydney" },
  { id: "mexico-city", location: [ 19.43, -99.13], image: "/landing-globe/mexico-city.jpg", caption: "Mexico City", rotate:  3, href: "/search?location=Mexico+City" },
];
```

### Future DB swap (Phase 11+, not implemented here)

`app/page.tsx` gains an async `getLandingMarkers()`:

```sql
SELECT DISTINCT ON (location.city)
  property.id, location.city,
  ST_Y(location.coordinates::geometry) AS lat,
  ST_X(location.coordinates::geometry) AS lng,
  property."photoUrls"[1] AS image
FROM property
JOIN location ON location.id = property."locationId"
ORDER BY location.city, property."postedDate" DESC
LIMIT 6;
```

Maps each row to `PolaroidMarker` with `href = "/properties/" + id`. Falls back to `LANDING_MARKERS` if fewer than 4 cities returned. `<GlobeClient markers={markers} />` is already prop-driven; zero internal refactor.

## 5. Page layout

```tsx
// app/page.tsx (RSC)
export default function LandingPage() {
  return (
    <main className="min-h-svh flex items-center justify-center bg-surface-paper relative">
      <a href="/search" className="sr-only focus:not-sr-only fixed top-4 left-4 z-50 rounded-sm bg-accent-evergreen px-3 py-2 text-label font-medium text-surface-paper">
        Skip to search
      </a>
      <h1 className="sr-only">Real Estate App — explore rentals around the world</h1>
      <div
        className="aspect-square"
        style={{ width: "clamp(280px, min(80vw, 70vh), 720px)" }}
      >
        <GlobeOrFallback markers={LANDING_MARKERS} />
      </div>
    </main>
  );
}
```

`<GlobeOrFallback>` (client) is the boundary that decides: (a) reduced-motion → render `<GlobeStatic>` directly; (b) default → `next/dynamic({ ssr: false, loading: () => <GlobeStatic /> })` for `<GlobeClient>`. The same `<GlobeStatic>` is reused for SSR placeholder, dynamic loading state, and reduced-motion terminal — no `<Suspense>` needed.

## 6. Design tokens (light only, no dark this phase)

### Cobe parameters

| Param | Value | Token derivation |
|---|---|---|
| `dark` | `0` | Light theme |
| `baseColor` | `[0.96, 0.95, 0.93]` | `surface-panel` oklch(95% 0.006 90) |
| `markerColor` | `[0.13, 0.40, 0.30]` | `accent-evergreen` oklch(38% 0.08 165) — dots only, well under 10% of viewport |
| `glowColor` | `[0.91, 0.95, 0.93]` | `accent-evergreen-soft` oklch(94% 0.02 165) |
| `diffuse` | `1.2` | Softer / matte vs ref 1.5 |
| `mapBrightness` | `6` | Tuned for warm beige base; ref 9 oversaturates |
| `mapSamples` | `16000` | Ref-preserved |
| `markerElevation` | `0` | Ref-preserved |
| `phi increment` | `0.003` | Ref auto-rotate speed |

### Polaroid frame

| Property | Value |
|---|---|
| Background | `var(--color-surface-paper)` |
| Padding | `6px 6px 24px` desktop / `4px 4px 18px` mobile |
| Shadow | `0 1px 2px oklch(20% 0.012 160 / 0.06), 0 4px 12px oklch(20% 0.012 160 / 0.08)` |
| Border | `1px solid var(--color-hairline)` |
| Border-radius | `0` — deliberate sharp print edge |
| Image | `60×60` desktop / `48×48` mobile, `object-cover`, no radius |
| Caption | `text-caption` token, `color: var(--color-ink-soft)`, inherits `cv11 ss03 tnum` features |
| Rotation | `-8°..+8°` per marker via `transform: rotate(...)` |
| Hover | `scale(1.05)` over 150ms ease-out, disabled in reduced-motion |
| Focus | `outline: 2px solid var(--color-accent-evergreen); outline-offset: 4px` |
| Touch target | `min-width: 48px; min-height: 48px` on `<a>` wrapper |

### Page background

`bg-surface-paper` (warm off-white). Globe panel-beige sits on cream — ~3% lightness step, no banding.

## 7. Responsive

Globe size:
```
width: clamp(280px, min(80vw, 70vh), 720px)
aspect-ratio: 1
```

- Mobile 375w: ~300px globe.
- Tablet 768w: ~540px.
- Desktop 1440w / 900h: ~640px (capped by viewport height).
- Landscape mobile 812×375: ~262px (capped by 70vh).

Polaroids:
- `<sm` breakpoint (`< 640px`): polaroids hidden via `hidden sm:block` on each `<a>`. Globe + cobe dots remain interactive. Visible city list rendered below globe as text-only `<ul>` for touch users + screen readers:

```html
<ul className="sm:hidden mt-6 flex flex-wrap justify-center gap-x-3 gap-y-1 text-caption text-ink-soft">
  {markers.map(m => <li><Link href={m.href}>{m.caption}</Link></li>)}
</ul>
```

- `≥sm`: polaroids float around globe via Anchor Positioning. Mobile list hidden.

Touch:
- `touch-action: none` on canvas (ref-preserved) — prevents page scroll bounce on drag.

## 8. Motion

### Default

- Globe auto-rotates `phi += 0.003` per `requestAnimationFrame`.
- Drag-to-rotate via pointer events (ref-preserved verbatim).
- Polaroid visibility driven by cobe-written CSS custom prop `--cobe-visible-<id>` (0..1). Polaroid `opacity` + `filter: blur(8px)` interpolate per `transition: opacity 0.3s, filter 0.3s`.
- Canvas first paint: `opacity 0 → 1` over 1.2s ease.
- Polaroid hover: `transform: scale(1.05)` 150ms ease-out.

### Reduced (`prefers-reduced-motion: reduce`)

- Cobe chunk not loaded.
- Static SVG renders all 6 polaroids visible simultaneously at pre-computed phi=0 positions.
- No rotation, no fade-in, no blur, no hover scale.
- Polaroid links remain fully functional.

### Battery / visibility

`document.visibilitychange` listener pauses cobe's `requestAnimationFrame` when tab hidden; resumes on visible. Saves battery on background tabs.

## 9. Performance

### Render pipeline

1. RSC SSR's `<main>` + `<GlobeStatic>` SVG inline. First paint shows full SVG globe.
2. Client hydrates. `<GlobeOrFallback>` reads `useReducedMotion()`.
3. If reduced: SVG stays, polaroid `<a>` handlers active. Done.
4. If default: `next/dynamic` lazily fetches `globe-client` chunk (cobe + 3kb component). Component mounts, canvas inits when `offsetWidth > 0`.
5. SVG → canvas swap: identical outer wrapper dimensions → zero CLS.

### Image strategy

- 6 polaroid jpegs, 240×240 source (4× retina for 60×60 displayed), q85, target 30–50kb each.
- Raw `<img>` with `loading="lazy"`, explicit `width`/`height` attrs. Not `next/image` — 6 fixed assets, no responsive variants needed.
- `<link rel="preload" as="image">` for all 6 in `metadata` head so they're cached before cobe writes visibility props.

### Budgets

| Metric | Target |
|---|---|
| LCP | < 1.5s (SSR'd SVG paints on first frame) |
| CLS | 0 (explicit wrapper dimensions before swap) |
| TBT | < 100ms (cobe init ~1–2ms) |
| a11y score | ≥ 95 |
| perf score (mobile) | ≥ 90 |

### Bundle delta vs Phase 9

- Removed: hero / features / discover / cta / footer client code, splash image (~80kb).
- Added: globe-client + cobe (~3kb gz + ~2kb component) + 6 polaroid images (~250kb).
- Net JS shipped on `/`: down (Phase 9 features section was animation-heavy).
- Net image weight: up (~170kb), but lazy-loaded.

### Dev HMR

Cobe double-init guard preserved (`if (width === 0 || globe) return`). Cleanup runs first on HMR.

## 10. A11y

| Concern | Implementation |
|---|---|
| Landmark | `<main>` wraps content |
| Heading | `<h1 className="sr-only">Real Estate App — explore rentals around the world</h1>` |
| Page title | `metadata.title = "Real Estate App"`, `metadata.description = "Find a calmer place to rent. Real homes from small-scale hosts."` |
| Skip-link | `<a href="/search" className="sr-only focus:not-sr-only fixed top-4 left-4 z-50 ...">Skip to search</a>` — first tab stop |
| Polaroid link | `<a href aria-label={`Browse rentals in ${caption}`}>` |
| Canvas | `<canvas role="img" aria-label="Interactive globe showing rental locations in six cities">` |
| Tab order | skip-link → polaroid 1..6 in DOM order |
| Keyboard | `Enter`/`Space` on focused link activates href. No custom keyboard handlers. |
| Touch target | `min-w-[48px] min-h-[48px]` on link wrapper |
| Reduced-motion | Static SVG path; all polaroids visible; no animation |
| Contrast | Polaroid caption `ink-soft` on `surface-paper` ≈ 7:1 (AAA). Globe dots `evergreen` on `surface-panel` ≈ 5.2:1 (AA). |
| Mobile fallback | `<sm`: visible city list `<ul>` replaces hidden polaroids |

## 11. Open issues (flagged for reviewer)

1. **No sign-in / sign-up surface on `/`.** Manager and tenant funnel both require knowing direct URLs (`/signin`, `/signup`). Accept for this spec; revisit in Phase 11 when DB-backed markers arrive.
2. **No host conversion CTA.** `PRODUCT.md` strategic principle #4 (host growth) loses its primary surface. Same revisit window as #1.
3. **No footer / legal links.** Once Terms / Privacy pages exist, footer must return — likely launch-blocker for public deploy. Track in Phase 12.
4. **No returning-user dashboard link.** Logged-in user landing on `/` has no visible path to their dashboard. Direct URL works.
5. **CSS Anchor Positioning compat.** Chrome 125+, Safari 26+, Firefox flag-gated. Firefox users get inline-stacked polaroids beneath globe — graceful degradation, but visually less rich. Document in spec; accept.
6. **Mock city images.** 6 placeholder CC0 photos in this commit; user replaces with curated images in a follow-up commit (`Phase 10b - Update - landing globe photos`).
7. **DB swap is future work.** Spec defines the contract (`PolaroidMarker[]` prop), but real query lives in Phase 11+.
8. **Empty-state risk on polaroid clicks.** `/search?location=Tokyo` returns "no results" on current seed (Pasadena-cluster only). Existing Phase 6 empty-state UI handles it. Honest aspirational marketing — accept.

## 12. Testing

| Test | Tool | Pass criteria |
|---|---|---|
| Type check | `tsc --noEmit` | No new errors |
| Lint | `eslint` | No new jsx-a11y or next/core-web-vitals warnings |
| Build | `next build --turbopack` | Builds; cobe chunk code-split |
| Dev smoke | manual | Globe spins, drag works, polaroids fade per rotation, links resolve |
| Reduced-motion smoke | DevTools "Emulate prefers-reduced-motion: reduce" | SVG renders, no animation, all polaroids visible, links work |
| Mobile smoke | DevTools 375×667 | Globe ~300px, polaroids hidden, text city list visible, skip-link first tab |
| Lighthouse | `npx lighthouse http://localhost:3000` | a11y ≥ 95, perf ≥ 90 mobile |
| Playwright | existing `e2e/` | Update Phase 1 smoke: assert `<canvas>` OR `<svg>` present, h1 sr-only text exists, 6 polaroid links present. Remove DB-count assertion. |

## 13. Definition of done

- All files in §4 created / rewritten / deleted.
- `cobe` added to `package.json`.
- 6 city images present in `public/landing-globe/`.
- `tsc`, `eslint`, `next build` all clean.
- Manual dev smoke + reduced-motion smoke pass.
- Lighthouse a11y ≥ 95, perf ≥ 90.
- Playwright smoke updated and passing.
- Commit: `Phase 10 - Done - landing globe (cobe + polaroid markers + reduced-motion SVG fallback)`.

## 14. Out of scope (Phase 11+ work)

- DB-backed markers (query + fallback chain).
- Dark mode (whole-app rollout, including DESIGN.md amendment).
- Real city photography curation.
- Sign-in / sign-up / host-CTA re-introduction on `/`.
- Footer with Terms / Privacy.
- Cobe library forking or upgrade.
