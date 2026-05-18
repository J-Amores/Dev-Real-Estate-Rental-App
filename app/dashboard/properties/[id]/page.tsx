import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PropertyDetailBody } from "@/components/manager/property-detail-body";
import { requireUser } from "@/lib/auth";
import { getPropertyDetail } from "@/lib/manager-overview";

export const dynamic = "force-dynamic";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  if (user.role !== "manager") redirect("/dashboard/favorites");

  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) notFound();

  const detail = await getPropertyDetail(numericId, user.id);
  if (!detail) notFound();

  return (
    <div className="mx-auto max-w-[820px] space-y-4">
      <Link
        href="/dashboard/properties"
        className="inline-flex items-center gap-1 text-caption text-ink-soft hover:text-ink"
      >
        ← Back to properties
      </Link>
      <PropertyDetailBody detail={detail} hideViewFullLease />
    </div>
  );
}
