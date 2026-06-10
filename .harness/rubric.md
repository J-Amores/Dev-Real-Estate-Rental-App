# Rubric — Phase B grading

Mode: **phase-b**. Deterministic gates are binary preconditions; scored criteria are
0–10 with explicit numeric `thresholds` the Evaluator enforces. Retry cap: 2 (default).

## Deterministic gates (binary — ALL must pass before scoring)

| gate | check |
|------|-------|
| install | `pnpm install` succeeds (fallback `npx pnpm install`) |
| build | `pnpm build` (astro build) succeeds |
| typecheck | `pnpm exec astro check` clean (fallback `npx astro check`) |
| stack-purge | `package.json` has no `next`, `react`, `react-dom`, `lucide-react`, `@vercel/analytics/next` deps |
| routes | build output contains `/`, `/properties`, and ≥1 `/properties/[id]` page |
| assets | no new files added under `public/images/` (reuse-only policy) |

## Scored criteria

| criterion | threshold | how to score |
|-----------|-----------|--------------|
| design-fidelity | **≥ 8 / 10** | Visual comparison of Astro landing page vs `.harness/baselines/` (Next.js rendering) at 1440×900 and 390×844: tokens/colors, typography (Inter, 35vw MONO hero type), spacing, section order, grain overlay, header pill scrolled state, hero mid-scroll layout, gallery stack frames, footer. 10 = indistinguishable; deduct ~1 per noticeable divergence, ~3 for a broken/missing section. |
| functionality | **≥ 8 / 10** | Playwright runtime: (a) `/` loads with zero console errors; (b) header anchor links navigate to section ids; (c) mobile menu opens/closes at 390px; (d) hero scroll animation visibly transforms layout (side images appear, text fades); (e) gallery cards stack on scroll and last image expands; (f) `/properties` renders seed listings with working links; (g) detail page shows that property's title/price/address/image. 10 = all pass robustly; weight (a–e) higher than (f–g). |

## Pass condition
All deterministic gates pass AND design-fidelity ≥ 8 AND functionality ≥ 8.
On failure: feed the specific failing gate/criterion evidence (diff screenshots, failing
Playwright step, build log) back to the Implementer; max 2 retries, then halt and report.
