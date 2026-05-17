"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { LANDING_CHIP_COPY } from "@/lib/landing-chip-copy";

/**
 * Phase 11 spec §5 — bottom-center floating chip on /. Click navigates to /signin
 * via View Transitions when the browser supports them; falls back to plain
 * router.push otherwise. Hover lift + arrow translate are suppressed under
 * reduced-motion.
 *
 * The chip has view-transition-name "auth-cta" set on pointerdown and cleared
 * after rAF so the destination form panel only matches when this chip is the
 * source — otherwise an unrelated polaroid morph could collide.
 */
export function LandingCtaChip() {
  const router = useRouter();
  const reduced = useReducedMotion() === true;
  const ref = useRef<HTMLAnchorElement>(null);

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const navigate = () => router.push("/signin");

    if (reduced) {
      navigate();
      return;
    }

    // Set view-transition-name only when this chip is the active source.
    if (ref.current) ref.current.style.viewTransitionName = "auth-cta";

    const vt = (document as Document & {
      startViewTransition?: (cb: () => void) => { finished: Promise<void> };
    }).startViewTransition;

    if (typeof vt === "function") {
      const transition = vt.call(document, navigate);
      transition.finished.finally(() => {
        if (ref.current) ref.current.style.viewTransitionName = "";
      });
    } else {
      requestAnimationFrame(() => {
        if (ref.current) ref.current.style.viewTransitionName = "";
      });
      navigate();
    }
  };

  return (
    <motion.a
      ref={ref}
      href="/signin"
      onClick={onClick}
      aria-label={LANDING_CHIP_COPY.ariaLabel}
      whileHover={reduced ? undefined : { y: -2 }}
      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
      className="group fixed bottom-6 left-1/2 z-30 flex max-w-[min(90vw,28rem)] -translate-x-1/2 items-center gap-4 rounded-lg border border-hairline bg-surface-paper px-5 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-2 focus-visible:ring-offset-surface-paper"
      style={{
        boxShadow:
          "0 12px 28px oklch(20% 0.012 160 / 0.08), 0 2px 6px oklch(20% 0.012 160 / 0.06)",
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
      }}
    >
      <span className="flex flex-1 flex-col text-left">
        <span className="text-label font-medium text-ink">{LANDING_CHIP_COPY.headline}</span>
        <span className="text-caption text-ink-soft">{LANDING_CHIP_COPY.subcopy}</span>
      </span>
      <ArrowRight
        size={20}
        aria-hidden
        className="shrink-0 text-accent-evergreen-deep transition-transform duration-200 motion-reduce:transition-none group-hover:translate-x-[2px]"
      />
    </motion.a>
  );
}
