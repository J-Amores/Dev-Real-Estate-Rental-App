import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { GlobeOrFallback } from "@/components/landing/globe-or-fallback";
import { LandingCtaChip } from "@/components/landing/landing-cta-chip";
import { LANDING_MARKERS } from "@/lib/landing-markers";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Real Estate App",
  description:
    "Find a calmer place to rent. Real homes from small-scale hosts in cities around the world.",
};

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="bg-surface-paper relative flex min-h-svh items-center justify-center">
      {LANDING_MARKERS.map((m) => (
        <link key={m.id} rel="preload" as="image" href={m.image} />
      ))}

      <h1 className="sr-only">
        Real Estate App, explore rentals around the world
      </h1>

      <div
        className="aspect-square"
        style={{ width: "clamp(280px, min(80vw, 70vh), 720px)" }}
      >
        <GlobeOrFallback markers={LANDING_MARKERS} />
      </div>

      <LandingCtaChip />
    </main>
  );
}
