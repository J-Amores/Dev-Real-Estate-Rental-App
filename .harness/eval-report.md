# Eval Report — Iteration 1 (full Phase-B gate)

**Verdict: FAIL** — one deterministic gate (stack-purge) fails. Everything else is green,
and both scored criteria are at 10/10. This is a cleanup-only failure.

Date: 2026-06-09 · Evaluator: separate agent · Retry budget: 2 (this consumes attempt 1)

## Deterministic gates

| gate | result | evidence |
|------|--------|----------|
| install | PASS | node_modules present and consistent; all commands ran via `npx pnpm` |
| build | PASS | `npx pnpm build` → 7 pages in 1.45s: `/`, `/properties`, `/properties/p-001..p-005`; 10 client island chunks emitted |
| typecheck | PASS | `npx pnpm check` (astro check, 19 files) → 0 errors / 0 warnings / 0 hints |
| stack-purge | **FAIL** | `package.json` dependencies still contain `next` 16.0.10, `react` 19.2.0, `react-dom` 19.2.0, `lucide-react` 0.454.0 (rubric requires all four gone). `@vercel/analytics` is the allowed framework-agnostic base package (no `/next` entrypoint dep). |
| routes | PASS | dist/ contains `/index.html`, `/properties/index.html`, `/properties/p-001..p-005/index.html` |
| assets | PASS | `git status public/images/` clean; 22 tracked files = 22 on disk (reuse-only policy held) |
| tests | PASS (vacuous) | no test runner configured; per CLAUDE.md, build+typecheck are the gate |

## Runtime gate (Playwright on `astro preview`, port 4321) — PASS

All rubric functionality checks, real browser (chromium via playwright-cli):

- (a) `/` loads with **0 console errors/warnings** at 1440×900 and 390×844; `/properties` and detail also clean.
- (b) Header anchors: all six links present (`#hero #technology #gallery #accessories #about #reserve`); all target ids exist; clicking "Gallery" smooth-scrolled to y=11672 and set `#gallery`.
- (c) Mobile menu at 390×844: `[aria-label="Toggle menu"]` opens panel (Design/Gallery/Models/About + Contact pill, X icon), closes back to 0 visible nav links.
- (d) Hero scroll (y=900, mid 200vh range): MONO text fully faded, center image shrunk, side columns visible from both edges, header pill scrolled state active (`bg-background/80 backdrop-blur-md rounded-full`).
- (e) Gallery (4500px section): card stacking verified mid-scroll (incoming card `translateY 30% / scale 0.94 / opacity 0.70` at one sampled frame); at section end the last (night) image is fullscreen with border-radius → 0.108px ≈ 0.
- (f) `/properties` renders 5 seed cards with working links (p-001..p-005).
- (g) `/properties/p-002` shows Grain Loft: title, FOR SALE chip, address (88 Foundry Row…), $1,250,000, 2 bd / 2 ba / 1,980 sqft, features, hero image — matches the seed in `src/lib/data/properties.ts`.

## Visual gate — PASS, score 10/10

`.harness/baselines/` did not exist (M0 was skipped by the builders). The evaluator
recovered ground truth by checking out the pre-port commit `c105e19` in a temp worktree
(`git worktree add`), cloning node_modules (Turbopack rejects out-of-root symlinks), and
running the real legacy Next.js app on :3000. Matched screenshot pairs at identical
scroll offsets, desktop 1440×900 + mobile 390×844:

top, hero mid-scroll (y=900), philosophy (y=2900), featured-products bento, day-cycle
technology (y=8500), gallery full expansion (y=15272), collection ("Surface Options"),
editorial + footer, mobile top.

Result: pixel-faithful. Section offset map is **identical** between baseline and port
(products 2700/h2138, technology 4838/h1420, gallery 11672/h4500, accessories 16172/h945,
about 17950/h810). Only diffs: Next dev-tools badge (baseline-only artifact) and the
intentionally added `id="hero"` / `id="reserve"` anchors per the API contract.

Baseline captures are now persisted at `.harness/baselines/base-*.png` — commit them.

## Rubric

| criterion | threshold | score |
|-----------|-----------|-------|
| design-fidelity | ≥ 8 | **10** |
| functionality | ≥ 8 | **10** |

Scored criteria pass; overall verdict fails only on the stack-purge deterministic gate.

## Instructions for the next builder (single fix)

Finish the M3/M1 in-place cleanup — the blocker the Frontend agent deliberately deferred
("delete legacy only after baseline capture"). Baselines are captured now; proceed:

1. Commit `.harness/baselines/`.
2. Delete legacy sources: `app/`, React `components/` (sections/ui/etc. — keep nothing
   imported by `src/`), `hooks/`, `lib/` (root), `styles/`, `next.config.mjs`,
   `next-env.d.ts`, `tsconfig.next.json`, `postcss.config.mjs` if Next-only.
3. `package.json`: remove scripts `next:dev|build|start`; remove deps `next`, `react`,
   `react-dom`, `lucide-react` (the four gated ones) plus now-unused React-ecosystem deps
   (@radix-ui/*, react-hook-form, recharts, embla, vaul, sonner, next-themes, cmdk, etc.)
   and `@types/react`, `@types/react-dom`. Keep preact/@astrojs/preact/lucide-preact.
4. `npx pnpm install` to regenerate the lockfile, then re-verify: `npx pnpm build`,
   `npx pnpm check`, and a preview smoke test of `/`, `/properties`, `/properties/p-001`.
5. Update CLAUDE.md (still describes the Next.js stack) and CODEBASE_MAP.md.

No design or functionality rework is needed — do not touch `src/`.
