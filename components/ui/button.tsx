import * as React from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-accent-evergreen text-surface-paper hover:bg-accent-evergreen-deep active:bg-accent-evergreen-deep px-4 py-[10px]",
  secondary:
    "bg-surface-panel text-ink hover:bg-surface-sunk active:bg-surface-sunk px-4 py-[10px]",
  ghost:
    "bg-transparent text-ink-soft hover:bg-surface-sunk hover:text-ink active:bg-surface-sunk px-3 py-2",
  danger:
    "bg-signal-danger text-surface-paper hover:bg-signal-danger/90 active:bg-signal-danger/90 px-4 py-[10px]",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-sm text-label font-medium tracking-[0.005em] " +
  "transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-2 focus-visible:ring-offset-surface-paper " +
  "disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none " +
  "motion-reduce:transition-none";

export function buttonClassName({ variant = "primary" }: { variant?: Variant } = {}): string {
  return `${BASE} ${VARIANT[variant]}`;
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", className, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={[buttonClassName({ variant }), className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
});
