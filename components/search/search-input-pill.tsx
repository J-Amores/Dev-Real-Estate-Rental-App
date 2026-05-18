"use client";

import { ArrowRight, Search } from "lucide-react";

import { useLiveLocation } from "@/components/search/live-location-context";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { searchAction } from "@/lib/actions";

const PILL =
  "flex items-center gap-3 rounded-lg border border-hairline bg-surface-paper px-4 py-3 " +
  "transition-shadow duration-150 " +
  "focus-within:ring-2 focus-within:ring-accent-evergreen focus-within:ring-offset-0";

export function SearchInputPill() {
  const { query, setQuery } = useLiveLocation();
  return (
    <div>
      <Label
        id="search-pill-label"
        htmlFor="search-pill-input"
        className="mb-2 text-ink-soft"
      >
        Search by location
      </Label>
      <form id="search-hero-form" action={searchAction} className={PILL}>
        <Search
          aria-hidden
          className="size-5 shrink-0 text-ink-soft"
        />
        <input
          id="search-pill-input"
          name="location"
          type="text"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try Tokyo or Lisbon"
          aria-labelledby="search-pill-label"
          className="min-w-0 flex-1 bg-transparent text-body text-ink placeholder:text-ink-faint focus:outline-none"
        />
        <Button
          type="submit"
          variant="primary"
          className="shrink-0 px-3 py-2"
          aria-label="Search"
        >
          <ArrowRight aria-hidden className="size-4" />
          <span className="sr-only">Search</span>
        </Button>
      </form>
    </div>
  );
}
