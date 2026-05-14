import type { Metadata } from "next";

import { GlobeOrFallback } from "@/components/landing/globe-or-fallback";
import { LANDING_MARKERS } from "@/lib/landing-markers";

export const metadata: Metadata = {
  title: "Real Estate App",
  description:
    "Find a calmer place to rent. Real homes from small-scale hosts in cities around the world.",
};

export default function LandingPage() {
  return (
    <main className="bg-surface-paper relative flex min-h-svh items-center justify-center">
      {LANDING_MARKERS.map((m) => (
        <link key={m.id} rel="preload" as="image" href={m.image} />
      ))}

      <a
        href="/search"
        className="sr-only focus:not-sr-only fixed left-4 top-4 z-50 rounded-sm bg-accent-evergreen px-3 py-2 text-label font-medium text-surface-paper"
      >
        Skip to search
      </a>
      <h1 className="sr-only">
        Real Estate App, explore rentals around the world
      </h1>

      <div
        className="aspect-square"
        style={{ width: "clamp(280px, min(80vw, 70vh), 720px)" }}
      >
        <GlobeOrFallback markers={LANDING_MARKERS} />
      </div>
    </main>
  );
}
