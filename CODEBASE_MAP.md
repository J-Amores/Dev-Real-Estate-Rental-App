# Codebase Map — my-v0-project

| Area | Path | Responsibility |
|------|------|----------------|
| App entry | `app/layout.tsx` | Root layout: fonts, global providers, `<html>`/`<body>` shell |
| Landing page | `app/page.tsx` | Composes the marketing sections into the single page |
| Global styles | `app/globals.css`, `styles/globals.css` | Tailwind v4 base/theme styles |
| Page sections | `components/sections/` | Hero, collection, editorial, featured-products, gallery, philosophy, technology, testimonials, footer |
| UI primitives | `components/ui/` | shadcn/ui + Radix components (~57); generated, edit sparingly |
| Shared components | `components/` | `header.tsx`, `fade-image.tsx`, `theme-provider.tsx` |
| Utilities | `lib/utils.ts` | `cn()` class merge + shared helpers |
| Hooks | `hooks/` | `use-mobile.ts`, `use-toast.ts` |
| Static assets | `public/` | Images and other static files |
| Config | `next.config.mjs`, `tsconfig.json`, `components.json`, `postcss.config.mjs` | Build, TS (`@/*` alias), shadcn, PostCSS/Tailwind config |
