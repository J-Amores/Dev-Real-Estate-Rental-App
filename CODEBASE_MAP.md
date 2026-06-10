# Codebase Map — evasion-mono (Astro + Preact)

| Area | Path | Responsibility |
|------|------|----------------|
| Build config | `astro.config.mjs` | Astro 5 static output, `@astrojs/preact` integration, Tailwind v4 vite plugin, `@` → `./src` alias |
| TS config | `tsconfig.json` | Astro strict preset, `jsxImportSource: preact`, `@/*` → `./src/*` |
| Root layout | `src/layouts/Layout.astro` | Head/meta/favicons, self-hosted Inter (`@fontsource/inter`, exposes `--font-inter`), imports globals.css, `font-sans antialiased` body |
| Landing page | `src/pages/index.astro` | Composes Header + the MONO/EVASION sections in original order |
| Properties listing | `src/pages/properties/index.astro` | Stub grid of seed properties, links to detail pages |
| Property detail | `src/pages/properties/[id].astro` | Stub detail page; `getStaticPaths` over seed data (p-001…p-005) |
| Static sections | `src/components/sections/` | Ported `.astro` sections: featured-products, collection, editorial, testimonials, footer |
| Preact islands | `src/components/islands/` | Header (`client:load`), HeroSection (`client:load`), GallerySection (`client:visible`), PhilosophySection, TechnologySection, FadeImage |
| Global styles | `src/styles/globals.css` | Verbatim port of the original Next.js `app/globals.css`: monochrome tokens, `@theme inline`, keyframes/utility classes — do not reformat |
| Data contract | `src/lib/types.ts` | `Property`, `PropertyQuery` & related types (authoritative source: `.harness/data-model.md`) |
| Data layer | `src/lib/data/properties.ts` | PLACEHOLDER in-memory seed (5 props); `getProperties` / `getPropertyById` / `getPropertyBySlug` / `getFeaturedProperties` (async; see `.harness/api-contract.md`) |
| Utilities | `src/lib/utils.ts` | `cn()` (clsx + tailwind-merge), `formatPrice()` |
| Static assets | `public/` | Images (`public/images/*` reused by seed data), favicons |
| Harness docs | `.harness/` | spec, data-model, milestones, rubric, api-contract, progress, baselines (visual ground truth from pre-port commit `c105e19`) |
| Deploy artifacts | `vercel.json`, `Dockerfile`, `.github/workflows/`, `env.example` | Vercel deploy config (see `.harness/deploy-plan.md`); linked project `jadev-projects/real-estate-app`, live at real-estate-app-dun-ten.vercel.app — new deploys only with an explicit grant |
