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
