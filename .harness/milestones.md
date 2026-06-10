# Milestones — ordered build units

Each milestone ends in a working, committed state. Commands use pnpm (fallback
`npx pnpm` — pnpm is not on the global PATH in this environment).

## M0 — Baseline capture (BEFORE any deletion)
- `pnpm install && pnpm build && pnpm start` (or `pnpm dev`) the CURRENT Next.js app.
- Capture Playwright screenshots into `.harness/baselines/`:
  desktop 1440×900 and mobile 390×844; shots: page top (hero initial), hero mid-scroll
  (~50% of the 200vh scroll range), each section scrolled into view (philosophy,
  featured-products, technology, gallery start + gallery last-image expansion,
  collection, editorial, testimonials, footer), header scrolled state (>50px), mobile
  menu open.
- Commit baselines. These are the visual-comparison ground truth for Phase B.

## M1 — Astro scaffold, in-place replacement
- Add Astro + `@astrojs/preact` + `@tailwindcss/vite` + TypeScript config; path alias `@/*`.
- Port `app/globals.css` → `src/styles/globals.css` verbatim (tokens, `@theme inline`,
  all keyframes/utilities, grain overlay, clip paths, text-stroke).
- `src/layouts/Layout.astro`: Inter via @fontsource (exposing `--font-inter`), metadata
  title `EVASION` + description, favicon set, `font-sans antialiased` body.
- Delete `app/`, `next.config.mjs`, `next-env.d.ts`; strip next/react/`@vercel/analytics`
  deps. Placeholder `src/pages/index.astro` renders with globals applied.
- Gate: `pnpm build` + `pnpm exec astro check` clean.

## M2 — Static sections port
- Port non-interactive sections to `.astro` components under `src/components/sections/`:
  philosophy, featured-products, technology, collection, editorial, testimonials, footer
  (audit each old file; if it has real `"use client"` interactivity, defer to M3).
- `next/image` → plain `<img>` with identical layout classes; keep section `id` anchors
  (`technology`, `gallery`, `accessories`, `about`, `reserve` targets as in old markup).
- Compose order in `index.astro` matching `app/page.tsx`.

## M3 — Interactive islands (Preact)
- `Header.tsx` island (`client:load`): scroll pill + exact box-shadow, mobile menu,
  lucide-preact Menu/X.
- `HeroSection.tsx` island (`client:load`): sticky 200vh scroll choreography, MONO
  letter stagger, center/side image interpolation, fixed tagline fade.
- `GallerySection.tsx` island (`client:visible`): rAF card stacking + last-image
  fullscreen expansion.
- `FadeImage` equivalent for any section that used it (smallest island or vanilla
  `<script>` if visually identical).
- Remove now-dead React components, unused `components/ui/`, `hooks/`. Update CLAUDE.md.

## M4 — Real-estate scaffolding
- `src/lib/types.ts` per `.harness/data-model.md`; `src/lib/utils.ts` (`cn()`).
- `src/lib/data/properties.ts` placeholder data layer with 3–6 seed properties reusing
  `public/images/` assets.
- `src/pages/properties/index.astro` (listing grid, monochrome styling, links to detail)
  and `src/pages/properties/[id].astro` (`getStaticPaths`, full property detail stub).
- Gate: routes present in `pnpm build` output.

## M5 — Deploy preparation (Vercel, prepare-only)
- Add `@astrojs/vercel` adapter OR confirm static output deploys via Vercel auto-detect;
  add `vercel.json` only if required.
- Verify `pnpm build` artifact; document deploy command in CLAUDE.md.
- Do NOT deploy (no `vercel` CLI network calls) without explicit user grant.

## M6 — Phase B evaluation
- Run deterministic gates (install, build, astro check, no react/next deps, routes exist).
- Playwright runtime suite (console-error-free load, anchors, mobile menu, hero +
  gallery scroll behavior, /properties listing + detail).
- Visual comparison vs `.harness/baselines/` at the same viewports/scroll positions.
- Rubric grading against `.harness/rubric.md` thresholds (design-fidelity ≥ 8,
  functionality ≥ 8). Retry cap: 2.
