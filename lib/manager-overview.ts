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
