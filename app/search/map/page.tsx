import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ActiveFilterChips } from "@/components/search/active-filter-chips";
import { SearchMap } from "@/components/map";
import { buttonClassName } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { searchProperties } from "@/lib/queries";
import { parseSearchFilters, serializeRawParams } from "@/lib/search-params";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SearchMapPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (session?.user?.role === "manager") redirect("/dashboard/properties");

  const sp = await searchParams;
  const filters = parseSearchFilters(sp);
  const rawParams = serializeRawParams(sp);
  const properties = await searchProperties(filters);
  const count = properties.length;
  const backHref = rawParams ? `/search?${rawParams}` : "/search";

  return (
    <main className="flex h-[100dvh] flex-col bg-surface-paper">
      <header className="sticky top-0 z-20 border-b border-hairline bg-surface-paper px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
          <Link
            href={backHref}
            aria-label="Back to results list"
            className={buttonClassName({ variant: "ghost" })}
          >
            <ChevronLeft aria-hidden className="size-4" />
            Back to results
          </Link>
          <p
            role="status"
            aria-live="polite"
            className="text-caption tabular-nums text-ink-soft"
          >
            {count} {count === 1 ? "result" : "results"}
          </p>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <ActiveFilterChips />
          </div>
        </div>
      </header>
      <div className="flex-1">
        <SearchMap properties={properties} />
      </div>
    </main>
  );
}
