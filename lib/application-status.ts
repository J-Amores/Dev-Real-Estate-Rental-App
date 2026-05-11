import type { ApplicationStatus } from "@prisma/client";

export const APPLICATION_STATUS_COLOR: Record<ApplicationStatus, string> = {
  Pending: "bg-surface-sunk text-ink-soft",
  Approved: "bg-accent-evergreen-soft text-accent-evergreen-deep",
  Denied: "bg-signal-danger/10 text-signal-danger",
};
