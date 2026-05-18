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

type PaymentLike = {
  paymentStatus: string;
  dueDate: Date;
  amountDue: number;
  amountPaid: number;
  paymentDate: Date | null;
};

type LeaseLike = {
  endDate: Date;
  startDate: Date;
  rent: number;
  payments: PaymentLike[];
};

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

export function propertyStatus(activeLease: LeaseLike | null): PropertyStatus {
  if (!activeLease) return "vacant";
  const hasOverdue = activeLease.payments.some((p) => p.paymentStatus === "Overdue");
  return hasOverdue ? "late" : "occupied";
}

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
