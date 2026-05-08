"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { UserRole } from "@prisma/client";

type NavLink = { href: string; label: string };

const tenantLinks: NavLink[] = [
  { href: "/dashboard/favorites", label: "Favorites" },
  { href: "/dashboard/applications", label: "Applications" },
  { href: "/dashboard/settings", label: "Settings" },
];

const managerLinks: NavLink[] = [
  { href: "/dashboard/properties", label: "Properties" },
  { href: "/dashboard/applications", label: "Applications" },
  { href: "/dashboard/settings", label: "Settings" },
];

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const links = role === "tenant" ? tenantLinks : managerLinks;

  return (
    <nav className="flex flex-col gap-1 p-4">
      <p className="px-2 pb-2 text-xs uppercase tracking-wide text-gray-500">
        {role === "tenant" ? "Tenant" : "Manager"}
      </p>
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-md px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-gray-900 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
