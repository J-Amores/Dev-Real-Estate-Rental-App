# Manager Ops Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `/dashboard/properties` with a manager ops console (KPI sidebar + featured-property hero + property card grid + intercepting-route modal for per-property KPIs / tenant / payment ledger).

**Architecture:** One Prisma query per page-load assembles all properties + active leases + payments + applications; pure-JS reducer shapes a `ManagerOverview` DTO; server components render KPI / hero / grid; clicking a card pushes `/dashboard/properties/[id]`, Next.js parallel + intercepting routes overlay a centered modal over the grid (refresh / paste-URL hits a full-page fallback rendering the same body).

**Tech Stack:** Next.js 15.5.15 App Router (parallel routes `@modal` + intercepting `(.)[id]`), Prisma 7 (one nested `findMany`), Tailwind 4 + DESIGN.md tokens, native `<dialog>` + `useRouter().back()` for modal dismissal. No new dependencies. No new test framework (project has none today; verification = `next build` + `eslint` + dev-server smoke per spec §14).

**Spec:** `docs/superpowers/specs/2026-05-18-manager-ops-console-design.md` (commits `42db901` + `c64794a`).

---

## Pre-flight checks (run once before starting)

```bash
# 1. On main, clean tree (Phase 12 already merged).
git status
# expect: untracked design-update/, docs/superpowers/{plans,specs}/ — no modified tracked files

# 2. Schema sanity (these are referenced everywhere below)
grep -A 4 "^model Tenant " prisma/schema.prisma   # Tenant has name, email, phoneNumber (non-null)
grep -A 6 "^enum PaymentStatus" prisma/schema.prisma  # Pending | Paid | PartiallyPaid | Overdue
grep -A 8 "^model Lease " prisma/schema.prisma    # id Int, startDate, endDate, rent (Float), payments[]

# 3. Confirm existing routes — Task 12 / 13 must not collide.
ls app/dashboard/properties/
# expect: [id]/ (with edit/), new/, page.tsx — and NO bare [id]/page.tsx (we add that)

# 4. Dev server runs cleanly.
npm run dev
# expect: ready on http://localhost:3000 ; visit /signin → smoke@test.com / password123 → tenant
#         visit as manager: john.smith@example.com / password123 → /dashboard/properties (old grid)
```

If any of these fail, fix before touching code.

---

## File map

**New (lib)**
- `lib/manager-overview.ts` — DTO types, `pickActiveLease`, `propertyStatus`, `propertyToCardDTO`, `computeKpi`, `pickTopPerformer`, `getManagerOverview`, `getPropertyDetail`.

**New (components, under `components/manager/`)**
- `kpi-card.tsx` — left-column KPI block (server component)
- `featured-property.tsx` — 16:7 hero tile (server component)
- `property-card-manager.tsx` — grid tile (server component)
- `property-card-grid.tsx` — grid shell (server component)
- `property-detail-body.tsx` — modal/full-page body content (server component)
- `property-modal.tsx` — dialog chrome + dismissal (client component)
- `status-chip.tsx` — shared status chip (Occupied / Vacant / Late) (server component)

**New (routes)**
- `app/dashboard/properties/layout.tsx` — accepts `modal` parallel slot
- `app/dashboard/properties/[id]/page.tsx` — full-page fallback
- `app/dashboard/properties/@modal/default.tsx` — exports `null`
- `app/dashboard/properties/@modal/(.)[id]/page.tsx` — intercepted modal page
- `app/dashboard/properties/loading.tsx` — skeleton
- `app/dashboard/properties/error.tsx` — error boundary

**Rewritten**
- `app/dashboard/properties/page.tsx` — old grid → new console composition.

**Untouched (relied upon)**
- `lib/auth.ts` (`requireUser`), `lib/prisma.ts`, `lib/format.ts` (`priceFormatter`, `dateFormatter`), `lib/images.ts` (`PLACEHOLDER`, `onImageError`), `components/empty-state.tsx`, `components/icons.tsx` (`HouseIcon`), `components/ui/button.tsx` (`buttonClassName`), `components/delete-property-button.tsx`, `lib/actions.ts` (`deletePropertyAction`).
- `components/property-card.tsx` — tenant-facing usage preserved (`/search`, `/dashboard/favorites`, `/properties/[id]`).

---

## Task 1 — Define types in `lib/manager-overview.ts`

**Files:**
- Create: `lib/manager-overview.ts`

- [ ] **Step 1: Create the file with only the type exports.**

```ts
// lib/manager-overview.ts
import type { PropertyType } from "@prisma/client";

export type PropertyStatus = "occupied" | "vacant" | "late";

export type PropertyCardDTO = {
  id: number;
  name: string;
  photoUrls: string[];
  location: { city: string; state: string };
  status: PropertyStatus;
  monthlyRent: number;
  leaseStart: Date | null;
  leaseEnd: Date | null;
  daysVacant: number | null;
  daysLate: number | null;
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
  expiringSoonCount: number;
};

export type ManagerOverview = {
  manager: { name: string };
  kpi: ManagerKpi;
  topPerformer: PropertyCardDTO | null;
  properties: PropertyCardDTO[];
};

export type PropertyDetail = {
  id: number;
  name: string;
  type: PropertyType;
  photoUrls: string[];
  location: { city: string; state: string };
  postedDate: Date;
  pricePerMonth: number;
  status: PropertyStatus;
  monthlyRent: number;
  collectedYtd: number;
  activeLease: {
    id: number;
    startDate: Date;
    endDate: Date;
    rent: number;
    tenant: { name: string; email: string; phoneNumber: string };
  } | null;
  payments: Array<{
    dueDate: Date;
    paymentDate: Date | null;
    amountDue: number;
    amountPaid: number;
    status: "Paid" | "Pending" | "PartiallyPaid" | "Overdue";
  }>;
  applicationsCount: number;
  overdue: { totalAmount: number; oldestDaysLate: number } | null;
};
```

- [ ] **Step 2: Verify type-check passes.**

Run: `npx tsc --noEmit`
Expected: no errors. (File only exports types; nothing references it yet.)

- [ ] **Step 3: Commit.**

```bash
git add lib/manager-overview.ts
git commit -m "Phase 13 - In Progress - lib/manager-overview.ts type scaffolding"
```

---

## Task 2 — `pickActiveLease` + `propertyStatus` helpers

**Files:**
- Modify: `lib/manager-overview.ts`

- [ ] **Step 1: Append `pickActiveLease` to the module.**

The helper deduplicates dirty data (multiple active leases on one property). Same logic in both `getManagerOverview` and `getPropertyDetail`.

```ts
// Append to lib/manager-overview.ts

type LeaseLike = {
  endDate: Date;
  startDate: Date;
  rent: number;
  payments: Array<{ paymentStatus: string; dueDate: Date; amountDue: number; amountPaid: number; paymentDate: Date }>;
};

/**
 * Returns the canonical active lease for a property: endDate >= now,
 * tiebreaker latest startDate. Returns null if none.
 */
export function pickActiveLease<T extends LeaseLike>(leases: T[], now: Date = new Date()): T | null {
  const active = leases.filter((l) => l.endDate.getTime() >= now.getTime());
  if (active.length === 0) return null;
  if (active.length > 1) {
    console.warn(
      `[manager-overview] property has ${active.length} active leases; picking latest startDate`,
    );
  }
  return [...active].sort((a, b) => b.startDate.getTime() - a.startDate.getTime())[0];
}
```

- [ ] **Step 2: Append `propertyStatus`.**

```ts
// Append to lib/manager-overview.ts

/**
 * Status precedence: late > occupied > vacant.
 * `late` = active lease + any Overdue payment.
 * `occupied` = active lease, no Overdue payments.
 * `vacant` = no active lease.
 */
export function propertyStatus(activeLease: LeaseLike | null): PropertyStatus {
  if (!activeLease) return "vacant";
  const hasOverdue = activeLease.payments.some((p) => p.paymentStatus === "Overdue");
  return hasOverdue ? "late" : "occupied";
}
```

- [ ] **Step 3: Type-check.**

Run: `npx tsc --noEmit`
Expected: pass.

- [ ] **Step 4: Commit.**

```bash
git add lib/manager-overview.ts
git commit -m "Phase 13 - In Progress - pickActiveLease + propertyStatus helpers"
```

---

## Task 3 — `propertyToCardDTO` shaper

**Files:**
- Modify: `lib/manager-overview.ts`

- [ ] **Step 1: Append the shaper.**

```ts
// Append to lib/manager-overview.ts

const MS_PER_DAY = 1000 * 60 * 60 * 24;

type PropertyLike = {
  id: number;
  name: string;
  pricePerMonth: number;
  photoUrls: string[];
  postedDate: Date;
  location: { city: string; state: string };
  leases: LeaseLike[];
};

export function propertyToCardDTO(p: PropertyLike, now: Date = new Date()): PropertyCardDTO {
  const active = pickActiveLease(p.leases, now);
  const status = propertyStatus(active);

  let daysLate: number | null = null;
  if (status === "late" && active) {
    const overdue = active.payments
      .filter((pay) => pay.paymentStatus === "Overdue")
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0];
    if (overdue) {
      daysLate = Math.max(0, Math.floor((now.getTime() - overdue.dueDate.getTime()) / MS_PER_DAY));
    }
  }

  const daysVacant =
    status === "vacant"
      ? Math.max(0, Math.floor((now.getTime() - p.postedDate.getTime()) / MS_PER_DAY))
      : null;

  return {
    id: p.id,
    name: p.name,
    photoUrls: p.photoUrls,
    location: { city: p.location.city, state: p.location.state },
    status,
    monthlyRent: active ? active.rent : p.pricePerMonth,
    leaseStart: active ? active.startDate : null,
    leaseEnd: active ? active.endDate : null,
    daysVacant,
    daysLate,
  };
}
```

- [ ] **Step 2: Type-check.**

Run: `npx tsc --noEmit`
Expected: pass.

- [ ] **Step 3: Commit.**

```bash
git add lib/manager-overview.ts
git commit -m "Phase 13 - In Progress - propertyToCardDTO shaper"
```

---

## Task 4 — `computeKpi` aggregator

**Files:**
- Modify: `lib/manager-overview.ts`

- [ ] **Step 1: Append `computeKpi`.**

```ts
// Append to lib/manager-overview.ts

type PropertyWithApps = PropertyLike & {
  applications: Array<{ status: string }>;
};

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function startOfNextMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}
function startOfPrevMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() - 1, 1);
}

export function computeKpi(properties: PropertyWithApps[], now: Date = new Date()): ManagerKpi {
  const mtdStart = startOfMonth(now);
  const mtdEnd = startOfNextMonth(now);
  const prevStart = startOfPrevMonth(now);
  const sixtyDaysOut = new Date(now.getTime() + 60 * MS_PER_DAY);

  let mrr = 0;
  let collectedMtd = 0;
  let outstandingMtd = 0;
  let prevCollected = 0;
  let prevPaymentsCount = 0;
  let occupied = 0;
  let openApps = 0;
  let expiringSoon = 0;

  for (const p of properties) {
    const active = pickActiveLease(p.leases, now);
    const status = propertyStatus(active);
    if (status === "occupied" || status === "late") occupied += 1;

    if (active) {
      mrr += active.rent;
      if (active.endDate.getTime() <= sixtyDaysOut.getTime()) expiringSoon += 1;
    }

    for (const lease of p.leases) {
      for (const pay of lease.payments) {
        const due = pay.dueDate.getTime();
        if (due >= mtdStart.getTime() && due < mtdEnd.getTime()) {
          collectedMtd += pay.amountPaid;
          if (pay.paymentStatus !== "Paid") {
            outstandingMtd += Math.max(0, pay.amountDue - pay.amountPaid);
          }
        }
        if (due >= prevStart.getTime() && due < mtdStart.getTime()) {
          prevCollected += pay.amountPaid;
          prevPaymentsCount += 1;
        }
      }
    }

    for (const app of p.applications) {
      if (app.status === "Pending") openApps += 1;
    }
  }

  return {
    mrr,
    mrrDeltaVsPrevMonth: prevPaymentsCount === 0 ? null : mrr - prevCollected,
    collectedMtd,
    outstandingMtd,
    occupied,
    total: properties.length,
    vacantCount: properties.length - occupied,
    openAppsCount: openApps,
    expiringSoonCount: expiringSoon,
  };
}
```

- [ ] **Step 2: Type-check.**

Run: `npx tsc --noEmit`
Expected: pass.

- [ ] **Step 3: Commit.**

```bash
git add lib/manager-overview.ts
git commit -m "Phase 13 - In Progress - computeKpi aggregator"
```

---

## Task 5 — `pickTopPerformer` selector

**Files:**
- Modify: `lib/manager-overview.ts`

- [ ] **Step 1: Append `pickTopPerformer`.**

```ts
// Append to lib/manager-overview.ts

/**
 * Highest active-lease rent; tiebreaker latest startDate.
 * Fallback when zero active leases: highest pricePerMonth.
 * Returns null only when properties is empty.
 */
export function pickTopPerformer(cards: PropertyCardDTO[]): PropertyCardDTO | null {
  if (cards.length === 0) return null;
  const occupiedish = cards.filter((c) => c.status !== "vacant");
  if (occupiedish.length > 0) {
    return [...occupiedish].sort((a, b) => {
      if (b.monthlyRent !== a.monthlyRent) return b.monthlyRent - a.monthlyRent;
      const aStart = a.leaseStart?.getTime() ?? 0;
      const bStart = b.leaseStart?.getTime() ?? 0;
      return bStart - aStart;
    })[0];
  }
  return [...cards].sort((a, b) => b.monthlyRent - a.monthlyRent)[0];
}
```

- [ ] **Step 2: Type-check.**

Run: `npx tsc --noEmit`
Expected: pass.

- [ ] **Step 3: Commit.**

```bash
git add lib/manager-overview.ts
git commit -m "Phase 13 - In Progress - pickTopPerformer selector"
```

---

## Task 6 — `getManagerOverview` Prisma orchestrator

**Files:**
- Modify: `lib/manager-overview.ts`

- [ ] **Step 1: Append the orchestrator.**

```ts
// Append to lib/manager-overview.ts
import { prisma } from "@/lib/prisma";

export async function getManagerOverview(managerId: string): Promise<ManagerOverview> {
  const now = new Date();

  const [manager, properties] = await Promise.all([
    prisma.manager.findUnique({ where: { userId: managerId }, select: { name: true } }),
    prisma.property.findMany({
      where: { managerId },
      include: {
        location: { select: { city: true, state: true } },
        applications: { select: { status: true } },
        leases: {
          include: {
            payments: {
              select: {
                paymentStatus: true,
                dueDate: true,
                amountDue: true,
                amountPaid: true,
                paymentDate: true,
              },
            },
          },
        },
      },
      orderBy: { postedDate: "desc" },
    }),
  ]);

  const cards = properties.map((p) => propertyToCardDTO(p, now));
  const kpi = computeKpi(properties, now);
  const topPerformer = pickTopPerformer(cards);

  return {
    manager: { name: manager?.name ?? "" },
    kpi,
    topPerformer,
    properties: cards,
  };
}
```

- [ ] **Step 2: Type-check.**

Run: `npx tsc --noEmit`
Expected: pass. (The Prisma payload type from `findMany` with `include` satisfies `PropertyWithApps` and `PropertyLike` structurally.)

If `tsc` complains about `applications.status` being an enum rather than `string`, change the `application.status` field type in `PropertyWithApps` to `string` (already done) — Prisma enum values widen to string.

- [ ] **Step 3: Smoke-test from the dev server.**

Add a temporary `console.log(JSON.stringify(...))` at the end of `getManagerOverview`:
```ts
console.log("[manager-overview]", { mrr: kpi.mrr, occupied: kpi.occupied, total: kpi.total });
```
Run `npm run dev`. In a separate terminal:
```bash
node -e "
const { prisma } = require('./lib/prisma');
require('./lib/manager-overview').getManagerOverview('<paste a manager user.id from seed>')
  .then(r => console.log(JSON.stringify(r.kpi, null, 2)));
"
```
*Skip this step if it's awkward; the page will exercise the function in Task 13 instead.*

Remove the temporary `console.log` before committing.

- [ ] **Step 4: Commit.**

```bash
git add lib/manager-overview.ts
git commit -m "Phase 13 - In Progress - getManagerOverview Prisma orchestrator"
```

---

## Task 7 — `getPropertyDetail` Prisma query

**Files:**
- Modify: `lib/manager-overview.ts`

- [ ] **Step 1: Append.**

```ts
// Append to lib/manager-overview.ts

export async function getPropertyDetail(
  propertyId: number,
  managerId: string,
): Promise<PropertyDetail | null> {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const p = await prisma.property.findFirst({
    where: { id: propertyId, managerId },
    include: {
      location: { select: { city: true, state: true } },
      applications: { select: { id: true } },
      leases: {
        include: {
          tenant: { select: { name: true, email: true, phoneNumber: true } },
          payments: {
            select: {
              paymentStatus: true,
              dueDate: true,
              amountDue: true,
              amountPaid: true,
              paymentDate: true,
            },
            orderBy: { dueDate: "desc" },
          },
        },
      },
    },
  });
  if (!p) return null;

  const active = pickActiveLease(p.leases, now);
  const status = propertyStatus(active);

  const allPayments = p.leases.flatMap((l) => l.payments);
  const collectedYtd = allPayments
    .filter((pay) => pay.dueDate.getTime() >= yearStart.getTime())
    .reduce((sum, pay) => sum + pay.amountPaid, 0);

  const ledger = (active ? active.payments : []).slice(0, 6).map((pay) => ({
    dueDate: pay.dueDate,
    paymentDate: pay.paymentStatus === "Paid" || pay.paymentStatus === "PartiallyPaid"
      ? pay.paymentDate
      : null,
    amountDue: pay.amountDue,
    amountPaid: pay.amountPaid,
    status: pay.paymentStatus as PropertyDetail["payments"][number]["status"],
  }));

  let overdue: PropertyDetail["overdue"] = null;
  if (status === "late" && active) {
    const overdueRows = active.payments.filter((pay) => pay.paymentStatus === "Overdue");
    const oldest = overdueRows.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0];
    overdue = {
      totalAmount: overdueRows.reduce((s, r) => s + (r.amountDue - r.amountPaid), 0),
      oldestDaysLate: oldest
        ? Math.max(0, Math.floor((now.getTime() - oldest.dueDate.getTime()) / MS_PER_DAY))
        : 0,
    };
  }

  // Locate the tenant via the active lease (Lease.tenantId references Tenant.userId).
  const activeTenantUserId = active ? p.leases.find((l) => l === active)?.tenantId : null;
  const tenantRow = activeTenantUserId
    ? p.leases.find((l) => l.tenantId === activeTenantUserId)?.tenant
    : null;

  return {
    id: p.id,
    name: p.name,
    type: p.propertyType,
    photoUrls: p.photoUrls,
    location: { city: p.location.city, state: p.location.state },
    postedDate: p.postedDate,
    pricePerMonth: p.pricePerMonth,
    status,
    monthlyRent: active ? active.rent : p.pricePerMonth,
    collectedYtd,
    activeLease: active && tenantRow
      ? {
          id: active.id,
          startDate: active.startDate,
          endDate: active.endDate,
          rent: active.rent,
          tenant: {
            name: tenantRow.name,
            email: tenantRow.email,
            phoneNumber: tenantRow.phoneNumber,
          },
        }
      : null,
    payments: ledger,
    applicationsCount: p.applications.length,
    overdue,
  };
}
```

- [ ] **Step 2: Type-check.**

Run: `npx tsc --noEmit`
Expected: pass.

- [ ] **Step 3: Commit.**

```bash
git add lib/manager-overview.ts
git commit -m "Phase 13 - In Progress - getPropertyDetail Prisma query"
```

---

## Task 8 — Shared `StatusChip` component

**Files:**
- Create: `components/manager/status-chip.tsx`

- [ ] **Step 1: Write the component.**

```tsx
// components/manager/status-chip.tsx
import type { PropertyStatus } from "@/lib/manager-overview";

const STYLES: Record<PropertyStatus, { bg: string; fg: string; dot: string; label: string }> = {
  occupied: {
    bg: "bg-accent-evergreen",
    fg: "text-surface-paper",
    dot: "bg-surface-paper/80",
    label: "Occupied",
  },
  vacant: {
    bg: "bg-signal-warning",
    fg: "text-ink",
    dot: "bg-ink/80",
    label: "Vacant",
  },
  late: {
    bg: "bg-signal-danger",
    fg: "text-surface-paper",
    dot: "bg-surface-paper/80",
    label: "Late",
  },
};

export function StatusChip({
  status,
  size = "sm",
}: {
  status: PropertyStatus;
  size?: "sm" | "md";
}) {
  const s = STYLES[status];
  const padding = size === "md" ? "px-3 py-1.5 text-caption" : "px-2.5 py-1 text-caption";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${padding} ${s.bg} ${s.fg} font-medium`}
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
```

If `bg-signal-warning` is not in DESIGN.json, fall back to `bg-amber-500/90`. If `bg-signal-danger` is missing, use `bg-rose-600`. Verify with:
```bash
grep -E "signal-(warning|danger)" globals.css DESIGN.json 2>/dev/null | head
```

- [ ] **Step 2: Type-check + lint.**

```bash
npx tsc --noEmit && npx eslint components/manager/status-chip.tsx
```
Expected: clean.

- [ ] **Step 3: Commit.**

```bash
git add components/manager/status-chip.tsx
git commit -m "Phase 13 - In Progress - StatusChip component"
```

---

## Task 9 — `KpiCard` component

**Files:**
- Create: `components/manager/kpi-card.tsx`

- [ ] **Step 1: Write the component.**

```tsx
// components/manager/kpi-card.tsx
import { priceFormatter } from "@/lib/format";
import type { ManagerKpi } from "@/lib/manager-overview";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function prevMonthShort(now = new Date()): string {
  return MONTHS[(now.getMonth() + 11) % 12];
}

function compactCurrency(n: number): string {
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return priceFormatter.format(n);
}

export function KpiCard({ kpi }: { kpi: ManagerKpi }) {
  const occupancyPct = kpi.total === 0 ? 0 : Math.round((kpi.occupied / kpi.total) * 100);

  return (
    <section className="rounded-2xl border border-hairline bg-surface-panel p-5">
      <h2 className="text-title text-ink">This Month</h2>
      <p className="text-caption text-ink-soft">Revenue + occupancy snapshot</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-surface-tone-deep p-4 text-surface-paper">
          <div className="text-caption uppercase tracking-wide opacity-80">MRR</div>
          <div className="mt-1 text-xl font-semibold tabular-nums">
            {compactCurrency(kpi.mrr)}
          </div>
          {kpi.mrrDeltaVsPrevMonth !== null && (
            <div className="mt-0.5 text-caption opacity-80 tabular-nums">
              {kpi.mrrDeltaVsPrevMonth >= 0 ? "+" : ""}
              {compactCurrency(kpi.mrrDeltaVsPrevMonth)} vs {prevMonthShort()}
            </div>
          )}
        </div>
        <div className="rounded-xl bg-surface-tone p-4">
          <div className="text-caption uppercase tracking-wide text-ink-soft">Occupied</div>
          <div className="mt-1 text-xl font-semibold tabular-nums text-ink">
            {kpi.occupied}/{kpi.total}
          </div>
          <div className="mt-0.5 text-caption text-ink-soft tabular-nums">{occupancyPct}%</div>
        </div>
      </div>

      <dl className="mt-4 divide-y divide-hairline">
        <Row label="Collected" value={priceFormatter.format(kpi.collectedMtd)} />
        <Row label="Outstanding" value={priceFormatter.format(kpi.outstandingMtd)} />
        <Row label="Vacant units" value={kpi.vacantCount === 0 ? "—" : String(kpi.vacantCount)} />
        <Row label="Open applications" value={kpi.openAppsCount === 0 ? "—" : String(kpi.openAppsCount)} />
        <Row label="Expiring <60d" value={kpi.expiringSoonCount === 0 ? "—" : String(kpi.expiringSoonCount)} />
      </dl>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <dt className="text-caption text-ink-soft">{label}</dt>
      <dd className="text-label font-medium tabular-nums text-ink">{value}</dd>
    </div>
  );
}
```

If `bg-surface-tone-deep` / `bg-surface-tone` are not in DESIGN.json, substitute `bg-stone-800` / `bg-stone-100` respectively. Verify:
```bash
grep -E "surface-tone(-deep)?" globals.css DESIGN.json 2>/dev/null
```

- [ ] **Step 2: Lint + type-check.**

```bash
npx tsc --noEmit && npx eslint components/manager/kpi-card.tsx
```
Expected: clean.

- [ ] **Step 3: Commit.**

```bash
git add components/manager/kpi-card.tsx
git commit -m "Phase 13 - In Progress - KpiCard component"
```

---

## Task 10 — `FeaturedProperty` hero

**Files:**
- Create: `components/manager/featured-property.tsx`

- [ ] **Step 1: Write the component.**

```tsx
// components/manager/featured-property.tsx
import Link from "next/link";

import { StatusChip } from "@/components/manager/status-chip";
import { priceFormatter } from "@/lib/format";
import { PLACEHOLDER } from "@/lib/images";
import type { PropertyCardDTO } from "@/lib/manager-overview";

export function FeaturedProperty({ property }: { property: PropertyCardDTO | null }) {
  if (!property) return null;
  const cover = property.photoUrls[0] ?? PLACEHOLDER;

  return (
    <Link
      href={`/dashboard/properties/${property.id}`}
      scroll={false}
      className="group relative block aspect-[16/7] overflow-hidden rounded-2xl bg-surface-sunk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-2 focus-visible:ring-offset-surface-paper"
      aria-label={`Top performer: ${property.name}, ${priceFormatter.format(property.monthlyRent)} per month`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cover}
        alt=""
        className="h-full w-full object-cover transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />

      <span className="absolute top-3 left-3 inline-flex items-center gap-2 rounded-full bg-ink/85 px-3 py-1.5 text-caption font-medium text-surface-paper tabular-nums">
        Top performer · {priceFormatter.format(property.monthlyRent)}/mo
      </span>

      <span className="absolute top-3 right-3">
        <StatusChip status={property.status} />
      </span>

      <span className="absolute bottom-3 left-3 right-3 flex items-baseline gap-2 text-surface-paper">
        <span className="text-title font-semibold drop-shadow-sm">{property.name}</span>
        <span className="text-caption opacity-90 drop-shadow-sm">
          {property.location.city}, {property.location.state}
        </span>
      </span>
    </Link>
  );
}
```

- [ ] **Step 2: Lint + type-check.**

```bash
npx tsc --noEmit && npx eslint components/manager/featured-property.tsx
```
Expected: clean.

- [ ] **Step 3: Commit.**

```bash
git add components/manager/featured-property.tsx
git commit -m "Phase 13 - In Progress - FeaturedProperty hero"
```

---

## Task 11 — `PropertyCardManager` grid tile

**Files:**
- Create: `components/manager/property-card-manager.tsx`

- [ ] **Step 1: Write the component.**

```tsx
// components/manager/property-card-manager.tsx
import Link from "next/link";

import { StatusChip } from "@/components/manager/status-chip";
import { dateFormatter } from "@/lib/format";
import { PLACEHOLDER } from "@/lib/images";
import type { PropertyCardDTO } from "@/lib/manager-overview";

function captionFor(p: PropertyCardDTO): string {
  if (p.status === "occupied" && p.leaseStart) {
    return `Leased since ${dateFormatter.format(p.leaseStart)}`;
  }
  if (p.status === "late" && p.daysLate !== null) {
    return `Late · ${p.daysLate} day${p.daysLate === 1 ? "" : "s"}`;
  }
  if (p.status === "vacant" && p.daysVacant !== null) {
    return `Listed ${p.daysVacant} day${p.daysVacant === 1 ? "" : "s"}`;
  }
  return "";
}

export function PropertyCardManager({ property }: { property: PropertyCardDTO }) {
  const cover = property.photoUrls[0] ?? PLACEHOLDER;
  const caption = captionFor(property);

  return (
    <article className="group relative flex flex-col gap-2 rounded-2xl border border-hairline bg-surface-paper overflow-hidden">
      <Link
        href={`/dashboard/properties/${property.id}`}
        scroll={false}
        aria-label={`${property.name} — ${property.status}`}
        className="absolute inset-0 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-2 focus-visible:ring-offset-surface-paper rounded-2xl"
      />
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-sunk">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cover}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
        <span className="absolute top-2 left-2">
          <StatusChip status={property.status} />
        </span>
      </div>
      <div className="relative z-0 px-3 pb-3 pt-1">
        <h3 className="text-title text-ink">{property.name}</h3>
        <p className="text-caption text-ink-soft tabular-nums">{caption}</p>
      </div>
    </article>
  );
}
```

- [ ] **Step 2: Lint + type-check.**

```bash
npx tsc --noEmit && npx eslint components/manager/property-card-manager.tsx
```
Expected: clean.

- [ ] **Step 3: Commit.**

```bash
git add components/manager/property-card-manager.tsx
git commit -m "Phase 13 - In Progress - PropertyCardManager grid tile"
```

---

## Task 12 — `PropertyCardGrid` grid shell

**Files:**
- Create: `components/manager/property-card-grid.tsx`

- [ ] **Step 1: Write the component.**

```tsx
// components/manager/property-card-grid.tsx
import { PropertyCardManager } from "@/components/manager/property-card-manager";
import type { PropertyCardDTO } from "@/lib/manager-overview";

export function PropertyCardGrid({ properties }: { properties: PropertyCardDTO[] }) {
  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {properties.map((p) => (
        <li key={p.id}>
          <PropertyCardManager property={p} />
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 2: Lint + type-check.**

```bash
npx tsc --noEmit && npx eslint components/manager/property-card-grid.tsx
```
Expected: clean.

- [ ] **Step 3: Commit.**

```bash
git add components/manager/property-card-grid.tsx
git commit -m "Phase 13 - In Progress - PropertyCardGrid grid shell"
```

---

## Task 13 — `PropertyDetailBody` (modal + full-page content)

**Files:**
- Create: `components/manager/property-detail-body.tsx`

- [ ] **Step 1: Write the component.**

```tsx
// components/manager/property-detail-body.tsx
import Link from "next/link";

import { StatusChip } from "@/components/manager/status-chip";
import { DeletePropertyButton } from "@/components/delete-property-button";
import { buttonClassName } from "@/components/ui/button";
import { dateFormatter, priceFormatter } from "@/lib/format";
import { PLACEHOLDER } from "@/lib/images";
import { humanize } from "@/lib/utils";
import type { PropertyDetail } from "@/lib/manager-overview";

const MONTH_DAY = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

function pillFor(status: PropertyDetail["payments"][number]["status"], dueDate: Date, paymentDate: Date | null) {
  if (status === "Paid" || status === "PartiallyPaid") {
    const label = status === "Paid" ? "Paid" : "Partial";
    return {
      cls: "bg-accent-evergreen/15 text-accent-evergreen",
      text: `${label} · ${MONTH_DAY.format(paymentDate ?? dueDate)}`,
    };
  }
  if (status === "Overdue") {
    return {
      cls: "bg-signal-danger/15 text-signal-danger",
      text: `Late · ${MONTH_DAY.format(dueDate)}`,
    };
  }
  return {
    cls: "bg-surface-sunk text-ink-soft",
    text: `Due · ${MONTH_DAY.format(dueDate)}`,
  };
}

export function PropertyDetailBody({
  detail,
  hideViewFullLease = false,
}: {
  detail: PropertyDetail;
  hideViewFullLease?: boolean;
}) {
  const cover = detail.photoUrls[0] ?? PLACEHOLDER;

  return (
    <div className="overflow-hidden rounded-2xl bg-surface-paper">
      <div className="relative aspect-[21/8] overflow-hidden bg-surface-sunk">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cover} alt="" className="h-full w-full object-cover" />
        <span className="absolute top-3 left-3">
          <StatusChip status={detail.status} size="md" />
        </span>
      </div>

      <div className="px-6 py-5">
        <h2 className="text-headline text-ink">{detail.name}</h2>
        <p className="text-caption text-ink-soft">
          {humanize(detail.type)} · {detail.location.city}, {detail.location.state} · Listed {dateFormatter.format(detail.postedDate)}
        </p>

        {/* Stat grid */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {detail.activeLease ? (
            <>
              <Stat label="Monthly rent" value={priceFormatter.format(detail.monthlyRent)} />
              <Stat label="Lease ends" value={dateFormatter.format(detail.activeLease.endDate)} />
              <Stat label="Collected YTD" value={priceFormatter.format(detail.collectedYtd)} />
            </>
          ) : (
            <>
              <Stat label="Ask price" value={priceFormatter.format(detail.pricePerMonth)} />
              <Stat label="Listed" value={dateFormatter.format(detail.postedDate)} />
              <Stat label="Applications" value={String(detail.applicationsCount)} />
            </>
          )}
        </div>

        {/* Overdue callout */}
        {detail.overdue && (
          <div className="mt-4 rounded-xl bg-signal-danger/10 px-4 py-3 text-caption text-signal-danger">
            Overdue: {priceFormatter.format(detail.overdue.totalAmount)} · {detail.overdue.oldestDaysLate} day
            {detail.overdue.oldestDaysLate === 1 ? "" : "s"}
          </div>
        )}

        {/* Tenant block / Vacant block */}
        {detail.activeLease ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-hairline bg-surface-panel p-4">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-accent-evergreen/15 text-label font-semibold text-accent-evergreen">
              {initials(detail.activeLease.tenant.name)}
            </span>
            <div className="flex-1">
              <div className="text-label font-medium text-ink">{detail.activeLease.tenant.name}</div>
              <div className="text-caption text-ink-soft">
                {detail.activeLease.tenant.email} · {detail.activeLease.tenant.phoneNumber} · since{" "}
                {dateFormatter.format(detail.activeLease.startDate)}
              </div>
            </div>
            <Link
              href={`/dashboard/applications?tenantId=${encodeURIComponent("")}`}
              className={buttonClassName({ variant: "ghost" })}
            >
              Message
            </Link>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-hairline bg-surface-panel p-4">
            <div className="text-label font-medium text-ink">No active lease.</div>
            <div className="mt-1 text-caption text-ink-soft">
              {detail.applicationsCount === 0
                ? "No applications yet."
                : `${detail.applicationsCount} application${detail.applicationsCount === 1 ? "" : "s"} received.`}
            </div>
            <div className="mt-3">
              <Link
                href={`/dashboard/applications?propertyId=${detail.id}`}
                className={buttonClassName({ variant: "secondary" })}
              >
                View applications
              </Link>
            </div>
          </div>
        )}

        {/* Payment history */}
        {detail.activeLease && (
          <>
            <div className="mt-5 text-caption uppercase tracking-wide text-ink-soft">Payment history</div>
            {detail.payments.length === 0 ? (
              <p className="mt-2 text-caption text-ink-soft">No payments yet.</p>
            ) : (
              <ul className="mt-2 divide-y divide-hairline">
                {detail.payments.map((pay, i) => {
                  const pill = pillFor(pay.status, pay.dueDate, pay.paymentDate);
                  return (
                    <li key={i} className="flex items-center justify-between py-2 text-label">
                      <span className="text-ink tabular-nums">
                        {pay.dueDate.toLocaleString("en-US", { month: "long", year: "numeric" })}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-caption font-medium ${pill.cls}`}>
                        {pill.text}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {!hideViewFullLease && (
            <a
              href={`/dashboard/properties/${detail.id}`}
              className={buttonClassName({ variant: "primary" })}
            >
              View full lease
            </a>
          )}
          <a
            href={`/dashboard/properties/${detail.id}/edit`}
            className={buttonClassName({ variant: "secondary" })}
          >
            Edit listing
          </a>
          <span
            title="Coming soon — distinct from delete"
            className={`${buttonClassName({ variant: "ghost" })} cursor-not-allowed opacity-50`}
            aria-disabled
          >
            End lease
          </span>
          <DeletePropertyButton propertyId={detail.id} variant="page" />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-tone p-3">
      <div className="text-caption uppercase tracking-wide text-ink-soft">{label}</div>
      <div className="mt-1 text-label font-semibold tabular-nums text-ink">{value}</div>
    </div>
  );
}
```

Note: `Message` link is a placeholder per spec §11; routing to applications is the temporary destination. The `tenantId=` value is left empty intentionally — `/dashboard/applications` already lists the tenant on each row, and we don't expose the tenant's `userId` in the DTO yet. (Replace with `detail.activeLease.id`-derived linkage if the applications page filters on lease in a later phase.)

- [ ] **Step 2: Lint + type-check.**

```bash
npx tsc --noEmit && npx eslint components/manager/property-detail-body.tsx
```
Expected: clean.

If `buttonClassName({ variant: "secondary" })` errors, check the component for the actual variant names — they may be `"primary" | "ghost" | "destructive"`. Substitute the closest match.

- [ ] **Step 3: Commit.**

```bash
git add components/manager/property-detail-body.tsx
git commit -m "Phase 13 - In Progress - PropertyDetailBody (occupied + vacant + late variants)"
```

---

## Task 14 — `PropertyModal` dialog chrome

**Files:**
- Create: `components/manager/property-modal.tsx`

- [ ] **Step 1: Write the component.**

```tsx
// components/manager/property-modal.tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function PropertyModal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!el.open) el.showModal();

    const onCancel = (e: Event) => {
      e.preventDefault();
      router.back();
    };
    el.addEventListener("cancel", onCancel);
    return () => el.removeEventListener("cancel", onCancel);
  }, [router]);

  const onBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) router.back();
  };

  return (
    <dialog
      ref={ref}
      onClick={onBackdropClick}
      className="fixed inset-0 max-h-none max-w-none h-full w-full bg-transparent p-0 backdrop:bg-ink/40 backdrop:backdrop-blur-[2px]"
    >
      <div className="flex min-h-full items-start justify-center p-4 sm:items-center sm:p-8">
        <div className="relative w-full max-w-[720px]">
          <button
            type="button"
            onClick={() => router.back()}
            className="absolute top-3 right-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface-paper text-ink shadow-sm hover:bg-surface-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen"
            aria-label="Close"
          >
            ×
          </button>
          {children}
        </div>
      </div>
    </dialog>
  );
}
```

- [ ] **Step 2: Lint + type-check.**

```bash
npx tsc --noEmit && npx eslint components/manager/property-modal.tsx
```
Expected: clean.

- [ ] **Step 3: Commit.**

```bash
git add components/manager/property-modal.tsx
git commit -m "Phase 13 - In Progress - PropertyModal dialog chrome (client)"
```

---

## Task 15 — `app/dashboard/properties/layout.tsx` (parallel slot wrapper)

**Files:**
- Create: `app/dashboard/properties/layout.tsx`

- [ ] **Step 1: Write the layout.**

```tsx
// app/dashboard/properties/layout.tsx
export default function PropertiesLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
```

- [ ] **Step 2: Type-check.**

Run: `npx tsc --noEmit`
Expected: pass.

- [ ] **Step 3: Commit.**

```bash
git add app/dashboard/properties/layout.tsx
git commit -m "Phase 13 - In Progress - properties route group layout accepts modal parallel slot"
```

---

## Task 16 — `@modal/default.tsx`

**Files:**
- Create: `app/dashboard/properties/@modal/default.tsx`

- [ ] **Step 1: Write the file.**

```tsx
// app/dashboard/properties/@modal/default.tsx
export default function ModalDefault() {
  return null;
}
```

- [ ] **Step 2: Commit.**

```bash
git add app/dashboard/properties/@modal/default.tsx
git commit -m "Phase 13 - In Progress - @modal default slot returns null"
```

---

## Task 17 — Intercepted modal route `@modal/(.)[id]/page.tsx`

**Files:**
- Create: `app/dashboard/properties/@modal/(.)[id]/page.tsx`

- [ ] **Step 1: Write the route.**

```tsx
// app/dashboard/properties/@modal/(.)[id]/page.tsx
import { notFound, redirect } from "next/navigation";

import { PropertyDetailBody } from "@/components/manager/property-detail-body";
import { PropertyModal } from "@/components/manager/property-modal";
import { requireUser } from "@/lib/auth";
import { getPropertyDetail } from "@/lib/manager-overview";

export const dynamic = "force-dynamic";

export default async function InterceptedPropertyModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  if (user.role !== "manager") redirect("/dashboard/favorites");

  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) notFound();

  const detail = await getPropertyDetail(numericId, user.id);
  if (!detail) notFound();

  return (
    <PropertyModal>
      <PropertyDetailBody detail={detail} />
    </PropertyModal>
  );
}
```

Note: Next.js 15 routes receive `params` as a `Promise`. Adjust if local Next typing differs (verify against `app/dashboard/properties/[id]/edit/page.tsx` for the existing convention).

- [ ] **Step 2: Type-check.**

Run: `npx tsc --noEmit`
Expected: pass.

- [ ] **Step 3: Commit.**

```bash
git add "app/dashboard/properties/@modal/(.)[id]/page.tsx"
git commit -m "Phase 13 - In Progress - intercepted modal route"
```

---

## Task 18 — Full-page fallback `[id]/page.tsx`

**Files:**
- Create: `app/dashboard/properties/[id]/page.tsx`

- [ ] **Step 1: Write the route.**

```tsx
// app/dashboard/properties/[id]/page.tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PropertyDetailBody } from "@/components/manager/property-detail-body";
import { requireUser } from "@/lib/auth";
import { getPropertyDetail } from "@/lib/manager-overview";

export const dynamic = "force-dynamic";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  if (user.role !== "manager") redirect("/dashboard/favorites");

  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) notFound();

  const detail = await getPropertyDetail(numericId, user.id);
  if (!detail) notFound();

  return (
    <div className="mx-auto max-w-[820px] space-y-4">
      <Link
        href="/dashboard/properties"
        className="inline-flex items-center gap-1 text-caption text-ink-soft hover:text-ink"
      >
        ← Back to properties
      </Link>
      <PropertyDetailBody detail={detail} hideViewFullLease />
    </div>
  );
}
```

- [ ] **Step 2: Type-check.**

Run: `npx tsc --noEmit`
Expected: pass.

- [ ] **Step 3: Commit.**

```bash
git add app/dashboard/properties/[id]/page.tsx
git commit -m "Phase 13 - In Progress - full-page fallback route"
```

---

## Task 19 — Rewrite `app/dashboard/properties/page.tsx`

**Files:**
- Modify (full rewrite): `app/dashboard/properties/page.tsx`

- [ ] **Step 1: Replace the entire file.**

```tsx
// app/dashboard/properties/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { HouseIcon } from "@/components/icons";
import { FeaturedProperty } from "@/components/manager/featured-property";
import { KpiCard } from "@/components/manager/kpi-card";
import { PropertyCardGrid } from "@/components/manager/property-card-grid";
import { buttonClassName } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getManagerOverview } from "@/lib/manager-overview";

export const dynamic = "force-dynamic";

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}

export default async function PropertiesPage() {
  const user = await requireUser();
  if (user.role !== "manager") redirect("/dashboard/favorites");

  const overview = await getManagerOverview(user.id);

  if (overview.properties.length === 0) {
    return (
      <EmptyState
        icon={<HouseIcon />}
        title="No properties yet"
        description="Add your first listing to start receiving applications from prospective tenants."
        cta={{ href: "/dashboard/properties/new", label: "Add a property" }}
      />
    );
  }

  const greeting = overview.manager.name
    ? `Hi ${firstName(overview.manager.name)}`
    : "Your portfolio";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-headline text-ink">{greeting}</h1>
          <p className="text-caption text-ink-soft tabular-nums">
            {overview.kpi.total} {overview.kpi.total === 1 ? "property" : "properties"} ·{" "}
            {overview.kpi.occupied} leased · {overview.kpi.vacantCount} vacant
          </p>
        </div>
        <Link
          href="/dashboard/properties/new"
          className={buttonClassName({ variant: "primary" })}
        >
          Add a property
        </Link>
      </header>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <KpiCard kpi={overview.kpi} />
        </div>
        <div className="space-y-4">
          <FeaturedProperty property={overview.topPerformer} />
          <PropertyCardGrid properties={overview.properties} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build the whole thing.**

```bash
npm run build
```
Expected: build succeeds. If a path mismatch or Tailwind class typo surfaces, fix it before continuing.

- [ ] **Step 3: Commit.**

```bash
git add app/dashboard/properties/page.tsx
git commit -m "Phase 13 - In Progress - rewrite /dashboard/properties to ops console"
```

---

## Task 20 — Loading + error boundaries

**Files:**
- Create: `app/dashboard/properties/loading.tsx`
- Create: `app/dashboard/properties/error.tsx`

- [ ] **Step 1: Write `loading.tsx`.**

```tsx
// app/dashboard/properties/loading.tsx
export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-7 w-48 rounded-md bg-surface-sunk motion-safe:animate-pulse" />
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2 rounded-2xl border border-hairline bg-surface-panel p-5">
          <div className="h-5 w-32 rounded bg-surface-sunk motion-safe:animate-pulse" />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="h-24 rounded-xl bg-surface-sunk motion-safe:animate-pulse" />
            <div className="h-24 rounded-xl bg-surface-sunk motion-safe:animate-pulse" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-5 w-full rounded bg-surface-sunk motion-safe:animate-pulse" />
          ))}
        </div>
        <div className="space-y-4">
          <div className="aspect-[16/7] rounded-2xl bg-surface-sunk motion-safe:animate-pulse" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-[16/10] rounded-2xl bg-surface-sunk motion-safe:animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write `error.tsx`.**

```tsx
// app/dashboard/properties/error.tsx
"use client";

import { buttonClassName } from "@/components/ui/button";

export default function PropertiesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-md space-y-3 py-12 text-center">
      <h1 className="text-headline text-ink">Couldn't load your portfolio.</h1>
      <p className="text-caption text-ink-soft">{error.message}</p>
      <button type="button" onClick={reset} className={buttonClassName({ variant: "primary" })}>
        Try again
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Type-check.**

Run: `npx tsc --noEmit`
Expected: pass.

- [ ] **Step 4: Commit.**

```bash
git add app/dashboard/properties/loading.tsx app/dashboard/properties/error.tsx
git commit -m "Phase 13 - In Progress - loading skeleton + error boundary"
```

---

## Task 21 — Manual smoke + acceptance

This is the verification gate from spec §14.

- [ ] **Step 1: Start dev server.**

```bash
npm run dev
```

- [ ] **Step 2: Sign in as manager.**

Visit `http://localhost:3000/signin` → `john.smith@example.com` / `password123` → redirected to `/dashboard/properties`.

Confirm visually:
- Header `Hi John` + count caption + `Add a property` button.
- Left col: KPI card with MRR + Occupied tiles + 5 breakdown rows.
- Right col row 1: featured-property tile (16:7) with Top performer chip + status chip + name + city.
- Right col row 2: card grid with status chip on each photo.

- [ ] **Step 3: Click any card.**

URL changes to `/dashboard/properties/[id]`. Modal overlays grid with photo + status chip + name + stat grid + tenant block (or vacant block) + payment history (occupied only) + action row.

- [ ] **Step 4: Dismiss modal three ways.**

- Click backdrop → modal closes, URL back to `/dashboard/properties`.
- Open again, press `Esc` → closes.
- Open again, click `×` button → closes.

- [ ] **Step 5: Refresh on a modal URL.**

While modal is open, hit `Cmd+R`. Expected: full-page fallback renders the same body, with `← Back to properties` link at top instead of scrim/close.

- [ ] **Step 6: Cross-manager 404.**

In a separate browser window, sign in as a different seed manager (look at seed for IDs). Take a property `id` from john's set (visible in URL). Paste `/dashboard/properties/<that-id>` as the other manager → expect a 404 (`notFound()` from `getPropertyDetail`).

- [ ] **Step 7: Tenant redirect.**

Sign in as `smoke@test.com` / `password123` (tenant). Visit `/dashboard/properties` → redirected to `/dashboard/favorites`. Visit `/dashboard/properties/<any-id>` → redirected to `/dashboard/favorites`.

- [ ] **Step 8: Reconcile KPIs against DB.**

```bash
npx prisma studio
```
Open the `Payment` table. Filter to `dueDate` in the current month. Sum `amountPaid` column. Compare to `Collected` value in the KPI card. They should match. Repeat for `Outstanding` (sum of `amountDue - amountPaid` where `paymentStatus !== 'Paid'`).

- [ ] **Step 9: Verify `next build` + `eslint`.**

```bash
npm run build
npm run lint
```
Expected: both clean.

- [ ] **Step 10: Lighthouse (Vercel preview).**

Push to a branch, open Vercel preview URL for `/dashboard/properties` (signed in as a manager). Run Lighthouse in DevTools → log `Performance` and `Accessibility` scores in the final commit body. Target ≥85 / ≥95 per spec §14.

- [ ] **Step 11: Final commit.**

```bash
git add -A
git commit -m "Phase 13 - Done - manager ops console (replaces /dashboard/properties: KPI col + featured hero + property card grid + intercepted-route modal)" \
  -m "Lighthouse perf: <X>, a11y: <Y>." \
  -m "" \
  -m "Components: KpiCard + FeaturedProperty + PropertyCardManager + PropertyCardGrid + PropertyDetailBody + PropertyModal + StatusChip." \
  -m "" \
  -m "Data: lib/manager-overview.ts — one Prisma findMany on Property by managerId, in-memory KPI reducer. getPropertyDetail scoped to managerId — cross-manager access returns 404."
```

If new files were staged in any prior step that didn't commit (unlikely with the per-task commits above), `git add -A` will catch them.

---

## Self-review

Spec coverage:

| Spec section | Task(s) |
|---|---|
| §2 Routes (page + [id] + intercepted + new untouched) | T15–T19 |
| §3 KpiCard | T9 |
| §3 FeaturedProperty + top-performer fallback | T5, T10 |
| §3 PropertyCardManager caption rules | T11 |
| §3 PropertyCardGrid | T12 |
| §3 PropertyDetailBody occupied/vacant/late variants | T13 |
| §3 PropertyModal native dialog + Esc + backdrop | T14 |
| §3 layout.tsx parallel slot | T15 |
| §4 ManagerOverview + types + Prisma orchestrator | T1, T6 |
| §4 getPropertyDetail scoped by managerId | T7 |
| §5 KPI math (MRR, MTD, occupied, expiring, openApps) | T4 |
| §6 Empty state | T19 |
| §6 Loading skeleton | T20 |
| §6 Error boundary | T20 |
| §6 Reduced-motion handling | T9, T10, T11, T20 (motion-safe / motion-reduce classes) |
| §6 Non-manager redirect | T17, T18, T19 |
| §7 Tokens (StatusChip + KpiCard + dialog scrim) | T8, T9, T14 |
| §8 a11y (dialog, dl in KPI breakdown, status chip text not color-only) | T8, T9, T14 |
| §9 Performance (one query for page, lazy photos, no mapbox) | T6, T11 |
| §10 Tenant.phoneNumber + multiple active leases warn | T2, T7 |
| §11 Out of scope: End lease disabled tooltip | T13 |
| §11 In scope (per amendment): Edit + Delete enabled | T13 |
| §14 Acceptance | T21 |

Placeholder scan: no `TBD`, `TODO`, "implement later", "add appropriate error handling", "similar to Task N". All code blocks contain the actual code to paste. Two intentional `if missing in DESIGN.json, substitute …` notes (Task 8, Task 9) are guidance for the engineer when DESIGN tokens drift; they are not gaps in the plan.

Type consistency: `PropertyCardDTO`, `ManagerKpi`, `ManagerOverview`, `PropertyDetail`, `PropertyStatus` defined in T1, referenced verbatim in T6, T7, T8, T9, T10, T11, T13. Function names: `pickActiveLease` (T2) referenced in T3, T6, T7. `propertyStatus` (T2) referenced in T3, T7. `propertyToCardDTO` (T3) called from T6. `computeKpi` (T4) called from T6. `pickTopPerformer` (T5) called from T6. `getManagerOverview` (T6) and `getPropertyDetail` (T7) called from T17, T18, T19 respectively. All consistent.
