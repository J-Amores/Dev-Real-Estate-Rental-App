import { PropertyCard } from "@/components/property-card";
import type { SearchResult } from "@/lib/queries";

type Props = {
  properties: SearchResult[];
  favoriteIds?: Set<number>;
};

export function Listings({ properties, favoriteIds }: Props) {
  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-start gap-2 rounded-lg border border-hairline bg-surface-paper p-6">
        <h2 className="text-title text-ink">No matches</h2>
        <p className="max-w-prose text-body text-ink-soft">
          No properties match these filters. Try widening the price range, lowering the bed
          or bath count, or clearing the location.
        </p>
      </div>
    );
  }

  const showFavorite = favoriteIds != null;

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2">
      {properties.map((p) => (
        <li key={p.id}>
          <PropertyCard
            variant="public"
            id={p.id}
            name={p.name}
            pricePerMonth={p.pricePerMonth}
            propertyType={p.propertyType}
            photoUrls={p.photoUrls}
            location={{ city: p.city, state: p.state }}
            showFavorite={showFavorite}
            isFavorited={favoriteIds?.has(p.id) ?? false}
          />
        </li>
      ))}
    </ul>
  );
}
