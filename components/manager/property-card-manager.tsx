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
    return `Listed ${p.daysVacant} day${p.daysVacant === 1 ? "" : "s"} ago`;
  }
  return "";
}

export function PropertyCardManager({ property }: { property: PropertyCardDTO }) {
  const cover = property.photoUrls[0] ?? PLACEHOLDER;
  const caption = captionFor(property);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-hairline bg-surface-paper">
      <Link
        href={`/dashboard/properties/${property.id}`}
        scroll={false}
        aria-label={`${property.name} — ${property.status}`}
        className="absolute inset-0 z-10 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-2 focus-visible:ring-offset-surface-paper"
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
      <div className="relative z-0 px-3 pb-3 pt-2">
        <h3 className="text-title text-ink">{property.name}</h3>
        <p className="text-caption tabular-nums text-ink-soft">{caption}</p>
      </div>
    </article>
  );
}
