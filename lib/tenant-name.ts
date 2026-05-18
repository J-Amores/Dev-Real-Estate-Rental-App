/**
 * Returns the substring before the first space in `fullName`, trimmed. Nullish,
 * empty, or whitespace-only input yields `null`. Used by the search hero to
 * personalize the greeting without assuming the stored name has any particular
 * shape ("Sam", "Sam Hayes", "Sam M. Hayes" all collapse to "Sam").
 */
export function firstNameOf(
  fullName: string | null | undefined,
): string | null {
  if (!fullName) return null;
  const trimmed = fullName.trim();
  if (!trimmed) return null;
  const space = trimmed.indexOf(" ");
  return space === -1 ? trimmed : trimmed.slice(0, space);
}
