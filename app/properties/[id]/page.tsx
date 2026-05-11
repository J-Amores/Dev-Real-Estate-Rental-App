import Link from "next/link";
import { notFound } from "next/navigation";

import { DeletePropertyButton } from "@/components/delete-property-button";
import { PropertyGallery } from "@/components/property-gallery";
import { PropertyMap } from "@/components/property-map";
import { buttonClassName } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getPropertyDetail } from "@/lib/queries";
import { humanize } from "@/lib/utils";

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const integerFormatter = new Intl.NumberFormat("en-US");

type RouteParams = { params: Promise<{ id: string }> };

export default async function PropertyDetailPage({ params }: RouteParams) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const property = await getPropertyDetail(id);
  if (!property) notFound();

  const session = await auth();
  const isOwner =
    session?.user?.id != null && String(session.user.id) === property.managerId;

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
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              aria-disabled="true"
              title="Saving is coming soon"
              className={buttonClassName({ variant: "secondary" })}
            >
              ♡ Save
            </button>
            <button
              type="button"
              disabled
              aria-disabled="true"
              title="Applying is coming soon"
              className={buttonClassName({ variant: "primary" })}
            >
              Apply
            </button>
          </div>
          <p className="text-caption text-ink-faint">Applications open soon</p>
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
    </main>
  );
}
