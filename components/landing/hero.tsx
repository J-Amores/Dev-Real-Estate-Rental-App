"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import { searchAction } from "@/lib/actions";

const EASE = [0.32, 0.72, 0, 1] as const;

export function Hero() {
  const reduced = useReducedMotion();
  const hidden = reduced ? false : { opacity: 0, y: 8 };
  const shown = { opacity: 1, y: 0 };

  return (
    <section className="px-6 pt-10 pb-16 sm:pt-14 sm:pb-20 lg:pt-20 lg:pb-28">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <motion.div
          initial={hidden}
          animate={shown}
          transition={{ duration: 0.5, ease: EASE }}
          className="order-2 lg:order-1"
        >
          <motion.h1
            initial={hidden}
            animate={shown}
            transition={{ duration: 0.5, delay: 0.05, ease: EASE }}
            className="text-display text-ink"
          >
            A calmer way to rent.
          </motion.h1>

          <motion.p
            initial={hidden}
            animate={shown}
            transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
            className="mt-5 max-w-[55ch] text-body text-ink-soft"
          >
            Real homes from small-scale hosts. No enterprise software theatre.
          </motion.p>

          <motion.form
            initial={hidden}
            animate={shown}
            transition={{ duration: 0.5, delay: 0.25, ease: EASE }}
            action={searchAction}
            role="search"
            aria-label="Find a place to live"
            className="mt-8"
          >
            <label htmlFor="landing-search" className="sr-only">
              Where do you want to live?
            </label>
            <div className="flex items-center gap-2 rounded-sm border border-hairline bg-surface-paper p-1.5 shadow-[0_1px_0_oklch(20%_0.012_160_/_0.04)] focus-within:ring-2 focus-within:ring-accent-evergreen focus-within:ring-offset-2 focus-within:ring-offset-surface-paper">
              <input
                id="landing-search"
                name="location"
                type="text"
                autoComplete="off"
                placeholder="Where do you want to live?"
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-body text-ink placeholder:text-ink-faint focus:outline-none sm:px-4 sm:py-3"
              />
              <button
                type="submit"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-sm bg-accent-evergreen px-4 py-2.5 text-label font-medium text-surface-paper transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-accent-evergreen-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-2 focus-visible:ring-offset-surface-paper motion-reduce:transition-none sm:px-5 sm:py-3"
              >
                Search
                <span aria-hidden>→</span>
              </button>
            </div>
          </motion.form>

          <motion.p
            initial={hidden}
            animate={shown}
            transition={{ duration: 0.5, delay: 0.35, ease: EASE }}
            className="mt-4 text-caption text-ink-soft"
          >
            Manage properties?{" "}
            <Link
              href="/signup"
              className="font-medium text-accent-evergreen underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-2 focus-visible:ring-offset-surface-paper"
            >
              Become a host →
            </Link>
          </motion.p>
        </motion.div>

        <motion.div
          initial={reduced ? false : { opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
          className="order-1 lg:order-2"
        >
          <div className="relative aspect-[4/5] overflow-hidden rounded-photo bg-surface-sunk sm:aspect-[5/4] lg:aspect-[4/5]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/landing-splash.jpg"
              alt="A sunlit modern home with a pool, listed on the marketplace."
              className="h-full w-full object-cover"
              loading="eager"
              fetchPriority="high"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
