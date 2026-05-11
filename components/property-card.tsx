"use client";

import Link from "next/link";

import { DeletePropertyButton } from "@/components/delete-property-button";
import { buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { humanize } from "@/lib/utils";

const PLACEHOLDER = "/placeholder.jpg";

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

type Variant = "public" | "owner";

type Props = {
  id: number;
  name: string;
  pricePerMonth: number;
  propertyType: string;
  photoUrls: string[];
  location: { city: string; state: string };
  variant?: Variant;
};

export function PropertyCard({
  id,
  name,
  pricePerMonth,
  propertyType,
  photoUrls,
  location,
  variant = "owner",
}: Props) {
  const cover = photoUrls[0] ?? PLACEHOLDER;

  const body = (
    <>
      <div className="relative aspect-[16/10] overflow-hidden rounded-photo bg-surface-sunk">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cover}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
          onError={(event) => {
            const target = event.currentTarget;
            if (target.src.endsWith(PLACEHOLDER)) return;
            target.src = PLACEHOLDER;
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <h3 className="text-title text-ink">{name}</h3>
        <p className="text-caption text-ink-soft tabular-nums">
          <span className="font-medium text-ink">
            {priceFormatter.format(pricePerMonth)}
          </span>
          <span className="mx-1.5 text-ink-faint" aria-hidden>
            ·
          </span>
          <span>
            {location.city}, {location.state}
          </span>
        </p>
        <div>
          <span className="inline-flex items-center rounded-xs bg-surface-sunk px-2 py-1 text-caption text-ink-soft">
            {humanize(propertyType)}
          </span>
        </div>
      </div>
    </>
  );

  if (variant === "public") {
    return (
      <Link
        href={`/properties/${id}`}
        aria-label={`${name}, ${priceFormatter.format(pricePerMonth)} per month in ${location.city}, ${location.state}`}
        className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-2 focus-visible:ring-offset-surface-paper"
      >
        <Card
          variant="listing"
          className="flex flex-col gap-3 transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:bg-surface-panel motion-reduce:transition-none"
        >
          {body}
        </Card>
      </Link>
    );
  }

  return (
    <Card variant="listing" className="flex flex-col gap-3">
      {body}

      <div className="mt-auto flex items-center justify-end gap-1 border-t border-hairline pt-3">
        <Link
          href={`/dashboard/properties/${id}/edit`}
          className={buttonClassName({ variant: "ghost" })}
        >
          Edit
        </Link>
        <DeletePropertyButton propertyId={id} variant="card" />
      </div>
    </Card>
  );
}
