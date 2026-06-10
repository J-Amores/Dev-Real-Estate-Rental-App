# Spec — Astro + Preact refactor of the MONO/EVASION landing page

## Summary
Port the existing Next.js 16 (App Router) + React 19 + Tailwind v4 single-page monochrome
landing site ("MONO" brand, `EVASION` metadata title) to **Astro + Preact**, in place, in this
repo. The port must be **pixel-faithful** to the current rendering. In addition, scaffold a
minimal **real-estate ecommerce layer**: typed `Property` data model, data-layer placeholders,
and stub routes `/properties` and `/properties/[id]`.

- Mode: **greenfield**, eval **phase-b**, **deployPrepare: true** (Vercel, prepare-only).
- Retry cap: default (2).
- Package manager: **npm** (migrated from pnpm on 2026-06-10 per CLAUDE.md "No pnpm/bun" rule).

## Source of truth (current app, before deletion)
- Page composition (`app/page.tsx`): `Header` + sections in order: hero, philosophy,
  featured-products, technology, gallery, collection, editorial, testimonials, footer
  (all under `components/sections/`, header at `components/header.tsx`).
- Root layout (`app/layout.tsx`): Inter font (variable `--font-inter`), metadata title
  `EVASION`, favicon set (`/icon-light-32x32.png`, `/icon-dark-32x32.png`, `/icon.svg`,
  `/apple-icon.png`), `<body class="font-sans antialiased">`. `@vercel/analytics` is used —
  drop it or replace with the framework-agnostic `@vercel/analytics` script injection;
  do NOT keep the `/next` entrypoint.
- Design tokens (`app/globals.css`): full monochrome palette (`--background: #FFFFFF`,
  `--foreground: #0A0A0A`, neutral grays, `--radius: 0rem`), `.dark` variant block,
  `@theme inline` mapping for Tailwind v4, fonts `--font-sans: Inter`, `--font-mono:
  JetBrains Mono`, `--font-display: 'PP Editorial New', 'Times New Roman', serif`.
- Keyframes/utilities that MUST be preserved verbatim: `slideUp`, `float`, `reveal-up`,
  `reveal-left`, `reveal-right`, `scale-in`, `grain`, `fadeIn`; helper classes
  `.animate-*`, `.animation-delay-100..600`, `.grain-overlay::before` (inline SVG
  fractal-noise data URI, opacity 0.03, `grain 8s steps(10) infinite`), `.text-stroke`,
  `.clip-diagonal`, `.clip-diagonal-reverse`, `html { scroll-behavior: smooth }`.

## Target architecture
- **Astro** project (static output) with **@astrojs/preact** integration and Tailwind v4
  via `@tailwindcss/vite`. TypeScript throughout. Path alias `@/*` preserved.
- Layout: `src/layouts/Layout.astro` (head, fonts, globals.css, favicons, metadata),
  `src/pages/index.astro` composes the sections in the same order as today.
- **Islands strategy** (hydrate only what needs JS):
  - `Header` — Preact island (`client:load`): scroll-state pill styling (scrolled >50px
    switches to `bg-background/80 backdrop-blur-md rounded-full` + the exact layered
    box-shadow), mobile menu open/close with lucide `Menu`/`X` icons, anchor links
    (`#hero`, `#technology`, `#gallery`, `#accessories`, `#about`, `#reserve`).
  - `HeroSection` — Preact island (`client:load`): sticky 200vh scroll-driven animation —
    "MONO" letters `slideUp` stagger (0.08s per letter, 35vw type), text fades out over
    progress 0–0.2, then center image shrinks 100%→20% width while side image columns
    (hero-side-1..4) slide in from ±100% with gap growing 0→8px; fixed bottom tagline
    "Lightweight, durable / and adventure-ready." fading with text.
  - `GallerySection` — Preact island (`client:visible`): black section, `(n+1)*100vh`
    tall, sticky card-stacking of `mono-1..4.png` (translateY 100%→0, scale 0.8→1,
    rAF-throttled), last image expands toward fullscreen (eased cubic, border-radius
    16→0) starting at progress 0.6.
  - `FadeImage` — small Preact island or rewrite: IntersectionObserver + load-state fade
    (opacity/scale 1.02→1, 700ms). Where a section only uses it decoratively, a CSS/
    vanilla-JS `<script>` equivalent in Astro is acceptable if visually identical.
  - All other sections (philosophy, featured-products, technology, collection, editorial,
    testimonials, footer): port as **static `.astro` components** unless they contain
    `"use client"` interactivity — audit each during the port and only then make it an
    island (smallest possible `client:visible` island).
- **Images**: replace `next/image` with plain `<img>` (current config is
  `images.unoptimized: true`, so plain `<img>` is parity) or `astro:assets` only if it
  does not change rendered output. `fill` usages become absolutely-positioned
  `object-cover` imgs. Reuse `public/images/*` paths unchanged.
- **Icons**: `lucide-react` → `lucide-preact` (only icons actually used, e.g. Menu, X).
- **shadcn/ui**: do NOT port `components/ui/` wholesale. Port only what the landing page
  actually renders (inspect section imports). Replace button-like usages with equivalent
  utility classes; keep `cn()` (clsx + tailwind-merge) in `src/lib/utils.ts`.
- **Fonts**: Inter self-hosted via `@fontsource-variable/inter` (or `@fontsource/inter`)
  exposing `--font-inter`; keep the `--font-display` / `--font-mono` stacks as declared
  fallbacks (no PP Editorial New files exist in repo — do not add any).

## In-place replacement
Delete: `app/`, `next.config.mjs`, `next-env.d.ts`, React/Next/`@vercel/analytics(/next)`
deps, `components/` React sources after porting, unused shadcn `components/ui/`,
`hooks/`, leftover Next artifacts. Git history preserves the old code — no archive copies.
Keep: `public/` (all of it, especially `public/images/`), the lockfile (`package-lock.json`)
regenerated as needed, `.harness/`. Update `CLAUDE.md` commands/layout for the Astro stack
(build: `npm run build` → `astro build`; typecheck: `npm run check` with `npx astro check`
fallback; dev: `npm run dev` → localhost:4321 unless configured to 3000).

## Real-estate ecommerce scaffolding (stubs only — no full ecommerce build)
- `src/lib/types.ts` (or `src/data/types.ts`): typed `Property` model and related types —
  see `.harness/data-model.md` (authoritative).
- `src/lib/data/properties.ts`: placeholder data layer — `getProperties(query?)`,
  `getPropertyBySlug(slug)` / `getPropertyById(id)` returning a small in-memory seed
  fixture array (3–6 properties reusing existing `public/images/` assets), async
  signatures so a real API/DB can be swapped in later. Clearly marked `// PLACEHOLDER`.
- `src/pages/properties/index.astro`: stub listing page (simple grid of seed properties,
  monochrome design language consistent with the landing page, links to detail pages).
- `src/pages/properties/[id].astro`: stub detail page (`getStaticPaths` from the seed
  data; title, price, address, image, features list).
- No cart, checkout, auth, or persistence — out of scope.

## Evaluation — phase-b
1. **Deterministic gates** (binary, all must pass):
   - `npm ci` succeeds; `npm run build` (astro build) succeeds.
   - Typecheck clean: `npm run check` (fallback `npx astro check`).
   - No `next`, `react`, `react-dom`, `lucide-react` left in `package.json` dependencies.
   - Routes exist in build output: `/`, `/properties`, at least one `/properties/[id]`.
2. **Playwright runtime checks**: page loads with no console errors; header anchors
   navigate; mobile-viewport menu toggles; hero scroll animation changes layout when
   scrolling; gallery stacking activates; `/properties` lists seed items; a detail page
   renders its property's data.
3. **Visual comparison**: screenshots of the Astro landing page vs **baseline captures of
   the current Next.js rendering**. Baselines MUST be captured at milestone 0 (before any
   deletion) into `.harness/baselines/` at desktop (1440×900) and mobile (390×844)
   viewports: top of page, hero mid-scroll, each section scrolled into view, footer.
4. **Rubric grading** with thresholds (see `.harness/rubric.md`):
   - design-fidelity ≥ 8/10
   - functionality ≥ 8/10

## Deploy — prepare only (Vercel)
`deployPrepare: true`. Add the `@astrojs/vercel` adapter **or** static-output Vercel
config (`vercel.json` if needed; Vercel auto-detects Astro), verify `npm run build` produces
a deployable artifact, and document the deploy command. Do **NOT** run `vercel deploy` or
any network deploy without an explicit user grant.

## Workflow args
`{ kind: 'greenfield', mode: 'phase-b', deployPrepare: true }` — retryCap omitted (default 2).
