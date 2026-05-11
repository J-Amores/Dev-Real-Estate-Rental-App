import Link from "next/link";
import { notFound } from "next/navigation";

import { ApplyForm } from "@/components/apply-form";
import { DeletePropertyButton } from "@/components/delete-property-button";
import { FavoriteButton } from "@/components/favorite-button";
import { PropertyGallery } from "@/components/property-gallery";
import { PropertyMap } from "@/components/property-map";
import { buttonClassName } from "@/components/ui/button";
import {
  APPLICATION_STATUS_COLOR,
  APPLICATION_STATUS_LABEL,
} from "@/lib/application-status";
import { auth } from "@/lib/auth";
import { integerFormatter, priceFormatter } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getPropertyDetail, getTenantApplicationStatus } from "@/lib/queries";
import { humanize } from "@/lib/utils";

type RouteParams = { params: Promise<{ id: string }> };

export default async function PropertyDetailPage({ params }: RouteParams) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const session = await auth();
  const tenantId =
    session?.user?.role === "tenant" && typeof session.user.tenantId === "number"
      ? session.user.tenantId
      : undefined;

  const property = await getPropertyDetail(id, tenantId);
  if (!property) notFound();

  const isOwner =
    session?.user?.id != null && session.user.id === property.managerId;
  const isTenant = tenantId != null;

  const applicationStatus =
    isTenant && session?.user?.id
      ? await getTenantApplicationStatus(property.id, session.user.id)
      : null;

  const tenantDefaults =
    isTenant && !applicationStatus && session?.user?.id
      ? await prisma.tenant
          .findUnique({
            where: { userId: session.user.id },
            select: { name: true, email: true, phoneNumber: true },
          })
          .then((t) =>
            t
              ? { name: t.name, email: t.email, phoneNumber: t.phoneNumber, message: "" }
              : null,
          )
      : null;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/search"
          className="text-caption text-ink-soft hover:text-ink"
        >
          ← Back to search
        </Link>
        {isOwner && (
          <div className="flex items-center gap-1">
            <Link
              href={`/dashboard/properties/${property.id}/edit`}
              className={buttonClassName({ variant: "ghost" })}
            >
              Edit
            </Link>
            <DeletePropertyButton propertyId={property.id} variant="card" />
          </div>
        )}
      </div>

      {/* Gallery */}
      <PropertyGallery photoUrls={property.photoUrls} altBase={property.name} />

      {/* Title block */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-headline text-ink">{property.name}</h1>
          <p className="text-body text-ink-soft tabular-nums">
            <span className="font-medium text-ink">
              {priceFormatter.format(property.pricePerMonth)} / mo
            </span>
            <span className="mx-1.5 text-ink-faint" aria-hidden>·</span>
            <span>
              {property.city}, {property.state}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isTenant && (
            <FavoriteButton
              propertyId={property.id}
              initialFavorited={property.isFavorited}
              variant="detail"
            />
          )}
          {isTenant && applicationStatus && (
            <span
              className={`inline-flex items-center rounded-sm px-3 py-[10px] text-label font-medium tracking-[0.005em] ${APPLICATION_STATUS_COLOR[applicationStatus]}`}
            >
              {APPLICATION_STATUS_LABEL[applicationStatus]}
            </span>
          )}
          {isTenant && !applicationStatus && (
            <a
              href="#apply"
              className={buttonClassName({ variant: "primary" })}
            >
              Apply
            </a>
          )}
        </div>
      </header>

      {/* Facts row */}
      <ul className="flex flex-wrap gap-2" aria-label="Property facts">
        {[
          `${property.beds} bd`,
          `${property.baths} ba`,
          `${integerFormatter.format(property.squareFeet)} sqft`,
          humanize(property.propertyType),
        ].map((fact) => (
          <li
            key={fact}
            className="inline-flex items-center rounded-xs bg-surface-sunk px-2 py-1 text-caption text-ink-soft tabular-nums"
          >
            {fact}
          </li>
        ))}
      </ul>

      {/* Description */}
      <section className="flex flex-col gap-3">
        <h2 className="text-title text-ink">About this property</h2>
        <p className="max-w-prose text-body text-ink-soft whitespace-pre-line">
          {property.description}
        </p>
      </section>

      {/* Amenities */}
      {property.amenities.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-title text-ink">Amenities</h2>
          <ul className="flex flex-wrap gap-2">
            {property.amenities.map((value) => (
              <li
                key={value}
                className="inline-flex items-center rounded-xs bg-surface-sunk px-2 py-1 text-caption text-ink-soft"
              >
                {humanize(value)}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Highlights */}
      {property.highlights.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-title text-ink">Highlights</h2>
          <ul className="flex flex-wrap gap-2">
            {property.highlights.map((value) => (
              <li
                key={value}
                className="inline-flex items-center rounded-xs bg-surface-sunk px-2 py-1 text-caption text-ink-soft"
              >
                {humanize(value)}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Location */}
      <section className="flex flex-col gap-3">
        <h2 className="text-title text-ink">Location</h2>
        <p className="text-body text-ink-soft">
          {property.address}, {property.city}, {property.state} {property.postalCode}
        </p>
        <PropertyMap lat={property.lat} lng={property.lng} label={property.name} />
      </section>

      {/* Listed by */}
      <section className="flex flex-col gap-1 border-t border-hairline pt-6">
        <h2 className="text-title text-ink">Listed by</h2>
        <p className="text-body text-ink-soft">
          {property.managerName} ·{" "}
          <a
            href={`mailto:${property.managerEmail}`}
            className="text-accent-evergreen hover:underline"
          >
            {property.managerEmail}
          </a>
        </p>
      </section>

      {/* Apply form */}
      {tenantDefaults && (
        <section id="apply" className="scroll-mt-8">
          <ApplyForm propertyId={property.id} defaults={tenantDefaults} />
        </section>
      )}
    </main>
  );
}
