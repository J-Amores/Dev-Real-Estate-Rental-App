# Phase 11 — Landing Auth Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the gap between the Phase 10 landing globe and authenticated routes by adding (a) a "Ready to rent your dream vacation" CTA chip on `/`, (b) redesigned split-panel `/signin` + `/signup` with polaroid hero layered over an ambient dotted-map canvas, framer-motion entrance reveal, and a password eye toggle, and (c) View Transitions on `/`-to-`/signin` navigation.

**Architecture:** `/`, `/signin`, `/signup` become auth-aware RSCs. Each calls `auth()` and `redirect("/dashboard")` for signed-in users. New `components/auth/*` shared shell (panel + hero + ambient canvas + slider + role toggle + form clients). New `components/landing/landing-cta-chip.tsx` mounts on `/` as the explicit affordance. View Transitions wire the landing chip → form panel and polaroids → hero morphs via small client wrappers around the existing server-rendered `<a>` / `<Link>` elements; if `document.startViewTransition` is unavailable, plain navigation is used.

**Tech Stack:** Next.js 15.5.15 (App Router, RSC), React 19.1, TypeScript, Tailwind v4 (`@theme inline` tokens already in `app/globals.css`), `next-auth` v5 (Credentials + JWT), `framer-motion@^12.38` (already a runtime dep), `cobe@^0.6.5` (already a runtime dep, used only by the landing globe — not by auth pages), `lucide-react` (new — small icon set for `Eye` / `EyeOff` / `ArrowRight`).

**Spec:** `docs/superpowers/specs/2026-05-15-phase-11-auth-gate-design.md` — revision R1 (2026-05-15).

**Deviations from spec (lock in here):**

1. **Playwright via skill + binary; no committed project test suite.** Playwright is available two ways: (a) the `playwright-cli` Claude Code skill, which drives a real browser in-session for ad-hoc smoke, and (b) the `playwright` Python binary at `/Library/Frameworks/Python.framework/Versions/3.14/bin/playwright` (v1.60.0). Neither requires touching `package.json`. The spec's `tests/auth-gate.spec.ts` (a committed `@playwright/test` suite) does **not** exist yet and is **not** added by this plan — adding it would require installing `@playwright/test` as a devDep, creating `playwright.config.ts`, and bootstrapping a test runner, which is its own scope-of-work. Instead, this plan uses the `playwright-cli` skill in Task 12 and Task 13 for live browser verification (chip nav, polaroid nav, role toggle, eye toggle, reduced-motion paths, signed-in redirects). If the user later wants committed regression tests, that becomes its own Phase 11.5 plan and is welcome — for now, the in-session smoke is the verification gate.
2. **`PolaroidMarker.caption` already exists** in `lib/landing-markers.ts:7-8`. Spec §3 says "Add `caption: string` per marker" — obsolete. The plan uses the existing field. Sub-copy ("A home is waiting.") is generated inside `AuthHero` from the existing `caption`, not stored on the marker.
3. **`framer-motion` is already a runtime dep** (`12.38.0`). Spec mentions it as a new addition in older context — no install step required.
4. **Each task is a single commit** matching CLAUDE.md §4 commit format: `Phase 11 - <Status> - <brief summary>` with three segments and ` - ` separators. No `Co-Authored-By` trailer; no `-c user.name=…`.

---

## Pre-flight (every task, every executor)

This is frontend / UI work. CLAUDE.md HARD rule: **all frontend UI work must go through `/impeccable:impeccable`**. That slash command auto-loads `PRODUCT.md`, `DESIGN.md`, and `DESIGN.json` and enforces the design system across the run.

**Before starting any task in this plan:**

1. The user invokes `/impeccable:impeccable` in the current session. (User-invoked only — agents cannot invoke slash commands themselves; if running as a subagent, request the main thread to invoke it before dispatching the first task.)
2. Read these design docs in this order:
   - `PRODUCT.md` — register=`product` (dashboard) + `brand` (landing / auth gate); audience (small-scale property managers + tenants); five strategic principles; WCAG 2.2 AA + reduced-motion hard requirements.
   - `DESIGN.md` — *"The Hospitable Operator"*. Hospitable Evergreen `oklch(38% 0.08 165)` on ≤10% of screen, warm neutrals, Inter monoculture (`cv11`, `ss03`, `tnum`), mixed corners (6–8px controls / 14–16px surfaces), flat elevation, **light only**. Polaroid pattern is reserved for brand surfaces (landing + auth-gate pages, per R1 of this phase's spec).
   - `DESIGN.json` — tonal ramps, motion / shadow tokens, component snippets.
3. Cross-check every color / spacing / radius value introduced below against `app/globals.css` (Tailwind v4 `@theme inline`) or DESIGN.md tokens. Token map for this plan:

| Surface | Token | CSS custom prop / Tailwind class |
|---|---|---|
| Page background (auth pages) | surface-panel | `bg-surface-panel` |
| Auth panel surface | surface-paper | `bg-surface-paper` |
| Polaroid frame | surface-paper | `bg-surface-paper` |
| Polaroid edge | hairline | `border-hairline` |
| Caption text | ink-soft | `text-ink-soft` |
| Headline text | ink | `text-ink` |
| Canvas dot color | accent-evergreen | `oklch(38% 0.08 165 / <alpha>)` (canvas API takes raw color string) |
| Canvas route color | accent-evergreen-deep | `oklch(30% 0.08 165 / 0.55)` |
| ModeSlider track | surface-panel | `bg-surface-panel` |
| ModeSlider active pill | surface-paper | `bg-surface-paper border border-hairline` |
| RoleToggle track | surface-sunk | `bg-surface-sunk` |
| Chip surface | surface-paper | `bg-surface-paper` |
| Chip arrow icon | accent-evergreen-deep | `text-accent-evergreen-deep` |
| Submit button | accent-evergreen | `Button variant="primary"` (existing) |
| Focus ring | accent-evergreen | `focus-visible:ring-accent-evergreen` |
| Cross-link | accent-evergreen-deep | `text-accent-evergreen-deep underline` |
| Form helper / sub-copy | ink-soft | `text-ink-soft` |
| Form error | signal-danger | `text-signal-danger` |

If any value below cannot be traced to this table or `app/globals.css`, **stop and ask** — don't invent.

4. Confirm the ≤10% evergreen accent budget per spec §5 Accent Budget Audit. Painted-evergreen surfaces in this plan: CTA chip arrow + hover state on `/`, `<AuthBgCanvas />` dots + routes (~3–5% of left panel = ~1.5–2.5% of viewport), submit button (~1%), cross-link (<0.5%). Combined ≤5% of screen total. Pass.
5. Confirm reduced-motion contract. `useReducedMotion()` is checked in: `AuthBgCanvas` (renders static SVG dots only), `SignInForm` / `SignUpForm` (entrance reveal collapses to `duration: 0`), `LandingCtaChip` (hover lift + icon translate suppressed), `ModeSlider` (within-route hover / press suppressed). `prefers-reduced-motion: reduce` therefore yields: no canvas RAF, no entrance fade, no hover lift, no icon translate, plain navigation (no View Transition morph).
6. Confirm reduced-motion + View Transitions: the `LandingCtaChip` and polaroid click handlers wrap `document.startViewTransition` in a `useReducedMotion()` check — when reduce is set, the wrapper skips the API and calls `router.push()` directly.

**Subagent dispatch note:** if executing via `superpowers:subagent-driven-development`, each subagent prompt MUST include: "Read `CLAUDE.md`, `PRODUCT.md`, `DESIGN.md`, and the Phase 11 spec at `docs/superpowers/specs/2026-05-15-phase-11-auth-gate-design.md` first. This plan's tokens are listed in the Pre-flight section — use them verbatim. Do not introduce colors, spacings, or radii not in the Pre-flight token map or `app/globals.css`."

---

## File Structure

### Created

| Path | Responsibility |
|---|---|
| `lib/auth-bg-routes.ts` | 4 route definitions (start / end / delay) for `AuthBgCanvas`. Stable input. |
| `components/auth/auth-panel.tsx` | RSC split-panel shell. 50/50 on md+, stacked below. `hero` + `form` props. |
| `components/auth/auth-hero.tsx` | RSC left-panel hero. Resolves `?city=` → marker, falls back to date-deterministic marker. Layers `<AuthBgCanvas />` behind polaroid + caption. |
| `components/auth/auth-bg-canvas.tsx` | Client component. Re-themed dotted-map canvas — cream surface, evergreen dots, evergreen routes. Static-SVG fallback under `prefers-reduced-motion`. RAF pauses on `visibilitychange`. |
| `components/auth/mode-slider.tsx` | Client. Sign in ↔ Sign up pill toggle. Two `<Link>` elements. Active pill `view-transition-name: "auth-mode-pill"` morphs across routes. Within-route hover via framer-motion `whileHover` (reduced-motion-suppressed). |
| `components/auth/role-toggle.tsx` | Client. Inline Host / Tenant segmented control. Writes selected value to hidden `<input name="role">`. Mapping: Host → "manager", Tenant → "tenant". |
| `components/auth/signin-form.tsx` | Client. Wraps `useActionState(signInAction)` form in a framer-motion `motion.div` entrance reveal (fade + 12px lift). Adds password eye/EyeOff toggle. |
| `components/auth/signup-form.tsx` | Client. Same entrance + eye toggle. Mounts `<RoleToggle />` above the username field. Hidden `name="role"` defaults to "tenant". |
| `components/landing/landing-cta-chip.tsx` | Client. Bottom-center floating chip on `/`. Wraps `<Link href="/signin">`. View Transition wrapper sets `view-transition-name: "auth-cta"` on `onPointerDown`. |
| `lib/landing-chip-copy.ts` | Single source of truth for chip copy strings. Tiny module so unit-test snapshots / copy review have one place to look. |
| `lib/landing-hero-fallback.ts` | Deterministic-by-date marker picker used by `AuthHero` when `?city=` is missing or unknown. |

### Modified

| Path | Change |
|---|---|
| `DESIGN.md` | §1 + §5 amendments per Phase 11 spec §7 (auth-gate pages join brand-surface permissions, polaroid reservation widens to auth-gate). |
| `app/page.tsx` | Becomes `async` RSC. Calls `auth()` → if session, `redirect("/dashboard")`. Removes the `Skip to search` skip-link. Mounts `<LandingCtaChip />`. Polaroid hrefs already point to `/search?...` — see `globe-client.tsx` / `globe-static.tsx` mods below. |
| `app/signin/page.tsx` | Becomes `async` RSC. Auth-aware redirect. Reads `?city=` from `searchParams`. Composes `<AuthPanel hero={<AuthHero city={…} />} form={<SignInForm />} />`. |
| `app/signup/page.tsx` | Same shape as signin. Composes `<SignUpForm />`. |
| `components/landing/globe-client.tsx` | Polaroid hrefs + mobile inline city list now point at `/signin?city=${id}`. |
| `components/landing/globe-static.tsx` | Same href change. |
| `components/landing/polaroid-marker.tsx` | Accept new optional `viewTransitionName?: string` prop, applied to the `<img>` only when set. Allows `onPointerDown` to enable the morph on the clicked polaroid alone. |
| `package.json` | Add `lucide-react` runtime dep. |

### Not Modified

- `lib/landing-markers.ts` — `caption` already exists. `href` field stays but is unused by Phase 11 (the new client wrappers compute the destination programmatically).
- `lib/actions.ts` — `signInAction`, `signUpAction`, `FormState` unchanged. Role mapping happens in `RoleToggle` before submit.
- `lib/auth.ts`, `lib/auth.config.ts` — Auth.js wiring unchanged.
- `middleware.ts` — continues to gate `/dashboard/*`.
- `components/ui/{button,field,input,label}.tsx` — primitives unchanged.

---

## Task 1: DESIGN.md amendments

The spec §7 requires DESIGN.md changes to be a separate surgical commit before any code lands. Two single-line edits.

**Files:**
- Modify: `DESIGN.md` §1 ("Brand surfaces have permission" paragraph)
- Modify: `DESIGN.md` §5 (Polaroid marker reservation)

- [ ] **Step 1: Open DESIGN.md and locate §1 "Brand surfaces have permission"**

Find the bullet starting "Marketing pages (landing, future campaign pages)". Exact current text:

```
- **Brand surfaces have permission.** Marketing pages (landing, future campaign pages) may exceed dashboard restraint with first-paint reveals (`duration-hero`) and the sharp-cornered Polaroid pattern. The dashboard never inherits these.
```

- [ ] **Step 2: Replace with widened brand-surface permission**

New text:

```
- **Brand surfaces have permission.** Marketing pages (landing, future campaign pages) and auth-gate surfaces (`/signin`, `/signup`) may exceed dashboard restraint with first-paint reveals (`duration-hero`) and the sharp-cornered Polaroid pattern. The dashboard never inherits these.
```

- [ ] **Step 3: Locate §5 Polaroid marker reservation**

Find the final paragraph of the Polaroid marker section. Exact current text:

```
Reserved for brand surfaces (landing, future campaign pages); never used on product surfaces where the mixed-corner rule applies.
```

- [ ] **Step 4: Replace with widened reservation**

New text:

```
Reserved for brand surfaces (landing, auth-gate pages, future campaign pages); never used on product surfaces where the mixed-corner rule applies.
```

- [ ] **Step 5: Verify the two edits and nothing else**

Run: `git diff DESIGN.md`
Expected: exactly two hunks — one in §1, one in §5. No formatting churn, no unrelated edits.

- [ ] **Step 6: Commit**

```bash
git add DESIGN.md
git commit -m "Phase 11 - In Progress - DESIGN.md amendments (auth-gate brand-surface permission)"
```

---

## Task 2: Install lucide-react and add `auth-bg-routes.ts` constants

`lucide-react` is the icon set used by `LandingCtaChip` (`ArrowRight`) and `SignInForm` / `SignUpForm` (`Eye`, `EyeOff`). The constant module isolates the canvas route definitions so they can be unit-frozen.

**Files:**
- Modify: `package.json`, `package-lock.json`
- Create: `lib/auth-bg-routes.ts`

- [ ] **Step 1: Install lucide-react**

Run: `npm install lucide-react`
Expected: one new entry in `package.json` `dependencies`, lockfile updated. No peer-dep warnings (lucide-react supports React 19).

- [ ] **Step 2: Verify install**

Run: `node -e "require('lucide-react')"` from project root.
Expected: exits 0, no output.

- [ ] **Step 3: Create `lib/auth-bg-routes.ts`**

```ts
/**
 * Route definitions for components/auth/auth-bg-canvas.tsx.
 * Coordinates are canvas-local (px). The canvas renders at the natural
 * size of its parent (ResizeObserver-driven), so these values are scaled
 * into the actual canvas bounds in the render loop.
 *
 * Phase 11 spec §5 "Left hero panel" — canvas color rules and route shape.
 */

export type AuthBgRoute = {
  start: { x: number; y: number; delay: number };
  end: { x: number; y: number; delay: number };
};

/** 4 routes, 15-second loop. Coordinates assume a ~320×200 reference canvas; the renderer scales them. */
export const AUTH_BG_ROUTES: readonly AuthBgRoute[] = [
  { start: { x: 100, y: 150, delay: 0 }, end: { x: 200, y: 80, delay: 2 } },
  { start: { x: 200, y: 80, delay: 2 }, end: { x: 260, y: 120, delay: 4 } },
  { start: { x: 50, y: 50, delay: 1 }, end: { x: 150, y: 180, delay: 3 } },
  { start: { x: 280, y: 60, delay: 0.5 }, end: { x: 180, y: 180, delay: 2.5 } },
] as const;

/** Canvas paint constants. oklch alpha is the canonical accent budget knob. */
export const AUTH_BG_PAINT = {
  /** Background clear color — transparent so panel bg shows through. */
  clear: "transparent",
  /** Dot fill color, alpha is randomized per dot in 0.18–0.40. */
  dotColor: (alpha: number) => `oklch(38% 0.08 165 / ${alpha})`,
  /** Route line stroke. */
  routeStroke: "oklch(30% 0.08 165 / 0.55)",
  /** Route moving point. */
  routePoint: "oklch(30% 0.08 165)",
  /** Route point glow ring. */
  routeGlow: "oklch(38% 0.08 165 / 0.30)",
  /** Dot grid gap (px) and radius (px). */
  gap: 12,
  dotRadius: 1,
  /** Route line width (px). */
  routeWidth: 1.5,
  /** Animation duration per route (seconds). */
  routeDuration: 3,
  /** Full loop length (seconds). */
  loopLength: 15,
} as const;
```

- [ ] **Step 4: Verify file compiles**

Run: `npx tsc --noEmit`
Expected: exit 0, no new errors.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json lib/auth-bg-routes.ts
git commit -m "Phase 11 - In Progress - lucide-react dep + auth-bg-routes constants"
```

---

## Task 3: `AuthBgCanvas` — re-themed dotted-map background

Renders an absolute-positioned canvas inside its parent. Generates a dot grid based on parent size (ResizeObserver), paints 4 traveling routes on a 15-second loop. Under `prefers-reduced-motion: reduce`, renders a static SVG of the dots only.

**Files:**
- Create: `components/auth/auth-bg-canvas.tsx`

- [ ] **Step 1: Create `components/auth/auth-bg-canvas.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

import { AUTH_BG_PAINT, AUTH_BG_ROUTES } from "@/lib/auth-bg-routes";

type Dot = { x: number; y: number; opacity: number };

function generateDots(width: number, height: number): Dot[] {
  const { gap } = AUTH_BG_PAINT;
  const dots: Dot[] = [];
  for (let x = 0; x < width; x += gap) {
    for (let y = 0; y < height; y += gap) {
      if (Math.random() > 0.3) {
        dots.push({
          x,
          y,
          opacity: Math.random() * 0.22 + 0.18,
        });
      }
    }
  }
  return dots;
}

/**
 * Phase 11 spec §5 — ambient dotted-map background for AuthHero.
 * Cream surface (transparent clear; panel bg shows through), evergreen dots,
 * deep-evergreen route lines. Pauses on visibilitychange. Static SVG fallback
 * for prefers-reduced-motion.
 */
export function AuthBgCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [staticDots, setStaticDots] = useState<Dot[] | null>(null);
  const reducedMotion = useReducedMotion();

  // Track parent size via ResizeObserver.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      setSize({ w: Math.round(rect.width), h: Math.round(rect.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Reduced-motion path: render static SVG dots only.
  useEffect(() => {
    if (!reducedMotion) return;
    if (!size.w || !size.h) return;
    setStaticDots(generateDots(size.w, size.h));
  }, [reducedMotion, size.w, size.h]);

  // Animation loop (skipped under reduced-motion).
  useEffect(() => {
    if (reducedMotion) return;
    if (!size.w || !size.h) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = size.w;
    canvas.height = size.h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dots = generateDots(size.w, size.h);
    let startTime = performance.now();
    let raf = 0;
    let paused = false;

    const onVisibility = () => {
      paused = document.hidden;
      if (!paused) startTime = performance.now() - elapsed * 1000;
    };
    let elapsed = 0;
    document.addEventListener("visibilitychange", onVisibility);

    const drawDots = () => {
      ctx.clearRect(0, 0, size.w, size.h);
      for (const d of dots) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, AUTH_BG_PAINT.dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = AUTH_BG_PAINT.dotColor(d.opacity);
        ctx.fill();
      }
    };

    const drawRoutes = (t: number) => {
      for (const route of AUTH_BG_ROUTES) {
        const e = t - route.start.delay;
        if (e <= 0) continue;
        const progress = Math.min(e / AUTH_BG_PAINT.routeDuration, 1);
        const x = route.start.x + (route.end.x - route.start.x) * progress;
        const y = route.start.y + (route.end.y - route.start.y) * progress;

        ctx.beginPath();
        ctx.moveTo(route.start.x, route.start.y);
        ctx.lineTo(x, y);
        ctx.strokeStyle = AUTH_BG_PAINT.routeStroke;
        ctx.lineWidth = AUTH_BG_PAINT.routeWidth;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(route.start.x, route.start.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = AUTH_BG_PAINT.routePoint;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = AUTH_BG_PAINT.routePoint;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = AUTH_BG_PAINT.routeGlow;
        ctx.fill();

        if (progress === 1) {
          ctx.beginPath();
          ctx.arc(route.end.x, route.end.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = AUTH_BG_PAINT.routePoint;
          ctx.fill();
        }
      }
    };

    const tick = (now: number) => {
      if (!paused) {
        elapsed = (now - startTime) / 1000;
        if (elapsed > AUTH_BG_PAINT.loopLength) {
          startTime = now;
          elapsed = 0;
        }
        drawDots();
        drawRoutes(elapsed);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reducedMotion, size.w, size.h]);

  return (
    <div ref={wrapperRef} aria-hidden className="pointer-events-none absolute inset-0">
      {reducedMotion ? (
        staticDots && size.w > 0 ? (
          <svg width={size.w} height={size.h} className="absolute inset-0">
            {staticDots.map((d, i) => (
              <circle
                key={i}
                cx={d.x}
                cy={d.y}
                r={AUTH_BG_PAINT.dotRadius}
                fill={AUTH_BG_PAINT.dotColor(d.opacity)}
              />
            ))}
          </svg>
        ) : null
      ) : (
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Manually mount the canvas in a scratch page**

Add a scratch route `app/_scratch/auth-bg/page.tsx`:

```tsx
import { AuthBgCanvas } from "@/components/auth/auth-bg-canvas";

export default function Page() {
  return (
    <main className="relative h-screen w-screen bg-surface-panel">
      <AuthBgCanvas />
    </main>
  );
}
```

Run: `npm run dev`
Open `http://localhost:3000/_scratch/auth-bg`
Expected: cream background, evergreen dots scattered across the viewport, four route lines traveling and looping every 15 seconds. No console errors.

- [ ] **Step 3: Verify reduced-motion path**

In Chrome DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion" → `reduce`.
Reload the scratch page.
Expected: only the static SVG dots are visible; no canvas element in the DOM (inspect to confirm `<svg>` is present and `<canvas>` is not).

- [ ] **Step 4: Verify visibility pause**

Open a second tab; switch to it for 5 seconds. Switch back.
Expected: animation resumes without a position jump (the `startTime` rebase on visibilitychange prevents a leap).

- [ ] **Step 5: Delete scratch page and gate**

```bash
rm -rf app/_scratch
npx tsc --noEmit && npm run lint
```
Expected: exit 0 from both.

- [ ] **Step 6: Commit**

```bash
git add components/auth/auth-bg-canvas.tsx
git commit -m "Phase 11 - In Progress - AuthBgCanvas (dotted-map, reduced-motion fallback)"
```

---

## Task 4: `AuthPanel` shell

Server component. Two-column grid on `md+`, stacked below. Accepts `hero` and `form` props.

**Files:**
- Create: `components/auth/auth-panel.tsx`

- [ ] **Step 1: Create `components/auth/auth-panel.tsx`**

```tsx
import type { ReactNode } from "react";

type Props = {
  hero: ReactNode;
  form: ReactNode;
};

/**
 * Phase 11 spec §5 — split-panel auth shell.
 * 50/50 on md+, stacked below. rounded-lg (14px), 1px hairline border, no shadow
 * (tonal layering against bg-surface-panel page background).
 * View-transition-name applied so the panel does not flash white when ModeSlider
 * switches routes.
 */
export function AuthPanel({ hero, form }: Props) {
  return (
    <div
      className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-hairline bg-surface-paper md:grid-cols-2"
      style={{ viewTransitionName: "auth-panel" }}
    >
      <div className="relative min-h-[200px] md:min-h-[600px]">{hero}</div>
      <div className="relative">{form}</div>
    </div>
  );
}
```

- [ ] **Step 2: Mount in a scratch page for visual smoke**

Add `app/_scratch/auth-panel/page.tsx`:

```tsx
import { AuthPanel } from "@/components/auth/auth-panel";

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-panel p-8">
      <AuthPanel
        hero={<div className="flex h-full w-full items-center justify-center bg-surface-panel">hero</div>}
        form={<div className="flex h-full w-full items-center justify-center p-8 bg-surface-paper">form</div>}
      />
    </main>
  );
}
```

Run `npm run dev`, open `http://localhost:3000/_scratch/auth-panel`.
Expected: at md+, two-column 50/50 split inside a rounded-lg cream panel on a warm-panel page background; hero side reads "hero", form side reads "form". Below md, single column stack.

- [ ] **Step 3: Delete scratch, gate, commit**

```bash
rm -rf app/_scratch
npx tsc --noEmit && npm run lint
git add components/auth/auth-panel.tsx
git commit -m "Phase 11 - In Progress - AuthPanel shell"
```

---

## Task 5: `landing-hero-fallback.ts` + `AuthHero`

`AuthHero` renders the polaroid for the selected city, layered over `<AuthBgCanvas />`. When no `city` param is passed, picks one of the 6 markers deterministically by date.

**Files:**
- Create: `lib/landing-hero-fallback.ts`
- Create: `components/auth/auth-hero.tsx`

- [ ] **Step 1: Create `lib/landing-hero-fallback.ts`**

```ts
import { LANDING_MARKERS, type PolaroidMarker } from "@/lib/landing-markers";

/**
 * Deterministic-by-date marker picker for AuthHero. Same hero shown to all
 * visitors on a given day. Per-session randomness would require a cookie;
 * skip the complexity (Phase 11 spec §9).
 *
 * @param now Optional date override for unit testing. Defaults to new Date().
 */
export function pickFallbackMarker(now: Date = new Date()): PolaroidMarker {
  const daysSinceEpoch = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
  return LANDING_MARKERS[daysSinceEpoch % LANDING_MARKERS.length]!;
}

/**
 * Resolve a city slug (?city=…) to a marker. Falls back to the date-deterministic
 * marker if the slug is missing or does not match any marker id.
 */
export function resolveHeroMarker(citySlug: string | undefined, now: Date = new Date()): PolaroidMarker {
  if (citySlug) {
    const found = LANDING_MARKERS.find((m) => m.id === citySlug);
    if (found) return found;
  }
  return pickFallbackMarker(now);
}
```

- [ ] **Step 2: Verify with a one-shot script**

Run: `node --input-type=module -e "import { resolveHeroMarker } from './lib/landing-hero-fallback.ts'; console.log(resolveHeroMarker('tokyo').id); console.log(resolveHeroMarker(undefined, new Date('2026-05-15')).id); console.log(resolveHeroMarker('not-a-city', new Date('2026-05-15')).id);"`

Note: this fails on `.ts` without a loader; instead, **type-check only**:

Run: `npx tsc --noEmit`
Expected: exit 0.

(Real verification happens in Task 11 / 12 when the page composes the hero.)

- [ ] **Step 3: Create `components/auth/auth-hero.tsx`**

```tsx
import { AuthBgCanvas } from "@/components/auth/auth-bg-canvas";
import { resolveHeroMarker } from "@/lib/landing-hero-fallback";

type Props = {
  /** City slug from ?city= search param. Falls back to date-deterministic marker. */
  city?: string;
};

/**
 * Phase 11 spec §5 — left-panel hero. AuthBgCanvas is absolutely-positioned behind
 * the polaroid + caption (z-10). Polaroid uses the sharp-cornered Polaroid pattern
 * from DESIGN.md §5 — print-edge intentional, border-radius: 0.
 *
 * The polaroid <img> carries viewTransitionName="polaroid-${id}" so it can be the
 * destination of the morph from the landing globe (set on the source by polaroid-marker.tsx).
 */
export function AuthHero({ city }: Props) {
  const marker = resolveHeroMarker(city);

  return (
    <div className="relative h-full w-full overflow-hidden bg-surface-panel p-8">
      <AuthBgCanvas />
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-6">
        <div
          className="border border-hairline bg-surface-paper p-2"
          style={{
            boxShadow:
              "0 1px 2px oklch(20% 0.012 160 / 0.06), 0 4px 12px oklch(20% 0.012 160 / 0.08)",
            borderRadius: 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={marker.image}
            alt=""
            width={200}
            height={200}
            className="block h-[200px] w-[200px] object-cover"
            style={{ viewTransitionName: `polaroid-${marker.id}` }}
          />
        </div>
        <div className="text-center">
          <p className="text-title text-ink">{marker.caption}</p>
          <p className="text-caption text-ink-soft">A home is waiting.</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Mount in scratch page for smoke**

`app/_scratch/auth-hero/page.tsx`:

```tsx
import { AuthHero } from "@/components/auth/auth-hero";
import { AuthPanel } from "@/components/auth/auth-panel";

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-panel p-8">
      <AuthPanel
        hero={<AuthHero city="tokyo" />}
        form={<div className="flex h-full w-full items-center justify-center bg-surface-paper p-8">form</div>}
      />
    </main>
  );
}
```

Run `npm run dev`, visit `http://localhost:3000/_scratch/auth-hero`.
Expected: left panel shows the Tokyo polaroid centered, with the dotted canvas animating behind it; caption reads "Tokyo" + "A home is waiting." No overflow on `md+` viewports; on mobile, the panel stacks and the hero is ~200px tall with the polaroid filling it.

- [ ] **Step 5: Verify fallback path**

Edit the scratch page to pass `city="not-a-city"`. Reload.
Expected: a deterministic non-Tokyo marker renders (whichever maps to today's daysSinceEpoch).

- [ ] **Step 6: Delete scratch, gate, commit**

```bash
rm -rf app/_scratch
npx tsc --noEmit && npm run lint
git add lib/landing-hero-fallback.ts components/auth/auth-hero.tsx
git commit -m "Phase 11 - In Progress - AuthHero (polaroid + canvas + date fallback)"
```

---

## Task 6: `ModeSlider`

Client component. Two `<Link>` elements wrapped in a pill track. Active pill carries `view-transition-name: "auth-mode-pill"`. Within-route hover uses framer-motion `whileHover`.

**Files:**
- Create: `components/auth/mode-slider.tsx`

- [ ] **Step 1: Create `components/auth/mode-slider.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

type Mode = "signin" | "signup";

const MODES: ReadonlyArray<{ id: Mode; label: string; href: "/signin" | "/signup" }> = [
  { id: "signin", label: "Sign in", href: "/signin" },
  { id: "signup", label: "Sign up", href: "/signup" },
];

/**
 * Phase 11 spec §5 — Sign in ↔ Sign up pill toggle. Active pill carries
 * view-transition-name: "auth-mode-pill" so the pill slides across routes
 * when the browser supports View Transitions. Within-route press/hover via
 * framer-motion whileHover/whileTap, suppressed under reduced-motion.
 */
export function ModeSlider() {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const active: Mode = pathname?.startsWith("/signup") ? "signup" : "signin";

  return (
    <div
      role="tablist"
      aria-label="Switch between sign in and sign up"
      className="relative grid h-10 w-full grid-cols-2 rounded-sm bg-surface-panel p-1"
    >
      {MODES.map((m) => {
        const isActive = m.id === active;
        return (
          <motion.div
            key={m.id}
            whileHover={reduced ? undefined : { scale: 1.01 }}
            whileTap={reduced ? undefined : { scale: 0.98 }}
            className="relative"
          >
            <Link
              href={m.href}
              role="tab"
              aria-selected={isActive}
              className="relative z-10 flex h-full w-full items-center justify-center rounded-sm text-label focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-2 focus-visible:ring-offset-surface-paper"
            >
              <span className={isActive ? "text-ink font-medium" : "text-ink-soft"}>{m.label}</span>
            </Link>
            {isActive ? (
              <span
                aria-hidden
                className="absolute inset-0 rounded-sm border border-hairline bg-surface-paper"
                style={{ viewTransitionName: "auth-mode-pill" }}
              />
            ) : null}
          </motion.div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add components/auth/mode-slider.tsx
git commit -m "Phase 11 - In Progress - ModeSlider (pill toggle, view-transition pill)"
```

Visual smoke is deferred to Task 11 once the slider is mounted on the actual auth pages.

---

## Task 7: `RoleToggle`

Inline Host / Tenant segmented control. Writes selected value to a hidden `<input name="role">`. Mapping: Host → "manager", Tenant → "tenant".

**Files:**
- Create: `components/auth/role-toggle.tsx`

- [ ] **Step 1: Create `components/auth/role-toggle.tsx`**

```tsx
"use client";

import { useState } from "react";

type Role = "tenant" | "manager";

const OPTIONS: ReadonlyArray<{ value: Role; label: string; hint: string }> = [
  { value: "tenant", label: "Tenant", hint: "I'm looking for a place" },
  { value: "manager", label: "Host", hint: "I have a place to rent" },
];

type Props = {
  /** Initial value. Defaults to "tenant" to match Phase 2 form behavior. */
  defaultValue?: Role;
};

/**
 * Phase 11 spec §3 — inline segmented control above the username field on /signup.
 * Hidden input name="role" carries the selected value into FormData; signUpAction
 * (lib/actions.ts) accepts role as-is. Label "Host" maps to DB role "manager".
 */
export function RoleToggle({ defaultValue = "tenant" }: Props) {
  const [value, setValue] = useState<Role>(defaultValue);

  return (
    <fieldset className="space-y-1.5">
      <legend className="text-label text-ink">I am a</legend>
      <input type="hidden" name="role" value={value} />
      <div role="radiogroup" className="grid grid-cols-2 gap-1 rounded-sm bg-surface-sunk p-1">
        {OPTIONS.map((o) => {
          const isActive = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => setValue(o.value)}
              className={[
                "flex h-9 w-full items-center justify-center rounded-sm text-label transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-2 focus-visible:ring-offset-surface-paper",
                isActive
                  ? "border border-hairline bg-surface-paper text-ink font-medium"
                  : "text-ink-soft hover:text-ink",
              ].join(" ")}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      <p className="text-caption text-ink-soft">{OPTIONS.find((o) => o.value === value)?.hint}</p>
    </fieldset>
  );
}
```

- [ ] **Step 2: Type-check + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add components/auth/role-toggle.tsx
git commit -m "Phase 11 - In Progress - RoleToggle (Host/Tenant segmented control)"
```

---

## Task 8: `SignInForm` — entrance reveal + eye toggle

Client component. Wraps the existing `useActionState(signInAction)` form in a framer-motion `motion.div` entrance reveal. Adds a password show/hide button.

**Files:**
- Create: `components/auth/signin-form.tsx`

- [ ] **Step 1: Create `components/auth/signin-form.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ModeSlider } from "@/components/auth/mode-slider";
import { signInAction, type FormState } from "@/lib/actions";

const initialState: FormState = {};

/**
 * Phase 11 spec §5 — right-panel form with framer-motion entrance reveal
 * (fade + 12px lift, suppressed under reduced-motion) and password eye/EyeOff
 * toggle. Form logic, validation, and server action are unchanged from Phase 2.
 */
export function SignInForm() {
  const [state, formAction, pending] = useActionState(signInAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.4, ease: [0.32, 0.72, 0, 1] }}
      className="flex h-full w-full flex-col justify-center bg-surface-paper p-8 md:p-10"
    >
      <h1 className="text-headline text-ink">Welcome back</h1>
      <p className="mb-6 text-body text-ink-soft">Sign in to your account.</p>

      <ModeSlider />

      <form action={formAction} className="mt-6 space-y-4">
        <Field name="email" label="Email" error={state.errors?.email?.[0]}>
          <Input name="email" type="email" autoComplete="email" required />
        </Field>

        <Field name="password" label="Password" error={state.errors?.password?.[0]}>
          <div className="relative">
            <Input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-ink-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-2 focus-visible:ring-offset-surface-paper"
            >
              {showPassword ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
            </button>
          </div>
        </Field>

        {state.errors?._form?.[0] ? (
          <p role="alert" className="text-caption text-signal-danger">
            {state.errors._form[0]}
          </p>
        ) : null}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Signing in…" : "Sign in"}
        </Button>

        <p className="text-center text-caption text-ink-soft">
          No account?{" "}
          <Link href="/signup" className="text-accent-evergreen-deep underline">
            Sign up
          </Link>
        </p>
      </form>
    </motion.div>
  );
}
```

- [ ] **Step 2: Type-check + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add components/auth/signin-form.tsx
git commit -m "Phase 11 - In Progress - SignInForm (motion entrance + eye toggle)"
```

---

## Task 9: `SignUpForm`

Same shape as `SignInForm`, with `RoleToggle` mounted above the username field. Submits to `signUpAction` (unchanged).

**Files:**
- Create: `components/auth/signup-form.tsx`

- [ ] **Step 1: Create `components/auth/signup-form.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ModeSlider } from "@/components/auth/mode-slider";
import { RoleToggle } from "@/components/auth/role-toggle";
import { signUpAction, type FormState } from "@/lib/actions";

const initialState: FormState = {};

/**
 * Phase 11 spec §5 — right-panel form. Same motion + eye-toggle pattern as
 * SignInForm, plus the Host/Tenant role toggle above the username field.
 */
export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.4, ease: [0.32, 0.72, 0, 1] }}
      className="flex h-full w-full flex-col justify-center bg-surface-paper p-8 md:p-10"
    >
      <h1 className="text-headline text-ink">Create your account</h1>
      <p className="mb-6 text-body text-ink-soft">Pick a role and we&apos;ll set you up.</p>

      <ModeSlider />

      <form action={formAction} className="mt-6 space-y-4">
        <RoleToggle />

        <Field name="email" label="Email" error={state.errors?.email?.[0]}>
          <Input name="email" type="email" autoComplete="email" required />
        </Field>

        <Field name="username" label="Username" error={state.errors?.username?.[0]}>
          <Input name="username" autoComplete="username" required />
        </Field>

        <Field name="password" label="Password" error={state.errors?.password?.[0]}>
          <div className="relative">
            <Input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-ink-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-2 focus-visible:ring-offset-surface-paper"
            >
              {showPassword ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
            </button>
          </div>
        </Field>

        {state.message ? (
          <p role="status" className="text-caption text-signal-warning">
            {state.message}
          </p>
        ) : null}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Creating account…" : "Sign up"}
        </Button>

        <p className="text-center text-caption text-ink-soft">
          Already have an account?{" "}
          <Link href="/signin" className="text-accent-evergreen-deep underline">
            Sign in
          </Link>
        </p>
      </form>
    </motion.div>
  );
}
```

- [ ] **Step 2: Type-check + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add components/auth/signup-form.tsx
git commit -m "Phase 11 - In Progress - SignUpForm (motion entrance + role toggle + eye toggle)"
```

---

## Task 10: `LandingCtaChip` + chip copy module

Bottom-center floating chip on `/`. Wraps `<Link href="/signin">`. View Transition wrapper sets `view-transition-name: "auth-cta"` on `onPointerDown` and calls `document.startViewTransition` when supported.

**Files:**
- Create: `lib/landing-chip-copy.ts`
- Create: `components/landing/landing-cta-chip.tsx`

- [ ] **Step 1: Create `lib/landing-chip-copy.ts`**

```ts
/**
 * Single source of truth for landing CTA chip copy. Isolated so copy review
 * and any future A/B tweaks have one place to look.
 */
export const LANDING_CHIP_COPY = {
  headline: "Ready to rent your dream vacation",
  subcopy: "Sign in to find one",
  ariaLabel: "Sign in to find a place to rent",
} as const;
```

- [ ] **Step 2: Create `components/landing/landing-cta-chip.tsx`**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { LANDING_CHIP_COPY } from "@/lib/landing-chip-copy";

/**
 * Phase 11 spec §5 — bottom-center floating chip on /. Click navigates to /signin
 * via View Transitions when the browser supports them; falls back to plain
 * router.push otherwise. Hover lift + arrow translate are suppressed under
 * reduced-motion.
 *
 * The chip has view-transition-name "auth-cta" set on pointerdown and cleared
 * after rAF so the destination form panel only matches when this chip is the
 * source — otherwise an unrelated polaroid morph could collide.
 */
export function LandingCtaChip() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const ref = useRef<HTMLAnchorElement>(null);

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const navigate = () => router.push("/signin");

    if (reduced) {
      navigate();
      return;
    }

    // Set view-transition-name only when this chip is the active source.
    if (ref.current) ref.current.style.viewTransitionName = "auth-cta";

    const vt = (document as Document & {
      startViewTransition?: (cb: () => void) => { finished: Promise<void> };
    }).startViewTransition;

    if (typeof vt === "function") {
      const transition = vt.call(document, navigate);
      transition.finished.finally(() => {
        if (ref.current) ref.current.style.viewTransitionName = "";
      });
    } else {
      requestAnimationFrame(() => {
        if (ref.current) ref.current.style.viewTransitionName = "";
      });
      navigate();
    }
  };

  return (
    <motion.a
      ref={ref}
      href="/signin"
      onClick={onClick}
      aria-label={LANDING_CHIP_COPY.ariaLabel}
      whileHover={reduced ? undefined : { y: -2 }}
      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
      className="group fixed bottom-6 left-1/2 z-30 flex max-w-[min(90vw,28rem)] -translate-x-1/2 items-center gap-4 rounded-lg border border-hairline bg-surface-paper px-5 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-2 focus-visible:ring-offset-surface-paper"
      style={{
        boxShadow:
          "0 12px 28px oklch(20% 0.012 160 / 0.08), 0 2px 6px oklch(20% 0.012 160 / 0.06)",
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
      }}
    >
      <span className="flex flex-1 flex-col text-left">
        <span className="text-label font-medium text-ink">{LANDING_CHIP_COPY.headline}</span>
        <span className="text-caption text-ink-soft">{LANDING_CHIP_COPY.subcopy}</span>
      </span>
      <ArrowRight
        size={20}
        aria-hidden
        className="shrink-0 text-accent-evergreen-deep transition-transform duration-200 motion-reduce:transition-none group-hover:translate-x-[2px]"
      />
    </motion.a>
  );
}
```

- [ ] **Step 3: Type-check + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add lib/landing-chip-copy.ts components/landing/landing-cta-chip.tsx
git commit -m "Phase 11 - In Progress - LandingCtaChip (view-transition wrapper)"
```

Visual smoke is deferred to Task 11.

---

## Task 11: Auth-aware landing — `app/page.tsx` + globe href updates

Convert `app/page.tsx` into an async RSC. Add session check + `redirect("/dashboard")`. Mount `<LandingCtaChip />`. Retarget polaroid hrefs from `/search?location=...` to `/signin?city=${id}` in `globe-client.tsx` and `globe-static.tsx`. Update `polaroid-marker.tsx` to accept an optional `viewTransitionName` prop.

**Files:**
- Modify: `app/page.tsx`
- Modify: `components/landing/globe-client.tsx`
- Modify: `components/landing/globe-static.tsx`
- Modify: `components/landing/polaroid-marker.tsx`

- [ ] **Step 1: Update `app/page.tsx` — auth-aware + chip mount**

Replace the entire file with:

```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { GlobeOrFallback } from "@/components/landing/globe-or-fallback";
import { LandingCtaChip } from "@/components/landing/landing-cta-chip";
import { LANDING_MARKERS } from "@/lib/landing-markers";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Real Estate App",
  description:
    "Find a calmer place to rent. Real homes from small-scale hosts in cities around the world.",
};

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="bg-surface-paper relative flex min-h-svh items-center justify-center">
      {LANDING_MARKERS.map((m) => (
        <link key={m.id} rel="preload" as="image" href={m.image} />
      ))}

      <h1 className="sr-only">
        Real Estate App, explore rentals around the world
      </h1>

      <div
        className="aspect-square"
        style={{ width: "clamp(280px, min(80vw, 70vh), 720px)" }}
      >
        <GlobeOrFallback markers={LANDING_MARKERS} />
      </div>

      <LandingCtaChip />
    </main>
  );
}
```

The skip-link is removed per spec §2 (the chip is itself keyboard-reachable and there are no repeating nav blocks).

- [ ] **Step 2: Update `components/landing/polaroid-marker.tsx` — accept optional view-transition prop**

Add to the existing component file. The full updated `PolaroidMarker` component:

```tsx
import Link from "next/link";

import type { PolaroidMarker as Marker } from "@/lib/landing-markers";

type Props = {
  marker: Marker;
  /** When true, applies the entrance opacity/blur custom-prop bindings used by GlobeClient. */
  withVisibilityProps?: boolean;
  /** Href override — when set, replaces marker.href. */
  hrefOverride?: string;
  /** Optional view-transition-name applied to the inner <img>. Used to enable the
   *  polaroid → AuthHero morph; set only on the polaroid the user clicks. */
  viewTransitionName?: string;
};

export function PolaroidMarker({
  marker,
  withVisibilityProps = false,
  hrefOverride,
  viewTransitionName,
}: Props) {
  const opacityVar = `var(--cobe-visible-${marker.id}, 1)`;
  const blurVar = `calc((1 - var(--cobe-visible-${marker.id}, 1)) * 8px)`;
  const href = hrefOverride ?? marker.href;

  return (
    <Link
      href={href}
      aria-label={`Sign in to browse rentals in ${marker.caption}`}
      className="relative block min-w-[48px] min-h-[48px] focus-visible:outline-2 focus-visible:outline-accent-evergreen focus-visible:outline-offset-4"
      style={{
        background: "var(--color-surface-paper)",
        padding: "6px 6px 24px",
        boxShadow:
          "0 1px 2px oklch(20% 0.012 160 / 0.06), 0 4px 12px oklch(20% 0.012 160 / 0.08)",
        border: "1px solid var(--color-hairline)",
        transform: `rotate(${marker.rotate}deg)`,
        transition: "transform 120ms cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s, filter 0.3s",
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
        className="block h-[60px] w-[60px] object-cover"
        style={viewTransitionName ? { viewTransitionName } : undefined}
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

- [ ] **Step 3: Update `components/landing/globe-static.tsx` — retarget href**

Find every `marker.href` reference in this file and wrap the polaroid marker render with `hrefOverride={`/signin?city=${marker.id}`}`. The exact edit depends on the current file shape; if `GlobeStatic` renders `<PolaroidMarker marker={m} … />`, add `hrefOverride={`/signin?city=${m.id}`}`. If the mobile inline city list uses a raw `<Link href={m.href}>`, change to `<Link href={`/signin?city=${m.id}`}>`.

Open the file and verify there are exactly two link surfaces (the polaroid wrapper inside `GlobeStatic` and the mobile inline city list). Update both.

- [ ] **Step 4: Update `components/landing/globe-client.tsx` — retarget href + arm view-transition on click**

In the polaroid render block, change to:

```tsx
<PolaroidMarker
  marker={m}
  withVisibilityProps
  hrefOverride={`/signin?city=${m.id}`}
  viewTransitionName={`polaroid-${m.id}`}
/>
```

Note: setting `viewTransitionName` permanently on every polaroid would create 6 simultaneous source names that the destination cannot match. Browsers tolerate this (the unmatched names simply do not morph) but emit a console warning. The cleaner pattern matches the spec §9 risk mitigation: set `view-transition-name` only on `onPointerDown` for the clicked polaroid. Implement that by adding a per-polaroid `pointerdown` handler that:

1. Sets `viewTransitionName` via `el.style.viewTransitionName = \`polaroid-${m.id}\``.
2. Schedules a `requestAnimationFrame` after the transition to clear it.

Replace the PolaroidMarker render in `globe-client.tsx` with a small inline wrapper that owns this logic:

```tsx
import type { ComponentRef } from "react";

function PolaroidWithMorph({ marker }: { marker: Marker }) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  // The PolaroidMarker exports its own ref; instead, set view-transition-name
  // via a sibling effect on pointerdown. Simpler: wrap the link in a div with
  // a pointerdown handler that finds the inner <img>.
  const onPointerDown = useCallback(() => {
    const node = imgRef.current;
    if (!node) return;
    node.style.viewTransitionName = `polaroid-${marker.id}`;
    requestAnimationFrame(() => {
      // Cleared automatically after the route transition finishes; if no
      // transition fires (Firefox), the name remains harmlessly on a now-unmounted node.
    });
  }, [marker.id]);

  return (
    <div onPointerDownCapture={onPointerDown} ref={(n) => {
      const inner = n?.querySelector("img") ?? null;
      imgRef.current = inner as HTMLImageElement | null;
    }}>
      <PolaroidMarker
        marker={marker}
        withVisibilityProps
        hrefOverride={`/signin?city=${marker.id}`}
      />
    </div>
  );
}
```

Render `<PolaroidWithMorph marker={m} />` instead of `<PolaroidMarker … />`. Same change at the call site for the mobile inline `<ul>` city list — there, the simpler form (raw `<Link href={\`/signin?city=${m.id}\`}>` with no view-transition wrapper) is fine, since mobile bypasses the View Transition path on most browsers.

If the file's current structure does not lend itself to this wrapper without significant rework, fall back to setting `viewTransitionName` on every polaroid `<img>` permanently and accept the unmatched-name console warning. Note the deviation in the commit message.

- [ ] **Step 5: Type-check + lint + build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: exit 0 from all three.

- [ ] **Step 6: Smoke via `playwright-cli` skill**

Start dev server in background: `npm run dev &` (or in a separate terminal).

Invoke the `playwright-cli` skill with this scenario:

> Open `http://localhost:3000/`. Wait for the globe canvas to load. Confirm: (a) a chip is visible at the bottom of the viewport with text "Ready to rent your dream vacation", (b) Tab from page top puts focus on the chip first (use `page.keyboard.press('Tab')` once and inspect `document.activeElement`), (c) clicking the chip sets the URL to `/signin`. Note: `/signin` will render the legacy form for the duration of Task 11 — Task 12 swaps it. Confirming the URL change is the goal here, not the destination layout.
>
> Then visit `http://localhost:3000/` again. Click one of the polaroid links (any of the 6 cities). Confirm the URL becomes `/signin?city=<id>`. Same caveat about destination layout.

If the skill is unavailable in this session, fall back to manual smoke in a real browser with the same checklist.

(Signed-in redirect is verified in Task 12 Step 6 — defer here to keep Task 11 minimal.)

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx components/landing/globe-client.tsx components/landing/globe-static.tsx components/landing/polaroid-marker.tsx
git commit -m "Phase 11 - In Progress - Auth-aware landing + CTA chip mount + polaroid hrefs"
```

---

## Task 12: Rewrite `/signin` and `/signup` against the new shell

Both pages become async RSCs. Each: (a) reads `?city=` from `searchParams`, (b) calls `auth()` and redirects to `/dashboard` if a session exists, (c) composes `<AuthPanel hero={<AuthHero city={…} />} form={<SignInForm /> or <SignUpForm />} />`.

**Files:**
- Modify: `app/signin/page.tsx`
- Modify: `app/signup/page.tsx`

- [ ] **Step 1: Replace `app/signin/page.tsx`**

```tsx
import { redirect } from "next/navigation";

import { AuthHero } from "@/components/auth/auth-hero";
import { AuthPanel } from "@/components/auth/auth-panel";
import { SignInForm } from "@/components/auth/signin-form";
import { auth } from "@/lib/auth";

type PageProps = {
  searchParams: Promise<{ city?: string }>;
};

export default async function SignInPage({ searchParams }: PageProps) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const { city } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-panel p-4 md:p-8">
      <AuthPanel hero={<AuthHero city={city} />} form={<SignInForm />} />
    </main>
  );
}
```

Notes on the `searchParams` shape: Next.js 15 made `searchParams` a Promise; the type and `await` are mandatory.

- [ ] **Step 2: Replace `app/signup/page.tsx`**

```tsx
import { redirect } from "next/navigation";

import { AuthHero } from "@/components/auth/auth-hero";
import { AuthPanel } from "@/components/auth/auth-panel";
import { SignUpForm } from "@/components/auth/signup-form";
import { auth } from "@/lib/auth";

type PageProps = {
  searchParams: Promise<{ city?: string }>;
};

export default async function SignUpPage({ searchParams }: PageProps) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const { city } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-panel p-4 md:p-8">
      <AuthPanel hero={<AuthHero city={city} />} form={<SignUpForm />} />
    </main>
  );
}
```

- [ ] **Step 3: Type-check + lint + build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: exit 0 from all three.

- [ ] **Step 4: Smoke `/signin` via `playwright-cli`**

Invoke the `playwright-cli` skill with:

> Open `http://localhost:3000/signin`. Confirm: split-panel renders, left panel has a `<canvas>` element with non-zero size, polaroid `<img>` is visible inside the left panel, headline reads "Welcome back", ModeSlider is present with "Sign in" pill in active state (aria-selected="true"), email + password fields render, submit reads "Sign in", cross-link "Sign up" present.
>
> Click the password eye toggle button. Confirm: input `type` changes from `password` to `text`, button `aria-pressed` flips from `false` to `true`, button `aria-label` flips from "Show password" to "Hide password". Click again → reverts.
>
> Visit `http://localhost:3000/signin?city=tokyo`. Confirm: polaroid `<img>` `src` matches `/landing-globe/tokyo.jpg`.
>
> Visit `http://localhost:3000/signin?city=not-a-city`. Confirm: the polaroid `<img>` `src` matches one of the 6 deterministic fallback images (same image as a no-param visit on the same calendar day).

- [ ] **Step 5: Smoke `/signup` via `playwright-cli`**

Invoke the skill with:

> Open `http://localhost:3000/signup`. Confirm: headline "Create your account", RoleToggle present, Tenant button initially `aria-checked="true"`, hidden input `name="role"` has `value="tenant"`, hint reads "I'm looking for a place". Email + username + password fields render.
>
> Click the "Host" button. Confirm: Host gets `aria-checked="true"`, hidden input value becomes `"manager"`, hint reads "I have a place to rent".

- [ ] **Step 6: Smoke slider + signed-in redirects via `playwright-cli`**

> On `/signin`, click the ModeSlider "Sign up" link. Confirm URL becomes `/signup` (View Transition is browser-dependent — visual morph not asserted; URL change is the gate).
>
> Sign in via the form using credentials `smoke@test.com` / `password123` (local seed tenant). Confirm redirect lands at `/dashboard/favorites`.
>
> While still signed in, visit `/`. Confirm immediate redirect to `/dashboard`. Visit `/signin` directly → also redirects. Visit `/signup` directly → also redirects.
>
> Sign out via the dashboard sign-out control. Visit `/` again — confirm globe + chip render (no redirect loop).

- [ ] **Step 7: Smoke submit flows via `playwright-cli`**

> Signed-out: visit `/signin`, click the "Sign in" submit button without filling fields. Confirm per-field error messages render inside elements with `text-signal-danger` color (computed style).
>
> Visit `/signup`, fill email + username + password with a fresh tenant identity, leave Tenant selected, submit. Confirm session is created (cookie set) and URL lands on `/dashboard/favorites`.
>
> Sign out, return to `/signup`, click Host, fill a fresh host identity, submit. Confirm URL lands on `/dashboard/properties`.

- [ ] **Step 8: Reduced-motion smoke via `playwright-cli`**

> Launch a new browser context with `reducedMotion: 'reduce'`. Open `/signin`. Confirm: no `<canvas>` element exists inside the left panel; instead an `<svg>` with `<circle>` children is present (the static-dot fallback). Confirm the form panel does not animate on mount (e.g. assert `transform` is `none` on the `motion.div` immediately after load, with no transitions).
>
> Open `/`. Hover over the chip. Confirm: chip `transform` stays at `translate(-50%, 0)` (no Y-axis lift), arrow icon `transform` stays at none (no translate-x).

- [ ] **Step 9: Commit**

```bash
git add app/signin/page.tsx app/signup/page.tsx
git commit -m "Phase 11 - In Progress - /signin and /signup against split-panel shell"
```

---

## Task 13: Final gates — Lighthouse + accent budget + accessibility sweep

Verify the production build meets the spec's quality bars before the final close-out commit.

**Files:**
- None modified.

- [ ] **Step 1: Production build + serve**

Run: `npm run build && npm run start`
Expected: build completes, server listens on `http://localhost:3000`.

- [ ] **Step 2: Lighthouse `/` desktop**

Run from a separate terminal:

```bash
npx lighthouse http://localhost:3000/ --output=json --output-path=./.lighthouse-landing.json --preset=desktop --chrome-flags="--headless"
```

Read scores from the JSON. Expected:
- Performance ≥ 95 (Phase 10 baseline).
- Accessibility ≥ 95.
- Best Practices ≥ 100.
- CLS = 0.
- LCP ≤ 1.5s (Phase 10 baseline was 0.6s; the chip is a tiny addition).

If Accessibility drops below 95, audit: ensure the chip has `aria-label`, focus ring visible, color contrast ≥ 4.5:1 on the headline copy.

- [ ] **Step 3: Lighthouse `/signin` desktop**

```bash
npx lighthouse http://localhost:3000/signin --output=json --output-path=./.lighthouse-signin.json --preset=desktop --chrome-flags="--headless"
```

Expected:
- Performance ≥ 95.
- Accessibility = 100.
- LCP element is the polaroid `<img>` (the canvas is `aria-hidden` and absolutely-positioned, so it does not become LCP).

- [ ] **Step 4: Accent-budget eyeball audit**

Open `/signin` in a browser. Open DevTools → Elements. Use the color picker / Eye Dropper to confirm:
- The CTA arrow icon and canvas dots/routes are the only evergreen surfaces on the left panel besides the submit button.
- Visual sum of evergreen pixels feels well under 10% of screen (the spec quantifies ~5%; this is a sanity check, not a precise measurement).

If the canvas reads too loud, drop `AUTH_BG_PAINT.dotColor` alpha range from 0.18–0.40 → 0.12–0.30 before reducing route count. Re-run Steps 2 and 3.

- [ ] **Step 5: Keyboard sweep via `playwright-cli`**

> On `/`, press Tab repeatedly from page top. Capture `document.activeElement.outerHTML.slice(0,80)` after each press. Expected order: chip → polaroid 1 → polaroid 2 → … → polaroid 6 → (page end).
>
> On `/signin`: ModeSlider Sign in → ModeSlider Sign up → email → password → eye toggle → submit → cross-link.
>
> On `/signup`: ModeSlider Sign in → ModeSlider Sign up → RoleToggle Tenant → RoleToggle Host → email → username → password → eye toggle → submit → cross-link.
>
> For each focused element, take a screenshot or check computed `outline-color` / `box-shadow` to confirm the visible focus ring uses `oklch(38% 0.08 165)` (Hospitable Evergreen).

- [ ] **Step 6: Clean up lighthouse JSON artifacts**

```bash
rm -f ./.lighthouse-landing.json ./.lighthouse-signin.json
```

These were one-off diagnostics; not checked in.

- [ ] **Step 7: Final close-out commit**

The implementation is done. Mark the phase complete with a Done commit that summarizes the deltas. There are no pending source-tree changes from Step 6 (it deleted untracked JSON), so this commit only exists if there is something left to flush. If `git status` is clean, **skip Step 7** — the previous commits already capture the work, and a no-op close-out commit is forbidden by CLAUDE.md.

If there *is* something to commit (e.g. accent-budget tweak from Step 4), include it in a single Done commit:

```bash
git add components/auth/auth-bg-canvas.tsx lib/auth-bg-routes.ts  # or whatever was tweaked
git commit -m "Phase 11 - Done - landing auth gate (chip + split-panel /signin & /signup + view transitions)"
```

Otherwise, retroactively rename the last "In Progress" commit's message to `Done` is **not** done — CLAUDE.md §4 forbids amending history. Instead, when running `npm run dev` next time, optionally add a `CHANGELOG.md` entry; that is out of plan scope.

- [ ] **Step 8: Push**

```bash
git push origin main
```

This pushes to GitLab. The GitLab → GitHub push-mirror handles the GitHub side; Vercel auto-deploys from GitHub. Verify the deploy at the production URL within ~2 minutes.

- [ ] **Step 9: Update CLAUDE.md "Current Phase" section**

This is **out of plan scope** because CLAUDE.md is gitignored locally. Update by hand in a follow-up session if the user wants the in-repo state to reflect Phase 11 closing. The phase ladder lives in `git log` regardless.

---

## Self-review

**1. Spec coverage check** — every spec section maps to a task:

| Spec section | Task |
|---|---|
| §1 Goal | Task 11 (chip mount) + Task 12 (auth-aware redirects) |
| §2 IA | Task 11 + Task 12 |
| §3 Components — new | Task 3 (canvas), 4 (panel), 5 (hero), 6 (slider), 7 (role toggle), 8 (signin form), 9 (signup form), 10 (chip) |
| §3 Components — modified | Task 11 (page.tsx, globe-client, globe-static, polaroid-marker) + Task 12 (signin/signup pages) |
| §3 Constants | Task 2 (auth-bg-routes) + Task 10 (chip copy) |
| §4 Data Flow + Actions | Task 8, 9 (existing actions unchanged); Task 11, 12 (auth-aware redirects) |
| §5 Visual spec — chip | Task 10 |
| §5 Visual spec — canvas | Task 3 |
| §5 Visual spec — left hero | Task 5 |
| §5 Visual spec — right form | Task 8, 9 |
| §5 Accent budget | Task 13 Step 4 |
| §6 View Transitions | Task 4 (panel name), 6 (pill name), 10 (chip name), 11 (polaroid name) |
| §7 DESIGN.md amendments | Task 1 |
| §8 Testing | Task 11 Step 6, Task 12 Steps 4–8, Task 13 Steps 2–5 |
| §9 Risks — canvas perf | Task 3 Step 4 (visibility pause), Task 13 Step 2 (Lighthouse) |
| §9 Risks — view-transition collisions | Task 11 Step 4 (per-pointerdown polaroid morph) |
| §9 Risks — accent budget | Task 13 Step 4 |
| §10 Implementation ladder | Tasks 1–13 align 1:1 with ladder steps |

No gaps.

**2. Placeholder scan** — searched for "TBD", "TODO", "implement later", "add appropriate error handling", "similar to Task N", "fill in details". None present except the explicit "**skip Step 7**" instruction in Task 13 (a guard, not a placeholder).

**3. Type consistency** —
- `PolaroidMarker` shape from `lib/landing-markers.ts` used unchanged across Task 5, 11.
- `AuthBgRoute` type defined in Task 2, used in Task 3.
- `FormState` from `lib/actions.ts` used unchanged in Task 8, 9.
- `Role = "tenant" | "manager"` defined locally in Task 7; the wire format matches `signUpSchema` in `lib/actions.ts`.
- `LANDING_CHIP_COPY` shape used in Task 10 only.
- `view-transition-name` strings: `polaroid-${id}` (Task 5, 11), `auth-panel` (Task 4), `auth-mode-pill` (Task 6), `auth-cta` (Task 10). Each appears in exactly one source + one destination per spec §6. No collisions.

---

## Execution Handoff

Plan saved to `docs/superpowers/plans/2026-05-15-phase-11-auth-gate.md`. Two execution options:

**1. Subagent-Driven (recommended)** — fresh subagent per task, two-stage review between tasks. Fastest iteration loop, lowest context burn on the main thread. Required sub-skill: `superpowers:subagent-driven-development`.

**2. Inline Execution** — execute tasks sequentially in this session with checkpoints. Higher context burn but no handoff latency. Required sub-skill: `superpowers:executing-plans`.

Which approach?
