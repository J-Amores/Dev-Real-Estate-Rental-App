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
      className="group relative block aspect-[16/7] overflow-hidden rounded-lg bg-surface-sunk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-2 focus-visible:ring-offset-surface-paper"
      aria-label={`Top performer: ${property.name}, ${priceFormatter.format(property.monthlyRent)} per month`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cover}
        alt=""
        className="h-full w-full object-cover transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />

      <span className="absolute top-3 left-3 inline-flex items-center gap-2 rounded-sm bg-ink/85 px-3 py-1.5 text-caption font-medium tabular-nums text-surface-paper">
        Top performer · {priceFormatter.format(property.monthlyRent)}/mo
      </span>

      <span className="absolute top-3 right-3">
        <StatusChip status={property.status} />
      </span>

      <span className="absolute bottom-3 left-3 right-3 flex flex-wrap items-baseline gap-x-2 gap-y-0 text-surface-paper">
        <span className="text-title font-semibold drop-shadow-sm">{property.name}</span>
        <span className="text-caption opacity-90 drop-shadow-sm">
          {property.location.city}, {property.location.state}
        </span>
      </span>
    </Link>
  );
}
