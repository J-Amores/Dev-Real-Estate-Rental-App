# Phase 13 — Manager Ops Console Design

**Status:** Spec only. No code changes pending.

**Date:** 2026-05-18.

**Author:** Brainstorm session, Claude (Opus 4.7) + user.

**Source inspiration:** `design-update/owner-view.png` (third-party smart-home dashboard mockup: left "Power Consumption" sidebar + top "live camera" hero + bottom "device cards" grid). Following the Phase 11/12 precedent: translate the *spatial composition* into our warm / light / evergreen system; do not port the dark theme or smart-home metaphor verbatim.

---

## 1. Goal

Replace the existing `/dashboard/properties` simple-grid view with a **manager ops console**: a single dense surface where a small-scale property manager can read the health of their portfolio at a glance (cash + occupancy) and drill into any one property's lease, tenant, and payment detail without leaving the page.

The change re-positions `/dashboard/properties` from a "list of my listings" affordance to a "today's portfolio" affordance. The existing Phase 4 CRUD entry (`Add a property`) stays. The Phase 8 lease/payment data layer (`Lease`, `Payment`, `Application`) gains its first read-side consumer beyond `/dashboard/applications`.

Phase 13 maps owner-view.png's three zones onto rental-ops content:

| owner-view zone | this phase |
|---|---|
| Left "Weather + Power Consumption" sidebar | `KpiCard` — MRR + Occupied hero pair + breakdown rows |
| Top-right "Hi Ann! + room pills + live camera" | Header (`Hi {firstName}`) + `FeaturedProperty` 16:7 hero (top performer by `Lease.rent`) |
| Bottom "device cards" (Living Lamp / Homepod / Air Humidifier) | `PropertyCardManager` grid — one card per property the manager owns |
| (none in source) | Modal on card click — Next.js intercepted route at `/dashboard/properties/[id]`, full-page fallback on direct nav |

Light-only, warm-neutral, mixed-corner DESIGN.md tokens are honored. Dark theme of the source is not ported.

---

## 2. Information Architecture

- **`/dashboard/properties`** — Repurposed. Manager only (existing `redirect("/dashboard/favorites")` for non-managers preserved verbatim). Renders header + two-column body: 280px fixed left col (`KpiCard`), fluid right col (`FeaturedProperty` row 1, `PropertyCardGrid` row 2). The previous simple card list is removed.
- **`/dashboard/properties/[id]`** — New route. Manager-scoped property detail (full lease, tenant contact, payment ledger). When the user navigates from the grid, Next.js parallel + intercepting routes serve a **centered modal** over the grid; on direct nav or refresh, the same component renders **full-page** with a `← Back to properties` link instead of a scrim.
- **`/dashboard/properties/new`** — Untouched.
- **URL is the source of truth.** Modal state is the URL. Backdrop click / close button / Esc pops `router.back()`. Modal URLs are shareable; an opened modal URL pasted into a new tab lands on the full-page variant.
- **Managers only.** Both `/dashboard/properties` and `/dashboard/properties/[id]` redirect non-manager roles to `/dashboard/favorites` (same precedent as the current page). Anonymous users hit the existing dashboard `/signin` redirect from `layout.tsx`.

### Route file layout

```
app/dashboard/properties/
├── page.tsx                            # rewrite — console
├── layout.tsx                          # NEW — accepts `modal` parallel slot
├── @modal/
│   ├── default.tsx                     # NEW — exports null
│   └── (.)[id]/page.tsx                # NEW — intercepted modal
├── [id]/page.tsx                       # NEW — full-page fallback
└── new/page.tsx                        # unchanged
```

The `@modal` parallel slot is rendered by `layout.tsx` adjacent to `children`. The `(.)[id]` intercepting segment matches sibling-level navigation from `page.tsx`. Hard navigation (refresh, paste-URL) bypasses the intercept and resolves to `[id]/page.tsx`.

---

## 3. Components

### New

- **`components/manager/kpi-card.tsx`** — Server component. Receives `kpi: ManagerKpi` prop. Renders title `This Month` + subtitle `Revenue + occupancy snapshot`, hero pair (MRR tile + Occupied tile), and a breakdown list (Collected MTD, Outstanding, Vacant units, Open applications, Leases expiring <60d). Each breakdown row is a static label + a numeric `<strong>` value; missing data renders as `—`. MRR tile shows a "+$X.Xk vs {prevMonthShort}" delta **only if any `Payment.dueDate` falls in the previous calendar month**; otherwise the delta line is hidden (not blank, not zero).

- **`components/manager/featured-property.tsx`** — Server component. Receives `property: PropertyCardDTO | null`. Returns `null` when `property` is `null` (handled by the page: no properties at all → empty state replaces both column and grid; properties exist but none qualify → impossible, since highest `Lease.rent` always exists when ≥1 active lease, and the fallback below covers all-vacant). Renders a 16:7 link tile wrapping the property photo with: top-left chip `Top performer · $X,XXX / mo` (DESIGN.md `surface-tone-deep`), top-right status chip (Occupied / Late / Vacant), bottom-left overlay name + city. Whole tile is `<Link href="/dashboard/properties/[id]">`. **Top-performer pick:** highest `Lease.rent` among active leases (`endDate >= now`). Ties broken by most-recent `Lease.startDate`. If zero active leases (all-vacant), fall back to highest `Property.pricePerMonth`.

- **`components/manager/property-card-manager.tsx`** — Server component. One per property. Renders 16:10 photo + status chip top-left + body block (name `font-medium`, caption derived from status). Caption rules:
  - `occupied` → `Leased since MMM YYYY` (from active `Lease.startDate`).
  - `vacant` → `Listed {N} days` (from `Property.postedDate`).
  - `late` → `Late · {N} days` (from oldest `Overdue` payment's `dueDate`).
  Whole tile is `<Link href="/dashboard/properties/[id]" scroll={false}>`. No inline KPIs (Mock A picked over Mock B in brainstorm).

- **`components/manager/property-card-grid.tsx`** — Server component shell that maps `PropertyCardDTO[]` onto `PropertyCardManager`. Grid: 1 col base, 2 cols `md:`, 3 cols `xl:`. Gap `gap-4`.

- **`components/manager/property-modal.tsx`** — Client component (needs `useRouter` for dismiss + `<dialog>` semantics). Renders the modal **chrome** (scrim + close + Esc handler + `router.back()`); receives the **content** as `children` so the same RSC body is used by both intercepted modal and full-page fallback.

- **`components/manager/property-detail-body.tsx`** — Server component. Receives `detail: PropertyDetail`. Renders the body content used in both the modal and the full-page route. Layout (top to bottom):
  1. 21:8 photo + status chip top-left.
  2. h2 name + caption `{type} · {city}, {state} · Listed MMM YYYY`.
  3. Stat grid (3 cols, gap-2): variants below.
  4. Tenant block / Vacant block (variant).
  5. Payment history (last 6, occupied/late only).
  6. Actions row.

  **Variants**

  - **Occupied** — stats: Monthly rent · Lease ends · Collected YTD. Tenant block: avatar (initials from `tenant.user.name`) + name + email + phone + `since MMM YYYY` + `Message` button. Payment history: last 6 `Payment` rows with status pill (Paid · MMM D / Late · MMM D / Due · MMM D).
  - **Vacant** — stats: Ask price · Listed (MMM D) · Applications received. Vacant block: copy `No active lease.` + `View applications` button → `/dashboard/applications?propertyId={id}`. Payment history hidden.
  - **Late** — same as Occupied + a red callout above the payment history: `Overdue: $X,XXX · {N} days`. Oldest overdue row in the ledger gets the `late` pill styled with the accent error token.

  **Actions row**
  - `View full lease` → `/dashboard/properties/[id]` as a plain `<a href>` (hard navigation; bypasses the parallel-route intercept so the user lands on the `[id]/page.tsx` full-page variant instead of seeing the same modal). In the full-page route this button is hidden (already on that route).
  - `Edit listing` → **disabled with tooltip** `Coming soon` (out of scope, see §11).
  - `End lease` → **disabled with tooltip** `Coming soon` (out of scope).

- **`components/manager/property-modal-page.tsx`** — Server component used by `@modal/(.)[id]/page.tsx`. Reads the propertyId param + `requireUser()`, calls `getPropertyDetail(propertyId, user.id)`, renders `<PropertyModal><PropertyDetailBody … /></PropertyModal>`.

- **`app/dashboard/properties/[id]/page.tsx`** — Server component. Same `getPropertyDetail` call. Renders `<PropertyDetailBody … />` directly inside a top-level `<main>` with a `← Back to properties` link, no scrim, no close button. Used by direct nav / refresh / "View full lease" link.

- **`app/dashboard/properties/layout.tsx`** — Server component. Wraps `{ children }` and `{ modal }` parallel slots side-by-side (`modal` rendered last so it overlays via fixed positioning inside its own component).

### Changed

- **`app/dashboard/properties/page.tsx`** — Rewritten. Replaces the existing `findMany → PropertyCard` grid with: header + 2-col body composing `KpiCard`, `FeaturedProperty`, and `PropertyCardGrid`. Empty state (0 properties) keeps the existing `EmptyState` block and skips all three components.

- **`components/property-card.tsx`** — Untouched. Tenant-facing usage in `/search`, `/dashboard/favorites`, `/properties/[id]` stays. The new manager card is a separate file (`property-card-manager.tsx`) since the data shape (status, lease metadata) differs.

### Existing reused

- `components/empty-state.tsx`, `components/icons.tsx`, `components/ui/button.tsx`, `lib/auth.ts` (`requireUser`), `lib/prisma.ts`, `lib/format.ts`, `lib/images.ts`.

---

## 4. Data Layer

### Module: `lib/manager-overview.ts`

```ts
export type PropertyStatus = 'occupied' | 'vacant' | 'late';

export type PropertyCardDTO = {
  id: number;
  name: string;
  photoUrls: string[];
  location: { city: string; state: string };
  status: PropertyStatus;
  monthlyRent: number;       // Lease.rent if active, else Property.pricePerMonth
  leaseStart: Date | null;
  leaseEnd: Date | null;
  daysVacant: number | null; // null when occupied
  daysLate: number | null;   // null unless status === 'late'
};

export type ManagerKpi = {
  mrr: number;
  mrrDeltaVsPrevMonth: number | null;
  collectedMtd: number;
  outstandingMtd: number;
  occupied: number;
  total: number;
  vacantCount: number;
  openAppsCount: number;
  expiringSoonCount: number; // active leases endDate within next 60d
};

export type ManagerOverview = {
  manager: { name: string };
  kpi: ManagerKpi;
  topPerformer: PropertyCardDTO | null;
  properties: PropertyCardDTO[];
};

export async function getManagerOverview(managerId: string): Promise<ManagerOverview>;
```

**Implementation strategy** — one Prisma `findMany` on `Property where: { managerId }` with nested `include` for leases (and their `payments` + `tenant.user`), `applications` (only `status === 'Pending'`), and `location`. A single JS reducer over the result computes all KPIs and shapes the DTOs. No raw SQL (PostGIS not needed here). MRR = sum of active-lease `rent`. Collected MTD / Outstanding MTD are computed from `Payment` rows whose `dueDate` falls in the current calendar month. `mrrDeltaVsPrevMonth` = current-month MRR minus prior-month collected sum; **`null` when zero prior-month payments exist** (suppresses the delta line in the UI).

**Active lease** definition for this module: `Lease.endDate >= now`. There may be more than one active lease per property in dirty data; if so, pick the lease with the **latest `startDate`** as the canonical active lease (deterministic, single source of truth for the card's rent/dates).

**Late** definition: any `Payment` row on any active lease with `paymentStatus === 'Overdue'`. Precedence: `late` > `occupied` > `vacant`.

### Module function: `getPropertyDetail(propertyId, managerId)`

Lives in same `lib/manager-overview.ts` (small enough). Fetches one `Property` (only when `managerId` matches — auth scope) with full `leases.payments.lease` chain, full `applications` (any status), `tenant.user` for the active lease. Returns:

```ts
export type PropertyDetail = {
  id: number;
  name: string;
  type: PropertyType;
  photoUrls: string[];
  location: { city: string; state: string };
  postedDate: Date;
  status: PropertyStatus;
  monthlyRent: number;
  collectedYtd: number;
  activeLease: {
    startDate: Date;
    endDate: Date;
    rent: number;
    tenant: { name: string; email: string; phone: string };
  } | null;
  payments: Array<{
    dueDate: Date;
    paymentDate: Date | null;
    amountDue: number;
    amountPaid: number;
    status: 'Paid' | 'Pending' | 'PartiallyPaid' | 'Overdue';
  }>; // last 6
  applicationsCount: number;
  overdue: { totalAmount: number; oldestDaysLate: number } | null;
};
```

If `getPropertyDetail` returns `null` (no match for that `managerId`, i.e. attempted cross-manager access), both modal and full-page routes call `notFound()`.

---

## 5. KPI math reference

| KPI | Formula |
|---|---|
| `mrr` | `sum(activeLeases.rent)` |
| `mrrDeltaVsPrevMonth` | `mrr - sum(Payment.amountPaid where dueDate in prev calendar month)` ; `null` if zero such rows |
| `collectedMtd` | `sum(Payment.amountPaid where dueDate in current calendar month)` |
| `outstandingMtd` | `sum(Payment.amountDue - amountPaid where dueDate in current calendar month and status !== 'Paid')` |
| `occupied` | `count(properties where status === 'occupied' OR status === 'late')` |
| `total` | `properties.length` |
| `vacantCount` | `total - occupied` |
| `openAppsCount` | `sum across properties: count(applications where status === 'Pending')` |
| `expiringSoonCount` | `count(activeLeases where endDate <= now + 60d)` |
| `topPerformer` | `properties sorted by activeLease.rent desc, activeLease.startDate desc; first` ; fallback `pricePerMonth desc` if zero active leases |

All money values rendered via existing `lib/format.ts` helper (`$X,XXX` form). Counts use `tnum`.

---

## 6. States

| State | Behavior |
|---|---|
| Empty (0 properties) | Existing `<EmptyState>` (`HouseIcon`, title `No properties yet`, CTA `Add a property` → `/dashboard/properties/new`). No header, no two-column body. |
| Loading | Per-section skeletons. `KpiCard` rows shimmer (5 row placeholders + 2 hero blocks). `FeaturedProperty` renders a 16:7 gradient placeholder. Grid renders 3 skeleton tiles. Reduced-motion: no shimmer keyframes; static placeholder color only. |
| Error | Page-level `error.tsx` boundary: copy `Couldn't load your portfolio.` + retry button. Modal-level errors render as a red banner inside the dialog body, dialog remains dismissable. |
| Reduced-motion | No card hover-scale, no shimmer animation. Status chip dots stay static. Same as Phase 12 precedent. |
| All-vacant | `KpiCard` renders zeros gracefully (`—` in breakdown rows when source rows are empty). `FeaturedProperty` falls back to highest `pricePerMonth` property. |
| Auth — non-manager | Existing `redirect("/dashboard/favorites")` from `page.tsx` (and `[id]/page.tsx`, and `@modal/(.)[id]/page.tsx`). |

---

## 7. Visual tokens

All colors / radii / type from DESIGN.md. No new tokens introduced.

- MRR hero tile: `surface-tone-deep` background, ink-inverse text.
- Occupied hero tile: `surface-tone` background, ink text.
- Status chip — Occupied: accent evergreen background (`oklch(38% 0.08 165)`), ink-inverse text, evergreen-tint dot.
- Status chip — Vacant: warm amber background (DESIGN.md amber ramp), ink text.
- Status chip — Late: red from DESIGN.md error ramp, ink-inverse text.
- Card / tile radii: 14px. Chip radii: 999px (capsule). Button radii: 8px.
- Typography: Inter `cv11 ss03 tnum`, identical to Phase 12.
- Modal scrim: `bg-ink/40 backdrop-blur-[2px]`.

---

## 8. Accessibility

- Modal uses native `<dialog>` element with `showModal()` on mount (client-side effect in `PropertyModal`). Esc dismiss + focus trap via the browser.
- Initial focus: close button.
- Card grid: each tile is a single `<Link>` — entire tile clickable, but the link's accessible name is the property name + status (`aria-label="Maple Court 4B — occupied"`).
- Status chip color is not the sole signal; chip text also carries status (`Occupied` / `Vacant` / `Late`).
- KPI breakdown list: semantic `<dl>` (term + definition) so screen readers read "Collected MTD: $22,400" pairs.
- WCAG 2.2 AA contrast verified on all chip color combinations against DESIGN.md tokens (rerun manual axe check after build, log in Phase 13 commit notes).

---

## 9. Performance

- One Prisma query covers the whole page (Approach A from brainstorm). Manager portfolios are small (<50 properties typical); the nested `include` returns at most ~50 properties × ~24 monthly payment rows = ~1200 rows worst case. Acceptable single round-trip.
- `getPropertyDetail` is a separate Prisma call (modal/full-page only). Returns a single property, bounded.
- No mapbox-gl on this page (kept on `/search/map`). First-load JS budget target: ≤220kB (current `/dashboard/properties` is ~140kB; modal client component will add ~10kB).
- Photos use existing `next/image` wrapper in `lib/images.ts`. `FeaturedProperty` photo uses `priority` (above the fold); grid photos use default lazy loading. Modal photo uses `priority` (modal is short-lived; eager load is fine).

---

## 10. Open data assumptions / failure modes

- **`Tenant.user.name`** — may be `null` (Phase 2 signup doesn't require name). Fallback `Unnamed tenant`. Initial avatar falls back to a single neutral icon.
- **`Tenant.user.phone`** — not currently in `User` model. Verify before implementation; if absent, omit the phone line from the tenant block (no schema migration in this phase).
- **More than one active lease on the same property** — pick latest `startDate`. Log a server-side `console.warn` once per page render with the property id for cleanup later.
- **Zero payments yet for a new active lease** — payment history block renders `No payments yet.`, status stays `occupied` (no Overdue rows yet → not `late`).
- **Manager re-uses the same `Property.photoUrls[0]`** for hero + grid + modal — no problem; `next/image` cache hits.

---

## 11. Out of scope (explicit)

These appear in the modal but are non-functional or stubbed in Phase 13. Each will be its own phase.

- **`Edit listing` button** — disabled with tooltip `Coming soon`. Will become a full edit form at `/dashboard/properties/[id]/edit` in a later phase. Phase 4 only built the `new` form.
- **`End lease` button** — disabled with tooltip `Coming soon`. Needs a server action + confirmation flow not yet designed.
- **`Message` button (tenant block)** — placeholder. Routes to `/dashboard/applications?tenantId={tenantId}` for now; a real DM thread is a separate phase.
- **Maintenance row** — owner-view shows maintenance counts; we have no `Maintenance` model. Row omitted from `KpiCard` breakdown.
- **Per-month MRR sparkline / trend chart** — only the single delta line ships in this phase. A real `Recharts` line graph is deferred to a future "Reports" surface.
- **Notification on overdue / expiring lease** — surfaced visually here, not pushed.

---

## 12. Risks

- **Phase 4 `Property.photoUrls`** is plain text array; some seed rows have only one photo. Modal header (21:8) may letterbox a poorly-aspected source. Use `next/image` with `object-cover` + neutral background.
- **`@modal` parallel slot wiring** is the first time we use parallel routes in this repo. Risk: layout slot prop missed, modal renders below content instead of overlaying. Mitigation: modal component itself uses `fixed inset-0 z-50`, so the slot's position in the DOM is decoupled from its visual stacking.
- **Active-lease deduplication** — if dirty data shows multiple active leases, the latest-`startDate` tiebreaker must be applied **identically** in `getManagerOverview` and `getPropertyDetail`. A shared `pickActiveLease(leases)` helper used by both, tested.
- **Cross-manager scope leak** — `getPropertyDetail` must `where: { id, managerId }` in the Prisma filter, not filter in JS. Both modal route and full-page route call `requireUser()` and pass `user.id`.

---

## 13. Future hooks (out of this phase)

- A real edit form at `/dashboard/properties/[id]/edit`.
- `End lease` flow + tenant move-out checklist.
- MRR sparkline (12-month trend) — add when reports surface lands.
- Maintenance model + KPI row.
- Cross-manager comparison ("Phase 13 ladder candidates: market view") — entirely separate route.
- Replace `Message` placeholder with a real DM thread.
- Push notifications for overdue / expiring leases.
- A "Reports" tab pulling the same `lib/manager-overview` shape into a printable monthly statement.

---

## 14. Acceptance

- `/dashboard/properties` as a signed-in manager renders header + KPI col + featured hero + card grid with seeded data.
- KPI numbers reconcile with manual `SELECT` on the Prisma DB (spot-check MRR + Collected MTD + Outstanding MTD against raw `Payment` table).
- Clicking any card opens an intercepted modal with the correct property's lease + tenant + ledger.
- Refreshing on a modal URL loads the full-page fallback with a `← Back to properties` link.
- Direct-paste of `/dashboard/properties/[id]` for a property owned by a **different manager** returns 404 (via `notFound()`).
- Signed-in tenant hitting `/dashboard/properties` or `/dashboard/properties/[id]` lands on `/dashboard/favorites`.
- Lighthouse `/dashboard/properties` (run from Vercel preview, not local): performance ≥85, accessibility ≥95 (Phase 12 had no Lighthouse run; this phase logs the numbers in the `- Done` commit body).
- No new lint errors. Type-check clean. `next build` passes.
