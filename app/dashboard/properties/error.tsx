"use client";

import { buttonClassName } from "@/components/ui/button";

export default function PropertiesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-md space-y-3 py-12 text-center">
      <h1 className="text-headline text-ink">Couldn&apos;t load your portfolio.</h1>
      <p className="text-caption text-ink-soft">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className={buttonClassName({ variant: "primary" })}
      >
        Try again
      </button>
    </div>
  );
}
