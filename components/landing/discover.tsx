"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import { PropertyCard } from "@/components/property-card";

const EASE = [0.32, 0.72, 0, 1] as const;

export type DiscoverProperty = {
  id: number;
  name: string;
  pricePerMonth: number;
  propertyType: string;
  photoUrls: string[];
  location: { city: string; state: string };
};

export function Discover({ properties }: { properties: DiscoverProperty[] }) {
  const reduced = useReducedMotion();
  const hidden = reduced ? false : { opacity: 0, y: 12 };
  const shown = { opacity: 1, y: 0 };

  if (properties.length < 3) return null;

  return (
    <section className="px-6 py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={hidden}
          whileInView={shown}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.4, ease: EASE }}
          className="flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            <h2 className="max-w-[20ch] text-headline text-ink sm:text-display">
              Recently posted.
            </h2>
            <p className="mt-4 max-w-[55ch] text-body text-ink-soft">
              Fresh listings from hosts on the platform.
            </p>
          </div>
          <Link
            href="/search"
            className="text-label font-medium text-accent-evergreen underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-2 focus-visible:ring-offset-surface-paper"
          >
            See all listings →
          </Link>
        </motion.div>

        <ul className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p, i) => (
            <motion.li
              key={p.id}
              initial={hidden}
              whileInView={shown}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.05, ease: EASE }}
            >
              <PropertyCard
                id={p.id}
                name={p.name}
                pricePerMonth={p.pricePerMonth}
                propertyType={p.propertyType}
                photoUrls={p.photoUrls}
                location={p.location}
                variant="public"
                showFavorite={false}
              />
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
