type Props = {
  className?: string;
};

const BASE = "pointer-events-none absolute inset-0 h-full w-full";

// Radial mask focuses density above center so the field decays toward the
// hero's lower edge, where the search pill needs a clean ground.
const MASK_CLASS =
  "[mask-image:radial-gradient(60%_60%_at_50%_30%,#000,transparent)]";

/**
 * Static dot field rendered behind the search hero. Single SVG, single
 * <pattern>, no animation — the calm counterpart to the landing globe canvas.
 * Color is accent-evergreen at 12% alpha; tuned down from the AuthBgCanvas
 * range because /search has no motion to occupy attention.
 */
export function DotPattern({ className }: Props) {
  return (
    <svg
      aria-hidden="true"
      className={[BASE, MASK_CLASS, className].filter(Boolean).join(" ")}
    >
      <defs>
        <pattern
          id="search-dot-pattern"
          x="0"
          y="0"
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="12" cy="12" r="1" fill="oklch(38% 0.08 165 / 0.12)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#search-dot-pattern)" />
    </svg>
  );
}
