"use client";

import { X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { priceFormatter } from "@/lib/format";
import { humanize } from "@/lib/utils";

type Chip = {
  id: string;
  label: string;
  ariaLabel: string;
  keysToRemove: string[];
};

function formatPriceRange(min: number | null, max: number | null): string | null {
  if (min != null && max != null) {
    return `${priceFormatter.format(min)}–${priceFormatter.format(max)}`;
  }
  if (min != null) return `${priceFormatter.format(min)}+`;
  if (max != null) return `Under ${priceFormatter.format(max)}`;
  return null;
}

function parsePositive(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

const CHIP_CLASS =
  "inline-flex items-center gap-1.5 rounded-sm border border-hairline " +
  "bg-accent-evergreen-soft px-2.5 py-1.5 text-caption tabular-nums text-accent-evergreen-deep " +
  "transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none " +
  "hover:bg-accent-evergreen hover:text-surface-paper " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-2 focus-visible:ring-offset-surface-paper";

export function ActiveFilterChips() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const chips: Chip[] = [];

  const beds = parsePositive(params.get("beds"));
  if (beds) {
    chips.push({
      id: "beds",
      label: `${beds}+ beds`,
      ariaLabel: `Remove beds filter (${beds}+)`,
      keysToRemove: ["beds"],
    });
  }

  const baths = parsePositive(params.get("baths"));
  if (baths) {
    chips.push({
      id: "baths",
      label: `${baths}+ baths`,
      ariaLabel: `Remove baths filter (${baths}+)`,
      keysToRemove: ["baths"],
    });
  }

  const priceMin = parsePositive(params.get("priceMin"));
  const priceMax = parsePositive(params.get("priceMax"));
  const priceLabel = formatPriceRange(priceMin, priceMax);
  if (priceLabel) {
    chips.push({
      id: "price",
      label: priceLabel,
      ariaLabel: `Remove price filter (${priceLabel})`,
      keysToRemove: ["priceMin", "priceMax"],
    });
  }

  const propertyType = params.get("propertyType");
  if (propertyType) {
    chips.push({
      id: "propertyType",
      label: humanize(propertyType),
      ariaLabel: `Remove property type filter (${humanize(propertyType)})`,
      keysToRemove: ["propertyType"],
    });
  }

  if (chips.length === 0) return null;

  function remove(keys: string[]) {
    const next = new URLSearchParams(params.toString());
    keys.forEach((k) => next.delete(k));
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <>
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          aria-label={chip.ariaLabel}
          onClick={() => remove(chip.keysToRemove)}
          className={CHIP_CLASS}
        >
          <span>{chip.label}</span>
          <X aria-hidden className="size-3" />
        </button>
      ))}
    </>
  );
}
