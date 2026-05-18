"use client";

import { Button } from "@/components/ui/button";

type Props = {
  reset: () => void;
};

export default function SearchError({ reset }: Props) {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-start gap-3 px-4 py-12 sm:px-6">
      <h1 className="text-headline text-ink">Search is temporarily unavailable</h1>
      <p className="max-w-prose text-body text-ink-soft">
        Refresh the page or clear filters.
      </p>
      <Button variant="ghost" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
