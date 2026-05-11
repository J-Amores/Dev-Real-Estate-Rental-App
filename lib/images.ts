import type { SyntheticEvent } from "react";

export const PLACEHOLDER = "/placeholder.jpg";

export function onImageError(event: SyntheticEvent<HTMLImageElement>) {
  const target = event.currentTarget;
  if (target.src.endsWith(PLACEHOLDER)) return;
  target.src = PLACEHOLDER;
}
