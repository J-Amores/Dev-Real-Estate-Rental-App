import { redirect } from "next/navigation";

import { PropertyForm } from "@/components/property-form";
import { createPropertyAction } from "@/lib/actions";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NewPropertyPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "manager") redirect("/dashboard/favorites");

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-headline text-ink">New property</h1>
        <p className="text-body text-ink-soft">
          Add a listing to your dashboard. You can edit anything later.
        </p>
      </header>

      <PropertyForm
        submitLabel="Save property"
        onSubmit={createPropertyAction}
      />
    </div>
  );
}
