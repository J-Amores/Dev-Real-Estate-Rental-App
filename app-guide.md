# Building an Enterprise Next.js Real Estate Rental App

> **Source:** [YouTube — `X1zCAPLvMtw`](https://youtu.be/X1zCAPLvMtw) — *"Build an Enterprise Nextjs Rental App | AWS, EC2, Cognito, Shadcn, RDS, S3, Node, React"* by **EdRoh**
> **Length:** 12h 19m 34s — 25 chapters
> **Transcript source:** YouTube auto-captions (frames not extracted; the video is a code-typing tutorial where sparse frames would be useless — the transcript carries the content).
> **Reference repo:** `https://github.com/ed-roh/real-estate-prod`
> **EC2 setup notes (author's):** `https://github.com/ed-roh/real-estate-prod/blob/master/server/aws-ec2-instructions.md`

This document is a structured guide for an AI coding assistant (e.g. Claude Code) to recreate the app end-to-end. It is split into **Frontend**, **Backend**, and **AWS Deployment** with the chronological build order from the video preserved, and concrete commands, file paths, and gotchas extracted.

---

## 0. App at a glance

A two-sided real-estate rental marketplace:

- **Tenants** browse a map-based search of properties, favorite listings, submit applications, view their leases/residences.
- **Managers** create properties, manage their portfolio, approve/deny applications, view tenants.
- Auth via **AWS Cognito** with a custom `role` attribute (`tenant` | `manager`).
- Geospatial filtering via **PostgreSQL + PostGIS**.
- Map UI via **Mapbox GL** (custom style); geocoding via **Mapbox Geocoding API** (and Nominatim mentioned as alternative).
- Server-side filtering/searching/sorting for the property list (Enterprise pattern; not client-side).

### Top-level decisions worth noting

- **Separate `client/` (Next.js) and `server/` (Node/Express) folders** — *not* a Next.js full-stack app. The author argues this is what real Enterprise codebases look like; it sidesteps Next.js mono-repo complications when the API grows.
- **Redux Toolkit + RTK Query** over Zustand — chosen for Enterprise scale; RTK Query is also used as the data-fetching layer (replacing react-query).
- **Prisma** for ORM (note: the author calls out Prisma's pain points at scale and says future videos will use Drizzle, but this project uses Prisma).
- **Manager and Tenant are separate Postgres tables** that mirror the Cognito user (linked by `cognitoId`) — not a single User table. Cognito holds credentials; Postgres holds domain data.

---

## 1. Tech stack

### Frontend (`client/`)

| Concern | Library |
|---|---|
| Framework | **Next.js 15 (App Router)** with TypeScript, Tailwind, ESLint |
| UI primitives | **shadcn/ui** (used with `--legacy-peer-deps` for React 19) |
| State | **@reduxjs/toolkit** + `react-redux` + **RTK Query** |
| Forms | **react-hook-form** + **zod** + `@hookform/resolvers` |
| Auth UI | **aws-amplify** + **@aws-amplify/ui-react** (`Authenticator` component) |
| Maps | **mapbox-gl** |
| Animation | **framer-motion** |
| Icons | **lucide-react** |
| Image upload | **filepond** + `filepond-plugin-image-exif-orientation` + `filepond-plugin-image-preview` + `react-filepond` |
| Utils | **lodash**, **date-fns** |
| Dev types | `@types/node`, `@types/uuid` |

### Backend (`server/`)

| Concern | Library |
|---|---|
| Runtime | **Node.js + TypeScript**, compiled to `dist/` via `tsc` |
| Framework | **Express** |
| ORM / DB | **Prisma** + `@prisma/client` against **PostgreSQL + PostGIS** |
| Middleware | `body-parser`, `cors`, `helmet`, `morgan` |
| Auth (server-side) | `jsonwebtoken` (JWT middleware) |
| Files | **multer** (uploads), **uuid** |
| HTTP | **axios** |
| Geo | `@terraformer/wkt` (Well-Known-Text → GeoJSON) |
| AWS | `@aws-sdk/client-s3`, `@aws-sdk/lib-storage` |
| Env | `dotenv` |
| Dev | `nodemon`, `ts-node`, `concurrently`, `rimraf`, `shx` |

### AWS / Infra

- **Cognito** — auth (always free up to 10k MAU)
- **VPC + subnets + IGW + NAT/route tables** — networking
- **EC2** (Amazon Linux, t2/t3.micro) — runs Express via **pm2**
- **RDS PostgreSQL** (free tier, Multi-AZ) — production DB; PostGIS extension required
- **S3** — public bucket for property images
- **API Gateway (REST)** — fronts EC2, applies a **Cognito authorizer**, terminates HTTPS
- **Amplify Hosting** — Next.js production hosting (mono-repo root: `client`)

### Local tooling

- Node + npm + npx
- VS Code (extensions: ES7+ React Redux, Prettier, Tailwind CSS IntelliSense, Prisma)
- Browser extensions: Redux DevTools, Pesticide
- PostgreSQL 16 + PostGIS spatial extension (via Stack Builder on Mac/Windows)
- pgAdmin
- Postman (or curl) for API testing
- AWS CLI

---

## 2. Project structure

```
real-estate/
├── client/                    # Next.js 15 App Router
│   ├── public/                # Replace from author's asset zip (logos, images)
│   ├── src/
│   │   ├── app/
│   │   │   ├── providers.tsx           # "use client"; wraps StoreProvider + Authenticator
│   │   │   ├── layout.tsx              # imports <Providers>
│   │   │   ├── (auth)/
│   │   │   │   ├── authProvider.tsx    # Amplify.configure + customized <Authenticator>
│   │   │   │   ├── signin/page.tsx
│   │   │   │   └── signup/page.tsx
│   │   │   ├── (nondashboard)/
│   │   │   │   ├── layout.tsx          # navbar + landing
│   │   │   │   ├── page.tsx            # landing (Hero + features + ...)
│   │   │   │   └── search/
│   │   │   │       ├── page.tsx        # filters + map + listings panel
│   │   │   │       ├── FiltersBar.tsx
│   │   │   │       ├── FiltersFull.tsx
│   │   │   │       ├── Map.tsx         # mapbox-gl
│   │   │   │       └── Listings.tsx
│   │   │   └── (dashboard)/
│   │   │       ├── layout.tsx          # role-aware sidebar (shadcn)
│   │   │       ├── tenants/
│   │   │       │   ├── favorites/page.tsx
│   │   │       │   ├── residences/page.tsx
│   │   │       │   ├── applications/page.tsx
│   │   │       │   └── settings/page.tsx
│   │   │       └── managers/
│   │   │           ├── properties/page.tsx
│   │   │           ├── newproperty/page.tsx
│   │   │           ├── applications/page.tsx
│   │   │           └── settings/page.tsx
│   │   ├── components/        # shadcn/ui primitives + reusable Header, Loading, Sidebar, Card
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   ├── constants.ts
│   │   │   ├── schemas.ts     # zod schemas (PropertyFormSchema, ApplicationFormSchema, ...)
│   │   │   └── utils.ts       # cn(), cleanParams(), formatPriceValue(), ...
│   │   ├── state/
│   │   │   ├── index.ts       # global slice (filters, isFiltersFullOpen, viewMode)
│   │   │   ├── api.ts         # RTK Query: createApi + endpoints
│   │   │   └── redux.tsx      # StoreProvider, useAppDispatch, useAppSelector
│   │   └── types/
│   │       ├── index.d.ts
│   │       └── prismaTypes.d.ts        # auto-copied from server on `prisma:generate`
│   ├── components.json        # shadcn config
│   ├── tailwind.config.js     # custom theme (use the one from author's asset zip)
│   ├── next.config.ts
│   └── .env                   # NEXT_PUBLIC_* keys (see §4)
│
└── server/
    ├── prisma/
    │   ├── schema.prisma      # see §6.1
    │   ├── seed.ts            # ts-node entry; clears + seeds + raw-SQL POSTGIS locations
    │   ├── seedData/*.json    # mock data per table
    │   └── migrations/
    ├── src/
    │   ├── index.ts           # express bootstrap
    │   ├── middleware/
    │   │   └── authMiddleware.ts        # decodes Cognito JWT, role-gates routes
    │   ├── routes/
    │   │   ├── tenantRoutes.ts
    │   │   ├── managerRoutes.ts
    │   │   ├── propertyRoutes.ts
    │   │   ├── leaseRoutes.ts
    │   │   └── applicationRoutes.ts
    │   └── controllers/
    │       ├── tenantControllers.ts
    │       ├── managerControllers.ts
    │       ├── propertyControllers.ts
    │       ├── leaseControllers.ts
    │       └── applicationControllers.ts
    ├── package.json
    ├── tsconfig.json
    └── .env                   # PORT, DATABASE_URL, S3_BUCKET_NAME, AWS_REGION, ...
```

> **The asset bundle is already on disk at `./asset-download/`** — see §11 for a full inventory. It contains the author's starter scaffolds: `globals.css`, `tailwind.config.ts`, `tsconfig.json`, full `lib/` (zod schemas, constants, utils), starter `state/` (empty Redux + RTK Query stubs that the video fills in), global `types/index.d.ts`, `components/FormField.tsx`, `hooks/use-mobile.tsx`, `public/` landing-page images, the entire `prisma/` folder (`schema.prisma` with PostGIS extension declared, `seed.ts`, and 7 seed JSONs). Copy these into the new `client/` and `server/` projects rather than recreating from scratch.

---

## 3. Build order (chapter map)

Use this as a phased plan. Each phase corresponds to a chapter in the video.

| # | Chapter | What gets built | Section below |
|---|---|---|---|
| 0 | Intro Demo (00:00–11:15) | Walkthrough of the finished app | — |
| 1 | Installations (11:15–12:25) | Node, npx, VS Code | §5.1 |
| 2 | Frontend Installations and Setup (12:25–27:39) | `client/` scaffolding, Redux providers | §5.2 |
| 3 | Landing Page (27:39–1:29:07) | Hero, features, footer (frontend-only) | §5.3 |
| 4 | Backend Installations and Setup (1:29:07–2:11:43) | DB, Prisma, Express, seed | §6 |
| 5 | AWS Cognito Auth (2:11:43–4:27:52) | Cognito user pool + Amplify auth + DB user creation | §7 |
| 6 | Settings Page (4:27:52–4:59:07) | First CRUD endpoint pattern (PUT tenant/manager) | §5.4 |
| 7 | Properties, Leases, Applications Backend (4:59:07–6:22:15) | Server-side filter/sort + PostGIS query + uploads | §6.3 |
| 8 | Search Filters (6:22:15–7:16:58) | Filter UI + URL-synced query params + Redux filter slice | §5.5 |
| 9 | Mapbox (7:16:58–7:40:03) | Custom style + map markers wired to Redux filters | §5.6 |
| 10 | Listings Pages (7:40:03–8:53:08) | Listings panel + favorite/unfavorite (RTK Query mutations + invalidation) | §5.7 |
| 11 | Properties Frontend (8:53:08–10:03:30) | Tenant favorites/residences, manager properties/new-property | §5.8 |
| 12 | Applications Frontend (10:03:30–10:38:14) | Apply → approve/deny flow | §5.9 |
| 13 | Cleanup (10:38:14–10:59:06) | Landing search bar (Mapbox geocoding) + final wiring | §5.10 |
| 14–24 | AWS deploy (10:59:06–end) | Budget, VPC, EC2, RDS, Amplify, API Gateway, S3 | §8 |

---

## 4. Environment variables (canonical)

### `client/.env`

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001          # backend URL (locally); swap to API Gateway URL in prod
NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID=us-east-2_xxxxxxxx
NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.xxx
```

### `server/.env`

```
PORT=3001
DATABASE_URL="postgresql://postgres:1234@localhost:5432/realestate2?schema=public"
# Production (RDS):
# DATABASE_URL="postgresql://postgres:<rds-master-password>@<rds-endpoint>:5432/realestate"

S3_BUCKET_NAME=re-s3-images
AWS_REGION=us-east-2
# AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY only needed if running outside an EC2 with an IAM role
```

> **Never** commit either `.env`. The video pushes only the source tree to GitHub and recreates env on the EC2 box via `echo "PORT=80" > .env`.

---

## 5. Frontend build

### 5.1 Install Node.js + tooling

```bash
# Mac (Homebrew):
brew install node
# or use the official installer from nodejs.org for Windows
npm install -g npx
```

### 5.2 Bootstrap the Next.js client

```bash
npx create-next-app@latest real-estate
# Prompts: TypeScript yes, ESLint yes, Tailwind yes, src/ yes,
#          App Router yes, Turbopack no, import alias no (defaults)
mv real-estate client      # the root will hold both client/ and server/
cd client
```

Install runtime deps:

```bash
npm i lucide-react dotenv date-fns react-filepond filepond \
      filepond-plugin-image-exif-orientation filepond-plugin-image-preview \
      framer-motion mapbox-gl lodash react-hook-form zod @hookform/resolvers
npm i -D @types/node @types/uuid
```

Initialize **shadcn/ui** (note `--legacy-peer-deps` is required because of React 19 compat with shadcn at the time of recording):

```bash
npx shadcn@latest init                   # answer y; --use-legacy-peer-deps if asked
npx shadcn@latest add avatar badge button card checkbox command dialog \
    dropdown-menu form input label navigation-menu radio-group select \
    separator sheet sidebar skeleton slider sonner switch table tabs textarea tooltip
```

Install Redux:

```bash
npm i react-redux @reduxjs/toolkit --legacy-peer-deps
```

Install Amplify (auth client):

```bash
npm i aws-amplify @aws-amplify/ui-react --legacy-peer-deps
```

#### Redux + Provider pattern (`src/state/`)

Three files implement the entire pattern (recreate from scratch — no `lib/store.ts` magic):

- `state/index.ts` — `createSlice` for global UI state (filters, `isFiltersFullOpen`, viewMode, search query).
- `state/api.ts` — `createApi` with `fetchBaseQuery({ baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL })`. **Custom `prepareHeaders`** must call `Auth.fetchAuthSession()` and attach `Authorization: Bearer <idToken>` so API Gateway's Cognito authorizer accepts the request. Endpoints are added incrementally as the app is built (`getAuthUser`, `updateTenantSettings`, `updateManagerSettings`, `getProperties`, `getProperty`, `createProperty`, `getTenant`, `getCurrentResidences`, `addFavoriteProperty`, `removeFavoriteProperty`, `getApplications`, `createApplication`, `updateApplicationStatus`, `getLeases`, `getPayments`).
- `state/redux.tsx` — `StoreProvider`, typed `useAppDispatch`, `useAppSelector` (single re-exported file Redux says you can copy-paste forever).

`src/app/providers.tsx`:

```tsx
"use client";
import StoreProvider from "@/state/redux";
import Auth from "./(auth)/authProvider";

const Providers = ({ children }: { children: React.ReactNode }) => (
  <StoreProvider>
    <Auth>{children}</Auth>
  </StoreProvider>
);
export default Providers;
```

Then wrap `{children}` in `app/layout.tsx` with `<Providers>{children}</Providers>`.

### 5.3 Landing page (`(nondashboard)/page.tsx`)

Hero + features + discover + call-to-action + footer. Sections animate in with framer-motion (`initial / whileInView / viewport`). Built from custom components in `(nondashboard)/landing/`:

- `HeroSection` (with the search input that geocodes via Mapbox; see §5.10)
- `FeaturesSection`, `DiscoverSection`, `CallToActionSection`, `FooterSection`

### 5.4 Settings page (auth-aware) — *the canonical CRUD pattern*

This is where the full client→server flow first lights up. Use it as the template for every other endpoint:

1. **Backend route** (`PUT /tenants/:cognitoId` or `/managers/:cognitoId`):
   ```ts
   router.put("/:cognitoId", updateTenant);
   ```
2. **Backend controller** uses `prisma.tenant.update({ where: { cognitoId }, data: req.body })` and returns the updated row.
3. **Frontend RTK endpoint** (mutation, with optimistic toast via `sonner`):
   ```ts
   updateTenantSettings: build.mutation<Tenant, { cognitoId: string } & Partial<Tenant>>({
     query: ({ cognitoId, ...updated }) => ({
       url: `tenants/${cognitoId}`,
       method: "PUT",
       body: updated,
     }),
     invalidatesTags: (result) => [{ type: "Tenants", id: result?.id }],
   })
   ```
4. **Page** renders a shadcn `<Form>` driven by `react-hook-form` + `zodResolver(SettingsFormSchema)` and submits with the mutation.

> **Convention:** RTK Query `query` for GET, `mutation` for PUT/POST/DELETE. Mutations use `invalidatesTags`; queries use `providesTags`. Tag types in this app: `"Managers" | "Tenants" | "Properties" | "PropertyDetails" | "Leases" | "Payments" | "Applications"`.

### 5.5 Search filters

- Filters live in Redux (`state/index.ts → initialState.filters`), keyed by `location, beds, baths, propertyType, amenities[], availableFrom, priceRange[min,max]|null, squareFeet[min,max]|null, coordinates[lng,lat]`.
- URL query params are the source of truth on first load: read with `useSearchParams()` from `next/navigation`, hydrate Redux via `setFilters`, and on every filter change call `router.push(\`/search?${params.toString()}\`)` so the URL reflects state and the listing query refetches.
- Two UI surfaces: top **`FiltersBar`** (compact) and slide-over **`FiltersFull`** (everything, gated by `isFiltersFullOpen`).
- A helper `cleanParams(obj)` (in `lib/utils.ts`) drops `undefined` / `"any"` / empty arrays before hitting the API.

### 5.6 Mapbox

1. Sign up at mapbox.com, create a custom style in **Studio → Style Editor** (the author calls his "minimo": desaturated B/W with light-blue water). Copy the style URL (`mapbox://styles/<account>/<style-id>`).
2. Copy the **public access token** → `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`.
3. `Map.tsx` (in `(nondashboard)/search/`):
   - `mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!`
   - On mount: `new mapboxgl.Map({ container, style: "<your-style>", center: [filters.coordinates[0], filters.coordinates[1]], zoom: 9 })`
   - For each property in the listings query result, build a custom HTML marker (`createPropertyMarker`) and `new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(map)`.
   - `useEffect` re-fits bounds when results change.
4. The landing-page hero search uses **Mapbox's geocoding API** directly (not a wrapped client). See §5.10.

### 5.7 Listings + favorite/unfavorite

- **API surface** (added on the backend in §6.3):
  - `POST /tenants/:cognitoId/favorites/:propertyId` → returns updated tenant
  - `DELETE /tenants/:cognitoId/favorites/:propertyId` → returns updated tenant
- **RTK mutations** invalidate **both** `Tenants` and `Properties` so the favorite heart-icon re-renders correctly:
  ```ts
  invalidatesTags: (result) => [
    { type: "Tenants", id: result?.id },
    { type: "Properties", id: "LIST" },
  ],
  ```

### 5.8 Tenant + Manager dashboards (`(dashboard)/`)

Both share a sidebar (shadcn `sidebar` component) whose items vary by role. The role comes from `useGetAuthUserQuery()` → `userRole` (decoded from the Cognito JWT custom attribute `custom:role`).

- **Tenant pages:** Favorites, Residences (active leases), Applications, Settings.
- **Manager pages:** Properties (cards of own properties), New Property (the big form — react-hook-form + zod + filepond image upload, sent as `multipart/form-data`), Applications (with approve/deny), Settings.

Reusable components introduced here: `Header`, `Loading` (uses `Loader2` from `lucide-react` with `animate-spin`), `Card`, `ApplicationCard`.

### 5.9 Applications flow

- Tenant submits an application → `POST /applications` (status defaults to `Pending`).
- Manager opens `/managers/applications`, switches between tabs `all | pending | approved | denied` (a local `useState`), each tab filters the list returned by `getApplications`.
- Approve/deny → `PUT /applications/:id/status` with `{ status }`. When status becomes `Approved`, the controller **also creates a Lease row** linking property+tenant — the response shape includes the new lease and RTK invalidates `["Applications", "Leases"]`.

### 5.10 Landing-page geocoded search (Cleanup chapter)

In `HeroSection`:

```ts
const handleLocationSearch = async () => {
  const trimmedQuery = searchQuery.trim();
  if (!trimmedQuery) return;
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmedQuery)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}&fuzzyMatch=true`
    );
    const data = await response.json();
    if (data.features?.length > 0) {
      const [lng, lat] = data.features[0].center;
      dispatch(setFilters({ location: trimmedQuery, coordinates: [lng, lat] }));
      const params = new URLSearchParams({
        location: trimmedQuery,
        lat: lat.toString(),
        lng: lng.toString(),
      });
      router.push(`/search?${params.toString()}`);
    }
  } catch (error) {
    console.error("error searching location:", error);
  }
};
```

---

## 6. Backend build

### 6.1 Local Postgres + PostGIS

1. Install **PostgreSQL 16** from postgresql.org. Set superuser to `postgres`, password to something memorable (the video uses `1234`), port `5432`. **Write these down.**
2. After install, run **Stack Builder** and install the **PostGIS spatial extension** (Mac/Windows). Linux: `apt install postgis` or distro equivalent.
3. Install **pgAdmin 4**.
4. Create a database named `realestate` (or `realestate2` to avoid conflicts).
5. **`CREATE EXTENSION` is automatic** — `asset-download/server/prisma/schema.prisma` declares:
   ```prisma
   generator client {
     provider        = "prisma-client-js"
     previewFeatures = ["postgresqlExtensions"]
   }
   datasource db {
     provider   = "postgresql"
     url        = env("DATABASE_URL")
     extensions = [postgis]
   }
   ```
   When you run `npx prisma migrate dev --name init`, Prisma issues `CREATE EXTENSION IF NOT EXISTS "postgis"` itself. You only need a manual `CREATE EXTENSION` on **RDS** (§8.4) where the schema-driven path can fail without superuser privileges. If you want to verify locally, run in pgAdmin's Query Tool: `SELECT PostGIS_Version();` after migrating.

### 6.2 Bootstrap the server

```bash
mkdir server && cd server
npm init -y

npm i express body-parser cors dotenv helmet morgan jsonwebtoken multer uuid \
      axios @terraformer/wkt @aws-sdk/client-s3 @aws-sdk/lib-storage

npm i -D rimraf concurrently nodemon shx ts-node typescript \
        @types/express @types/cors @types/morgan @types/node \
        @types/jsonwebtoken @types/multer @types/terraformer__wkt @types/uuid

npx tsc --init
```

Edit `tsconfig.json`:

```jsonc
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "resolveJsonModule": true,
    "outDir": "./dist",
    /* keep the rest of the defaults */
  },
  "include": ["src/**/*", "src/**/*.json", "prisma/**/*"]
}
```

`package.json` scripts (the magic that ties dev / build / Prisma type sharing together):

```json
{
  "scripts": {
    "build": "rimraf dist && npx tsc",
    "start": "npm run build && node dist/index.js",
    "dev": "npm run build && concurrently \"npx tsc -w\" \"nodemon --exec ts-node src/index.ts\"",
    "seed": "ts-node prisma/seed.ts",
    "prisma:generate": "prisma generate",
    "postprisma:generate": "shx cp node_modules/.prisma/client/index.d.ts ../client/src/types/prismaTypes.d.ts"
  }
}
```

> The `postprisma:generate` script auto-copies Prisma's generated types into the client's `src/types/` so the front-end is type-synced with the schema. Whenever the Prisma schema changes: `npm run prisma:generate` on the server.

`src/index.ts` skeleton:

```ts
import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

/* ROUTE IMPORTS */
import tenantRoutes from "./routes/tenantRoutes";
import managerRoutes from "./routes/managerRoutes";
import propertyRoutes from "./routes/propertyRoutes";
import leaseRoutes from "./routes/leaseRoutes";
import applicationRoutes from "./routes/applicationRoutes";
import { authMiddleware } from "./middleware/authMiddleware";

/* CONFIGURATIONS */
dotenv.config();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

/* ROUTES */
app.get("/", (_req, res) => res.send("This is home route"));
app.use("/applications", applicationRoutes);
app.use("/properties", propertyRoutes);
app.use("/leases", leaseRoutes);
app.use("/tenants", authMiddleware(["tenant"]), tenantRoutes);
app.use("/managers", authMiddleware(["manager"]), managerRoutes);

/* SERVER */
const port = Number(process.env.PORT) || 3002;
app.listen(port, () => console.log(`Server running on port ${port}`));
```

### 6.3 Data model (`prisma/schema.prisma`)

> **Use the schema verbatim from `asset-download/server/prisma/schema.prisma`** — copy that file (and the whole `prisma/` directory) into `server/`. The summary below describes what's in it; do not re-derive the field list.

Core models in the schema:

- **Property** — `id (Int @id @default(autoincrement()))`, `name`, `description`, `pricePerMonth Float`, `securityDeposit Float`, `applicationFee Float`, `photoUrls String[]`, `amenities Amenity[]`, `highlights Highlight[]`, `isPetsAllowed Boolean @default(false)`, `isParkingIncluded Boolean @default(false)`, `beds Int`, `baths Float`, `squareFeet Int`, `propertyType PropertyType`, `postedDate DateTime @default(now())`, `averageRating Float? @default(0)`, `numberOfReviews Int? @default(0)`, `locationId Int` (NOT unique — a Location can have many Properties? In practice each property gets its own Location row, but the schema does not enforce it), `managerCognitoId String`. Relations: `location`, `manager`, `leases`, `applications`, `favoritedBy Tenant[] @relation("TenantFavorites")`, `tenants Tenant[] @relation("TenantProperties")`.
- **Manager** — `id`, `cognitoId String @unique`, `name`, `email`, `phoneNumber`, `managedProperties Property[]`.
- **Tenant** — same shape as Manager + `properties Property[] @relation("TenantProperties")`, `favorites Property[] @relation("TenantFavorites")`, `applications Application[]`, `leases Lease[]`.
- **Location** — `id`, `address`, `city`, `state`, `country`, `postalCode`, `coordinates Unsupported("geography(Point, 4326)")`, `properties Property[]`. The `Unsupported` is required because Prisma has no first-class type for PostGIS `geography`.
- **Application** — `id`, `applicationDate DateTime`, `status ApplicationStatus`, `propertyId`, `tenantCognitoId`, `name`, `email`, `phoneNumber`, `message String?`, `leaseId Int? @unique`, relations to Property, Tenant, Lease?.
- **Lease** — `id`, `startDate`, `endDate`, `rent Float`, `deposit Float`, `propertyId`, `tenantCognitoId`, relations to Property, Tenant, Application?, Payment[].
- **Payment** — `id`, `amountDue`, `amountPaid`, `dueDate`, `paymentDate`, `paymentStatus PaymentStatus`, `leaseId`.

Concrete enum values (verbatim from schema):

- **`Highlight`**: `HighSpeedInternetAccess, WasherDryer, AirConditioning, Heating, SmokeFree, CableReady, SatelliteTV, DoubleVanities, TubShower, Intercom, SprinklerSystem, RecentlyRenovated, CloseToTransit, GreatView, QuietNeighborhood`
- **`Amenity`**: `WasherDryer, AirConditioning, Dishwasher, HighSpeedInternet, HardwoodFloors, WalkInClosets, Microwave, Refrigerator, Pool, Gym, Parking, PetsAllowed, WiFi`
- **`PropertyType`**: `Rooms, Tinyhouse, Apartment, Villa, Townhouse, Cottage`
- **`ApplicationStatus`**: `Pending, Denied, Approved`
- **`PaymentStatus`**: `Pending, Paid, PartiallyPaid, Overdue`

After copying the schema:

```bash
npx prisma migrate dev --name init    # creates Postgres schema + enables postgis extension
npm run prisma:generate                # generate client + copy types to client/src/types
npm run seed                           # populate dev data
```

> **PostGIS gotcha for inserts:** Prisma's typed client cannot write a `geography` column directly. The bundled `prisma/seed.ts` uses **raw SQL** with WKT (Well-Known Text):
> ```ts
> await prisma.$executeRaw`
>   INSERT INTO "Location" ("id","country","city","state","address","postalCode","coordinates")
>   VALUES (${id}, ${country}, ${city}, ${state}, ${address}, ${postalCode},
>           ST_GeomFromText(${coordinates}, 4326));
> `;
> // coordinates string format: "POINT(<lng> <lat>)"
> ```
> Replicate this exact pattern in `createProperty` after geocoding the address. For reads, cast to geometry then extract: `ST_X(coordinates::geometry) AS lng, ST_Y(coordinates::geometry) AS lat`.

> **Seed file behavior:** `seed.ts` deletes data in reverse-dependency order, then seeds in this order: `location → manager → property → tenant → lease → application → payment`. After each table it resets the auto-increment sequence with `setval(pg_get_serial_sequence(...), max(id)+1, false)`. The 70 seed rows live in `asset-download/server/prisma/seedData/*.json` (10 locations, 10 managers, 10 properties, 15 tenants, 15 leases, 15 applications, 15 payments). **Property `photoUrls` in the seed point at fake `https://example.com/...` URLs** — replace with real S3 URLs (or local placeholder paths) before relying on image rendering.

### 6.4 Controllers — server-side filter/sort pattern

`getProperties` is the most complex query. It accepts query params `favoriteIds, priceMin, priceMax, beds, baths, propertyType, squareFeetMin, squareFeetMax, amenities, availableFrom, latitude, longitude` and builds a **raw SQL query** because of PostGIS. Sketch:

```ts
const whereConditions: Prisma.Sql[] = [];
if (priceMin) whereConditions.push(Prisma.sql`p."pricePerMonth" >= ${priceMin}`);
if (latitude && longitude) {
  const radiusInKm = 1000;
  whereConditions.push(Prisma.sql`
    ST_DWithin(
      l.coordinates::geography,
      ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
      ${radiusInKm * 1000}
    )
  `);
}
const completeQuery = Prisma.sql`
  SELECT p.*, json_build_object(
    'id', l.id, 'address', l.address, 'city', l.city, 'state', l.state,
    'country', l.country, 'postalCode', l."postalCode",
    'coordinates', json_build_object(
      'longitude', ST_X(l.coordinates::geometry),
      'latitude',  ST_Y(l.coordinates::geometry)
    )
  ) AS location
  FROM "Property" p JOIN "Location" l ON p."locationId" = l.id
  ${whereConditions.length ? Prisma.sql`WHERE ${Prisma.join(whereConditions, " AND ")}` : Prisma.empty}
`;
const properties = await prisma.$queryRaw(completeQuery);
```

Other endpoints (`createProperty`, `getProperty`, `getCurrentResidences`, `getApplications`, `updateApplicationStatus`, `addFavoriteProperty`, etc.) use ordinary Prisma client methods.

`createProperty` accepts `multipart/form-data` — `multer.memoryStorage()` gives `req.files`, then each file goes to S3 via `@aws-sdk/lib-storage`'s `Upload` helper:

```ts
const uploadPromises = files.map(async (file) => {
  const uploadParams = {
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: `properties/${Date.now()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
  };
  const result = await new Upload({ client: s3Client, params: uploadParams }).done();
  return result.Location;
});
const photoUrls = await Promise.all(uploadPromises);
```

Geocode the address (city/state/country) at create time using **Nominatim** (OpenStreetMap, free) instead of Mapbox so you don't burn Mapbox quota:

```ts
const geocodingUrl = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
  street: address,
  city, country, postalcode: postalCode, format: "json", limit: "1",
}).toString()}`;
const [{ lat, lon }] = await axios.get(geocodingUrl, {
  headers: { "User-Agent": "RealEstateApp (you@example.com)" },
}).then(r => r.data);
```

### 6.5 Auth middleware

`src/middleware/authMiddleware.ts` decodes the JWT from `Authorization: Bearer <token>`:

```ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface DecodedToken extends jwt.JwtPayload {
  sub: string;
  "custom:role"?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string };
    }
  }
}

export const authMiddleware = (allowedRoles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    try {
      const decoded = jwt.decode(token) as DecodedToken;
      const userRole = decoded["custom:role"] || "";
      req.user = { id: decoded.sub, role: userRole.toLowerCase() };
      if (!allowedRoles.includes(userRole.toLowerCase())) {
        return res.status(403).json({ message: "Forbidden" });
      }
      next();
    } catch (err) {
      return res.status(400).json({ message: "Invalid token" });
    }
  };
```

> **Note:** the video uses `jwt.decode` (not `jwt.verify`) because **API Gateway's Cognito authorizer already verifies the signature** before forwarding to EC2. If you serve EC2 directly without API Gateway, switch to `jwt.verify` with the JWKS from `https://cognito-idp.<region>.amazonaws.com/<userPoolId>/.well-known/jwks.json`.

---

## 7. AWS Cognito (auth)

Performed *during* development, not at the end — the rest of the app depends on it.

### 7.1 Create the user pool (AWS Console → Cognito → Create user pool)

- App type: **SPA**
- Sign-in identifiers: **Email + Username**
- Required signup attributes: **Email**
- Custom attribute: add **`role`** (string, mutable). It'll be referenced as `custom:role`.
- Name the pool e.g. `re-cognito-user-pool`; the auto-created App Client e.g. `re-cognito-client`.
- Copy two values into `client/.env`:
  - `NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID`
  - `NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID`

### 7.2 Frontend Amplify wiring (`app/(auth)/authProvider.tsx`)

```tsx
"use client";
import { Amplify } from "aws-amplify";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID!,
      userPoolClientId: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID!,
    },
  },
});

const formFields = {
  signIn: {
    username: { placeholder: "Enter your email", label: "Email", isRequired: true },
    password: { placeholder: "Enter your password", label: "Password", isRequired: true },
  },
  signUp: {
    username:  { order: 1, placeholder: "Choose a username",     label: "Username", isRequired: true },
    email:     { order: 2, placeholder: "Enter your email address", label: "Email",  isRequired: true },
    password:  { order: 3, placeholder: "Create a password",     label: "Password", isRequired: true },
    confirm_password: { order: 4, placeholder: "Confirm password", label: "Confirm Password", isRequired: true },
    "custom:role": {
      order: 5, type: "radio", label: "Role",
      isRequired: true,
      options: ["tenant", "manager"],
    },
  },
};

const Auth = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthenticator((c) => [c.user]);
  const router = useRouter();
  const pathname = usePathname();
  const isAuthPage = pathname.match(/^\/(signin|signup)$/);
  const isDashboardPage = pathname.startsWith("/manager") || pathname.startsWith("/tenant");

  useEffect(() => {
    if (user && isAuthPage) router.push("/");
  }, [user, isAuthPage, router]);

  // Public pages render children directly:
  if (!isAuthPage && !isDashboardPage) return <>{children}</>;

  return (
    <div className="h-full">
      <Authenticator
        initialState={pathname.includes("signup") ? "signUp" : "signIn"}
        components={{
          Header: () => <h1 className="text-2xl font-bold">RENTIFUL</h1>,
        }}
        formFields={formFields}
      >
        {() => <>{children}</>}
      </Authenticator>
    </div>
  );
};
export default Auth;
```

### 7.3 Wrap the providers in `AuthenticatorProvider`

`app/providers.tsx` must use `Authenticator.Provider` (so the dashboard sidebar can call `useAuthenticator()` to get `user` / `signOut`):

```tsx
import { Authenticator } from "@aws-amplify/ui-react";
return (
  <StoreProvider>
    <Authenticator.Provider>
      <Auth>{children}</Auth>
    </Authenticator.Provider>
  </StoreProvider>
);
```

### 7.4 Back-end mirror: create-or-fetch user on sign-in

After sign-in the client immediately calls `getAuthUser` (RTK Query). The server endpoint:

1. Decodes the Cognito JWT, reads `sub` (cognitoId) and `custom:role`.
2. Looks up the user in Postgres by `cognitoId`.
3. If missing, calls `POST /tenants` or `POST /managers` to create a row with `cognitoId`, `name=username`, `email`, default `phoneNumber=""`. (Done as a one-shot from the front-end in `getAuthUser`.)
4. Returns `{ cognitoInfo, userInfo, userRole }` to the client.

The `getAuthUser` endpoint **chains** RTK fetches: first call `/tenants/:cognitoId` (or `/managers/:cognitoId`), and on 404, fall through and call `POST /tenants` to create the row.

### 7.5 RTK Query auth header

`state/api.ts → fetchBaseQuery({ prepareHeaders })`:

```ts
import { fetchAuthSession } from "aws-amplify/auth";
const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  prepareHeaders: async (headers) => {
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken?.toString();
    if (idToken) headers.set("Authorization", `Bearer ${idToken}`);
    return headers;
  },
});
```

---

## 8. AWS deployment

Architecture (referenced from the video's diagram):

```
  Browser ──▶ AWS Amplify Hosting (Next.js, mono-repo: client)
                           │
                           ▼
                 API Gateway (REST)
                  ▲   Cognito Authorizer (validates ID token)
                  │
              forwards /{proxy+}
                  │
                  ▼
          EC2 (Amazon Linux + Node + pm2 + Express)
                  │
                  ▼
          RDS PostgreSQL (PostGIS) ◀── private subnets only
                  │
              S3 (public bucket re-s3-images) — serves uploaded photos
                  │
              Cognito User Pool — already created in §7
```

### 8.1 Budget (do this FIRST — avoid surprise bills)

- AWS Console → **Billing & Cost Management → Budgets → Create budget** → Customize → **Cost budget**, monthly, $5 (or your number), email alerts at 80% and 100%.

### 8.2 VPC + networking

Create a VPC and 4 subnets (2 public for EC2/Amplify, 2 private for RDS):

1. **VPC**: name `re-vpc`, IPv4 CIDR `10.0.0.0/16`, no IPv6.
2. **Subnets**:
   - `re-public-subnet-1` — `10.0.0.0/24`, AZ `us-east-2a`
   - `re-public-subnet-2` — `10.0.1.0/24`, AZ `us-east-2b`
   - `re-private-subnet-1` — `10.0.2.0/24`, AZ `us-east-2a`
   - `re-private-subnet-2` — `10.0.3.0/24`, AZ `us-east-2b`
3. **Internet Gateway**: create `re-igw`, attach to `re-vpc`.
4. **Route tables**:
   - `re-public-rt` — add route `0.0.0.0/0 → re-igw`; associate both public subnets.
   - `re-private-rt` — leave default (no internet route); associate both private subnets.
5. **Security groups** — created later per service:
   - `re-ec2-sg` — inbound 22 (SSH), 80 (HTTP), 443 (HTTPS) from `0.0.0.0/0`.
   - `re-rds-sg` — inbound 5432 from `re-ec2-sg` *only*.

### 8.3 EC2 (backend host)

1. **Launch instance**: name `re-ec2`, AMI `Amazon Linux 2023`, type `t2.micro` (free tier), key pair `re-ec2-key.pem` (download and `chmod 400`), VPC `re-vpc`, subnet `re-public-subnet-1`, **auto-assign public IP: enabled**, security group `re-ec2-sg`.
2. After launch, **Instance Connect** in the console:
   ```bash
   sudo su -
   # NVM + Node
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
   . ~/.nvm/nvm.sh
   nvm install --lts
   node -v && npm -v

   # Git + clone
   sudo yum update -y
   sudo yum install git -y
   git clone https://github.com/<you>/real-estate-prod.git
   cd real-estate-prod/server
   npm install

   # .env on the box (NEVER commit it)
   echo "PORT=80" > .env
   echo "DATABASE_URL=\"postgresql://postgres:<rds-password>@<rds-endpoint>:5432/realestate\"" >> .env
   echo "S3_BUCKET_NAME=re-s3-images" >> .env
   echo "AWS_REGION=us-east-2" >> .env

   # Migrate + seed against RDS
   npx prisma migrate deploy
   npm run seed

   # pm2 — keep the server alive across reboots
   npm i -g pm2
   pm2 start npm --name "real-estate-api" -- run start
   pm2 save
   pm2 startup
   # run the command pm2 prints, then:
   pm2 save
   ```
3. **Test:** open `http://<public-ipv4-of-ec2>` in a browser → should return `This is home route`.

### 8.4 RDS (production database)

1. RDS → **Create database** → Standard create, **PostgreSQL** (NOT Aurora), template **Free tier**.
2. DB instance identifier: `re-rds` (no underscores). Master username: `postgres`. Self-managed master password (note it).
3. Instance class: `db.t3.micro` (free tier).
4. **Connectivity**: VPC `re-vpc`, subnet group must include both private subnets, **public access: No**, security group `re-rds-sg`, AZ either, port `5432`.
5. Additional configuration → **Initial database name: `realestate`** (otherwise you'll have to create it manually).
6. Create. Wait ~10 min. Copy the endpoint into `server/.env` `DATABASE_URL`.
7. **Enable PostGIS** on the RDS DB. Connect via the EC2 box (psql installed via `sudo yum install postgresql15`):
   ```bash
   psql "postgresql://postgres:<password>@<rds-endpoint>:5432/realestate"
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

### 8.5 S3 (image bucket)

1. S3 → **Create bucket** `re-s3-images`, ACLs disabled, **uncheck "Block all public access"** (acknowledge), versioning off.
2. After create → bucket → **Permissions → Bucket policy → Edit**:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Sid": "PublicReadGetObject",
       "Effect": "Allow",
       "Principal": "*",
       "Action": "s3:GetObject",
       "Resource": "arn:aws:s3:::re-s3-images/*"
     }]
   }
   ```
3. **CORS** (Permissions → CORS):
   ```json
   [{
     "AllowedHeaders": ["*"],
     "AllowedMethods": ["GET", "PUT", "POST"],
     "AllowedOrigins": ["*"],
     "ExposeHeaders": []
   }]
   ```
4. **Give EC2 write access**: IAM → create role `re-ec2-s3-role` with policy `AmazonS3FullAccess` (or scope to this bucket); attach to the EC2 instance (Actions → Security → Modify IAM role). Now the SDK on EC2 can sign requests via instance metadata — *no access keys in `.env`*.

### 8.6 API Gateway (HTTPS + Cognito authorizer in front of EC2)

1. API Gateway → **Create API → REST API → Build**, name `re-api-gateway`.
2. **Resources → Create resource** → enable **Proxy resource**, name `{proxy+}`, enable CORS, create.
3. Click `ANY` under `/{proxy+}` → **Edit integration** → integration type **HTTP**, **HTTP proxy integration: yes**, method **ANY**, endpoint URL `http://<ec2-public-ipv4>/{proxy}`.
4. **Authorizers → Create**: type Cognito, name `re-api-authorizer`, user pool = `re-cognito-user-pool`, token source `Authorization`. Create.
5. Back in `/{proxy+} ANY` → **Method request → Authorization** → set to `re-api-authorizer`. Save.
6. **Deploy API → Stage `prod`**. Copy the invoke URL → set `client/.env` `NEXT_PUBLIC_API_BASE_URL=https://<api-id>.execute-api.<region>.amazonaws.com/prod`.

> The Cognito authorizer validates the `Authorization: Bearer <idToken>` that RTK Query attaches. Requests without a valid token get 401 *before* reaching EC2, which is why our `authMiddleware` only `decode`s rather than `verify`s.

### 8.7 Amplify Hosting (frontend)

1. Amplify → **Deploy app → GitHub** → authorize → pick repo `real-estate-prod`, branch `master`.
2. Mark **mono repo: yes**, root directory `client`.
3. Framework auto-detected as Next.js. Build settings default. **Environment variables** — paste the four `NEXT_PUBLIC_*` values from `client/.env`.
4. **Advanced** → set the Node version if needed (e.g., `_LIVE_UPDATES=[{"name":"Node.js version","pkg":"node","type":"nvm","version":"20"}]`).
5. Save and deploy. The first build runs `npm ci --legacy-peer-deps && next build`. (If the build fails on peer-deps, override the build command in the Amplify console: `npm install --legacy-peer-deps && npm run build`.)

### 8.8 End-to-end smoke test

1. Hit the Amplify URL → sign up as a tenant → confirm the email code → see redirected to `/tenants/favorites` (empty state).
2. In Cognito console, change `custom:role` to `manager` → sign back in → see `/managers/properties`.
3. Create a property with photos → confirm the row in RDS (via psql) and photos in S3.
4. Open another browser, sign up as tenant → favorite the property → submit application → as the manager, approve it → confirm a Lease row appears.

### 8.9 Cost-saving cleanup

Stop the bill cold when you're done:

- EC2 → **Terminate** the instance (don't just stop — t2.micro is free but the IP costs).
- RDS → **Delete** the DB (uncheck final snapshot).
- S3 → **Empty** then **Delete** the bucket.
- API Gateway → **Delete** the API.
- Amplify → **Delete** the app.
- VPC → delete subnets, route tables, IGW, then VPC.
- Cognito user pool can stay (free).

---

## 9. Asset-download bundle reference (`./asset-download/`)

The author distributes a starter bundle that's already on disk in this project. Treat each file as a copy-paste source. The relevant ones, with verbatim purposes verified by reading them:

### `asset-download/server/prisma/`

| File | Purpose | Notes |
|---|---|---|
| `schema.prisma` | Full data model + enums | Already declares the `postgis` extension via `previewFeatures = ["postgresqlExtensions"]` and `extensions = [postgis]`. Use as-is — copy to `server/prisma/schema.prisma`. |
| `seed.ts` | Idempotent seed script | Deletes in reverse-dep order, inserts in dep order, uses `ST_GeomFromText` + WKT for Location coordinates, resets auto-increment sequences. Run via `npm run seed`. |
| `seedData/location.json` | 10 California locations | Coordinates field is a WKT string, e.g. `"POINT(-118.144516 34.147785)"`. |
| `seedData/manager.json` | 10 managers | Includes a fake `cognitoId` like `010be580-60a1-70ae-...` — these exist in the DB but not in Cognito; on first sign-in for a real Cognito user, the create-user flow inserts a fresh row. |
| `seedData/property.json` | 10 properties | `photoUrls` contain placeholder `https://example.com/...` — overwrite if you want images to render. |
| `seedData/tenant.json` | 15 tenants | |
| `seedData/lease.json` | 15 leases linked to property+tenant | |
| `seedData/application.json` | 15 applications, mixed statuses | |
| `seedData/payment.json` | 15 payments | Uses Prisma nested `lease: { connect: { id } }` shape, not `leaseId`. |

### `asset-download/client/state/`

**These are starter stubs, not finished code.** The video walks you through filling them in across the whole tutorial. Verbatim contents:

```ts
// state/api.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL }),
  reducerPath: "api",
  tagTypes: [],
  endpoints: (build) => ({}),
});
export const {} = api;

// state/index.ts
import { createSlice } from "@reduxjs/toolkit";
export const initialState = {};
export const globalSlice = createSlice({ name: "global", initialState, reducers: {} });
export const {} = globalSlice.actions;
export default globalSlice.reducer;
```

**`state/redux.tsx` is the finished provider** (use as-is). It implements:

- `combineReducers({ global, [api.reducerPath]: api.reducer })`
- `makeStore()` configures the store with the API middleware
- `setupListeners(store.dispatch)` (RTK Query refetch-on-focus/reconnect)
- Typed hooks `useAppDispatch`, `useAppSelector`
- A `StoreProvider` that lazy-creates the store via `useRef` so SSR + RSC don't double-instantiate it

> The empty `tagTypes: []` and `endpoints: (build) => ({})` are placeholders. As you build features, expand them: `tagTypes: ["Managers","Tenants","Properties","PropertyDetails","Leases","Payments","Applications"]`, then add `getAuthUser`, `updateTenantSettings`, `getProperties`, `addFavoriteProperty`, etc. via `build.query` / `build.mutation`. RTK Query auth header (`prepareHeaders` calling `fetchAuthSession`) is added when Cognito is wired in (§7.5).

### `asset-download/client/lib/`

| File | Purpose |
|---|---|
| `schemas.ts` | Zod schemas: `propertySchema` (full create-property form including `photoUrls: z.array(z.instanceof(File))`), `applicationSchema`, `settingsSchema`. Plus inferred TS types `PropertyFormData`, `ApplicationFormData`, `SettingsFormData`. |
| `constants.ts` | `AmenityEnum`, `HighlightEnum`, `PropertyTypeEnum` (string enums) + matching `*Icons: Record<Enum, LucideIcon>` mappings. Constant `NAVBAR_HEIGHT = 52`. Mock `testUsers` for development. |
| `utils.ts` | `cn()` (clsx + tailwind-merge), `formatEnumString()` (PascalCase → spaced), `formatPriceValue()`, `cleanParams()` (drops `undefined`/`"any"`/`""`/all-null arrays before sending to API), `withToast()` (sonner wrapper for mutations), `createNewUserInDatabase()` (the helper that inserts a tenant/manager row on first sign-in). |

### `asset-download/client/types/index.d.ts`

Global types — copy to `client/src/types/index.d.ts`. Provides:

- `User { cognitoInfo: AuthUser, userInfo: Tenant | Manager, userRole }` — return shape of `getAuthUser`.
- All component prop interfaces: `SidebarLinkProps`, `PropertyOverviewProps`, `ApplicationModalProps`, `ContactWidgetProps`, `ImagePreviewsProps`, `PropertyDetailsProps`, `PropertyLocationProps`, `ApplicationCardProps`, `CardProps`, `CardCompactProps`, `HeaderProps`, `NavbarProps`, `AppSidebarProps`, `SettingsFormProps`.
- Re-declares `AmenityEnum`, `HighlightEnum`, `PropertyTypeEnum` in the global namespace so JSX can reference them without imports.
- Augments framer-motion's `MotionProps` to allow `className` (TS otherwise complains for some setups).

> Imports `Manager, Tenant, Property, Application` from `./prismaTypes` — that file is **auto-generated** by the server's `postprisma:generate` script. Run `npm run prisma:generate` in `server/` after copying the schema, otherwise these imports are red.

### `asset-download/client/components/FormField.tsx`

A unified `<CustomFormField name label type=... options accept />` for `text | email | textarea | number | select | switch | password | file | multi-input`. Wraps shadcn's `Form*`, `Input`, `Textarea`, `Select`, `Switch`. The `file` variant uses **FilePond** with image-preview + EXIF-orientation plugins. The `multi-input` variant uses `useFieldArray` for repeated fields. **This is the workhorse component** — the New Property form, Settings form, and Application form all use it.

> ⚠️ **Tailwind class gotcha:** the file references `text-customgreys-darkGrey`, `bg-customgreys-darkGrey`, `text-customgreys-dirtyGrey`. These classes are **not** defined in the bundled `tailwind.config.ts` (see §9 #13). Either extend the Tailwind config or replace with stock greys (`text-gray-700`, `bg-gray-100`, `text-gray-500`) before importing this file or those styles will silently no-op.

### `asset-download/client/hooks/use-mobile.tsx`

`useIsMobile()` — listens to `(max-width: 767px)` via `matchMedia`. shadcn's `Sidebar` component requires this hook at exactly this path.

### `asset-download/client/app/`

| File | Drop-in target | Notes |
|---|---|---|
| `globals.css` | `client/src/app/globals.css` | Replaces the create-next-app default. Defines all the shadcn HSL CSS variables (light + dark), Mapbox popup overrides (`.mapboxgl-popup-content`, `.marker-popup-*`), custom scrollbar, **comprehensive Amplify Authenticator overrides** (matches Auth UI to the shadcn theme — hides the tabs, restyles primary button, fields, labels), and Sonner toast styling. ~250 lines. |
| `tailwind.config.ts` | `client/tailwind.config.ts` | Extends with full `primary` (zinc-like) and `secondary` (red-tinted) palettes (50–950), plus shadcn's HSL-CSS-var-driven colors for `background/foreground/card/popover/muted/accent/destructive/border/input/ring/chart/sidebar`. Plugin: `tailwindcss-animate`. **Does NOT define `customgreys-*`** despite FormField referencing them. |
| `tsconfig.json` | `client/tsconfig.json` | Standard Next.js + `paths: { "@/*": ["./src/*"] }` and `typeRoots: ["./node_modules/@types", "./src/types"]` so the global `index.d.ts` is picked up. |

### `asset-download/client/public/`

Drop into `client/public/`. Contains:

- `logo.svg` — site logo
- `landing-splash.jpg` — hero background
- `landing-icon-{wand,calendar,heart}.png` — feature icons
- `landing-i1.png … landing-i7.png` — feature illustration grid
- `landing-search1..3.png` — search step graphics
- `landing-discover-bg.jpg`, `landing-call-to-action.jpg` — section backgrounds
- `singlelisting-2.jpg`, `singlelisting-3.jpg` — sample listing photos
- `placeholder.jpg` — generic placeholder

These are referenced by hard-coded paths in the Hero / Features / Discover / CTA sections — keeping the filenames stable saves you a manual rewrite of the landing page.

### How to use the bundle

```bash
# After scaffolding client/ and server/ shells (§5.2 / §6.2):

# Server:
cp -R asset-download/server/prisma server/prisma

# Client:
cp -R asset-download/client/state      client/src/state
cp -R asset-download/client/lib        client/src/lib
cp -R asset-download/client/types      client/src/types
cp -R asset-download/client/hooks      client/src/hooks
cp    asset-download/client/components/FormField.tsx client/src/components/FormField.tsx
cp    asset-download/client/app/globals.css   client/src/app/globals.css
cp    asset-download/client/app/tailwind.config.ts  client/tailwind.config.ts
cp    asset-download/client/app/tsconfig.json client/tsconfig.json
cp -R asset-download/client/public/.   client/public/
```

After copying, run `npm run prisma:generate` in `server/` to populate `client/src/types/prismaTypes.d.ts`. Then `npm run seed` to load the 70 demo rows.

---

## 10. Critical gotchas

1. **React 19 + shadcn/Amplify:** install everything with `--legacy-peer-deps`. Without it, `npm install` errors out and the shadcn CLI silently fails to add components. This applies to the Amplify build on the cloud too.
2. **PostGIS isn't first-class in Prisma.** Use `Unsupported("geography(Point, 4326)")` for the column and raw SQL for any write that touches it. The bundled `seed.ts` uses `ST_GeomFromText('POINT(<lng> <lat>)', 4326)`; controllers can use either that or `ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography`. Reads cast to geometry: `ST_X(coordinates::geometry)`, `ST_Y(coordinates::geometry)`.
3. **`NEXT_PUBLIC_*` is the only way to expose env vars to client code in Next.js.** Forgetting the prefix is the #1 cause of "Mapbox token undefined" / "Cognito userpool null" errors.
4. **Two user records per signup.** Cognito holds the auth identity; Postgres holds the domain row. They link via `cognitoId`. The first request the client makes after sign-in must be `GET /tenants/:cognitoId` (or `/managers/:cognitoId`); if it 404s, the client immediately POSTs to create the row. The bundle ships `createNewUserInDatabase()` in `lib/utils.ts` — call it from RTK Query's `getAuthUser` `queryFn` when the lookup 404s.
5. **Manager vs tenant routing on signin** is decided client-side from `userRole` (decoded from the JWT). If the Postgres row is missing the role can't be derived — *ensure* the create-on-first-login path runs.
6. **EC2 port:** the security group only opens 80/443/22. The Express server defaults to 3001. Set `PORT=80` in `server/.env` on EC2 (or run pm2 with `sudo` so it can bind to 80).
7. **API Gateway proxy needs `/{proxy}` in the endpoint URL.** Without it, every request hits `/` on EC2 regardless of path.
8. **RDS endpoint is private** — only the EC2 box (and anything else in `re-ec2-sg`) can reach it. Don't try to connect from your laptop.
9. **PostGIS extension on RDS** — locally, `prisma migrate` runs `CREATE EXTENSION` automatically because of `previewFeatures = ["postgresqlExtensions"]`. On RDS the same migration *should* enable it, but RDS sometimes restricts the extension catalog — if `prisma migrate deploy` errors, manually `psql` from the EC2 box and run `CREATE EXTENSION IF NOT EXISTS postgis;` once before retrying.
10. **Server-side filtering pattern:** never accept arbitrary SQL fragments from query params. The video composes `Prisma.sql\`...\`` template literals which auto-parameterize values — preserve that pattern; do not string-concatenate user input.
11. **Type sharing:** the `postprisma:generate` script copies Prisma types into `client/src/types/prismaTypes.d.ts`. If TypeScript complains about a missing `Property` or `Tenant` type on the client, you forgot to run `npm run prisma:generate` after editing the schema.
12. **`./asset-download/` is the local source of truth** for any field/file the video glosses over (CSS, Tailwind theme, schema, seed JSONs, zod schemas, FormField, global types). Read it before reaching for the GitHub repo. The remote `https://github.com/ed-roh/real-estate-prod` is authoritative only for files not in the bundle (controllers, route handlers, page components).
13. **Undefined `customgreys-*` Tailwind classes.** `asset-download/client/components/FormField.tsx` references `text-customgreys-darkGrey`, `bg-customgreys-darkGrey`, `text-customgreys-dirtyGrey`, but the bundled `tailwind.config.ts` does **not** define them. Either extend the config (`theme.extend.colors.customgreys = { darkGrey: "#374151", dirtyGrey: "#6b7280" }` or whichever shade you want) or replace those classes with stock greys before relying on the component.
14. **`state/api.ts` and `state/index.ts` in the bundle are EMPTY scaffolds**, not finished code (see §9). RTK Query endpoints, tag types, and `prepareHeaders` for Bearer auth all need to be added — the video walks you through adding them feature-by-feature.

---

## 11. Suggested execution plan for an AI assistant

Phase the work in this order so each step is independently testable:

1. **Local Postgres + PostGIS install** (§6.1) — create the `realestate` DB. Skip `CREATE EXTENSION` here; the schema in §9 enables it during `prisma migrate dev`.
2. **Server scaffold** (§6.2) → run `npm run dev` → `curl localhost:3001/` returns `This is home route`.
3. **Copy `asset-download/server/prisma/` to `server/prisma/`** then `npx prisma migrate dev --name init && npm run prisma:generate && npm run seed`. Verify in pgAdmin: 10 properties, 10 locations with non-null `coordinates`.
4. **Client scaffold** (§5.2) → `npm run dev` shows blank `Home` page.
5. **Copy the asset-download client files** (§9 "How to use the bundle") then re-run `npm run dev` — page should still render with the new globals.css applied.
6. **Cognito user pool + Amplify wiring** (§7) → sign up → confirm in Cognito console.
7. **Settings page CRUD** end-to-end (§5.4) → confirms client→server→DB→client loop. This is where `state/api.ts` first gets endpoints + the `prepareHeaders` Bearer auth.
8. **Properties backend + server-side filter** (§6.4) → smoke with Postman.
9. **Search page UI + Mapbox** (§5.5–5.6) → see markers move with filters.
10. **Listings + favorites** (§5.7) → heart toggles, Redux invalidation works.
11. **Dashboards** (§5.8–5.9) → tenant favorites/residences/applications, manager properties/applications.
12. **AWS budget + VPC + RDS + EC2 + S3 + API Gateway + Amplify** (§8) — deploy in that order. Smoke after each.
13. **End-to-end test** (§8.8) → tear down (§8.9) when done.

Before writing any chapter's code, **read the corresponding chapter transcript** if one is preserved (or pull the relevant file from `https://github.com/ed-roh/real-estate-prod`) — the transcript and the GitHub repo together fill in field-level details that didn't fit here.

---

*Generated from auto-captions of `https://youtu.be/X1zCAPLvMtw` (12h 19m). No frames were extracted — this is a typing-heavy tutorial where sparse frame samples would not reproducibly capture code. The reference repository at `https://github.com/ed-roh/real-estate-prod` is authoritative for any field-level discrepancy.*
