"use client";

import { Children, isValidElement, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

type Props = {
  children: ReactNode;
};

const GRID =
  "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

// Stagger caps at the 12th card so a 100-result page doesn't choreograph for
// 3 seconds; later cards mount with zero delay.
const STAGGER_CAP = 11;
const EASE_OUT_QUART: [number, number, number, number] = [0.32, 0.72, 0, 1];

export function DiscoveryGrid({ children }: Props) {
  // `useReducedMotion` returns null on the server. Keeping the motion.div in
  // the tree unconditionally avoids a hydration mismatch — the transition
  // prop is a JS-only value and only affects runtime animation timing.
  const reduce = useReducedMotion();
  const items = Children.toArray(children);

  return (
    <ul className={GRID}>
      {items.map((child, index) => {
        const key =
          isValidElement(child) && child.key != null ? child.key : index;
        const transition = reduce
          ? { duration: 0 }
          : {
              duration: 0.3,
              delay: Math.min(index, STAGGER_CAP) * 0.03,
              ease: EASE_OUT_QUART,
            };
        return (
          <li key={key}>
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={transition}
            >
              {child}
            </motion.div>
          </li>
        );
      })}
    </ul>
  );
}
