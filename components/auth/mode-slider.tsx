"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

type Mode = "signin" | "signup";

const MODES: ReadonlyArray<{ id: Mode; label: string; href: "/signin" | "/signup" }> = [
  { id: "signin", label: "Sign in", href: "/signin" },
  { id: "signup", label: "Sign up", href: "/signup" },
];

/**
 * Phase 11 spec §5 — Sign in ↔ Sign up pill toggle. Active pill carries
 * view-transition-name: "auth-mode-pill" so the pill slides across routes
 * when the browser supports View Transitions. Within-route press/hover via
 * framer-motion whileHover/whileTap, suppressed under reduced-motion.
 */
export function ModeSlider() {
  const pathname = usePathname();
  const reduced = useReducedMotion() === true;
  const active: Mode = pathname?.startsWith("/signup") ? "signup" : "signin";

  return (
    <nav
      aria-label="Switch between sign in and sign up"
      className="relative grid h-10 w-full grid-cols-2 rounded-sm bg-surface-panel p-1"
    >
      {MODES.map((m) => {
        const isActive = m.id === active;
        return (
          <motion.div
            key={m.id}
            whileHover={reduced ? undefined : { scale: 1.01 }}
            whileTap={reduced ? undefined : { scale: 0.98 }}
            className="relative"
          >
            <Link
              href={m.href}
              aria-current={isActive ? "page" : undefined}
              className="relative z-10 flex h-full w-full items-center justify-center rounded-sm text-label focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-2 focus-visible:ring-offset-surface-paper"
            >
              <span className={isActive ? "text-ink font-medium" : "text-ink-soft"}>{m.label}</span>
            </Link>
            {isActive ? (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-sm border border-hairline bg-surface-paper"
                style={{ viewTransitionName: "auth-mode-pill" }}
              />
            ) : null}
          </motion.div>
        );
      })}
    </nav>
  );
}
