/**
 * Route definitions for components/auth/auth-bg-canvas.tsx.
 * Coordinates are canvas-local (px). The canvas renders at the natural
 * size of its parent (ResizeObserver-driven), so these values are scaled
 * into the actual canvas bounds in the render loop.
 *
 * Phase 11 spec §5 "Left hero panel" — canvas color rules and route shape.
 */

export type AuthBgRoute = {
  start: { x: number; y: number; delay: number };
  end: { x: number; y: number; delay: number };
};

/** 4 routes, 15-second loop. Coordinates assume a ~320×200 reference canvas; the renderer scales them. */
export const AUTH_BG_ROUTES: readonly AuthBgRoute[] = [
  { start: { x: 100, y: 150, delay: 0 }, end: { x: 200, y: 80, delay: 2 } },
  { start: { x: 200, y: 80, delay: 2 }, end: { x: 260, y: 120, delay: 4 } },
  { start: { x: 50, y: 50, delay: 1 }, end: { x: 150, y: 180, delay: 3 } },
  { start: { x: 280, y: 60, delay: 0.5 }, end: { x: 180, y: 180, delay: 2.5 } },
] as const;

/** Canvas paint constants. oklch alpha is the canonical accent budget knob. */
export const AUTH_BG_PAINT = {
  /** Background clear color — transparent so panel bg shows through. */
  clear: "transparent",
  /** Dot fill color, alpha is randomized per dot in 0.18–0.40. */
  dotColor: (alpha: number) => `oklch(38% 0.08 165 / ${alpha})`,
  /** Route line stroke. */
  routeStroke: "oklch(30% 0.08 165 / 0.55)",
  /** Route moving point. */
  routePoint: "oklch(30% 0.08 165)",
  /** Route point glow ring. */
  routeGlow: "oklch(38% 0.08 165 / 0.30)",
  /** Dot grid gap (px) and radius (px). */
  gap: 12,
  dotRadius: 1,
  /** Route line width (px). */
  routeWidth: 1.5,
  /** Animation duration per route (seconds). */
  routeDuration: 3,
  /** Full loop length (seconds). */
  loopLength: 15,
} as const;
