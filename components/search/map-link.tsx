"use client";

import { MapPin } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { buttonClassName } from "@/components/ui/button";

type Props = {
  className?: string;
};

export function MapLink({ className }: Props) {
  const params = useSearchParams();
  const qs = params.toString();
  const href = qs ? `/search/map?${qs}` : "/search/map";

  return (
    <Link
      href={href}
      aria-label="View results on a map"
      className={[buttonClassName({ variant: "secondary" }), className]
        .filter(Boolean)
        .join(" ")}
    >
      <MapPin aria-hidden className="size-4" />
      View on map
    </Link>
  );
}
