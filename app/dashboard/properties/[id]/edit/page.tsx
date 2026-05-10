import { notFound, redirect } from "next/navigation";

import { DeletePropertyButton } from "@/components/delete-property-button";
import { PropertyForm } from "@/components/property-form";
import { updatePropertyAction } from "@/lib/actions";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { PropertyInput } from "@/lib/schemas";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export default async function EditPropertyPage({ params }: Params) {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "manager") redirect("/dashboard/favorites");

  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (!Number.isFinite(id)) notFound();

  const property = await prisma.property.findUnique({
    where: { id },
    include: { location: true },
  });
  if (!property || property.managerId !== session.user.id) notFound();

  const defaults: Partial<PropertyInput> = {
    name: property.name,
    description: property.description,
    pricePerMonth: property.pricePerMonth,
    securityDeposit: property.securityDeposit,
    applicationFee: property.applicationFee,
    isPetsAllowed: property.isPetsAllowed,
    isParkingIncluded: property.isParkingIncluded,
    photoUrls: property.photoUrls.length ? property.photoUrls : [""],
    amenities: property.amenities,
    highlights: property.highlights,
    beds: property.beds,
    baths: property.baths,
    squareFeet: property.squareFeet,
    propertyType: property.propertyType,
    address: property.location.address,
    city: property.location.city,
    state: property.location.state,
    country: property.location.country,
    postalCode: property.location.postalCode,
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-headline text-ink">Edit property</h1>
        <p className="text-body text-ink-soft">
          Update the listing. Address changes re-run geocoding.
        </p>
      </header>

      <PropertyForm
        defaultValues={defaults}
        submitLabel="Save changes"
        onSubmit={updatePropertyAction.bind(null, id)}
        footerExtras={<DeletePropertyButton propertyId={id} variant="page" />}
      />
    </div>
  );
}
