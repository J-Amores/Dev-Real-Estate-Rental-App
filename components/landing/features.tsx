"use client";

import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.32, 0.72, 0, 1] as const;

type Feature = {
  num: string;
  heading: string;
  body: string;
};

const FEATURES: Feature[] = [
  {
    num: "01",
    heading: "Built for real homes.",
    body: "We're built for the host with three properties, not the corporation with three hundred. Calm tools, real conversations, software that doesn't bury the work.",
  },
  {
    num: "02",
    heading: "Search the map, not the spreadsheet.",
    body: "Map-first browsing across real listings, with filters that stay out of the way. Photos win the visual hierarchy; the toolbar steps aside.",
  },
  {
    num: "03",
    heading: "Plain language, fewer clicks.",
    body: "Sentence-case labels, helpful empty states, errors that apologize without theatre. Words do most of the warmth.",
  },
];

export function Features() {
  const reduced = useReducedMotion();
  const hidden = reduced ? false : { opacity: 0, y: 12 };
  const shown = { opacity: 1, y: 0 };

  return (
    <section className="px-6 py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-5xl">
        <motion.h2
          initial={hidden}
          whileInView={shown}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.4, ease: EASE }}
          className="max-w-[22ch] text-headline text-ink sm:text-display"
        >
          Three quiet ideas, used everywhere.
        </motion.h2>
        <motion.p
          initial={hidden}
          whileInView={shown}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.4, delay: 0.05, ease: EASE }}
          className="mt-4 max-w-[55ch] text-body text-ink-soft"
        >
          The project’s voice, distilled.
        </motion.p>

        <ul className="mt-14 divide-y divide-hairline border-y border-hairline">
          {FEATURES.map((f, i) => (
            <motion.li
              key={f.num}
              initial={hidden}
              whileInView={shown}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
              className="grid grid-cols-1 gap-3 py-10 sm:gap-6 sm:py-12 lg:grid-cols-[auto_1fr_1.4fr] lg:items-start lg:gap-12"
            >
              <span
                aria-hidden
                className="text-label font-medium tabular-nums text-accent-evergreen"
              >
                {f.num}
              </span>
              <h3 className="text-headline text-ink">{f.heading}</h3>
              <p className="max-w-[55ch] text-body text-ink-soft">{f.body}</p>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
