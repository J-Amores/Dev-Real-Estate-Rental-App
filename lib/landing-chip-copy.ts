/**
 * Single source of truth for landing CTA chip copy. Isolated so copy review
 * and any future A/B tweaks have one place to look.
 */
export const LANDING_CHIP_COPY = {
  headline: "Ready to rent your dream vacation",
  subcopy: "Sign in to find one",
  ariaLabel: "Sign in to find a place to rent",
} as const;
