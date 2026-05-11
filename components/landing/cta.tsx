"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.32, 0.72, 0, 1] as const;

export function CTA() {
  const reduced = useReducedMotion();
  const hidden = reduced ? false : { opacity: 0, y: 12 };
  const shown = { opacity: 1, y: 0 };

  return (
    <section className="px-6 py-20 sm:py-24 lg:py-28">
      <motion.div
        initial={hidden}
        whileInView={shown}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: EASE }}
        className="mx-auto max-w-6xl rounded-xl bg-accent-evergreen-soft px-6 py-14 sm:px-12 sm:py-20 lg:px-16 lg:py-24"
      >
        <h2 className="max-w-[22ch] text-headline text-ink sm:text-display">
          Two sides, one quiet tool.
        </h2>
        <p className="mt-4 max-w-[55ch] text-body text-ink-soft">
          Pick your way in. We’ll meet you where you are.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          <motion.div
            initial={hidden}
            whileInView={shown}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
            className="rounded-lg border border-hairline bg-surface-paper p-6 sm:p-8"
          >
            <h3 className="text-title text-ink">Find a place to live.</h3>
            <p className="mt-3 max-w-[42ch] text-body text-ink-soft">
              Map-first search, favorites, and a one-form application. No ads, no
              banner theatre.
            </p>
            <Link
              href="/search"
              className="mt-6 inline-flex items-center gap-1.5 rounded-sm bg-surface-panel px-4 py-2.5 text-label font-medium text-ink transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-surface-sunk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-2 focus-visible:ring-offset-surface-paper motion-reduce:transition-none"
            >
              Browse properties
              <span aria-hidden>→</span>
            </Link>
          </motion.div>

          <motion.div
            initial={hidden}
            whileInView={shown}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.18, ease: EASE }}
            className="rounded-lg border border-hairline bg-surface-paper p-6 sm:p-8"
          >
            <h3 className="text-title text-ink">List a property.</h3>
            <p className="mt-3 max-w-[42ch] text-body text-ink-soft">
              Add a home, review applications, send a lease. Built for hosts with
              three properties, not three hundred.
            </p>
            <Link
              href="/signup"
              className="mt-6 inline-flex items-center gap-1.5 rounded-sm bg-accent-evergreen px-4 py-2.5 text-label font-medium text-surface-paper transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-accent-evergreen-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-2 focus-visible:ring-offset-surface-paper motion-reduce:transition-none"
            >
              Become a host
              <span aria-hidden>→</span>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
