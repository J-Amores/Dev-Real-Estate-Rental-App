/**
 * Time-of-day greeting for the tenant search hero. When `firstName` is omitted,
 * returns the anonymous fallback so the hero always has copy to render.
 *
 * Cutoffs are local-time hours read from the passed Date. The caller is
 * responsible for passing a server-side `new Date()` (the route is `force-dynamic`,
 * so each request gets a fresh evaluation).
 */
export function getGreeting(date: Date, firstName?: string | null): string {
  if (!firstName) return "Let's find your next stay.";
  const hour = date.getHours();
  // <12 morning, <18 afternoon, else evening — three buckets, no twilight nuance.
  const part = hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening";
  return `Good ${part}, ${firstName}.`;
}
