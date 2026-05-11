import Link from "next/link";

import { CTA } from "@/components/landing/cta";
import { Discover, type DiscoverProperty } from "@/components/landing/discover";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DASHBOARD_FOR_ROLE = {
  tenant: "/dashboard/favorites",
  manager: "/dashboard/properties",
} as const;

async function getRecentProperties(): Promise<DiscoverProperty[]> {
  const rows = await prisma.property.findMany({
    take: 6,
    orderBy: { postedDate: "desc" },
    select: {
      id: true,
      name: true,
      pricePerMonth: true,
      propertyType: true,
      photoUrls: true,
      location: { select: { city: true, state: true } },
    },
  });
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    pricePerMonth: Number(p.pricePerMonth),
    propertyType: p.propertyType,
    photoUrls: p.photoUrls,
    location: p.location,
  }));
}

export default async function LandingPage() {
  const [session, properties] = await Promise.all([
    auth(),
    getRecentProperties(),
  ]);
  const user = session?.user;
  const dashboardHref = user ? DASHBOARD_FOR_ROLE[user.role] : null;

  return (
    <main className="bg-surface-paper">
      <header className="px-6 pt-6 sm:pt-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-2 focus-visible:ring-offset-surface-paper"
            aria-label="Real Estate App, home"
          >
            <span className="block size-7 text-accent-evergreen">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="" className="h-full w-full" />
            </span>
            <span className="text-title text-ink">Real Estate App</span>
          </Link>

          <nav aria-label="Account" className="flex items-center gap-1">
            {dashboardHref ? (
              <Link
                href={dashboardHref}
                className="inline-flex items-center gap-1.5 rounded-sm bg-surface-panel px-3 py-2 text-label font-medium text-ink transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-surface-sunk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-2 focus-visible:ring-offset-surface-paper motion-reduce:transition-none"
              >
                Dashboard
                <span aria-hidden>→</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="rounded-sm px-3 py-2 text-label font-medium text-ink-soft transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-surface-sunk hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-2 focus-visible:ring-offset-surface-paper motion-reduce:transition-none"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-sm bg-accent-evergreen px-3 py-2 text-label font-medium text-surface-paper transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-accent-evergreen-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-2 focus-visible:ring-offset-surface-paper motion-reduce:transition-none"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <Hero />
      <Features />
      <Discover properties={properties} />
      <CTA />
      <Footer />
    </main>
  );
}
