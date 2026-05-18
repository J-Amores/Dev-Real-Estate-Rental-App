import { redirect } from "next/navigation";

import { Listings } from "@/components/listings";
import { SearchHero } from "@/components/search/search-hero";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { searchProperties } from "@/lib/queries";
import { parseLocation, parseSearchFilters } from "@/lib/search-params";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (session?.user?.role === "manager") redirect("/dashboard/properties");

  const sp = await searchParams;
  const filters = parseSearchFilters(sp);
  const location = parseLocation(sp);

  const properties = await searchProperties(filters);

  let favoriteIds: Set<number> | undefined;
  if (
    session?.user?.role === "tenant" &&
    typeof session.user.tenantId === "number"
  ) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { favorites: { select: { id: true } } },
    });
    favoriteIds = new Set(tenant?.favorites.map((f) => f.id) ?? []);
  }

  return (
    <main className="flex min-h-screen flex-col bg-surface-paper">
      <SearchHero defaultLocation={location} />
      <section className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Listings properties={properties} favoriteIds={favoriteIds} />
      </section>
    </main>
  );
}
