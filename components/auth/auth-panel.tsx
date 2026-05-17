import type { ReactNode } from "react";

type Props = {
  hero: ReactNode;
  form: ReactNode;
};

/**
 * Phase 11 spec §5 — split-panel auth shell.
 * 50/50 on md+, stacked below. rounded-lg (14px), 1px hairline border, no shadow
 * (tonal layering against bg-surface-panel page background).
 * View-transition-name applied so the panel does not flash white when ModeSlider
 * switches routes.
 */
export function AuthPanel({ hero, form }: Props) {
  return (
    <div
      className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-hairline bg-surface-paper md:grid-cols-2"
      style={{ viewTransitionName: "auth-panel" }}
    >
      <div className="relative min-h-[200px] md:min-h-[600px]">{hero}</div>
      <div className="relative">{form}</div>
    </div>
  );
}
