import type { PropertyStatus } from "@/lib/manager-overview";

type StyleEntry = {
  bg: string;
  fg: string;
  label: string;
  icon: "check" | "clock" | "x";
};

const STYLES: Record<PropertyStatus, StyleEntry> = {
  occupied: {
    bg: "bg-accent-evergreen-soft",
    fg: "text-accent-evergreen-deep",
    label: "Occupied",
    icon: "check",
  },
  vacant: {
    bg: "bg-signal-warning/15",
    fg: "text-signal-warning",
    label: "Vacant",
    icon: "clock",
  },
  late: {
    bg: "bg-signal-danger/15",
    fg: "text-signal-danger",
    label: "Late",
    icon: "x",
  },
};

function ChipIcon({ kind, className }: { kind: StyleEntry["icon"]; className: string }) {
  if (kind === "check") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden className={className} fill="none">
        <path
          d="M3.5 8.5l2.8 2.8 6.2-6.2"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (kind === "clock") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden className={className} fill="none">
        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 5v3l2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={className} fill="none">
      <path
        d="M4.5 4.5l7 7M11.5 4.5l-7 7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function StatusChip({
  status,
  size = "sm",
}: {
  status: PropertyStatus;
  size?: "sm" | "md";
}) {
  const s = STYLES[status];
  const pad = size === "md" ? "px-2.5 py-1.5 text-caption" : "px-2 py-1 text-caption";
  const icon = size === "md" ? "h-3.5 w-3.5" : "h-3 w-3";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-xs ${pad} ${s.bg} ${s.fg} font-medium`}
    >
      <ChipIcon kind={s.icon} className={icon} />
      {s.label}
    </span>
  );
}
