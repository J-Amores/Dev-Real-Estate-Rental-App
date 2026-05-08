import { redirect } from "next/navigation";

import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  return (
    <div className="min-h-screen bg-gray-50">
      <Header email={session.user.email ?? ""} />
      <div className="flex">
        <aside className="w-56 shrink-0 border-r bg-white min-h-[calc(100vh-3.25rem)]">
          <Sidebar role={session.user.role} />
        </aside>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
