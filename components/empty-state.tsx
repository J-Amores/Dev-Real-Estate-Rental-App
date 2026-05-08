import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  title: string;
  description: string;
  cta?: { href: string; label: string };
};

export function EmptyState({ icon, title, description, cta }: Props) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-xl border border-dashed bg-white p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500">
          {icon}
        </div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm text-gray-500">{description}</p>
        {cta ? (
          <Link
            href={cta.href}
            className="mt-6 inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            {cta.label}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
