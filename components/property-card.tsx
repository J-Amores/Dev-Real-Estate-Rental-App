"use client";

import Link from "next/link";

import { DeletePropertyButton } from "@/components/delete-property-button";
import { FavoriteButton } from "@/components/favorite-button";
import { buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { priceFormatter } from "@/lib/format";
import { PLACEHOLDER, onImageError } from "@/lib/images";
import { humanize } from "@/lib/utils";

type Variant = "public" | "owner" | "discovery";

type Props = {
  id: number;
  name: string;
  pricePerMonth: number;
  propertyType: string;
  photoUrls: string[];
  location: { city: string; state: string };
  variant?: Variant;
  showFavorite?: boolean;
  isFavorited?: boolean;
  priority?: boolean;
};

export function PropertyCard({
  id,
  name,
  pricePerMonth,
  propertyType,
  photoUrls,
  location,
  variant = "owner",
  showFavorite = false,
  isFavorited = false,
  priority = false,
}: Props) {
  const cover = photoUrls[0] ?? PLACEHOLDER;

  if (variant === "discovery") {
    const ariaLabel = `${name}, ${priceFormatter.format(pricePerMonth)} per month in ${location.city}, ${location.state}`;
    return (
      <article className="group relative flex flex-col gap-2">
        <Link
          href={`/properties/${id}`}
          aria-label={ariaLabel}
          className="absolute inset-0 z-0 rounded-photo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-2 focus-visible:ring-offset-surface-paper"
        />
        <div className="relative aspect-[2/3] overflow-hidden rounded-photo bg-surface-sunk">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt=""
            loading={priority ? "eager" : "lazy"}
            className="h-full w-full object-cover transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            onError={onImageError}
          />
          {showFavorite && (
            <div className="absolute top-2 right-2 z-10">
              <FavoriteButton
                propertyId={id}
                initialFavorited={isFavorited}
                variant="card"
              />
            </div>
          )}
          <span
            aria-hidden
            className="absolute bottom-2 left-2 z-10 inline-flex items-center rounded-sm border border-hairline bg-surface-paper px-2 py-1 text-caption tabular-nums text-ink"
          >
            {priceFormatter.format(pricePerMonth)}
          </span>
        </div>
        <div className="relative z-[1] flex flex-col gap-0.5 px-0.5">
          <h3 className="text-title text-ink">{name}</h3>
          <p className="text-caption tabular-nums text-ink-soft">
            {location.city}, {location.state}
            <span className="mx-1.5 text-ink-faint" aria-hidden>
              ·
            </span>
            {humanize(propertyType)}
          </p>
        </div>
      </article>
    );
  }

  const photo = (
    <div className="relative aspect-[16/10] overflow-hidden rounded-photo bg-surface-sunk">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cover}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover"
        onError={onImageError}
      />
      {variant === "public" && showFavorite && (
        <div className="absolute top-2 right-2 z-10">
          <FavoriteButton
            propertyId={id}
            initialFavorited={isFavorited}
            variant="card"
          />
        </div>
      )}
    </div>
  );

  const info = (
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
  );

  if (variant === "public") {
    return (
      <Card
        variant="listing"
        className="group relative flex flex-col gap-3 transition-colors duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] focus-within:bg-surface-panel hover:bg-surface-panel motion-reduce:transition-none"
      >
        <Link
          href={`/properties/${id}`}
          aria-label={`${name}, ${priceFormatter.format(pricePerMonth)} per month in ${location.city}, ${location.state}`}
          className="absolute inset-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-2 focus-visible:ring-offset-surface-paper"
        />
        {photo}
        {info}
      </Card>
    );
  }

  return (
    <Card variant="listing" className="flex flex-col gap-3">
      {photo}
      {info}

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
