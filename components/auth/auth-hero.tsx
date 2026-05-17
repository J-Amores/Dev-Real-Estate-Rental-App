import { AuthBgCanvas } from "@/components/auth/auth-bg-canvas";
import { resolveHeroMarker } from "@/lib/landing-hero-fallback";

type Props = {
  /** City slug from ?city= search param. Falls back to date-deterministic marker. */
  city?: string;
};

/**
 * Phase 11 spec §5 — left-panel hero. AuthBgCanvas is absolutely-positioned behind
 * the polaroid + caption (z-10). Polaroid uses the sharp-cornered Polaroid pattern
 * from DESIGN.md §5 — print-edge intentional, border-radius: 0.
 *
 * The polaroid <img> carries viewTransitionName="polaroid-${id}" so it can be the
 * destination of the morph from the landing globe (set on the source by polaroid-marker.tsx).
 */
export function AuthHero({ city }: Props) {
  const marker = resolveHeroMarker(city);

  return (
    <div className="relative h-full w-full overflow-hidden bg-surface-panel p-8">
      <AuthBgCanvas />
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-6">
        <div
          className="border border-hairline bg-surface-paper p-2"
          style={{
            boxShadow:
              "0 1px 2px oklch(20% 0.012 160 / 0.06), 0 4px 12px oklch(20% 0.012 160 / 0.08)",
            borderRadius: 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={marker.image}
            alt=""
            width={200}
            height={200}
            className="block h-[200px] w-[200px] object-cover"
            style={{ viewTransitionName: `polaroid-${marker.id}` }}
          />
        </div>
        <div className="text-center">
          <p className="text-title text-ink">{marker.caption}</p>
          <p className="text-caption text-ink-soft">A home is waiting.</p>
        </div>
      </div>
    </div>
  );
}
