import { redirect } from "next/navigation";

import { SettingsForm } from "@/components/settings-form";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  let initial: { name: string; email: string; phoneNumber: string } | null =
    null;

  if (session.user.role === "tenant" && session.user.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { name: true, email: true, phoneNumber: true },
    });
    if (tenant) initial = tenant;
  } else if (session.user.role === "manager" && session.user.managerId) {
    const manager = await prisma.manager.findUnique({
      where: { id: session.user.managerId },
      select: { name: true, email: true, phoneNumber: true },
    });
    if (manager) initial = manager;
  }

  if (!initial) {
    return (
      <section className="max-w-xl">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-2 text-sm text-red-600">
          Profile not found for this account.
        </p>
      </section>
    );
  }

  return (
    <section className="max-w-xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-gray-500">
          Update your {session.user.role} profile.
        </p>
      </header>
      <SettingsForm initial={initial} />
    </section>
  );
}
