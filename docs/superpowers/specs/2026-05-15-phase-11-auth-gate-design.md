# Phase 11 — Landing → Auth Gate Design

**Status:** Spec only. No code changes pending. Landing globe fix has landed (`18927bd`, `7dc2a98`) — implementation no longer blocked.

**Date:** 2026-05-15 (initial), revised 2026-05-15 (Delta R1 — landing CTA chip + ambient canvas + form polish).

**Author:** Brainstorm session, Claude (Opus 4.7) + user.

---

## Revision history

- **R0 (2026-05-15)** — Initial spec. Globe-as-auth-gate, split-panel `/signin` and `/signup` with polaroid hero, ModeSlider, RoleToggle, View Transitions morph.
- **R1 (2026-05-15)** — User-driven delta after the globe fix landed. Adds: (a) bottom-center "Ready to rent your dream vacation" CTA chip on `/`, (b) ambient dotted-map canvas layered behind the polaroid hero on `/signin` and `/signup`, (c) framer-motion entrance reveal on the form panel, (d) password eye toggle. Translates the *vibe* of `design-update/sign-in.txt` (Travel-Connect reference) into our warm-light system: no dark theme, no gradient text, no Google OAuth, no shimmer button — all forbidden by DESIGN.md. R1 changes are additive to R0; no R0 decision is reversed.

---

## 1. Goal

Close the gap between the Phase 10 landing globe and the existing `/signin` / `/signup` routes. Today, the landing page is globe-only: there is no visible affordance to authenticate, and the polaroid city links point to `/search?city=…` which itself has no signed-in path back. Phase 11 makes the globe an auth gate: any interaction on the landing page navigates the user to `/signin`, where they can switch between sign in and sign up via a single slider, and pick their role (Host or Tenant) when signing up. Returning authenticated users are sent directly to `/dashboard`.

A bottom-center floating CTA chip — copy *"Ready to rent your dream vacation"* + an arrow into Sign in — sits above the globe as the explicit, plain-language auth affordance. The chip is the safety net for users who don't read the polaroids as interactive; it ships alongside the implicit polaroid path, not instead of it.

The redesigned auth pages also align with the system's brand surface conventions, reusing the Phase 10 polaroid pattern as a hero image inside a split-panel layout. A re-themed dotted-map canvas (warm cream base, evergreen dots and route lines) sits behind the polaroid as ambient motion, translating the visual rhythm of the `sign-in.txt` reference into our warm-light system without adopting its dark theme or gradient palette. The form panel uses a framer-motion entrance reveal on mount and includes a password show/hide toggle. The transition between landing and auth is animated via the View Transitions API, with a graceful fallback to plain navigation on browsers without support.

## 2. Information Architecture

- **`/`** — Globe + polaroids unchanged visually. Every interactive element (globe canvas, 6 polaroid links, mobile inline city list) navigates to `/signin?city=${id}`. **A bottom-center CTA chip overlays the globe** as the explicit, plain-language affordance: copy *"Ready to rent your dream vacation"* + arrow + "Sign in" label. The chip navigates to `/signin` with no `?city=` parameter (the no-city deterministic-by-date fallback in `AuthHero` applies). The globe is no longer a city explorer; it is the auth gate, and the chip is the safety net for users who don't read the polaroids as interactive.
- **`/signin`** — Split-panel auth page. Left panel renders the polaroid hero matched to `?city=…` layered on top of an ambient dotted-map canvas; right panel renders the sign-in form. Top of the form contains a Sign in ↔ Sign up slider that morphs to `/signup` when toggled. The form panel mounts with a framer-motion entrance reveal (fade + 12px lift), gated on `prefers-reduced-motion`.
- **`/signup`** — Mirror of `/signin`. Same split-panel shell, same canvas, same slider (in "Sign up" position). Form additionally contains an inline Host / Tenant segmented control above the username field.
- **Auth-aware redirects** — `/`, `/signin`, `/signup` all read the session via `auth()` in their RSC. If a session exists, they `redirect("/dashboard")`. Marketing and direct-link traffic still works for signed-out users.
- **Skip-link removed** — The landing page has no repeating nav blocks; per WCAG 2.4.1, the skip-link is unnecessary and is removed to reduce screen-reader noise. The CTA chip is itself keyboard-reachable and sits above the globe canvas in tab order — it does not require an additional skip-link.

## 3. Components

### New

- **`components/auth/auth-panel.tsx`** — Split-panel shell. Two-column grid (50/50) on `md+`; single-column stack below `md`. `bg-surface-paper`, `rounded-lg` (14px), `border border-hairline`, **no shadow** (tonal layering against `bg-surface-panel` page background). Accepts `hero` and `form` props.
- **`components/auth/auth-hero.tsx`** — Left-panel hero. Renders the polaroid matched to `?city=…` **layered on top of `<AuthBgCanvas />`** as ambient background motion. Falls back to a deterministic-random polaroid (seeded by date) when no city param is present. Caption sits below the polaroid: city name in `text-title text-ink`, sub-copy in `text-caption text-ink-soft`. The polaroid `<img>` carries `style={{ viewTransitionName: \`polaroid-${id}\` }}` so it morphs from the matching polaroid on the landing globe.
- **`components/auth/auth-bg-canvas.tsx`** — Client component. Re-themed translation of the `sign-in.txt` `DotMap`: a dotted-world canvas (cream surface, evergreen dots) with 4 traveling route lines in deeper evergreen. **Color rules:** dots use `oklch(38% 0.08 165 / 0.18–0.40)` (accent-evergreen at 18–40% opacity, opacity randomized per dot per the existing pattern); routes use `oklch(30% 0.08 165 / 0.55)` (deep evergreen); moving point glow uses `oklch(38% 0.08 165 / 0.30)`. No blues. Loops every 15 seconds. **`ResizeObserver`-driven sizing** identical to the reference. Lazy-mounted under a `prefers-reduced-motion` check — when reduce is set, the component renders the dots as a single static SVG (no RAF, no routes). RAF pauses on `visibilitychange` (same pattern as `globe-client.tsx`).
- **`components/auth/mode-slider.tsx`** — Top toggle: Sign in ↔ Sign up. Two `<Link>` elements (one per route) wrapped in a pill-style track. Active pill is `bg-surface-paper border border-hairline`; track is `bg-surface-panel`. Active pill carries `style={{ viewTransitionName: "auth-mode-pill" }}` so the pill slides across routes via the browser's View Transition. Within-route hover and press states use `framer-motion`. Disabled under `prefers-reduced-motion: reduce` (active state still highlighted; no movement).
- **`components/auth/role-toggle.tsx`** — Inline segmented control inside the signup form, positioned above the username field. Two buttons: "Host" and "Tenant". Writes the selected value to a hidden input `name="role"`. Label "Host" maps to DB role `manager` at submit time. No animation.
- **`components/landing/landing-cta-chip.tsx`** — Client component. Bottom-center floating chip on `/`. Renders a `<Link href="/signin">` styled as a pill: `bg-surface-paper`, 1px hairline border, Floating shadow token, 14px radius, `px-5 py-3`, with two stacked text rows on the left (`text-label text-ink` headline *"Ready to rent your dream vacation"* and `text-caption text-ink-soft` sub-copy *"Sign in to find one"*) and a trailing `ArrowRight` lucide icon in `text-accent-evergreen-deep`. The whole chip has `style={{ viewTransitionName: "auth-cta" }}` (set only on the chip when it is the click source — same pattern as the polaroid). Click handler runs `document.startViewTransition(() => router.push("/signin"))` when supported; otherwise plain navigation. Hover: chip lifts 2px (translate3d, gated on reduced-motion). Focus: 2px Hospitable Evergreen ring at 2px offset.

### Constants

- **`lib/auth-bg-routes.ts`** — Exports `AUTH_BG_ROUTES`: 4 route definitions (start xy, end xy, delay) using the same shape as the reference `DotMap`. Stable input keeps the canvas deterministic for snapshot testing.

### Modified

- **`app/page.tsx`** — Becomes `async` RSC. Calls `auth()`; if session, `redirect("/dashboard")`. Removes the `Skip to search` skip-link. Wraps the globe `<div>` and the mobile inline list in `<Link href="/signin">`. Globe canvas click is captured by the wrapping link (the cobe pointer-drag handler still runs; click without drag navigates). **Mounts `<LandingCtaChip />`** as the last sibling of the globe wrapper, positioned `fixed bottom-6 left-1/2 -translate-x-1/2` (centered, above the safe-area inset on mobile).
- **`lib/landing-markers.ts`** — `PolaroidMarker.href` is no longer used (links go to `/signin?city=${id}` programmatically). Add `caption: string` per marker — e.g. `"Tokyo, today."` — used by `AuthHero`.
- **`app/signin/page.tsx`** — Replace the standalone form with `<AuthPanel hero={<AuthHero city={city} />} form={<SignInForm />} />`. Read `?city=` from `searchParams`. Add session check + redirect. **The form is now extracted into `components/auth/signin-form.tsx`** — a `"use client"` component that wraps the existing `useActionState`-driven form in a framer-motion `motion.div` entrance reveal (`initial={{ opacity: 0, y: 12 }}`, `animate={{ opacity: 1, y: 0 }}`, `transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}`). The reveal is suppressed (replaced with instant transition) when `useReducedMotion()` returns true. The password input gains a right-edge eye/EyeOff toggle button (lucide-react icons, `text-ink-soft`, `aria-label` swaps between "Show password" and "Hide password").
- **`app/signup/page.tsx`** — Same as signin. Replace the inline role radio fieldset with `<RoleToggle />`. Existing form logic and `signUpAction` unchanged (it already accepts `role` from FormData). **Form extracted into `components/auth/signup-form.tsx`** with the same framer-motion entrance reveal and the same password eye toggle.
- **`components/landing/polaroid-marker.tsx`** — Anchor the polaroid `<img>` with `style={{ viewTransitionName: \`polaroid-${id}\` }}` set only on the polaroid the user clicks (set via `onPointerDown` handler, cleared on others) so the browser sees exactly one source / one destination per transition.
- **`components/landing/globe-client.tsx`** — Polaroid hrefs and the mobile inline city list now point at `/signin?city=${id}`.
- **`components/landing/globe-static.tsx`** — Same href change for the reduced-motion fallback.

### Deletions

None. All changes are additive or in-place edits. The Phase 10 globe and polaroid scaffolding are preserved.

## 4. Data Flow + Actions

### Sign-in

- Existing `signInAction` (Phase 2) is unchanged; it never consumed `role`.
- `app/signin/page.tsx` reads `searchParams.city` and passes it to `<AuthHero city={city} />`. The form does not see the city — it is hero-only context.

### Sign-up

- `signUpAction` already accepts `role: "tenant" | "manager"` from FormData. The `RoleToggle` writes the selected value to a hidden input. Mapping: `Host → "manager"`, `Tenant → "tenant"`. No schema change; the toggle component performs the mapping client-side before submit.
- Validation, error rendering, and post-signup redirect all remain as they are in Phase 2.

### Auth-aware landing

- `app/page.tsx`, `app/signin/page.tsx`, and `app/signup/page.tsx` each call `const session = await auth()` and `redirect("/dashboard")` if a session exists.
- `middleware.ts` continues to gate `/dashboard/*`. No middleware changes.

### Slider state across routes

- `ModeSlider` uses `usePathname()` to derive the active mode (Sign in if pathname is `/signin`, Sign up if `/signup`). No client state needed. Each option is a real `<Link>`, so the slider works without JS and is keyboard-reachable.

## 5. Visual Specification

### Auth panel (split layout)

- Desktop (`md+`): two-column grid, 50/50 split. `max-w-5xl mx-auto`. `rounded-lg` (14px), `border border-hairline`, `bg-surface-paper`. **No shadow** — tonal layering against `bg-surface-panel` page background does the work. Mixed-corner rule respected: the panel uses surface-tier 14px while inputs and buttons inside use 6px.
- Mobile (`<md`): single column, stacked. Polaroid hero collapses to a 200px banner above the form.

### Left hero panel

- `bg-surface-panel`, `p-8`. **`<AuthBgCanvas />` fills the panel as absolute-positioned background**; polaroid + caption sit `relative z-10` on top.
- **Ambient canvas (`<AuthBgCanvas />`)** — re-themed dotted-map, `absolute inset-0` inside the hero panel. Dots: gap 12px, radius 1px, opacity `Math.random() * 0.5 + 0.1` (matches the reference), color `oklch(38% 0.08 165)` (accent-evergreen) at the per-dot opacity. Route lines: stroke `oklch(30% 0.08 165 / 0.55)` (deep evergreen), width 1.5px, moving point fill `oklch(30% 0.08 165)`, glow `oklch(38% 0.08 165 / 0.30)` at 6px radius. 4 routes loop on a 15-second cycle. No blues. No `#fff` clear color — canvas clears to `transparent` and shows `bg-surface-panel` through. **No second accent introduced**: the canvas re-uses Hospitable Evergreen and counts toward the ≤10% accent budget — see "Accent budget" below.
- Polaroid image: aspect-square, **`border-radius: 0`** (matches DESIGN.md §5 polaroid-marker — print-edge intentional). White frame `p-2 bg-surface-paper border border-hairline`. Uses the Polaroid shadow token from DESIGN.md §4. Sits `relative z-10` over the canvas; the small drop-shadow + cream frame lifts it cleanly off the dotted background.
- Caption block below polaroid: city name in `text-title text-ink`, sub-copy in `text-caption text-ink-soft`. Per-city caption sourced from `lib/landing-markers.ts`. Example: `"Tokyo, today."`
- **No-city fallback**: when `searchParams.city` is missing or unknown, `AuthHero` picks one of the six markers deterministically by date (e.g. `markers[Math.floor(daysSinceEpoch) % 6]`). Same hero shown to all visitors on a given day. This keeps direct-URL traffic visually warm without persisting cookies.
- **Reduced motion**: when `prefers-reduced-motion: reduce` is set, `<AuthBgCanvas />` renders a static SVG of the dots only (no RAF, no routes, no moving points). The polaroid + caption are unchanged.

### Right form panel

- `bg-surface-paper`, `p-8 md:p-10`. **Wrapped in a framer-motion `motion.div`** with entrance reveal: `initial={{ opacity: 0, y: 12 }}`, `animate={{ opacity: 1, y: 0 }}`, `transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}` (cubic-bezier matches DESIGN.md primary-button transition curve). Reveal collapses to instant transition (`duration: 0`) when `useReducedMotion()` returns true. The slider, role toggle, and inputs do not stagger — the whole panel reveals as one element.
- `<h1>` "Welcome back" (signin) / "Create your account" (signup) — **`text-headline text-ink`** (24px). Per DESIGN.md §3, `text-display` is reserved for the marketing landing hero and is not used here.
- Sub-copy in `text-body text-ink-soft mb-8`. Example: "Sign in to your account." / "Pick a role and we'll set you up."
- `<ModeSlider>`: full-width pill toggle, `h-10`, `bg-surface-panel` track. Active pill `bg-surface-paper border border-hairline`. Text uses `text-label`; active is `text-ink font-medium`, inactive is `text-ink-soft`. Within-route press / hover via framer-motion `whileTap` and `whileHover`. Cross-route pill morph via View Transitions.
- `<RoleToggle>` (signup only): inline 2-button segmented control sitting above the username field. `bg-surface-sunk` track, active state `bg-surface-paper border border-hairline`. `text-label`. Hidden `name="role"` input updates on click. No animation.
- Form fields: existing `<Field>` + `<Input>` components from Phase 9. Unchanged.
- **Password input — eye/EyeOff toggle**: existing `<Input type="password">` is wrapped in a `relative` container. A right-edge `<button type="button">` (32×32, `absolute inset-y-0 right-0 flex items-center pr-3`) toggles input type between `password` and `text`. Icon: lucide-react `Eye` (when hidden) / `EyeOff` (when shown), 18×18, `text-ink-soft`, hover `text-ink`. `aria-label` swaps: "Show password" ↔ "Hide password". `aria-pressed` reflects state. Focus ring per DESIGN.md ghost button. Button is **outside** the input border (no nested focus rings). The input retains its existing focus state untouched.
- Submit button: existing `<Button>` (evergreen primary), full-width. **No gradient**, no shimmer — DESIGN.md forbids both.
- "Forgot password?" link **removed** — no reset flow exists yet; revisit in a later phase. No "Login with Google" — Phase 2 committed to Credentials-only.

### Accent budget

Hospitable Evergreen appears on:
- the submit button (primary action),
- the small cross-link beneath the form ("No account? Sign up" / "Already have an account? Sign in"),
- the trailing arrow icon inside the **landing CTA chip**,
- the **`<AuthBgCanvas />`** dots and routes on `/signin` and `/signup`.

Two budget audits:

1. **Landing (`/`)** — the chip is the only evergreen surface; total evergreen pixels are well under 10% of viewport. Globe + polaroids do not introduce evergreen pixels beyond the cobe marker color (already accepted in Phase 10).
2. **Auth pages (`/signin`, `/signup`)** — the canvas dots are individually 1px at 18–40% opacity, and the four moving routes occupy a thin diagonal stripe. Measured fill ratio is approximately 3–5% of the left panel, which is itself ~50% of the viewport on `md+`, so the canvas contributes ~1.5–2.5% to the screen total. Plus submit button (~1%) and cross-link (<0.5%), the total stays under 5%. The ≤10% rule is respected.

The ModeSlider active pill uses `surface-paper`, not evergreen, so the toggle still does not consume the accent budget.

### Typography

Inter only. All sizes pulled from DESIGN.md §3 tokens: `text-headline`, `text-body`, `text-label`, `text-caption`, `text-title`. No new typography.

### Landing CTA chip

- **Position** — `fixed bottom-6 left-1/2 -translate-x-1/2 z-30`. Respects `env(safe-area-inset-bottom)` via `pb-[max(1.5rem,env(safe-area-inset-bottom))]` on the parent `<main>` so the chip clears iOS home-indicators. `max-w-[min(90vw,28rem)]` keeps the chip from spanning desktop full-width.
- **Surface** — `bg-surface-paper`, 1px hairline border, `rounded-lg` (14px), Floating shadow token from DESIGN.md §4. Padding `px-5 py-3`. Flex row, `gap-4`, `items-center`. No glassmorphism, no backdrop-filter.
- **Text** — Two stacked rows on the left:
  - Row 1: *"Ready to rent your dream vacation"* in `text-label text-ink font-medium`.
  - Row 2: *"Sign in to find one"* in `text-caption text-ink-soft`.
- **Icon** — Trailing `ArrowRight` (lucide-react, 20×20, `text-accent-evergreen-deep`). On hover, the icon translates `2px` to the right (gated on reduced-motion).
- **States** —
  - **Hover** — Chip lifts 2px (`translate3d(0,-2px,0)`, gated on reduced-motion), shadow steps up to a slightly heavier Floating variant. 200ms `cubic-bezier(0.32, 0.72, 0, 1)`.
  - **Focus** — 2px Hospitable Evergreen ring at 2px offset (matches DESIGN.md button focus).
  - **Active** — Press returns the chip to resting elevation; no scale.
- **A11y** — The chip is a single `<Link>`; the `<a>` is the entire pill. `aria-label="Sign in to find a place to rent"` (longer than the visible copy for screen readers). Tab order: chip arrives before the globe canvas wrapper (`tabIndex={-1}` would be wrong — chip must be reachable). Touch target ≥48×48 per DESIGN.md tenant-facing surfaces.
- **Reduced motion** — Hover lift and icon translate are suppressed. The chip remains a static link with the same visual rest state.

## 6. View Transitions

### Mechanism

Use Next.js 15.5's experimental `unstable_ViewTransition` API if enabled in the project's `next.config.ts`; otherwise wrap navigations in a client component that calls `document.startViewTransition(() => router.push(href))` directly. Either path drives the same browser-level transition.

### Named transitions

- **`polaroid-${cityId}`** — Set on the clicked polaroid `<img>` on `/` via `onPointerDown` (and cleared on the other 5 polaroids so only one source exists per transition). Matched by the `<img>` inside `AuthHero` with the same name. Effect: the polaroid lifts off the globe and morphs into the left-panel hero.
- **`auth-panel`** — Set on the `<AuthPanel>` root on both `/signin` and `/signup`. Effect: the panel itself does not flash white between routes when the slider is toggled.
- **`auth-mode-pill`** — Set on the active pill of `<ModeSlider>`. Effect: the pill slides between Sign in and Sign up positions across the two routes.
- **`auth-cta`** — Set on the landing CTA chip via `onPointerDown` (and cleared after navigation completes). Matched by the **form panel** container on `/signin` (the framer-motion `motion.div` wrapper). Effect: the chip grows / morphs into the form panel position as the route transitions. The polaroid morph (`polaroid-${cityId}`) does **not** fire on this path because the chip click carries no city — the destination polaroid renders fresh from the no-city deterministic fallback.

### Fallback chain

1. Browser supports `document.startViewTransition` (Chrome 111+, Safari 18+) → animated morph.
2. Browser does not support it (Firefox at time of writing) → plain Next.js navigation, no animation. Layout is identical; users see an instant route change.
3. `prefers-reduced-motion: reduce` is set → the View Transition is skipped explicitly; plain navigation is used. Slider pill movement is also disabled (active state still highlighted, no animation). Honors DESIGN.md and PRODUCT.md WCAG 2.2 AA requirements.

### Implementation note

The polaroid click handler is a small client component that wraps the `<a>` element. It calls `e.preventDefault()` then runs `document.startViewTransition(() => router.push(href))`. The server-rendered `href` remains valid for no-JS, prefetch, and crawler traffic.

**`LandingCtaChip`** uses the same wrapper pattern. The chip's `<Link>` href is `/signin` (no city param). The wrapper sets `view-transition-name: "auth-cta"` on the chip in `onPointerDown` and clears it on the destination after `requestAnimationFrame` so the name does not linger past the transition. If `document.startViewTransition` is unavailable, the click falls through to plain `router.push()` and the chip styles in `/signin` simply render in place.

## 7. DESIGN.md Amendments

A single commit precedes implementation, amending DESIGN.md as follows.

**§1 Overview — "Brand surfaces have permission" paragraph.**

> Before: "Marketing pages (landing, future campaign pages) may exceed dashboard restraint with first-paint reveals (`duration-hero`) and the sharp-cornered Polaroid pattern. The dashboard never inherits these."
>
> After: "Marketing pages (landing, future campaign pages) and auth-gate surfaces (`/signin`, `/signup`) may exceed dashboard restraint with first-paint reveals (`duration-hero`) and the sharp-cornered Polaroid pattern. The dashboard never inherits these."

**§5 Components — Polaroid marker reservation.**

> Before: "Reserved for brand surfaces (landing, future campaign pages); never used on product surfaces where the mixed-corner rule applies."
>
> After: "Reserved for brand surfaces (landing, auth-gate pages, future campaign pages); never used on product surfaces where the mixed-corner rule applies."

No new tokens, no token renames, no palette changes.

## 8. Testing + Verification

### Build gates (CLAUDE.md §7)

- `npm run build` — Next.js production build must complete without error.
- `npm run lint` — ESLint clean.
- `npx tsc --noEmit` — TypeScript typecheck clean.
- Existing Playwright suite continues to pass.

### New Playwright smoke (`tests/auth-gate.spec.ts`)

- Signed-out user visits `/`. Globe renders. **CTA chip is visible** at bottom-center with copy *"Ready to rent your dream vacation"* and is **keyboard-reachable in tab order** before the globe canvas.
- Click the CTA chip. URL becomes `/signin` (no `?city=`). Form renders. Hero shows the date-deterministic polaroid fallback.
- Reload `/`. Click a polaroid (Tokyo). URL becomes `/signin?city=tokyo`. Form renders. Hero shows Tokyo polaroid.
- On `/signin`, click "Sign up" in the ModeSlider. URL becomes `/signup`. Role toggle is visible above the username field.
- **Eye toggle**: on `/signin`, password input is `type="password"` by default. Click the eye button; input becomes `type="text"`, button `aria-label` switches to "Hide password". Click again; reverts.
- Submit a valid signup form with role "Host". Redirect lands at `/dashboard`. Session is established.
- Signed-in user visits `/` directly. Redirect lands at `/dashboard`.
- Signed-in user visits `/signin` directly. Redirect lands at `/dashboard`.
- Signed-in user visits `/signup` directly. Redirect lands at `/dashboard`.

### Reduced-motion verification

- In Chrome DevTools, emulate `prefers-reduced-motion: reduce`. Click a polaroid. URL changes instantly with no morph. ModeSlider pill highlights the new active state without animating.
- On `/signin` with reduced-motion: `<AuthBgCanvas />` renders as a static SVG (no `<canvas>`, no RAF — confirm by inspecting the DOM). Form panel mounts without the fade-and-lift reveal.
- On `/` with reduced-motion: the CTA chip is present and clickable; hover does not lift; the arrow icon does not translate on hover.

### Cross-browser sanity

- Chrome 111+ and Safari 18+: View Transitions render the polaroid → hero morph, the chip → form morph, and the cross-route pill slide.
- Firefox: plain navigation, no morph, no broken layout, no console errors. The dotted-map canvas still animates (`<canvas>` is universally supported).

### Lighthouse (production headless)

- `/` desktop: performance ≥95, accessibility ≥95, CLS 0. (Phase 10 baseline.) The CTA chip adds one fixed-position element with stable bounding box from first paint, so CLS stays 0.
- `/signin` desktop: performance ≥95, accessibility 100, no new LCP regression. The `<AuthBgCanvas />` paints behind the polaroid and does not contribute to LCP — LCP element remains the polaroid `<img>`.

### Manual smoke

- Using `prod-smoke@test.com` / `password123` on production: land on `/` → expect immediate redirect to `/dashboard`. Sign out → revisit `/` → expect the globe and the CTA chip.
- Click the CTA chip → `/signin` opens with no city param; the hero shows the date-deterministic fallback polaroid; canvas animates behind.
- Tap each of the 6 polaroids in turn. Each `/signin?city=…` shows the corresponding polaroid as the hero.
- Tab from page top on `/`: focus moves through the chip first, then into the globe canvas wrapper (which forwards focus to the underlying `<a>` polaroid links).
- Submit empty form fields. Each field renders an error in `text-signal-danger` per Phase 2.

## 9. Risks + Open Items

### View Transitions API churn

The `unstable_ViewTransition` API in Next 15.5 is, by name, unstable. Mitigation: the implementation should prefer the native `document.startViewTransition` browser API directly, wrapped in a tiny client component, so it works regardless of whether the Next experimental flag is enabled. If both pathways break, the page still ships — the morph is decorative, and plain navigation is an acceptable degradation.

### Polaroid `viewTransitionName` collision

The globe shows all 6 polaroids simultaneously. If each carries a permanent `view-transition-name`, the browser may warn about unmatched names on the destination page (only the clicked city has a matching `<img>` on `/signin`). Mitigation: set the `view-transition-name` only on the polaroid the user actually clicks via the `onPointerDown` handler, and clear it on the other 5. The destination always has exactly one matching name.

### Auth-aware redirect on share-links

Signed-in users sharing a `/` URL will send recipients straight to `/dashboard` if they're also authenticated. Acceptable; signed-out recipients still see the globe normally. No mitigation required.

### Direct-URL polaroid determinism

The no-city fallback picks one of six polaroids seeded by the current date, so every visitor sees the same hero on a given day. Per-session randomness would require a cookie; skip the complexity.

### Canvas performance budget

The dotted-map canvas runs an RAF loop continuously while `/signin` or `/signup` is visible. Mitigations:

- **Visibility gate** — `addEventListener("visibilitychange", …)`: pause RAF when `document.hidden`, same pattern as `globe-client.tsx`. Resume on visible.
- **Dot count cap** — gap is 12px, so a 600×600 panel holds ≤2,500 candidate cells; the `Math.random() > 0.3` filter trims roughly 70% → ≤750 drawn dots per frame. Acceptable.
- **Reduced-motion path** — no `<canvas>` at all; static SVG only. Zero per-frame cost.
- **Mobile** — at `<md`, the canvas does not render (the hero collapses to a 200px banner without the canvas; just polaroid + caption). Phase 11 spec §5 already constrains the hero on mobile.

If Lighthouse mobile regresses by >3 points after the canvas lands, fall back to the static SVG path on mobile unconditionally and document the change in this section.

### Accent-budget audit

Hospitable Evergreen is now used on the CTA chip arrow, the canvas dots/routes, the submit button, and the cross-link. The §5 Accent-budget section quantifies the totals (~5% of screen). Audit during code review: if the visual sum exceeds 10% in DevTools (eyeball the screen with a hue picker), drop canvas opacity from 0.40 max → 0.30 max before reducing route count.

### Deferred items

- **Database-backed markers.** `LANDING_MARKERS` remains hard-coded in `lib/landing-markers.ts`. Wire to a Prisma `City` table when one is added. Out of Phase 11 scope.
- **Phase 10b — Update — landing globe photos.** Placeholder JPEGs in `public/landing-globe/` are still 240×240 sharp-resized derivatives of unrelated splash images. Replace with curated CC0 city photography. Out of Phase 11 scope.
- **Forgot-password flow.** The link is removed in Phase 11. Revisit in Phase 12+ when a password-reset action is implemented.
- **Dashboard nav for signed-in users.** Auth-aware redirect handles the authed case from `/`; signed-out users have no dashboard. No nav needed on the landing page in Phase 11.
- **Footer.** Not in Phase 11 scope.
- **Dark mode.** Not in Phase 11 scope.
- **Google OAuth.** The reference's Google sign-in button is intentionally not ported. Adding it would require a new Auth.js provider, new env keys, and a callback URL. Defer until a future phase explicitly chooses to add OAuth.
- **Sign-up gradient submit + shimmer.** The reference's gradient submit and hover shimmer are forbidden by DESIGN.md (no gradient buttons, single evergreen accent). Not deferred — permanently out of scope for this system.

## 10. Phase 11 Implementation Ladder

The implementation plan will be written in a follow-up `writing-plans` session. Suggested rough order (R1 — folds in CTA chip, ambient canvas, framer-motion entrance, eye toggle):

1. Commit DESIGN.md §1 + §5 amendments (separate, surgical commit).
2. Add `lib/landing-markers.ts` `caption` field; update existing markers. Add `lib/auth-bg-routes.ts` constants for the canvas.
3. Build shared auth components: `components/auth/auth-panel.tsx`, `auth-hero.tsx`, `auth-bg-canvas.tsx`, `mode-slider.tsx`, `role-toggle.tsx`.
4. Build form components: `components/auth/signin-form.tsx`, `signup-form.tsx`. Each wraps the existing `useActionState` form in a framer-motion entrance reveal and adds the password eye toggle.
5. Build landing chip: `components/landing/landing-cta-chip.tsx`.
6. Rewrite `app/page.tsx` as auth-aware RSC; mount `<LandingCtaChip />`; retarget polaroid links to `/signin?city=…`; remove skip-link.
7. Rewrite `app/signin/page.tsx` and `app/signup/page.tsx` against the new split-panel components.
8. Wire View Transitions via small client wrappers around the polaroid links and the CTA chip. Register `polaroid-*`, `auth-panel`, `auth-mode-pill`, `auth-cta` names.
9. Add `tests/auth-gate.spec.ts` covering chip nav, polaroid nav, role toggle, eye toggle, reduced-motion paths, and signed-in redirects.
10. Lighthouse production headless on `/` and `/signin`. Confirm canvas does not push LCP element off the polaroid and CLS stays 0.

Each step gets one commit per CLAUDE.md §4 commit rules: `Phase 11 - <Status> - <brief summary>` with three segments.
