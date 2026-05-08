import { redirect } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "manager") redirect("/dashboard/favorites");

  return (
    <EmptyState
      icon={
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-7 w-7"
          aria-hidden
        >
          <path d="M3 21h18" />
          <path d="M5 21V7l7-4 7 4v14" />
          <path d="M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h.01M15 17h.01" />
        </svg>
      }
      title="No properties yet"
      description="Add your first listing to start receiving applications from prospective tenants."
      cta={{ href: "/dashboard/properties/new", label: "Add a property" }}
    />
  );
}
