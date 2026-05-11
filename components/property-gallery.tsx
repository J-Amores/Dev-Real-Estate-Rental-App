"use client";

import { useState } from "react";

const PLACEHOLDER = "/placeholder.jpg";

type Props = {
  photoUrls: string[];
  altBase: string;
};

export function PropertyGallery({ photoUrls, altBase }: Props) {
  const photos = photoUrls.length > 0 ? photoUrls : [PLACEHOLDER];
  const [activeIndex, setActiveIndex] = useState(0);
  const safeIndex = Math.min(activeIndex, photos.length - 1);
  const hero = photos[safeIndex];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[16/10] overflow-hidden rounded-photo bg-surface-sunk">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={hero}
          src={hero}
          alt={`${altBase} — photo ${safeIndex + 1}`}
          className="h-full w-full object-cover"
          onError={(event) => {
            const target = event.currentTarget;
            if (target.src.endsWith(PLACEHOLDER)) return;
            target.src = PLACEHOLDER;
          }}
        />
      </div>

      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Property photos">
          {photos.map((src, idx) => {
            const isActive = idx === safeIndex;
            return (
              <button
                key={`${src}-${idx}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Show photo ${idx + 1}`}
                onClick={() => setActiveIndex(idx)}
                className={[
                  "relative h-16 w-24 shrink-0 overflow-hidden rounded-sm bg-surface-sunk",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-evergreen focus-visible:ring-offset-2 focus-visible:ring-offset-surface-paper",
                  isActive ? "ring-2 ring-accent-evergreen ring-offset-2 ring-offset-surface-paper" : "opacity-80 hover:opacity-100",
                ].join(" ")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    const target = event.currentTarget;
                    if (target.src.endsWith(PLACEHOLDER)) return;
                    target.src = PLACEHOLDER;
                  }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
