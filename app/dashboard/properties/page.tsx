import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "manager") redirect("/dashboard/favorites");

  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold">My properties</h1>
      <p className="text-sm text-gray-500">
        Properties you manage will appear here.
      </p>
    </section>
  );
}
