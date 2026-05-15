# Phase 11 — Landing → Auth Gate Design

**Status:** Spec only. No code changes pending. Implementation deferred — another agent is currently working on a fix to the landing globe, and this spec should not be implemented until that work lands.

**Date:** 2026-05-15

**Author:** Brainstorm session, Claude (Opus 4.7) + user.

---

## 1. Goal

Close the gap between the Phase 10 landing globe and the existing `/signin` / `/signup` routes. Today, the landing page is globe-only: there is no visible affordance to authenticate, and the polaroid city links point to `/search?city=…` which itself has no signed-in path back. Phase 11 makes the globe an auth gate: any interaction on the landing page navigates the user to `/signin`, where they can switch between sign in and sign up via a single slider, and pick their role (Host or Tenant) when signing up. Returning authenticated users are sent directly to `/dashboard`.

The redesigned auth pages also align with the system's brand surface conventions, reusing the Phase 10 polaroid pattern as a hero image inside a split-panel layout. The transition between landing and auth is animated via the View Transitions API, with a graceful fallback to plain navigation on browsers without support.

## 2. Information Architecture

- **`/`** — Globe + polaroids unchanged visually. Every interactive element (globe canvas, 6 polaroid links, mobile inline city list) navigates to `/signin?city=${id}`. The globe is no longer a city explorer; it is the auth gate.
- **`/signin`** — Split-panel auth page. Left panel renders the polaroid hero matched to `?city=…`; right panel renders the sign-in form. Top of the form contains a Sign in ↔ Sign up slider that morphs to `/signup` when toggled.
- **`/signup`** — Mirror of `/signin`. Same split-panel shell, same slider (in "Sign up" position). Form additionally contains an inline Host / Tenant segmented control above the username field.
- **Auth-aware redirects** — `/`, `/signin`, `/signup` all read the session via `auth()` in their RSC. If a session exists, they `redirect("/dashboard")`. Marketing and direct-link traffic still works for signed-out users.
- **Skip-link removed** — The landing page has no repeating nav blocks; per WCAG 2.4.1, the skip-link is unnecessary and is removed to reduce screen-reader noise.

## 3. Components

### New

- **`components/auth/auth-panel.tsx`** — Split-panel shell. Two-column grid (50/50) on `md+`; single-column stack below `md`. `bg-surface-paper`, `rounded-lg` (14px), `border border-hairline`, **no shadow** (tonal layering against `bg-surface-panel` page background). Accepts `hero` and `form` props.
- **`components/auth/auth-hero.tsx`** — Left-panel hero. Renders the polaroid matched to `?city=…`. Falls back to a deterministic-random polaroid (seeded by date) when no city param is present. Caption sits below the polaroid: city name in `text-title text-ink`, sub-copy in `text-caption text-ink-soft`. The polaroid `<img>` carries `style={{ viewTransitionName: \`polaroid-${id}\` }}` so it morphs from the matching polaroid on the landing globe.
- **`components/auth/mode-slider.tsx`** — Top toggle: Sign in ↔ Sign up. Two `<Link>` elements (one per route) wrapped in a pill-style track. Active pill is `bg-surface-paper border border-hairline`; track is `bg-surface-panel`. Active pill carries `style={{ viewTransitionName: "auth-mode-pill" }}` so the pill slides across routes via the browser's View Transition. Within-route hover and press states use `framer-motion`. Disabled under `prefers-reduced-motion: reduce` (active state still highlighted; no movement).
- **`components/auth/role-toggle.tsx`** — Inline segmented control inside the signup form, positioned above the username field. Two buttons: "Host" and "Tenant". Writes the selected value to a hidden input `name="role"`. Label "Host" maps to DB role `manager` at submit time. No animation.

### Modified

- **`app/page.tsx`** — Becomes `async` RSC. Calls `auth()`; if session, `redirect("/dashboard")`. Removes the `Skip to search` skip-link. Wraps the globe `<div>` and the mobile inline list in `<Link href="/signin">`. Globe canvas click is captured by the wrapping link (the cobe pointer-drag handler still runs; click without drag navigates).
- **`lib/landing-markers.ts`** — `PolaroidMarker.href` is no longer used (links go to `/signin?city=${id}` programmatically). Add `caption: string` per marker — e.g. `"Tokyo, today."` — used by `AuthHero`.
- **`app/signin/page.tsx`** — Replace the standalone form with `<AuthPanel hero={<AuthHero city={city} />} form={<SignInForm />} />`. Read `?city=` from `searchParams`. Add session check + redirect.
- **`app/signup/page.tsx`** — Same as signin. Replace the inline role radio fieldset with `<RoleToggle />`. Existing form logic and `signUpAction` unchanged (it already accepts `role` from FormData).
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

- `bg-surface-panel`, `p-8`.
- Polaroid image: aspect-square, **`border-radius: 0`** (matches DESIGN.md §5 polaroid-marker — print-edge intentional). White frame `p-2 bg-surface-paper border border-hairline`. Uses the Polaroid shadow token from DESIGN.md §4.
- Caption block below polaroid: city name in `text-title text-ink`, sub-copy in `text-caption text-ink-soft`. Per-city caption sourced from `lib/landing-markers.ts`. Example: `"Tokyo, today."`
- No DotMap canvas. No animated routes. The Travel-Connect dark theme is fully discarded.
- **No-city fallback**: when `searchParams.city` is missing or unknown, `AuthHero` picks one of the six markers deterministically by date (e.g. `markers[Math.floor(daysSinceEpoch) % 6]`). Same hero shown to all visitors on a given day. This keeps direct-URL traffic visually warm without persisting cookies.

### Right form panel

- `bg-surface-paper`, `p-8 md:p-10`.
- `<h1>` "Welcome back" (signin) / "Create your account" (signup) — **`text-headline text-ink`** (24px). Per DESIGN.md §3, `text-display` is reserved for the marketing landing hero and is not used here.
- Sub-copy in `text-body text-ink-soft mb-8`. Example: "Sign in to your account." / "Pick a role and we'll set you up."
- `<ModeSlider>`: full-width pill toggle, `h-10`, `bg-surface-panel` track. Active pill `bg-surface-paper border border-hairline`. Text uses `text-label`; active is `text-ink font-medium`, inactive is `text-ink-soft`. Within-route press / hover via framer-motion `whileTap` and `whileHover`. Cross-route pill morph via View Transitions.
- `<RoleToggle>` (signup only): inline 2-button segmented control sitting above the username field. `bg-surface-sunk` track, active state `bg-surface-paper border border-hairline`. `text-label`. Hidden `name="role"` input updates on click. No animation.
- Form fields: existing `<Field>` + `<Input>` components from Phase 9. Unchanged.
- Submit button: existing `<Button>` (evergreen primary), full-width.
- "Forgot password?" link **removed** — no reset flow exists yet; revisit in a later phase. No "Login with Google" — Phase 2 committed to Credentials-only.

### Accent budget

Hospitable Evergreen appears only on the submit button and the small cross-link beneath the form ("No account? Sign up" / "Already have an account? Sign in"). The ModeSlider active pill uses `surface-paper`, not evergreen, so the toggle does not consume the accent budget. The ≤10% rule is respected.

### Typography

Inter only. All sizes pulled from DESIGN.md §3 tokens: `text-headline`, `text-body`, `text-label`, `text-caption`, `text-title`. No new typography.

## 6. View Transitions

### Mechanism

Use Next.js 15.5's experimental `unstable_ViewTransition` API if enabled in the project's `next.config.ts`; otherwise wrap navigations in a client component that calls `document.startViewTransition(() => router.push(href))` directly. Either path drives the same browser-level transition.

### Named transitions

- **`polaroid-${cityId}`** — Set on the clicked polaroid `<img>` on `/` via `onPointerDown` (and cleared on the other 5 polaroids so only one source exists per transition). Matched by the `<img>` inside `AuthHero` with the same name. Effect: the polaroid lifts off the globe and morphs into the left-panel hero.
- **`auth-panel`** — Set on the `<AuthPanel>` root on both `/signin` and `/signup`. Effect: the panel itself does not flash white between routes when the slider is toggled.
- **`auth-mode-pill`** — Set on the active pill of `<ModeSlider>`. Effect: the pill slides between Sign in and Sign up positions across the two routes.

### Fallback chain

1. Browser supports `document.startViewTransition` (Chrome 111+, Safari 18+) → animated morph.
2. Browser does not support it (Firefox at time of writing) → plain Next.js navigation, no animation. Layout is identical; users see an instant route change.
3. `prefers-reduced-motion: reduce` is set → the View Transition is skipped explicitly; plain navigation is used. Slider pill movement is also disabled (active state still highlighted, no animation). Honors DESIGN.md and PRODUCT.md WCAG 2.2 AA requirements.

### Implementation note

The polaroid click handler is a small client component that wraps the `<a>` element. It calls `e.preventDefault()` then runs `document.startViewTransition(() => router.push(href))`. The server-rendered `href` remains valid for no-JS, prefetch, and crawler traffic.

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

- Signed-out user visits `/`. Globe renders. Click a polaroid (Tokyo). URL becomes `/signin?city=tokyo`. Form renders. Hero shows Tokyo polaroid.
- On `/signin`, click "Sign up" in the ModeSlider. URL becomes `/signup`. Role toggle is visible above the username field.
- Submit a valid signup form with role "Host". Redirect lands at `/dashboard`. Session is established.
- Signed-in user visits `/` directly. Redirect lands at `/dashboard`.
- Signed-in user visits `/signin` directly. Redirect lands at `/dashboard`.
- Signed-in user visits `/signup` directly. Redirect lands at `/dashboard`.

### Reduced-motion verification

- In Chrome DevTools, emulate `prefers-reduced-motion: reduce`. Click a polaroid. URL changes instantly with no morph. ModeSlider pill highlights the new active state without animating.

### Cross-browser sanity

- Chrome 111+ and Safari 18+: View Transitions render the polaroid → hero morph and the cross-route pill slide.
- Firefox: plain navigation, no morph, no broken layout, no console errors.

### Lighthouse (production headless)

- `/` desktop: performance ≥95, accessibility ≥95, CLS 0. (Phase 10 baseline.)
- `/signin` desktop: performance ≥95, accessibility 100, no new LCP regression.

### Manual smoke

- Using `prod-smoke@test.com` / `password123` on production: land on `/` → expect immediate redirect to `/dashboard`. Sign out → revisit `/` → expect the globe.
- Tap each of the 6 polaroids in turn. Each `/signin?city=…` shows the corresponding polaroid as the hero.
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

### Deferred items

- **Database-backed markers.** `LANDING_MARKERS` remains hard-coded in `lib/landing-markers.ts`. Wire to a Prisma `City` table when one is added. Out of Phase 11 scope.
- **Phase 10b — Update — landing globe photos.** Placeholder JPEGs in `public/landing-globe/` are still 240×240 sharp-resized derivatives of unrelated splash images. Replace with curated CC0 city photography. Out of Phase 11 scope.
- **Forgot-password flow.** The link is removed in Phase 11. Revisit in Phase 12+ when a password-reset action is implemented.
- **Dashboard nav for signed-in users.** Auth-aware redirect handles the authed case from `/`; signed-out users have no dashboard. No nav needed on the landing page in Phase 11.
- **Footer.** Not in Phase 11 scope.
- **Dark mode.** Not in Phase 11 scope.

## 10. Phase 11 Implementation Ladder

The implementation plan will be written in a follow-up `writing-plans` session once the landing globe fix from the parallel agent has landed. Suggested rough order:

1. Commit DESIGN.md §1 + §5 amendments (separate, surgical commit).
2. Add `lib/landing-markers.ts` `caption` field; update existing markers.
3. Build `components/auth/auth-panel.tsx`, `auth-hero.tsx`, `mode-slider.tsx`, `role-toggle.tsx`.
4. Rewrite `app/page.tsx` as auth-aware RSC; retarget polaroid links to `/signin?city=…`; remove skip-link.
5. Rewrite `app/signin/page.tsx` and `app/signup/page.tsx` against the new split-panel components.
6. Wire View Transitions via a small client wrapper around the polaroid links.
7. Add `tests/auth-gate.spec.ts` and run the full gate suite.
8. Lighthouse production headless on `/` and `/signin`.
