"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import type { SearchResult } from "@/lib/queries";

const DEFAULT_CENTER: [number, number] = [-98.5795, 39.8283]; // Geographic US center
const DEFAULT_ZOOM = 3.2;

type Props = {
  properties: SearchResult[];
};

type PinnableProperty = SearchResult & { lat: number; lng: number };

function hasCoords(p: SearchResult): p is PinnableProperty {
  return (
    typeof p.lat === "number" &&
    typeof p.lng === "number" &&
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lng)
  );
}

export function SearchMap({ properties }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  useEffect(() => {
    if (!token || !containerRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      dragRotate: false,
      attributionControl: true,
    });
    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const pins = properties.filter(hasCoords);
    if (pins.length === 0) {
      map.easeTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, duration: 400 });
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();
    pins.forEach((p) => {
      const marker = new mapboxgl.Marker()
        .setLngLat([p.lng, p.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 24, closeButton: false }).setHTML(
            `<div style="font-family: Inter, system-ui, sans-serif; font-size: 13px; line-height: 1.4;"><strong>${escapeHtml(p.name)}</strong><br/><span style="color:#535f5b">${escapeHtml(p.city)}, ${escapeHtml(p.state)}</span></div>`,
          ),
        )
        .addTo(map);
      markersRef.current.push(marker);
      bounds.extend([p.lng, p.lat]);
    });

    if (pins.length === 1) {
      map.easeTo({ center: [pins[0].lng, pins[0].lat], zoom: 12, duration: 400 });
    } else {
      map.fitBounds(bounds, { padding: 48, duration: 400, maxZoom: 14 });
    }
  }, [properties]);

  if (!token) {
    return (
      <div
        className="flex h-full min-h-[400px] w-full items-center justify-center rounded-photo bg-surface-sunk text-caption text-ink-soft"
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
      className="h-full min-h-[400px] w-full overflow-hidden rounded-photo bg-surface-sunk"
      role="region"
      aria-label="Map of search results"
    />
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
