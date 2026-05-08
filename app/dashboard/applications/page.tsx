import { redirect } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const isTenant = session.user.role === "tenant";

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
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5" />
          <path d="M9 13h6M9 17h6" />
        </svg>
      }
      title="No applications yet"
      description={
        isTenant
          ? "Apply to a listing and your applications will show up here."
          : "Applications will appear here once tenants apply to your properties."
      }
      cta={
        isTenant
          ? { href: "/search", label: "Browse listings" }
          : { href: "/dashboard/properties", label: "View properties" }
      }
    />
  );
}
