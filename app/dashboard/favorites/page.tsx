import { redirect } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { PropertyCard } from "@/components/property-card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "tenant") redirect("/dashboard/properties");
  if (typeof session.user.tenantId !== "number") redirect("/signin");

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
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
        icon={
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7"
            aria-hidden
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        }
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
