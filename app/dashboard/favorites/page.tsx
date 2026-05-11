import { redirect } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { HeartIcon } from "@/components/icons";
import { PropertyCard } from "@/components/property-card";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const user = await requireUser();
  if (user.role !== "tenant") redirect("/dashboard/properties");
  if (typeof user.tenantId !== "number") redirect("/signin");

  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    select: {
      favorites: {
        orderBy: { postedDate: "desc" },
        select: {
          id: true,
          name: true,
          pricePerMonth: true,
          propertyType: true,
          photoUrls: true,
          location: { select: { city: true, state: true } },
        },
      },
    },
  });

  const favorites = tenant?.favorites ?? [];

  if (favorites.length === 0) {
    return (
      <EmptyState
        icon={<HeartIcon />}
        title="No favorites yet"
        description="Save properties you're interested in by tapping the heart on any listing."
        cta={{ href: "/search", label: "Browse listings" }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-headline text-ink">Favorites</h1>
        <p className="text-caption text-ink-soft">
          {favorites.length} saved {favorites.length === 1 ? "listing" : "listings"}.
        </p>
      </header>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {favorites.map((p) => (
          <li key={p.id}>
            <PropertyCard
              variant="public"
              id={p.id}
              name={p.name}
              pricePerMonth={p.pricePerMonth}
              propertyType={p.propertyType}
              photoUrls={p.photoUrls}
              location={p.location}
              showFavorite
              isFavorited
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
