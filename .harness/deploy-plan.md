# Deploy plan — Vercel (prepare-only)

Status: **PREPARED, NOT DEPLOYED.** Per `.harness/spec.md` (`deployPrepare: true`), no
`vercel deploy`, `git push`, or any network deploy has been run. Everything below is local.

## What ships

Static Astro site (`output: "static"` in `astro.config.mjs`). `npm run build` emits `dist/`
containing 7 prerendered routes: `/`, `/properties`, `/properties/p-001 … p-005`, plus
`public/` assets and hashed `_astro/` bundles. No serverless functions, no adapter needed —
the `@astrojs/vercel` adapter was intentionally NOT added (spec allows static-output config
instead; the site has zero SSR/runtime needs).

## Prepared artifacts

| File | Purpose |
|---|---|
| `vercel.json` | Platform manifest: `framework: astro`, `npm ci`, `npm run build`, output `dist/`, `cleanUrls`, immutable cache headers for `/_astro/*`. |
| `.github/workflows/ci.yml` | CI on push/PR to `main`: npm + Node 20 → `astro check` → `astro build` → asserts `/`, `/properties`, `/properties/[id]` exist in `dist/` → uploads `dist` artifact. |
| `env.example` | Env template. **No env vars are required** (fully static site). Human must rename: `mv env.example .env.example` — agent permission rules deny writing any `.env*` path. |
| `Dockerfile` + `.dockerignore` | Portable fallback (non-Vercel hosts): node:20-alpine build stage (`npm ci`) → nginx:1.27-alpine serving `dist/` on port 80. |

## Local verification (run before deploying)

```sh
npm ci
npm run check               # typecheck (astro check) — must be clean
npm run build               # must emit dist/ with the 7 routes
npm run preview             # smoke-test http://localhost:4321
```

## Exact human steps to actually deploy

1. **One-time:** `mv env.example .env.example` (see permission note above), then commit the
   deploy artifacts:
   ```sh
   git add vercel.json .github/workflows/ci.yml .env.example Dockerfile .dockerignore .harness/deploy-plan.md .harness/progress.md
   git commit -m "Deploy prep: Vercel manifest, CI workflow, env template, Docker fallback"
   ```
2. **Preview deploy** (requires Vercel auth; first run will prompt to link/create the
   Vercel project — accept the auto-detected Astro framework preset, which `vercel.json`
   pins anyway):
   ```sh
   npx vercel deploy
   ```
3. **Verify the preview URL** it prints: landing page renders (hero scroll, gallery
   stacking, mobile menu), `/properties` lists 5 seeds, `/properties/p-001` renders.
4. **Promote to production:**
   ```sh
   npx vercel deploy --prod
   ```
   (Or, if the Vercel project is connected to the Git repo: `git push origin main` — the
   CI workflow gates typecheck/build/routes, and Vercel's Git integration deploys
   production from `main` automatically. Pick ONE of push-to-deploy or CLI deploy as the
   ongoing mechanism.)

No environment variables need to be set in the Vercel dashboard. Vercel Web Analytics can
be enabled from the dashboard (Project → Analytics) — no code change required for a static
site.

## Rollback

Vercel dashboard → Deployments → previous deployment → "Promote to Production", or
`npx vercel rollback`.
