import { Filters, type FilterValues } from "@/components/filters";
import { Listings } from "@/components/listings";
import { SearchMap } from "@/components/map";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  searchProperties,
  type PropertyType,
  type SearchFilters,
} from "@/lib/queries";
import { PROPERTY_TYPES } from "@/lib/schemas";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parsePositiveNumber(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function parseCoordinate(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function parsePropertyType(raw: string | undefined): PropertyType | undefined {
  if (!raw) return undefined;
  return (PROPERTY_TYPES as readonly string[]).includes(raw)
    ? (raw as PropertyType)
    : undefined;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  const filters: SearchFilters = {
    lat: parseCoordinate(firstString(sp.lat)),
    lng: parseCoordinate(firstString(sp.lng)),
    beds: parsePositiveNumber(firstString(sp.beds)),
    baths: parsePositiveNumber(firstString(sp.baths)),
    propertyType: parsePropertyType(firstString(sp.propertyType)),
    priceMin: parsePositiveNumber(firstString(sp.priceMin)),
    priceMax: parsePositiveNumber(firstString(sp.priceMax)),
  };

  const initial: FilterValues = {
    location: firstString(sp.location),
    beds: filters.beds,
    baths: filters.baths,
    propertyType: filters.propertyType,
    priceMin: filters.priceMin,
    priceMax: filters.priceMax,
  };

  const properties = await searchProperties(filters);

  const session = await auth();
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
      <header className="sticky top-0 z-20 border-b border-hairline bg-surface-paper">
        <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Filters initial={initial} />
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-3 pb-4">
          <h1 className="text-headline text-ink">
            {initial.location ? `Homes near ${initial.location}` : "Homes for rent"}
          </h1>
          <p className="text-caption text-ink-soft tabular-nums">
            {properties.length}{" "}
            {properties.length === 1 ? "result" : "results"}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Listings properties={properties} favoriteIds={favoriteIds} />

          <aside className="h-[60vh] lg:h-auto lg:sticky lg:top-28">
            <div className="h-full lg:h-[calc(100vh-7.5rem)]">
              <SearchMap properties={properties} />
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
