"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

type Props = {
  lat: number | null;
  lng: number | null;
  label?: string;
};

export function PropertyMap({ lat, lng, label }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const hasCoords = typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng);
  const canRender = Boolean(token) && hasCoords;

  useEffect(() => {
    if (!canRender || !containerRef.current) return;

    mapboxgl.accessToken = token!;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [lng!, lat!],
      zoom: 14,
      scrollZoom: false,
      dragRotate: false,
      attributionControl: true,
    });

    const marker = new mapboxgl.Marker().setLngLat([lng!, lat!]).addTo(map);
    if (label) marker.setPopup(new mapboxgl.Popup({ offset: 24 }).setText(label));

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [canRender, lat, lng, label, token]);

  if (!canRender) {
    return (
      <div
        className="flex aspect-[16/9] w-full items-center justify-center rounded-photo bg-surface-sunk text-caption text-ink-soft"
        role="img"
        aria-label="Map preview unavailable"
      >
        Map preview unavailable
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="aspect-[16/9] w-full overflow-hidden rounded-photo bg-surface-sunk"
      aria-label={label ? `Map showing ${label}` : "Property map"}
      role="img"
    />
  );
}
