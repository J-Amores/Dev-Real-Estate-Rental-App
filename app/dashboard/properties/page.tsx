import Link from "next/link";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { HouseIcon } from "@/components/icons";
import { PropertyCard } from "@/components/property-card";
import { buttonClassName } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const user = await requireUser();
  if (user.role !== "manager") redirect("/dashboard/favorites");

  const properties = await prisma.property.findMany({
    where: { managerId: user.id },
    select: {
      id: true,
      name: true,
      pricePerMonth: true,
      propertyType: true,
      photoUrls: true,
      location: { select: { city: true, state: true } },
    },
    orderBy: { postedDate: "desc" },
  });

  if (properties.length === 0) {
    return (
      <EmptyState
        icon={<HouseIcon />}
        title="No properties yet"
        description="Add your first listing to start receiving applications from prospective tenants."
        cta={{ href: "/dashboard/properties/new", label: "Add a property" }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-headline text-ink">Properties</h1>
          <p className="text-caption text-ink-soft">
            {properties.length} {properties.length === 1 ? "listing" : "listings"}.
          </p>
        </div>
        <Link
          href="/dashboard/properties/new"
          className={buttonClassName({ variant: "primary" })}
        >
          Add a property
        </Link>
      </header>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {properties.map((p) => (
          <li key={p.id}>
            <PropertyCard
              id={p.id}
              name={p.name}
              pricePerMonth={p.pricePerMonth}
              propertyType={p.propertyType}
              photoUrls={p.photoUrls}
              location={p.location}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
