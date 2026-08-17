"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useLanguage } from "@/i18n/language-provider";

/** Small single-marker map near the address — deliberately not the full
 * search MapPanel (no clustering/draw tool, just "where is this"). Renders
 * nothing if there's no token or no coordinates, same "degrade, don't
 * break" pattern as MapPanel's own missing-token fallback and the rest of
 * the optional listing-detail sections. */
export function ListingMap({ lat, lng }: { lat: number; lng: number }) {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    if (!token || !containerRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [lng, lat],
      zoom: 14,
      interactive: true,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }));
    new mapboxgl.Marker({ color: "#6e2a1e" }).setLngLat([lng, lat]).addTo(map);

    return () => map.remove();
  }, [token, lat, lng]);

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  if (!token) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
      <div ref={containerRef} className="h-64 w-full" />
      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="border-t border-neutral-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-neutral-900 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
      >
        {t.listing.getDirections} →
      </a>
    </div>
  );
}
