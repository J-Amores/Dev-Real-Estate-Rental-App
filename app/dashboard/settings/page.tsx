import { SettingsForm } from "@/components/settings-form";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();

  let initial: { name: string; email: string; phoneNumber: string } | null =
    null;

  if (user.role === "tenant" && user.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { name: true, email: true, phoneNumber: true },
    });
    if (tenant) initial = tenant;
  } else if (user.role === "manager" && user.managerId) {
    const manager = await prisma.manager.findUnique({
      where: { id: user.managerId },
      select: { name: true, email: true, phoneNumber: true },
    });
    if (manager) initial = manager;
  }

  if (!initial) {
    return (
      <section className="max-w-xl">
        <h1 className="text-headline text-ink">Settings</h1>
        <p className="mt-2 text-caption text-signal-danger">
          Profile not found for this account.
        </p>
      </section>
    );
  }

  return (
    <section className="max-w-xl space-y-6">
      <header>
        <h1 className="text-headline text-ink">Settings</h1>
        <p className="text-caption text-ink-soft">
          Update your {user.role} profile.
        </p>
      </header>
      <SettingsForm initial={initial} />
    </section>
  );
}
