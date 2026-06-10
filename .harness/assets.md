# Asset manifest

Policy: **reuse-only**. The user wants NO new image generation — every asset the app
needs already exists under `public/images/` and must be referenced at its current path.
The deterministic `assets` gate fails if new files appear under `public/images/`.

Generation queue: **empty** — nothing to generate, no model selection needed.

| id | purpose | prompt | target_path | aspect_ratio | model | status |
|----|---------|--------|-------------|--------------|-------|--------|
| hero-mono | hero center image | (none — reuse existing) | public/images/hero-mono.png | as-is |  | reused |
| hero-side-1 | hero left column img 1 | (none — reuse existing) | public/images/hero-side-1.png | as-is |  | reused |
| hero-side-2 | hero left column img 2 | (none — reuse existing) | public/images/hero-side-2.png | as-is |  | reused |
| hero-side-3 | hero right column img 1 | (none — reuse existing) | public/images/hero-side-3.png | as-is |  | reused |
| hero-side-4 | hero right column img 2 | (none — reuse existing) | public/images/hero-side-4.png | as-is |  | reused |
| mono-1 | gallery stack img 1 | (none — reuse existing) | public/images/mono-1.png | as-is |  | reused |
| mono-2 | gallery stack img 2 | (none — reuse existing) | public/images/mono-2.png | as-is |  | reused |
| mono-3 | gallery stack img 3 | (none — reuse existing) | public/images/mono-3.png | as-is |  | reused |
| mono-4 | gallery stack img 4 / fullscreen finale | (none — reuse existing) | public/images/mono-4.png | as-is |  | reused |

Notes for the Frontend agent:
- Any OTHER files already present under `public/images/` (used by the
  featured-products / collection / editorial / testimonials sections) are likewise
  reused in place at their existing paths — keep `src` strings identical to the old
  React components when porting.
- Favicons stay as-is: `/icon-light-32x32.png`, `/icon-dark-32x32.png`, `/icon.svg`,
  `/apple-icon.png`.
- The real-estate seed fixtures (`src/lib/data/properties.ts`) must also reuse these
  existing images for property covers/galleries — do not generate or download anything.
