"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";

import type { PolaroidMarker } from "@/lib/landing-markers";

import { GlobeStatic } from "./globe-static";

const GlobeClient = dynamic(
  () => import("./globe-client").then((m) => m.GlobeClient),
  {
    ssr: false,
    loading: () => <GlobeStatic />,
  },
);

type Props = {
  markers: readonly PolaroidMarker[];
};

/**
 * Single decision boundary for the landing page. If the user prefers reduced motion,
 * render the SVG fallback and never load the cobe chunk. Otherwise dynamic-import the
 * canvas component with the same SVG as a loading placeholder, so the swap is CLS-free.
 */
export function GlobeOrFallback({ markers }: Props) {
  const reduced = useReducedMotion();
  if (reduced) return <GlobeStatic />;
  return <GlobeClient markers={markers} />;
}
