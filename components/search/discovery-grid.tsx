"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { useLiveLocation } from "@/components/search/live-location-context";

export type DiscoveryItem = {
  key: string | number;
  matchText: string; // lowercased haystack for live-location substring filter
  node: ReactNode;
};

type Props = {
  items: DiscoveryItem[];
};

const GRID =
  "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

// Stagger caps at the 12th card so a 100-result page doesn't choreograph for
// 3 seconds; later cards mount with zero delay.
const STAGGER_CAP = 11;
const EASE_OUT_QUART: [number, number, number, number] = [0.32, 0.72, 0, 1];

export function DiscoveryGrid({ items }: Props) {
  // useReducedMotion returns null on the server. Keeping motion.li in the tree
  // unconditionally avoids a hydration mismatch — only the transition object
  // (a JS-only value) differs between server and client.
  const reduce = useReducedMotion();
  const { query } = useLiveLocation();

  const needle = query.trim().toLowerCase();
  const visible = needle
    ? items.filter((it) => it.matchText.includes(needle))
    : items;

  return (
    <ul className={GRID}>
      <AnimatePresence mode="popLayout" initial={false}>
        {visible.map((item, index) => {
          const transition = reduce
            ? { duration: 0 }
            : {
                duration: 0.3,
                delay: Math.min(index, STAGGER_CAP) * 0.03,
                ease: EASE_OUT_QUART,
              };
          return (
            <motion.li
              key={item.key}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={transition}
            >
              {item.node}
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
