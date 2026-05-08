import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "tenant") redirect("/dashboard/properties");

  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold">Favorites</h1>
      <p className="text-sm text-gray-500">
        Your saved properties will appear here.
      </p>
    </section>
  );
}
