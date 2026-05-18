import { notFound, redirect } from "next/navigation";

import { PropertyDetailBody } from "@/components/manager/property-detail-body";
import { PropertyModal } from "@/components/manager/property-modal";
import { requireUser } from "@/lib/auth";
import { getPropertyDetail } from "@/lib/manager-overview";

export const dynamic = "force-dynamic";

export default async function InterceptedPropertyModal({
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
    <PropertyModal>
      <PropertyDetailBody detail={detail} />
    </PropertyModal>
  );
}
