import Link from "next/link";

import type { PolaroidMarker as Marker } from "@/lib/landing-markers";

type Props = {
  marker: Marker;
  /** When true, applies the entrance opacity/blur custom-prop bindings used by GlobeClient. */
  withVisibilityProps?: boolean;
};

/**
 * Visual polaroid frame around a city photo. Wrapping <Link> is the only interactive
 * element on the landing page, so it must remain keyboard-focusable with an aria-label.
 */
export function PolaroidMarker({ marker, withVisibilityProps = false }: Props) {
  const opacityVar = `var(--cobe-visible-${marker.id}, 1)`;
  const blurVar = `calc((1 - var(--cobe-visible-${marker.id}, 1)) * 8px)`;

  return (
    <Link
      href={marker.href}
      aria-label={`Browse rentals in ${marker.caption}`}
      className="relative block min-w-[48px] min-h-[48px] focus-visible:outline-2 focus-visible:outline-accent-evergreen focus-visible:outline-offset-4"
      style={{
        background: "var(--color-surface-paper)",
        padding: "6px 6px 24px",
        boxShadow:
          "0 1px 2px oklch(20% 0.012 160 / 0.06), 0 4px 12px oklch(20% 0.012 160 / 0.08)",
        border: "1px solid var(--color-hairline)",
        transform: `rotate(${marker.rotate}deg)`,
        transition: "transform 120ms cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s, filter 0.3s",
        ...(withVisibilityProps
          ? { opacity: opacityVar, filter: `blur(${blurVar})` }
          : {}),
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={marker.image}
        alt=""
        width={60}
        height={60}
        loading="lazy"
        className="block h-[60px] w-[60px] object-cover"
      />
      <span
        className="text-caption block text-center"
        style={{
          position: "absolute",
          bottom: 5,
          left: 0,
          right: 0,
          color: "var(--color-ink-soft)",
          letterSpacing: "0.02em",
        }}
      >
        {marker.caption}
      </span>
    </Link>
  );
}
