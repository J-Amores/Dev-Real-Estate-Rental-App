import * as React from "react";

type Variant = "form" | "listing";

const VARIANT: Record<Variant, string> = {
  form: "rounded-lg border border-hairline bg-surface-paper p-6",
  listing: "rounded-lg border border-hairline bg-surface-paper p-4",
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

export function Card({ variant = "form", className, ...rest }: CardProps) {
  return <div className={[VARIANT[variant], className].filter(Boolean).join(" ")} {...rest} />;
}
