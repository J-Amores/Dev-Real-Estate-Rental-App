# Landing Globe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Phase 9 marketing landing (Hero/Features/Discover/CTA/Footer) with a single full-viewport interactive 3D globe whose only interactive elements are 6 polaroid city markers linking to `/search?location=...`.

**Architecture:** RSC `app/page.tsx` SSR-renders an SVG fallback (`<GlobeStatic>`); client component `<GlobeOrFallback>` either keeps that SVG (reduced motion) or lazily mounts `<GlobeClient>` (cobe WebGL canvas + CSS Anchor Positioning polaroid overlays) via `next/dynamic`. The decision boundary lives in one component so cobe never loads for users who opted out of motion.

**Tech Stack:** Next.js 15 (App Router, RSC), React 19, TypeScript, Tailwind v4, `cobe` (new), `framer-motion` (already present, used only for `useReducedMotion()`).

**Spec:** `docs/superpowers/specs/2026-05-14-landing-globe-design.md` (commit `c104cee`).

**Deviations from spec (lock in here):**
1. Spec §4 lists a `scripts/bake-globe-svg.ts` build script to extract cobe dot positions for the SVG fallback. Dropped. Static SVG uses a simple equirectangular dot grid via `<pattern>` clipped to a circle — no build step, no checked-in generated file.
2. Spec §12 references Playwright e2e gates. No committed Playwright harness exists; test gates are `tsc` + `eslint` + `next build` + manual dev smoke + Lighthouse. Local Playwright runs stay out-of-band as before.

---

## Pre-flight (every task, every executor)

This is a frontend / UI plan. CLAUDE.md HARD rule: **all frontend UI work must go through `/impeccable:impeccable`**. That slash command auto-loads `PRODUCT.md`, `DESIGN.md`, and `DESIGN.json` and enforces the design system across the run.

**Before starting any task in this plan:**

1. Invoke `/impeccable:impeccable` in the current session. Wait for it to load the design system. (User-invoked only — agents cannot invoke slash commands themselves; if running as a subagent, request the main thread to invoke it before dispatching the first task.)
2. Read the three design docs in this order:
   - `PRODUCT.md` — register, audience (small-scale property managers), five strategic principles, WCAG 2.2 AA + reduced-motion hard requirements.
   - `DESIGN.md` — North Star *"The Hospitable Operator"*, Hospitable Evergreen `oklch(38% 0.08 165)` on ≤10% of screen, warm neutrals, Inter monoculture (`cv11`, `ss03`, `tnum`), mixed corners (6–8px controls / 14–16px surfaces), flat elevation, **light only** (dark is deferred per spec §2).
   - `DESIGN.json` — tonal ramps, motion / shadow tokens, component snippets. Source of truth for any numeric value not already in `app/globals.css`.
3. Cross-check that every color / spacing / radius value introduced in this plan resolves to a named token from `DESIGN.md` or a CSS custom property already declared in `app/globals.css`. Token map for this plan:

| Surface | Token | CSS custom prop |
|---|---|---|
| Page background | surface-paper | `var(--color-surface-paper)` |
| Globe sphere fill | surface-panel | `var(--color-surface-panel)` |
| Globe dots | accent-evergreen | `var(--color-accent-evergreen)` |
| Globe atmospheric glow | accent-evergreen-soft | `var(--color-accent-evergreen-soft)` |
| Polaroid frame | surface-paper | `var(--color-surface-paper)` |
| Polaroid edge | hairline | `var(--color-hairline)` |
| Polaroid caption | ink-soft | `var(--color-ink-soft)` |
| Skip-link bg | accent-evergreen | `var(--color-accent-evergreen)` |
| Skip-link text | surface-paper | `var(--color-surface-paper)` |
| Focus ring | accent-evergreen | `var(--color-accent-evergreen)` |

If any value below in Tasks 3–7 cannot be traced to this table or `app/globals.css`, **stop and ask** — don't invent. The cobe RGB float triplets (`[0.96, 0.95, 0.93]` etc.) are oklch-token conversions; cobe only accepts RGB floats, so the source-of-truth oklch values live in the token column above and the floats are mechanical conversions noted in spec §6.

4. Confirm the ≤10% evergreen accent budget. Painted-evergreen surfaces in this plan: globe markers (tiny dots), polaroid focus rings (only when focused), skip-link (only when keyboard-focused). All combined ≪ 10% of viewport. Pass.

5. Confirm reduced-motion contract. `useReducedMotion()` is checked in Task 6; static SVG path in Task 4 has zero animation; CSS `transition` properties on the polaroid (Task 3) decay automatically under `prefers-reduced-motion: reduce` because they're driven from cobe's custom-prop writes — and cobe never mounts in reduced mode (Task 6).

**Subagent dispatch note:** if executing via `superpowers:subagent-driven-development`, each subagent prompt MUST include: "Read `CLAUDE.md`, `PRODUCT.md`, `DESIGN.md` first. This plan's tokens are listed in the Pre-flight section — use them verbatim. Do not introduce colors, spacings, or radii not in the Pre-flight token map or `app/globals.css`."

---

## File Structure

### Created
| Path | Responsibility |
|---|---|
| `lib/landing-markers.ts` | `PolaroidMarker` type + `LANDING_MARKERS` const (6 cities). Single source of truth. |
| `components/landing/polaroid-marker.tsx` | Pure presentational `<a>` wrapping image + caption. Used by both globe-client + globe-static. |
| `components/landing/globe-static.tsx` | Server-renderable SVG. Dot-pattern circle + 6 polaroids positioned via lat/lng→2D projection. SSR initial paint, dynamic-loading placeholder, and reduced-motion terminal. |
| `components/landing/globe-client.tsx` | Client. Wraps `cobe`'s `createGlobe`. Canvas + Anchor-Positioned polaroid overlays. |
| `components/landing/globe-or-fallback.tsx` | Client decision boundary. `useReducedMotion()` → `<GlobeStatic>` (terminal) vs `next/dynamic({ ssr: false })` `<GlobeClient>` with `<GlobeStatic>` as loading placeholder. |
| `public/landing-globe/tokyo.jpg` | 240×240 CC0 city photo, q85. |
| `public/landing-globe/lisbon.jpg` | 240×240 CC0 city photo. |
| `public/landing-globe/new-york.jpg` | 240×240 CC0 city photo. |
| `public/landing-globe/cape-town.jpg` | 240×240 CC0 city photo. |
| `public/landing-globe/sydney.jpg` | 240×240 CC0 city photo. |
| `public/landing-globe/mexico-city.jpg` | 240×240 CC0 city photo. |

### Rewritten
| Path | Change |
|---|---|
| `app/page.tsx` | Full rewrite. Drops `auth()`, `prisma`, `getRecentProperties`, `force-dynamic`, header markup. Renders `<main>` with skip-link, sr-only h1, sized globe wrapper, and `<GlobeOrFallback>`. Adds `metadata` export with image preloads. |

### Deleted
| Path | Reason |
|---|---|
| `components/landing/hero.tsx` | Replaced by globe. |
| `components/landing/features.tsx` | Out of scope per "globe only" decision. |
| `components/landing/discover.tsx` | Same. |
| `components/landing/cta.tsx` | Same. |
| `components/landing/footer.tsx` | Same. |
| `public/landing-splash.jpg` | No longer referenced. |

### Modified packages
| Path | Change |
|---|---|
| `package.json` | Add `"cobe": "^0.6.4"` to `dependencies`. |
| `package-lock.json` | Regenerated by `npm install`. |

---

## Task 0: Invoke `/impeccable:impeccable` to vet + amend design docs

**Files (likely):**
- Modify: `DESIGN.md`
- Modify: `DESIGN.json`
- Modify: `PRODUCT.md` (only if §3 below surfaces a real principle conflict)

The globe landing introduces patterns not yet documented in the design system. Before any code lands, the design docs must either (a) absorb the new patterns or (b) explicitly accept the drift with a dated note. Pure-code execution before this step risks committing UI that contradicts its own design system.

- [ ] **Step 1: Invoke the slash command**

In the main thread (subagents cannot invoke slash commands), run:
```
/impeccable:impeccable
```

This auto-loads `PRODUCT.md`, `DESIGN.md`, `DESIGN.json`. Tell it:
> Vet the landing-globe spec at `docs/superpowers/specs/2026-05-14-landing-globe-design.md` against `DESIGN.md` / `DESIGN.json` / `PRODUCT.md`. Identify new patterns or token gaps the spec introduces. Propose minimal amendments — either fold the new patterns in, or document the deviation explicitly. Do not edit code; only design docs.

- [ ] **Step 2: Expect these candidate amendments (impeccable will refine)**

`DESIGN.md` — likely adds:
- A "Landing globe" page-pattern entry under §Pages or §Patterns (whichever convention DESIGN.md already uses) noting: 100vh, single-surface, globe-and-polaroids only, skip-link mandatory.
- A "Polaroid card" component entry under §Components: surface-paper background, hairline border, 6/4 padding, ink-soft caption, sharp corners (deliberate contrast to `radius-photo` surfaces), ≥48×48 touch target on links, rotation in ±8°.
- A note under §Color / §Surfaces clarifying that the cobe sphere uses `surface-panel` (NOT evergreen — preserves the ≤10% accent rule even on a globe-dominant surface).
- Reduced-motion section (if not already present): "Globe → static SVG; polaroid `transition` properties no-op under `prefers-reduced-motion: reduce` because the driving custom-prop writes don't fire."

`DESIGN.json` — likely adds:
- `tokens.cobe.baseColor`, `markerColor`, `glowColor` as derived oklch→RGB triplets so the conversion source is auditable (not magic numbers in `globe-client.tsx`).
- `components.polaroid` block: padding, shadow, border, caption color, rotation range.

`PRODUCT.md` — potential amendments (only if impeccable agrees there's a real principle conflict):
- §Strategic principles: if "Host conversion is a first-class surface on every public page" is currently written, either soften to "…on every conversion-targeted page" or add a footnote acknowledging the Phase 10 landing exception with a Phase-11 re-entry plan.
- WCAG / reduced-motion: confirm already-stated reqs cover the globe; no change expected.

- [ ] **Step 3: Apply the amendments impeccable proposes**

Impeccable's output is a set of suggested edits — apply them. Push back on any amendment that contradicts the spec's "globe-only" decision unless impeccable surfaces a genuine principle violation (in which case escalate to the spec author, not silently soften the spec).

- [ ] **Step 4: Type-check + lint (sanity)**

```bash
npx tsc --noEmit && npx eslint .
```

Expected: PASS (design docs are markdown / JSON; this just confirms nothing else regressed during the edit pass).

- [ ] **Step 5: Commit**

```bash
git add DESIGN.md DESIGN.json PRODUCT.md
git commit -m "Phase 10 - In Progress - design system amendments for landing globe (impeccable)"
```

If a file did not need modification, omit it from the `git add`. The commit must contain at least one of the three.

**Gate:** Tasks 1–9 below are blocked until this commit lands. The Pre-flight token table further up assumes these amendments are in place.

---

## Task 1: Install cobe + scaffold image directory

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `public/landing-globe/` (directory)
- Create: `public/landing-globe/README.md`

- [ ] **Step 1: Install cobe**

Run:
```bash
npm install cobe@^0.6.4
```

Expected: `package.json` gains `"cobe": "^0.6.4"` under `dependencies`, lockfile updates.

- [ ] **Step 2: Verify the install**

Run:
```bash
node -e "console.log(require('cobe'))"
```

Expected: prints `[Function: createGlobe]` (or similar — confirms module resolves).

- [ ] **Step 3: Create the image directory + placeholder note**

Run:
```bash
mkdir -p public/landing-globe
```

Create `public/landing-globe/README.md` with content:
```markdown
# Landing globe city photos

Six 240×240 JPEG files, q85, target 30–50kb each. CC0 licensed.

Required filenames (lowercase, hyphenated):
- tokyo.jpg
- lisbon.jpg
- new-york.jpg
- cape-town.jpg
- sydney.jpg
- mexico-city.jpg

Replace placeholders with curated photography in a follow-up commit.
```

- [ ] **Step 4: Drop placeholder JPEGs**

For each of the six filenames above, save a 240×240 CC0 city photo into `public/landing-globe/`. Sources: Unsplash (CC0-licensed photos by Annie Spratt, Pedro Lastra, etc.) or Pexels (also CC0). Confirm each file is ≤80 KB.

Run to verify:
```bash
ls -la public/landing-globe/
```

Expected: 6 `.jpg` files + `README.md`, each jpg under 80 KB.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json public/landing-globe/
git commit -m "Phase 10 - In Progress - add cobe dep + landing globe city photos"
```

---

## Task 2: Marker data + type contract

**Files:**
- Create: `lib/landing-markers.ts`

- [ ] **Step 1: Write the marker module**

Create `lib/landing-markers.ts`:
```ts
export type PolaroidMarker = {
  id: string;
  /** [lat, lng] — degrees, lat ∈ [-90, 90], lng ∈ [-180, 180]. */
  location: [number, number];
  /** Public-served image path. */
  image: string;
  /** Display caption beneath the image. */
  caption: string;
  /** Frame tilt in degrees, kept within ±8 for visual balance. */
  rotate: number;
  /** Destination on polaroid click. */
  href: string;
};

export const LANDING_MARKERS: readonly PolaroidMarker[] = [
  {
    id: "tokyo",
    location: [35.68, 139.65],
    image: "/landing-globe/tokyo.jpg",
    caption: "Tokyo",
    rotate: -5,
    href: "/search?location=Tokyo",
  },
  {
    id: "lisbon",
    location: [38.72, -9.14],
    image: "/landing-globe/lisbon.jpg",
    caption: "Lisbon",
    rotate: 4,
    href: "/search?location=Lisbon",
  },
  {
    id: "new-york",
    location: [40.71, -74.01],
    image: "/landing-globe/new-york.jpg",
    caption: "New York",
    rotate: -3,
    href: "/search?location=New+York",
  },
  {
    id: "cape-town",
    location: [-33.92, 18.42],
    image: "/landing-globe/cape-town.jpg",
    caption: "Cape Town",
    rotate: 6,
    href: "/search?location=Cape+Town",
  },
  {
    id: "sydney",
    location: [-33.87, 151.21],
    image: "/landing-globe/sydney.jpg",
    caption: "Sydney",
    rotate: -4,
    href: "/search?location=Sydney",
  },
  {
    id: "mexico-city",
    location: [19.43, -99.13],
    image: "/landing-globe/mexico-city.jpg",
    caption: "Mexico City",
    rotate: 3,
    href: "/search?location=Mexico+City",
  },
] as const;
```

- [ ] **Step 2: Type-check**

Run:
```bash
npx tsc --noEmit
```

Expected: PASS (zero new errors). If errors mention `readonly` incompatibility with downstream consumers, drop the `readonly` modifier; the rest of the plan does not require it.

- [ ] **Step 3: Commit**

```bash
git add lib/landing-markers.ts
git commit -m "Phase 10 - In Progress - landing marker type + curated city data"
```

---

## Task 3: Polaroid presentational component

**Files:**
- Create: `components/landing/polaroid-marker.tsx`

- [ ] **Step 1: Write the component**

Create `components/landing/polaroid-marker.tsx`:
```tsx
import Link from "next/link";

import type { PolaroidMarker as Marker } from "@/lib/landing-markers";

type Props = {
  marker: Marker;
  /** When true, applies the entrance opacity/blur custom-prop bindings used by GlobeClient. */
  withVisibilityProps?: boolean;
};

/**
 * Visual polaroid frame around a city photo. Wrapping <a> is the only interactive element
 * on the landing page, so it must remain keyboard-focusable and have a descriptive aria-label.
 */
export function PolaroidMarker({ marker, withVisibilityProps = false }: Props) {
  const opacityVar = `var(--cobe-visible-${marker.id}, 1)`;
  const blurVar = `calc((1 - var(--cobe-visible-${marker.id}, 1)) * 8px)`;

  return (
    <Link
      href={marker.href}
      aria-label={`Browse rentals in ${marker.caption}`}
      className="block min-w-[48px] min-h-[48px] focus-visible:outline-2 focus-visible:outline-accent-evergreen focus-visible:outline-offset-4"
      style={{
        background: "var(--color-surface-paper)",
        padding: "6px 6px 24px",
        boxShadow:
          "0 1px 2px oklch(20% 0.012 160 / 0.06), 0 4px 12px oklch(20% 0.012 160 / 0.08)",
        border: "1px solid var(--color-hairline)",
        transform: `rotate(${marker.rotate}deg)`,
        transition: "transform 150ms ease-out, opacity 0.3s, filter 0.3s",
        ...(withVisibilityProps
          ? { opacity: opacityVar, filter: `blur(${blurVar})` }
          : {}),
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={marker.image}
        alt=""
        width={60}
        height={60}
        loading="lazy"
        className="block h-[60px] w-[60px] object-cover sm:h-[60px] sm:w-[60px]"
      />
      <span
        className="text-caption block text-center"
        style={{
          position: "absolute",
          bottom: 5,
          left: 0,
          right: 0,
          color: "var(--color-ink-soft)",
          letterSpacing: "0.02em",
        }}
      >
        {marker.caption}
      </span>
    </Link>
  );
}
```

- [ ] **Step 2: Type-check + lint**

Run:
```bash
npx tsc --noEmit && npx eslint components/landing/polaroid-marker.tsx
```

Expected: both PASS. The `// eslint-disable-next-line @next/next/no-img-element` is intentional — we explicitly opt out of `next/image` per spec §9.

- [ ] **Step 3: Commit**

```bash
git add components/landing/polaroid-marker.tsx
git commit -m "Phase 10 - In Progress - PolaroidMarker presentational component"
```

---

## Task 4: Static SVG fallback (SSR-safe globe)

**Files:**
- Create: `components/landing/globe-static.tsx`

- [ ] **Step 1: Write the static component**

Create `components/landing/globe-static.tsx`:
```tsx
import { LANDING_MARKERS, type PolaroidMarker } from "@/lib/landing-markers";

import { PolaroidMarker as PolaroidLink } from "./polaroid-marker";

const DOT_PATTERN_ID = "landing-globe-dots";
const CLIP_ID = "landing-globe-clip";

/**
 * Project [lat, lng] to 0..1 x/y over the bounding box of the visible hemisphere.
 * Uses a simple equirectangular projection rotated so the prime meridian sits at center.
 * Hides markers whose longitude lands on the back hemisphere at phi=0 (≈|lng| > 90) by
 * returning null — the caller skips those polaroids in the static view.
 */
function projectVisible(
  lat: number,
  lng: number,
): { x: number; y: number } | null {
  if (Math.abs(lng) > 100) return null;
  const x = (lng + 100) / 200; // -100..100 → 0..1
  const y = (90 - lat) / 180; // 90..-90 → 0..1
  return { x, y };
}

function GlobeMarker({ marker }: { marker: PolaroidMarker }) {
  const projected = projectVisible(marker.location[0], marker.location[1]);
  if (!projected) return null;
  return (
    <div
      className="hidden sm:block absolute pointer-events-auto"
      style={{
        left: `${projected.x * 100}%`,
        top: `${projected.y * 100}%`,
        transform: "translate(-50%, -110%)",
      }}
    >
      <PolaroidLink marker={marker} />
    </div>
  );
}

/**
 * Server-renderable SVG globe. Renders:
 *   - circular dot-pattern sphere using <pattern> clipped to a circle
 *   - 6 polaroid links absolutely positioned via simple equirectangular projection
 *   - a screen-reader-only city list (also shown visibly on mobile)
 * Used as: SSR initial paint, dynamic-loading placeholder, and reduced-motion terminal.
 */
export function GlobeStatic() {
  return (
    <div className="relative h-full w-full">
      <svg
        role="img"
        aria-label="Globe showing rental locations in six cities"
        viewBox="0 0 100 100"
        className="h-full w-full"
      >
        <defs>
          <pattern
            id={DOT_PATTERN_ID}
            width="2"
            height="2"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="0.35" fill="var(--color-accent-evergreen)" />
          </pattern>
          <clipPath id={CLIP_ID}>
            <circle cx="50" cy="50" r="48" />
          </clipPath>
        </defs>
        <circle cx="50" cy="50" r="48" fill="var(--color-surface-panel)" />
        <rect
          x="2"
          y="2"
          width="96"
          height="96"
          fill={`url(#${DOT_PATTERN_ID})`}
          clipPath={`url(#${CLIP_ID})`}
          opacity="0.55"
        />
      </svg>

      {LANDING_MARKERS.map((m) => (
        <GlobeMarker key={m.id} marker={m} />
      ))}

      <ul className="sm:hidden absolute left-0 right-0 -bottom-12 flex flex-wrap justify-center gap-x-3 gap-y-1 text-caption text-ink-soft">
        {LANDING_MARKERS.map((m) => (
          <li key={m.id}>
            <a
              href={m.href}
              className="underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-accent-evergreen focus-visible:outline-offset-2"
            >
              {m.caption}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Type-check + lint**

Run:
```bash
npx tsc --noEmit && npx eslint components/landing/globe-static.tsx
```

Expected: both PASS.

- [ ] **Step 3: Commit**

```bash
git add components/landing/globe-static.tsx
git commit -m "Phase 10 - In Progress - GlobeStatic SVG fallback"
```

---

## Task 5: Cobe client component

**Files:**
- Create: `components/landing/globe-client.tsx`

- [ ] **Step 1: Write the client component**

Create `components/landing/globe-client.tsx`:
```tsx
"use client";

import { useCallback, useEffect, useRef } from "react";
import createGlobe from "cobe";

import type { PolaroidMarker as Marker } from "@/lib/landing-markers";

import { PolaroidMarker as PolaroidLink } from "./polaroid-marker";

type Props = {
  markers: readonly Marker[];
  /** Auto-rotation speed in radians per frame. */
  speed?: number;
};

/**
 * Cobe-driven WebGL globe with CSS-Anchor-Positioned polaroid overlays. Mounted only
 * when motion is allowed. Pauses `requestAnimationFrame` when the tab becomes hidden
 * to spare battery. Pointer-drag pauses auto-rotate; pointer-up commits the drag offset.
 */
export function GlobeClient({ markers, speed = 0.003 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null);
  const dragOffset = useRef({ phi: 0, theta: 0 });
  const phiOffsetRef = useRef(0);
  const thetaOffsetRef = useRef(0);
  const isPausedRef = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerInteracting.current = { x: e.clientX, y: e.clientY };
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
    isPausedRef.current = true;
  }, []);

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current !== null) {
      phiOffsetRef.current += dragOffset.current.phi;
      thetaOffsetRef.current += dragOffset.current.theta;
      dragOffset.current = { phi: 0, theta: 0 };
    }
    pointerInteracting.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = "grab";
    isPausedRef.current = false;
  }, []);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (pointerInteracting.current !== null) {
        dragOffset.current = {
          phi: (e.clientX - pointerInteracting.current.x) / 300,
          theta: (e.clientY - pointerInteracting.current.y) / 1000,
        };
      }
    };
    const handleVisibility = () => {
      isPausedRef.current = document.hidden;
    };
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [handlePointerUp]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    let globe: ReturnType<typeof createGlobe> | null = null;
    let animationId = 0;
    let phi = 0;

    function init() {
      const width = canvas.offsetWidth;
      if (width === 0 || globe) return;

      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        width,
        height: width,
        phi: 0,
        theta: 0.2,
        dark: 0,
        diffuse: 1.2,
        mapSamples: 16000,
        mapBrightness: 6,
        baseColor: [0.96, 0.95, 0.93],
        markerColor: [0.13, 0.4, 0.3],
        glowColor: [0.91, 0.95, 0.93],
        markerElevation: 0,
        markers: markers.map((m) => ({
          location: m.location,
          size: 0.02,
        })),
        arcs: [],
        arcColor: [0.13, 0.4, 0.3],
        arcWidth: 0.5,
        arcHeight: 0.25,
        opacity: 0.7,
      });

      function animate() {
        if (!isPausedRef.current) phi += speed;
        globe!.update({
          phi: phi + phiOffsetRef.current + dragOffset.current.phi,
          theta: 0.2 + thetaOffsetRef.current + dragOffset.current.theta,
        });
        animationId = requestAnimationFrame(animate);
      }
      animate();
      setTimeout(() => {
        if (canvas) canvas.style.opacity = "1";
      });
    }

    if (canvas.offsetWidth > 0) {
      init();
    } else {
      const ro = new ResizeObserver((entries) => {
        const first = entries[0];
        if (first && first.contentRect.width > 0) {
          ro.disconnect();
          init();
        }
      });
      ro.observe(canvas);
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (globe) globe.destroy();
    };
  }, [markers, speed]);

  return (
    <div className="relative aspect-square h-full w-full select-none">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Interactive globe showing rental locations in six cities"
        onPointerDown={handlePointerDown}
        style={{
          width: "100%",
          height: "100%",
          cursor: "grab",
          opacity: 0,
          transition: "opacity 1.2s ease",
          borderRadius: "50%",
          touchAction: "none",
        }}
      />
      {markers.map((m) => (
        <div
          key={m.id}
          className="hidden sm:block absolute pointer-events-auto"
          style={{
            // @ts-expect-error CSS Anchor Positioning is not yet in lib.dom
            positionAnchor: `--cobe-${m.id}`,
            bottom: "anchor(top)",
            left: "anchor(center)",
            translate: "-50% 0",
            marginBottom: 8,
          }}
        >
          <PolaroidLink marker={m} withVisibilityProps />
        </div>
      ))}
    </div>
  );
}

export default GlobeClient;
```

- [ ] **Step 2: Type-check + lint**

Run:
```bash
npx tsc --noEmit && npx eslint components/landing/globe-client.tsx
```

Expected: both PASS. The `@ts-expect-error` is intentional — `positionAnchor` is not in lib.dom typings yet.

- [ ] **Step 3: Commit**

```bash
git add components/landing/globe-client.tsx
git commit -m "Phase 10 - In Progress - GlobeClient cobe canvas"
```

---

## Task 6: Decision boundary (reduced-motion gate + dynamic import)

**Files:**
- Create: `components/landing/globe-or-fallback.tsx`

- [ ] **Step 1: Write the boundary component**

Create `components/landing/globe-or-fallback.tsx`:
```tsx
"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";

import type { PolaroidMarker } from "@/lib/landing-markers";

import { GlobeStatic } from "./globe-static";

const GlobeClient = dynamic(
  () => import("./globe-client").then((m) => m.GlobeClient),
  {
    ssr: false,
    loading: () => <GlobeStatic />,
  },
);

type Props = {
  markers: readonly PolaroidMarker[];
};

/**
 * Single decision boundary for the landing page. If the user prefers reduced motion,
 * render the SVG fallback and never load the cobe chunk. Otherwise dynamic-import the
 * canvas component with the same SVG as a loading placeholder, so the swap is CLS-free.
 */
export function GlobeOrFallback({ markers }: Props) {
  const reduced = useReducedMotion();
  if (reduced) return <GlobeStatic />;
  return <GlobeClient markers={markers} />;
}
```

- [ ] **Step 2: Type-check + lint**

Run:
```bash
npx tsc --noEmit && npx eslint components/landing/globe-or-fallback.tsx
```

Expected: both PASS.

- [ ] **Step 3: Commit**

```bash
git add components/landing/globe-or-fallback.tsx
git commit -m "Phase 10 - In Progress - GlobeOrFallback reduced-motion decision boundary"
```

---

## Task 7: Rewrite `app/page.tsx` and delete legacy landing files

**Files:**
- Rewrite: `app/page.tsx`
- Delete: `components/landing/hero.tsx`
- Delete: `components/landing/features.tsx`
- Delete: `components/landing/discover.tsx`
- Delete: `components/landing/cta.tsx`
- Delete: `components/landing/footer.tsx`
- Delete: `public/landing-splash.jpg`

- [ ] **Step 1: Rewrite `app/page.tsx`**

Replace the entire contents of `app/page.tsx` with:
```tsx
import type { Metadata } from "next";

import { GlobeOrFallback } from "@/components/landing/globe-or-fallback";
import { LANDING_MARKERS } from "@/lib/landing-markers";

export const metadata: Metadata = {
  title: "Real Estate App",
  description:
    "Find a calmer place to rent. Real homes from small-scale hosts in cities around the world.",
};

export default function LandingPage() {
  return (
    <main className="bg-surface-paper relative flex min-h-svh items-center justify-center">
      {/* Next.js 15 App Router hoists <link> JSX from Server Components into <head>. */}
      {LANDING_MARKERS.map((m) => (
        <link key={m.id} rel="preload" as="image" href={m.image} />
      ))}

      <a
        href="/search"
        className="sr-only focus:not-sr-only fixed left-4 top-4 z-50 rounded-sm bg-accent-evergreen px-3 py-2 text-label font-medium text-surface-paper"
      >
        Skip to search
      </a>
      <h1 className="sr-only">
        Real Estate App — explore rentals around the world
      </h1>

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

- [ ] **Step 2: Delete the legacy landing components and splash**

Run:
```bash
git rm components/landing/hero.tsx \
       components/landing/features.tsx \
       components/landing/discover.tsx \
       components/landing/cta.tsx \
       components/landing/footer.tsx \
       public/landing-splash.jpg
```

Expected: 5 .tsx files and 1 .jpg are staged for deletion.

- [ ] **Step 3: Type-check + lint + build**

Run:
```bash
npx tsc --noEmit && npx eslint . && npm run build
```

Expected: all three PASS. The build must produce a `cobe`-named chunk separate from the main client bundle (visible in build output). If `eslint` flags the inline preload `<link>` loop and refuses to be silenced, delete the preload loop entirely — the rest of the page must remain.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "Phase 10 - In Progress - landing globe page + delete legacy hero/features/discover/cta/footer"
```

---

## Task 8: Manual smoke + Lighthouse

**Files:** None — verification only.

- [ ] **Step 1: Start dev server**

Run:
```bash
npm run dev
```

Open `http://localhost:3000` in Chromium.

- [ ] **Step 2: Default-motion smoke**

Verify each of:
- Globe canvas renders.
- Globe auto-rotates clockwise (~one rotation per 35s).
- Dragging the globe with the mouse rotates it, releases hold drag offset.
- 4–6 polaroids visible at any given phi (depending on rotation).
- Polaroids fade + blur smoothly as markers cross the back hemisphere.
- Clicking a polaroid navigates to `/search?location=<city>`.
- Tabbing from page-load focuses "Skip to search" link first.
- Tab again: focus enters the first polaroid; outline ring uses evergreen.
- Page has no horizontal scroll at 1440×900.

Any failure → fix in code, recommit, re-run.

- [ ] **Step 3: Reduced-motion smoke**

In Chromium DevTools → Rendering pane → "Emulate CSS prefers-reduced-motion: reduce". Hard-reload page. Verify:
- No canvas in DOM (`document.querySelector("canvas")` returns null in console).
- SVG element is present.
- All 6 polaroids visible simultaneously.
- No animation runs (visually static).
- Polaroid links still navigate.

Any failure → fix and recommit.

- [ ] **Step 4: Mobile smoke**

DevTools → Device toolbar → iPhone 12 Pro (390×844). Hard-reload. Verify:
- Globe scales to ~310px square, centered.
- Polaroids hidden (no images visible on the canvas).
- Visible inline city list (`Tokyo · Lisbon · ...`) renders below the globe.
- Tapping a city in the list navigates.
- Pinch / scroll does not bounce the page or rotate-on-touch the globe in default mode (drag is still pointer-event-based, single-finger drag rotates).

- [ ] **Step 5: Lighthouse**

In Chromium DevTools → Lighthouse tab. Run for "Desktop" with default settings against `http://localhost:3000`. Then run again for "Mobile".

Required:
- Accessibility ≥ 95 (both modes).
- Performance ≥ 90 (mobile).
- Best Practices ≥ 95.
- No CLS warnings.

Any threshold miss → investigate the offending audit, fix root cause (don't lower the bar), recommit, re-run.

- [ ] **Step 6: Commit QA notes (if any code changed during smoke)**

If steps 2–5 required code fixes, commit them together:
```bash
git add -p
git commit -m "Phase 10 - In Progress - smoke fixes"
```

If no fixes were needed, skip this commit.

---

## Task 9: Final Phase-10 close-out commit

**Files:** None — bookkeeping only.

- [ ] **Step 1: Run the full gate suite one last time**

Run:
```bash
npx tsc --noEmit && npx eslint . && npm run build
```

Expected: all PASS.

- [ ] **Step 2: Verify git tree is clean**

Run:
```bash
git status
```

Expected: working tree clean, branch is ahead of `origin/main` by Task-1..Task-8 commits.

- [ ] **Step 3: Push to origin (GitLab — auto-mirrors to GitHub for Vercel)**

```bash
git push origin main
```

Expected: push succeeds; Vercel triggers a production deploy from the GitHub mirror within ~30s. Watch deploy logs:
```bash
vercel ls --prod
```

- [ ] **Step 4: Production smoke**

Open `https://dev-real-estate-rental-app.vercel.app` once the deploy is `READY`. Repeat Task 8 Steps 2–4 against production. Any regression → roll back (Vercel UI) and fix locally.

- [ ] **Step 5: Final close-out commit (empty if everything passed)**

If a follow-up tweak was needed in step 4, commit it. Otherwise, no further commit — the running history of Task-1..Task-8 commits already documents the phase.

Update `CLAUDE.md`'s "Completed Phases" table with a new row:
```
| `<new-sha>` | Phase 10 — Landing globe: cobe canvas, polaroid markers around the sphere, SVG fallback for reduced motion, `LANDING_MARKERS` mock data swap-ready for DB-backed Phase 11 work. |
```

Stage + commit:
```bash
git add CLAUDE.md
git commit -m "Phase 10 - Done - landing globe (cobe + polaroid markers + reduced-motion SVG fallback)"
git push origin main
```

---

## Definition of Done (from spec §13)

- [ ] Task 0 complete: design-doc amendments via `/impeccable:impeccable` committed before any code task.
- [ ] All files in §4 created / rewritten / deleted.
- [ ] `cobe` added to `package.json`.
- [ ] 6 city images present in `public/landing-globe/`.
- [ ] `tsc`, `eslint`, `next build` all clean.
- [ ] Manual dev smoke + reduced-motion smoke pass.
- [ ] Lighthouse a11y ≥ 95, perf ≥ 90.
- [ ] CLAUDE.md updated with Phase 10 row.
- [ ] Final commit: `Phase 10 - Done - landing globe ...`.

## Out of Scope (Phase 11+ per spec §14)

- DB-backed markers (query + fallback chain).
- Dark mode (whole-app rollout + DESIGN.md amendment).
- Real city photography curation.
- Re-introduction of sign-in / sign-up / host-CTA / footer surfaces on `/`.
