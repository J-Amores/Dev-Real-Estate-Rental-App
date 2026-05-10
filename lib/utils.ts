/**
 * "WalkInClosets" → "Walk in closets".
 * Splits camelCase and sentence-cases the result, per the Sentence-Case Rule in DESIGN.md.
 */
export function humanize(value: string): string {
  const spaced = value.replace(/([A-Z])/g, " $1").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}
