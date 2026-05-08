import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { signOutAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "tenant") redirect("/dashboard/properties");

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">Favorites</h1>
          <p className="text-sm text-gray-500">
            Tenant dashboard stub — Phase 2 smoke test
          </p>
        </header>

        <section className="border rounded-md p-4 font-mono text-xs space-y-1">
          <p>id: {session.user.id}</p>
          <p>email: {session.user.email}</p>
          <p>role: {session.user.role}</p>
          <p>tenantId: {session.user.tenantId ?? "—"}</p>
        </section>

        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded-md border px-3 py-1.5 text-sm"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
