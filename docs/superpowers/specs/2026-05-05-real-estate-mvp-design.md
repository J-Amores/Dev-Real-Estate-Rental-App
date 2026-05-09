# Real Estate Rental Marketplace — MVP Design

**Date:** 2026-05-05
**Source:** Adapted from `app-guide.md` (a structured guide derived from EdRoh's "Build an Enterprise Nextjs Rental App" YouTube tutorial, 12h 19m).
**Stack pivot:** From the guide's AWS-heavy two-repo architecture (Next.js client + Express server + Cognito + EC2 + RDS + S3 + API Gateway + Amplify Hosting) to a single Next.js 15 app on Vercel with Neon Postgres + PostGIS.

> **Design / UI superseded.** All frontend, visual, and UX guidance in this spec has been replaced by `PRODUCT.md`, `DESIGN.md`, and `DESIGN.json` at the project root, applied via the `impeccable:impeccable` skill. This spec remains authoritative for **data model, server actions, page flows, auth, deployment, and PostGIS** (§5–§9, §11, §14 phase ladder), but treat any reference to shadcn/ui, the bundled `tailwind.config.ts`, `<FormField/>`, `customgreys-*` classes, `use-mobile`, or the "Polish" phase as historical. When designing or building UI, follow `DESIGN.md` tokens (Hospitable Evergreen, OKLCH ramps, Inter, mixed corners, flat-by-default) and let `impeccable` drive component shape — do not re-import the asset-download UI bundle.

---

## 1. Goals & non-goals

### Goals
A two-sided real-estate rental marketplace MVP:
- Tenants can search properties on a map, favorite listings, and submit applications.
- Managers can create / read / update / delete properties and approve or deny applications.
- Auth via email + password (role chosen at signup: `tenant` | `manager`).
- Geospatial filtering via PostgreSQL + PostGIS.
- Hosted on Vercel; database on Neon (via the Neon ↔ Vercel native integration).
- UI built **and** polished via the `impeccable:impeccable` skill, sourcing all visual decisions from `PRODUCT.md` / `DESIGN.md` / `DESIGN.json` (not a final-phase polish — applied continuously from Phase 4 onward).

### Non-goals (cut from the source guide)
- AWS Cognito, EC2, RDS, S3, API Gateway, Amplify Hosting.
- File-upload UI (FilePond, multer, S3). Replaced with paste-a-URL inputs.
- Express, Helmet, Morgan, body-parser, CORS, `jsonwebtoken`, multer.
- RTK Query / Redux Toolkit. Search filter state lives in URL params.
- Email-verification flow.
- A separate "Residences" page for tenants — folded into Applications (Approved status).
- Payments UI — schema column kept for seed compatibility but never read.
- Mapbox Studio custom style; custom HTML map markers.
- Filter inputs for amenities, highlights, square feet, available-from, pets-allowed, parking-included.

---

## 2. Architecture

```
Browser  ─────▶  Vercel (Next.js 15 App Router)
                    ├─ Server Components (data reads via Prisma)
                    ├─ Server Actions   (mutations via Prisma)
                    ├─ Route Handler    (only at api/auth/[...nextauth])
                    └─ Middleware       (auth gate on /dashboard/*)
                              │
                              ▼
                    Neon Postgres + PostGIS
                              │
                              ▼
                    Mapbox API   (geocoding + map tiles, browser-side)
```

Single repo, single Next.js project. No client/server split. The "API layer" is a combination of Server Components (reads) and Server Actions (writes); only Auth.js's catch-all callback exists as a Route Handler.

Top-level directories: `app/`, `components/`, `lib/`, `prisma/`, `public/`. Five total.

---

## 3. Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript + Tailwind |
| UI primitives | ~~shadcn/ui~~ **superseded** — raw Tailwind primitives styled per `DESIGN.md` tokens; component shape driven by the `impeccable` skill |
| Forms | react-hook-form + zod + @hookform/resolvers |
| Auth | Auth.js v5 (`next-auth@5`), Credentials provider, JWT sessions |
| Password hashing | bcrypt |
| ORM | Prisma + `@prisma/client` |
| Database | Neon Postgres + PostGIS extension |
| DB CLI | pgcli (`brew install pgcli`) |
| Maps | mapbox-gl (default `streets-v12` style, default markers) |
| Geocoding | Mapbox Geocoding API (landing search), Nominatim (server-side property creation) |
| Animation | framer-motion |
| Icons | lucide-react |
| Utils | lodash, date-fns |
| Hosting | Vercel |
| UI design system | `PRODUCT.md` + `DESIGN.md` + `DESIGN.json` (project root); all visual decisions cite their tokens |
| UI workflow | `impeccable:impeccable` skill — applied continuously, not just at end |

Notably absent vs. the guide:
- No Redux / RTK Query / `state/` directory.
- No Express, multer, body-parser, helmet, morgan, jsonwebtoken.
- No `@aws-sdk/*`, FilePond, AWS Amplify, `@terraformer/wkt`.

---

## 4. Routing & file structure

```
real-estate-app/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                          # landing
│   ├── globals.css
│   ├── api/auth/[...nextauth]/route.ts   # only Route Handler
│   ├── signin/page.tsx
│   ├── signup/page.tsx
│   ├── search/
│   │   ├── page.tsx                      # RSC
│   │   ├── filters.tsx                   # client
│   │   ├── map.tsx                       # client (mapbox-gl)
│   │   └── listings.tsx                  # client
│   ├── properties/
│   │   └── [id]/page.tsx                 # public detail; favorite + apply (tenant only)
│   └── dashboard/
│       ├── layout.tsx                    # role-aware sidebar
│       ├── settings/page.tsx             # both roles
│       ├── favorites/page.tsx            # tenant
│       ├── applications/page.tsx         # both — role-aware view
│       └── properties/                   # manager
│           ├── page.tsx                  # list
│           ├── new/page.tsx              # create
│           └── [id]/edit/page.tsx        # update + delete
│
├── components/
│   ├── sidebar.tsx                       # styled per DESIGN.md §5 Navigation
│   ├── header.tsx
│   ├── property-card.tsx
│   └── application-card.tsx
│   # NOTE: components/ui/ (shadcn) and form-field.tsx (FormField workhorse)
│   # are SUPERSEDED — see top-of-doc banner. Build inputs/buttons/selects
│   # as plain Tailwind elements that cite DESIGN.md tokens.
│
├── lib/
│   ├── prisma.ts                         # PrismaClient singleton
│   ├── auth.ts                           # Auth.js config + auth() helper
│   ├── schemas.ts                        # all zod schemas
│   ├── constants.ts                      # enums + icon maps
│   ├── utils.ts                          # cn, cleanParams, formatters
│   └── actions.ts                        # all 8 Server Actions
│   # NOTE: lib/use-mobile.ts is SUPERSEDED (was a shadcn-sidebar hook).
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── seedData/*.json
│
├── public/                               # from asset-download/client/public
├── middleware.ts
├── tailwind.config.ts
├── next.config.ts
└── .env.local
```

### Routing notes
- No route groups. Direct `/signin`, `/signup`, `/search`, `/properties/:id`, `/dashboard/*`.
- Single `dashboard/` folder for both roles. Sidebar in `dashboard/layout.tsx` reads `session.user.role` and renders role-appropriate links. Role-restricted pages (`favorites`, `properties/*`) start with a one-liner role check + redirect.
- After signup/signin redirect: tenant → `/dashboard/favorites`, manager → `/dashboard/properties`.

---

## 5. Auth & sessions

### Library
Auth.js v5 (`next-auth@5`), Credentials provider only. JWT session strategy (no DB hit per request).

### Schema additions (delta vs. `asset-download/server/prisma/schema.prisma`)
- New `User` model: `id`, `email @unique`, `passwordHash`, `username`, `role (UserRole enum: tenant | manager)`, `createdAt`. Replaces the original "Cognito for credentials, Postgres for domain data" split.
- Rename `cognitoId` → `userId` on `Manager` and `Tenant`. One-to-one relation to `User` (only one of `Tenant?` / `Manager?` is populated, determined by `role`).
- Rename `managerCognitoId` → `managerId` on `Property`.
- Rename `tenantCognitoId` → `tenantId` on `Application` and `Lease`.
- No `cognitoId` column appears anywhere in the final schema (clean break — MVP, no migration story needed).
- Keep PostGIS extension declaration as-is.

### Token shape
After `jwt` / `session` callbacks: `{ id, email, role, tenantId? | managerId? }`. Available client-side via `useSession()` and server-side via `auth()`.

### Signup flow (Server Action on `/signup`)
1. Zod-validate `{ email, password, username, role }`.
2. `bcrypt.hash(password, 10)`.
3. Prisma transaction: create `User` row + create `Tenant` *or* `Manager` row linked by `userId`.
4. `signIn("credentials", ...)` from inside the action to set the session cookie.
5. `redirect()` to `/dashboard/favorites` (tenant) or `/dashboard/properties` (manager).

### Sign-in flow
Credentials provider's `authorize` callback looks up `User` by email, `bcrypt.compare`s the password, returns `{ id, email, role }`. The `jwt` callback enriches the token with `role` and the linked tenant/manager id.

### Route protection
- `middleware.ts` checks "is logged in" for `/dashboard/*`. Unauthenticated → `/signin`.
- Server Actions and role-restricted pages call `await auth()` and assert role. Middleware is a UX redirect; per-page checks are the security boundary.

---

## 6. Data layer

### Prisma client
Standard Next.js singleton in `lib/prisma.ts` using `globalThis` so HMR doesn't open a connection per save.

### Connection
Neon's pooled URL (`DATABASE_URL`) via the standard Postgres driver. No driver adapter needed for the MVP.

### Schema source of truth
`asset-download/server/prisma/schema.prisma` — copy verbatim to `prisma/schema.prisma`, then apply the auth deltas from §5. Keep `previewFeatures = ["postgresqlExtensions"]` and `extensions = [postgis]`.

### Datasource block
```prisma
datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  directUrl  = env("DATABASE_URL_UNPOOLED")
  extensions = [postgis]
}
```

### PostGIS pattern
- **Writes** (in `createPropertyAction`): geocode address via Nominatim → format as WKT (`POINT(<lng> <lat>)`) → ``prisma.$executeRaw`INSERT INTO "Location" ... ST_GeomFromText(${wkt}, 4326)` ``.
- **Reads** (in `app/search/page.tsx`): `prisma.$queryRaw` with `` Prisma.sql`...` `` template literals composing `WHERE` clauses, including `ST_DWithin(...)` for the lat/lng radius. Cast back to plain lng/lat with `ST_X(coordinates::geometry)` / `ST_Y(coordinates::geometry)`.

### Seed (`prisma/seed.ts`)
Adapted from `asset-download/server/prisma/seed.ts`:
1. New first step: create demo `User` rows (one tenant, one manager, password `password123` bcrypted) so login works immediately.
2. Manager / Tenant seeds reference those `userId`s instead of fake `cognitoId`s.
3. Row counts and seed JSON files unchanged: 10 locations, 10 managers, 10 properties, 15 tenants, 15 leases, 15 applications, 15 payments. (Payments are seeded but never displayed.)

### Where queries live
- Reads: directly inside Server Components via `prisma.*`. RSC *is* the data layer.
- Writes: inside Server Actions in `lib/actions.ts`. Each action: `await auth()` → zod-validate input → Prisma call → `revalidatePath("/affected-route")`.

---

## 7. User-facing operations (CRUD inventory)

| Entity | Tenant | Manager (own properties) | Public |
|---|---|---|---|
| Auth | Sign up · Sign in · Sign out · Update profile | Sign up · Sign in · Sign out · Update profile | — |
| Property | Read | Create · Read · Update · Delete | Read · Search |
| Favorite | Add · Read · Remove | — | — |
| Application | Create · Read | Read · Approve / Deny | — |

### Server Actions in `lib/actions.ts` — 8 total
1. `signupAction(formData)` — create User + Tenant/Manager rows + sign in.
2. `updateProfileAction(formData)` — update Tenant or Manager based on `session.user.role`.
3. `toggleFavoriteAction(propertyId)` — add or remove based on current state.
4. `createApplicationAction(formData)` — tenant submits an application (status `Pending`).
5. `updateApplicationStatusAction(id, status)` — manager approves/denies. On approve, also creates `Lease` row in same Prisma transaction.
6. `createPropertyAction(formData)` — geocode (Nominatim), insert Location + Property in one transaction.
7. `updatePropertyAction(id, formData)` — manager edits own property.
8. `deletePropertyAction(id)` — manager deletes own; cascades to applications + leases via Prisma `onDelete: Cascade`.

Every action: `await auth()` → role check → zod-validate → Prisma → `revalidatePath()`.

---

## 8. Pages & flows

### Landing (`app/page.tsx`)
Hero + Features + Discover + CTA + Footer (five client components, animations via framer-motion `whileInView`). Hero search input geocodes via Mapbox API → routes to `/search?location=…&lat=…&lng=…`.

### Search (`app/search/page.tsx`)
- Server Component reads `searchParams` (location, beds, baths, propertyType, priceMin, priceMax, lat, lng).
- One `prisma.$queryRaw` returning `Property` rows joined to `Location`, lng/lat extracted.
- Renders `<Filters/>` (client), `<Map/>` (client, properties as prop), `<Listings/>` (client, properties + favorited set).
- Filter changes: `router.push("/search?<qs>")` → RSC re-runs, results re-stream. No client-side data store.
- Favorite toggle calls `toggleFavoriteAction` → `revalidatePath("/search")`.

### Property detail (`app/properties/[id]/page.tsx`)
- Server Component fetches the property (by id) joined to its Location.
- Public read (no auth required).
- If viewer is a tenant: show Favorite toggle and inline Apply form (`react-hook-form`, posts to `createApplicationAction`).
- If viewer is the owning manager: show Edit / Delete buttons that link to `/dashboard/properties/[id]/edit`.

### Tenant dashboard
- `favorites` — RSC: Prisma fetches user's favorites → `<PropertyCard/>` grid.
- `applications` — RSC: tenant's applications grouped by status; renders `<ApplicationCard/>`. Approved entries double as "residences" — no separate page.
- `settings` — RSC fetches current Tenant row → client `<SettingsForm/>` → `updateProfileAction`.

### Manager dashboard
- `properties` — RSC: properties where `managerId = session.user.managerId` → cards with Edit / Delete.
- `properties/new` — client form: `react-hook-form + zodResolver(propertySchema)`. `photoUrls` is a `useFieldArray` of `<Input type="url"/>` rows with `<img>` thumbnail previews. Submit → `createPropertyAction` → `redirect("/dashboard/properties")`.
- `properties/[id]/edit` — client form pre-populated with existing values → `updatePropertyAction`. Includes a Delete button → `deletePropertyAction`.
- `applications` — RSC: applications where `property.managerId = session.user.managerId`. Status filter via `?status=pending` URL param. Each card: approve/deny forms calling `updateApplicationStatusAction`.
- `settings` — same pattern as tenant settings.

### Application flow end-to-end
Tenant clicks Apply on `/properties/[id]` → fills inline form → `createApplicationAction` (status `Pending`) → manager sees it under `/dashboard/applications?status=pending` → Approve → `Lease` row created in same transaction → revalidate `/dashboard/applications` and `/dashboard/favorites`.

---

## 9. Image handling (URL-only, no uploads)

`propertySchema.photoUrls`:
```ts
photoUrls: z.array(z.string().url()).min(1).max(10)
```

UI in `properties/new/page.tsx` and `properties/[id]/edit/page.tsx`:
- Repeating field via `useFieldArray`: each row is an `<Input type="url"/>` + `<img>` thumbnail + remove button.
- "Add another image" button appends a row up to max=10.
- `<img onError>` swaps to `/placeholder.jpg` when the URL fails to load.
- Schema-side validation is enough — no server-side fetch to validate images. Trade-off: broken URLs render as placeholders.

The `<FormField/>` workhorse from `asset-download/client/components/FormField.tsx` is copied in but with its `file` variant deleted.

---

## 10. Filters & search-page mechanics

### Filter set (5 controls, down from 11+)
- `location` (text, geocoded via Mapbox on submit → sets `lat` + `lng`)
- `priceMin` / `priceMax` (range slider — one control)
- `beds` (select: any | 1 | 2 | 3 | 4+)
- `baths` (select: any | 1 | 2 | 3 | 4+)
- `propertyType` (select: any | Apartment | Villa | Townhouse | Cottage | Tinyhouse | Rooms)

Schema columns for amenities, highlights, square feet, etc., remain — they're just not surfaced in the filter UI.

### URL as state
Filter changes update the URL query string via `router.push`. The search page is an RSC keyed on `searchParams`; Next.js re-runs it on URL change. No filter Redux, no `useState`-mirrored-to-URL.

### Map
- `mapbox-gl` with default `streets-v12` style.
- Default `mapboxgl.Marker` for each result. No custom HTML markers.
- `useEffect` re-fits bounds when results change.

---

## 11. Deployment & environment

### Database: Neon ↔ Vercel native integration
1. Vercel dashboard → Storage → Create Database → Neon. Connect to project.
2. Auto-injected env vars: `DATABASE_URL` (pooled), `DATABASE_URL_UNPOOLED` (direct). Plus `POSTGRES_*` aliases (ignored).
3. `vercel env pull .env.local` for local dev.
4. Enable PostGIS once via `pgcli "$DATABASE_URL_UNPOOLED"` → `CREATE EXTENSION IF NOT EXISTS postgis;`. Use the direct URL — pooled connections can choke on DDL.

### Vercel config
- Auto-detected as Next.js. Add `postinstall: "prisma generate"` to `package.json` so the Prisma client regenerates on deploy.
- Preview deploys: each PR gets a Neon database branch automatically (writable copy-on-write fork of main).

### Environment variables
```
# auto-injected by Neon ↔ Vercel:
DATABASE_URL=...
DATABASE_URL_UNPOOLED=...

# manual:
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000              # local only
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.<token>
```

For non-production Vercel envs, `NEXTAUTH_URL` is computed from `VERCEL_URL` in `lib/auth.ts`.

### Source control: GitLab → GitHub mirror, Vercel deploys from GitHub
- Push target: GitLab (free push-mirror to GitHub).
- GitHub holds the auto-mirrored copy that Vercel watches.
- Setup happens later in the implementation plan, not at design time.

### Local dev
```bash
npm run dev
npx prisma studio
npx prisma migrate dev
npm run seed
pgcli "$DATABASE_URL_UNPOOLED"   # ad-hoc inspection
```

---

## 12. Asset-download bundle reuse

Files copied verbatim or near-verbatim from `asset-download/`:

| Source | Destination | Notes |
|---|---|---|
| `server/prisma/schema.prisma` | `prisma/schema.prisma` | Apply auth deltas (User model, userId rename) before first migration |
| `server/prisma/seed.ts` | `prisma/seed.ts` | Add User-creation step; switch cognitoId references to userId |
| `server/prisma/seedData/*.json` | `prisma/seedData/*.json` | Verbatim |
| `client/lib/schemas.ts` | `lib/schemas.ts` | Trim `propertySchema.photoUrls` from `File[]` to `string[].url()` |
| `client/lib/constants.ts` | `lib/constants.ts` | Verbatim |
| `client/lib/utils.ts` | `lib/utils.ts` | Verbatim |
| `client/types/index.d.ts` | (delete) | Use `@prisma/client` types directly |
| ~~`client/hooks/use-mobile.tsx`~~ | — | **SUPERSEDED** (shadcn dependency) |
| ~~`client/components/FormField.tsx`~~ | — | **SUPERSEDED** — build inputs as plain Tailwind elements per `DESIGN.md` |
| `client/app/globals.css` | `app/globals.css` | **Partially superseded** — drop the Amplify Authenticator overrides; the Tailwind base + token layer is now hand-authored against `DESIGN.md` / `DESIGN.json`, not copied verbatim |
| ~~`client/app/tailwind.config.ts`~~ | — | **SUPERSEDED** — Tailwind config is hand-authored to expose `DESIGN.json` tokens |
| `client/public/.` | `public/` | Verbatim |

Files **not** used:
- `client/state/api.ts`, `client/state/index.ts`, `client/state/redux.tsx` — no Redux.

---

## 13. Critical gotchas (carried from the source guide)

1. ~~**React 19 + shadcn:** install with `--legacy-peer-deps`.~~ **SUPERSEDED** — shadcn is no longer used; see top-of-doc banner.
2. **PostGIS isn't first-class in Prisma.** `Unsupported("geography(Point, 4326)")` for the column; raw SQL for any write that touches it. `ST_X` / `ST_Y` for reads.
3. **`NEXT_PUBLIC_*` is the only way to expose env vars to client code.** Forgetting the prefix is the #1 cause of "Mapbox token undefined" errors.
4. **Server-side filtering pattern:** never accept SQL fragments from query params. Compose `` Prisma.sql`...` `` template literals which auto-parameterize values.
5. **Pooled vs direct URL:** runtime queries use `DATABASE_URL` (pooled). Migrations and DDL (incl. `CREATE EXTENSION`) use `DATABASE_URL_UNPOOLED`. Mixing them can cause "prepared statements not supported" or "cannot do DDL in transaction" errors.
6. ~~**`<FormField/>` references undefined Tailwind classes…**~~ **SUPERSEDED** — `<FormField/>` is not used; build inputs as plain Tailwind elements per `DESIGN.md`.

---

## 14. Implementation phases (each independently testable)

1. **Project bootstrap.** `create-next-app@15` (Next pinned to 15.5.x) → install deps → copy only what's still relevant from `asset-download/` (`public/`, the trimmed `lib/schemas.ts` / `lib/constants.ts` / `lib/utils.ts`). **Do not** run `shadcn init` and **do not** copy the bundled `tailwind.config.ts` or `globals.css` verbatim — Tailwind config is hand-authored to expose `DESIGN.json` tokens. App boots with default landing route still rendering.
2. **Database setup.** Neon ↔ Vercel integration → `vercel env pull` → adapt `schema.prisma` (User model, userId rename) → `prisma migrate dev` → enable PostGIS via pgcli → adapt seed → `npm run seed`. Verify in `prisma studio`.
3. **Auth foundation.** Auth.js v5 install + config in `lib/auth.ts` → Credentials provider → JWT callbacks → `signIn` / `signUp` server actions in `lib/actions.ts` → `/signin` and `/signup` pages → middleware. Smoke: sign up as tenant, see session.
4. **Dashboard shell.** `app/dashboard/layout.tsx` + role-aware sidebar + settings page (read + update) end-to-end. First full Server Component → Server Action loop.
5. **Property CRUD (manager).** `dashboard/properties/page.tsx` (list), `new/page.tsx` (create with Nominatim geocoding + URL image inputs), `[id]/edit/page.tsx` (update + delete). Smoke: create a property, see it in the list, edit, delete.
6. **Property detail.** `app/properties/[id]/page.tsx` — public read, includes images + map preview. No auth required.
7. **Search page.** `app/search/page.tsx` Server Component with `prisma.$queryRaw` + PostGIS radius filter. Filter UI (5 controls) writes to URL params. Map renders default markers.
8. **Favorites.** `toggleFavoriteAction` + `dashboard/favorites/page.tsx`. Smoke: tenant favorites a property, sees it in the favorites list, unfavorites it.
9. **Applications.** Inline Apply form on property detail → `createApplicationAction`. Tenant `dashboard/applications/page.tsx` (own list). Manager `dashboard/applications/page.tsx` (incoming, status filter, approve/deny). On approve, Lease row created.
10. **Landing page.** Hero + Features + Discover + CTA + Footer with framer-motion `whileInView`. Hero search geocodes via Mapbox → routes to `/search`.
11. ~~**Polish.**~~ **SUPERSEDED as a discrete phase.** Visual quality is enforced continuously from Phase 4 onward via `impeccable:impeccable` against `PRODUCT.md` / `DESIGN.md` / `DESIGN.json`. There is no end-of-project polish pass.
12. **Deploy.** Create GitLab repo + GitHub repo, configure GitLab push-mirror to GitHub, connect Vercel to GitHub, `vercel --prod`. End-to-end smoke: sign up, create property, search, favorite, apply, approve, see lease.

Each phase is independently testable. Estimated effort range: 1–6 hours per phase.

---

## 15. Open questions / deferred decisions

- None at design time. (Image upload could be revisited in a future phase with Vercel Blob if the URL-only UX feels too clunky.)
