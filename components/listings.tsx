import Link from "next/link";

import { PropertyCard } from "@/components/property-card";
import { DiscoveryGrid } from "@/components/search/discovery-grid";
import { buttonClassName } from "@/components/ui/button";
import type { SearchResult } from "@/lib/queries";

type Props = {
  properties: SearchResult[];
  favoriteIds?: Set<number>;
};

const PRIORITY_COUNT = 4;

export function Listings({ properties, favoriteIds }: Props) {
  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg border border-hairline bg-surface-paper p-6">
        <h2 className="text-title text-ink">No matches</h2>
        <p className="max-w-prose text-body text-ink-soft">
          Try widening the price range, lowering bed or bath count, or clearing the location.
        </p>
        <Link href="/search" className={buttonClassName({ variant: "secondary" })}>
          Clear all filters
        </Link>
      </div>
    );
  }

  const showFavorite = favoriteIds != null;

  return (
    <DiscoveryGrid>
      {properties.map((p, index) => (
        <PropertyCard
          key={p.id}
          variant="discovery"
          id={p.id}
          name={p.name}
          pricePerMonth={p.pricePerMonth}
          propertyType={p.propertyType}
          photoUrls={p.photoUrls}
          location={{ city: p.city, state: p.state }}
          showFavorite={showFavorite}
          isFavorited={favoriteIds?.has(p.id) ?? false}
          priority={index < PRIORITY_COUNT}
        />
      ))}
    </DiscoveryGrid>
  );
}
