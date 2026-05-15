import { LANDING_MARKERS, type PolaroidMarker } from "@/lib/landing-markers";

import { PolaroidMarker as PolaroidLink } from "./polaroid-marker";

const DOT_PATTERN_ID = "landing-globe-dots";
const CLIP_ID = "landing-globe-clip";

/**
 * Equirectangular projection of [lat, lng] across the full 0..1 x/y bounding box.
 * The static fallback never rotates, so all 6 markers render simultaneously.
 */
function project(lat: number, lng: number): { x: number; y: number } {
  return { x: (lng + 180) / 360, y: (90 - lat) / 180 };
}

function GlobeMarker({ marker }: { marker: PolaroidMarker }) {
  const { x, y } = project(marker.location[0], marker.location[1]);
  return (
    <div
      className="hidden sm:block absolute pointer-events-auto"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: "translate(-50%, -110%)",
      }}
    >
      <PolaroidLink marker={marker} />
    </div>
  );
}

/**
 * Server-renderable SVG globe. Renders a dot-pattern sphere clipped to a circle,
 * 6 polaroid links absolutely positioned via simple equirectangular projection,
 * and a mobile-only inline city list. Used as SSR initial paint, dynamic-loading
 * placeholder, and reduced-motion terminal.
 */
export function GlobeStatic() {
  return (
    <div className="relative aspect-square w-full">
      <svg
        role="img"
        aria-label="Globe showing rental locations in six cities"
        viewBox="0 0 100 100"
        className="block w-full"
        style={{ aspectRatio: "1 / 1" }}
      >
        <defs>
          <pattern
            id={DOT_PATTERN_ID}
            width="2"
            height="2"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="0.35" fill="var(--color-accent-evergreen)" />
          </pattern>
          <clipPath id={CLIP_ID}>
            <circle cx="50" cy="50" r="48" />
          </clipPath>
        </defs>
        <circle cx="50" cy="50" r="48" fill="var(--color-surface-panel)" />
        <rect
          x="2"
          y="2"
          width="96"
          height="96"
          fill={`url(#${DOT_PATTERN_ID})`}
          clipPath={`url(#${CLIP_ID})`}
          opacity="0.55"
        />
      </svg>

      {LANDING_MARKERS.map((m) => (
        <GlobeMarker key={m.id} marker={m} />
      ))}

      <ul className="sm:hidden absolute left-0 right-0 -bottom-12 flex flex-wrap justify-center gap-x-3 gap-y-1 text-caption text-ink-soft">
        {LANDING_MARKERS.map((m) => (
          <li key={m.id}>
            <a
              href={m.href}
              className="underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-accent-evergreen focus-visible:outline-offset-2"
            >
              {m.caption}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
