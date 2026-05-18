import { ActiveFilterChips } from "@/components/search/active-filter-chips";
import { DotPattern } from "@/components/search/dot-pattern";
import { MapLink } from "@/components/search/map-link";
import {
  RefinePanel,
  RefineProvider,
  RefineTrigger,
} from "@/components/search/refine-disclosure";
import { SearchInputPill } from "@/components/search/search-input-pill";
import { auth } from "@/lib/auth";
import { getGreeting } from "@/lib/greeting";
import { prisma } from "@/lib/prisma";
import { firstNameOf } from "@/lib/tenant-name";

type Props = {
  defaultLocation?: string;
};

// Tenant name is not on the session payload (jwt callback only stores id / role /
// tenantId / managerId), so we read it here when the route is signed-in tenant.
async function resolveTenantFirstName(): Promise<string | null> {
  const session = await auth();
  if (session?.user?.role !== "tenant") return null;
  const tenantId = session.user.tenantId;
  if (typeof tenantId !== "number") return null;
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true },
  });
  return firstNameOf(tenant?.name);
}

export async function SearchHero({ defaultLocation }: Props) {
  const firstName = await resolveTenantFirstName();
  const greeting = getGreeting(new Date(), firstName);
  const personalized = firstName != null;

  return (
    <section className="relative isolate overflow-hidden bg-surface-paper">
      <DotPattern />
      <div className="relative mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
        <h1 className="text-display text-ink">{greeting}</h1>
        {personalized && (
          <p className="mt-2 text-body text-ink-soft">
            Let&apos;s find your next stay.
          </p>
        )}
        <div className="mt-8">
          <SearchInputPill defaultLocation={defaultLocation} />
        </div>
        <RefineProvider>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <ActiveFilterChips />
            <RefineTrigger />
            <MapLink className="ml-auto" />
          </div>
          <div className="mt-3">
            <RefinePanel />
          </div>
        </RefineProvider>
      </div>
    </section>
  );
}
