import Link from "next/link";
import type { ReactNode } from "react";

import { buttonClassName } from "@/components/ui/button";

type Props = {
  icon: ReactNode;
  title: string;
  description: string;
  cta?: { href: string; label: string };
};

export function EmptyState({ icon, title, description, cta }: Props) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-lg border border-dashed border-hairline bg-surface-paper p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-sunk text-ink-soft">
          {icon}
        </div>
        <h2 className="text-title text-ink">{title}</h2>
        <p className="mt-2 text-body text-ink-soft">{description}</p>
        {cta ? (
          <Link href={cta.href} className={`${buttonClassName()} mt-6`}>
            {cta.label}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
