import Link from "next/link";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { HouseIcon } from "@/components/icons";
import { FeaturedProperty } from "@/components/manager/featured-property";
import { KpiCard } from "@/components/manager/kpi-card";
import { PropertyCardGrid } from "@/components/manager/property-card-grid";
import { buttonClassName } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getManagerOverview } from "@/lib/manager-overview";

export const dynamic = "force-dynamic";

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}

export default async function PropertiesPage() {
  const user = await requireUser();
  if (user.role !== "manager") redirect("/dashboard/favorites");

  const overview = await getManagerOverview(user.id);

  if (overview.properties.length === 0) {
    return (
      <EmptyState
        icon={<HouseIcon />}
        title="No properties yet"
        description="Add your first listing to start receiving applications from prospective tenants."
        cta={{ href: "/dashboard/properties/new", label: "Add a property" }}
      />
    );
  }

  const greeting = overview.manager.name
    ? `Hi ${firstName(overview.manager.name)}`
    : "Your portfolio";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-headline text-ink">{greeting}</h1>
          <p className="text-caption tabular-nums text-ink-soft">
            {overview.kpi.total} {overview.kpi.total === 1 ? "property" : "properties"} ·{" "}
            {overview.kpi.occupied} leased · {overview.kpi.vacantCount} vacant
          </p>
        </div>
        <Link
          href="/dashboard/properties/new"
          className={buttonClassName({ variant: "primary" })}
        >
          Add a property
        </Link>
      </header>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <KpiCard kpi={overview.kpi} />
        </div>
        <div className="space-y-4">
          <FeaturedProperty property={overview.topPerformer} />
          <PropertyCardGrid properties={overview.properties} />
        </div>
      </div>
    </div>
  );
}
