import { redirect } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "tenant") redirect("/dashboard/properties");

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
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      }
      title="No favorites yet"
      description="Save properties you're interested in by tapping the heart on any listing."
      cta={{ href: "/search", label: "Browse listings" }}
    />
  );
}
