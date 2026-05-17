import { LANDING_MARKERS, type PolaroidMarker } from "@/lib/landing-markers";

/**
 * Deterministic-by-date marker picker for AuthHero. Same hero shown to all
 * visitors on a given day. Per-session randomness would require a cookie;
 * skip the complexity (Phase 11 spec §9).
 *
 * @param now Optional date override for unit testing. Defaults to new Date().
 */
export function pickFallbackMarker(now: Date = new Date()): PolaroidMarker {
  const daysSinceEpoch = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
  return LANDING_MARKERS[daysSinceEpoch % LANDING_MARKERS.length]!;
}

/**
 * Resolve a city slug (?city=…) to a marker. Falls back to the date-deterministic
 * marker if the slug is missing or does not match any marker id.
 */
export function resolveHeroMarker(citySlug: string | undefined, now: Date = new Date()): PolaroidMarker {
  if (citySlug) {
    const found = LANDING_MARKERS.find((m) => m.id === citySlug);
    if (found) return found;
  }
  return pickFallbackMarker(now);
}
