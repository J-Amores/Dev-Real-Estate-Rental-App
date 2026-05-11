import type { ApplicationStatus } from "@prisma/client";

export const APPLICATION_STATUS_COLOR: Record<ApplicationStatus, string> = {
  Pending: "bg-surface-sunk text-ink-soft",
  Approved: "bg-accent-evergreen-soft text-accent-evergreen-deep",
  Denied: "bg-signal-danger/10 text-signal-danger",
};

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  Pending: "Application pending",
  Approved: "Application approved",
  Denied: "Application denied",
};
