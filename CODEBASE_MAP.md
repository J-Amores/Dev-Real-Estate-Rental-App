# Codebase Map — evasion-mono (Astro + Preact)

| Area | Path | Responsibility |
|------|------|----------------|
| Build config | `astro.config.mjs` | Astro 5 static output, `@astrojs/preact` integration, Tailwind v4 vite plugin, `@` → `./src` alias, postcss neutralizer for legacy config |
| TS config | `tsconfig.json` | Astro strict preset, `jsxImportSource: preact`, `@/*` → `./src/*`, excludes legacy Next dirs |
| Root layout | `src/layouts/Layout.astro` | Head/meta/favicons, self-hosted Inter (`@fontsource/inter`, exposes `--font-inter`), imports globals.css, `font-sans antialiased` body |
| Landing page | `src/pages/index.astro` | Composes MONO/EVASION sections in old `app/page.tsx` order (placeholder until M2/M3 port) |
| Properties listing | `src/pages/properties/index.astro` | Stub grid of seed properties, links to detail pages |
| Property detail | `src/pages/properties/[id].astro` | Stub detail page; `getStaticPaths` over seed data (p-001…p-005) |
| Static sections | `src/components/sections/` | Ported `.astro` sections (M2): philosophy, featured-products, technology, collection, editorial, testimonials, footer |
| Preact islands | `src/components/islands/` | Header (`client:load`), HeroSection (`client:load`), GallerySection (`client:visible`), FadeImage (M3) |
| Global styles | `src/styles/globals.css` | Verbatim port of old `app/globals.css`: monochrome tokens, `@theme inline`, keyframes/utility classes — do not reformat |
| Data contract | `src/lib/types.ts` | `Property`, `PropertyQuery` & related types (authoritative source: `.harness/data-model.md`) |
| Data layer | `src/lib/data/properties.ts` | PLACEHOLDER in-memory seed (5 props); `getProperties` / `getPropertyById` / `getPropertyBySlug` / `getFeaturedProperties` (async; see `.harness/api-contract.md`) |
| Utilities | `src/lib/utils.ts` | `cn()` (clsx + tailwind-merge), `formatPrice()` |
| Static assets | `public/` | Images (`public/images/*` reused by seed data), favicons |
| Harness docs | `.harness/` | spec, data-model, milestones, rubric, api-contract, progress, baselines (M0) |
| LEGACY (delete per milestones) | `app/`, `components/`, `hooks/`, `lib/`, `styles/`, `next.config.mjs`, `tsconfig.next.json`, `postcss.config.mjs`, `components.json` | Old Next.js app — port source for M2/M3 and M0 baseline rendering (`npx pnpm next:dev`); excluded from Astro typecheck |
