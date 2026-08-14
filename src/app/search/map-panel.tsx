"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import { MapPinPopup } from "@/components/map-pin-popup";
import type { MapBounds, SearchListing } from "@/types/listing";

const SOURCE_ID = "listings";
const KOSOVO_CENTER: [number, number] = [20.9, 42.6];

interface MapPanelProps {
  listings: SearchListing[];
  selectedId: string | null;
  hoveredId: string | null;
  onBoundsChange: (bounds: MapBounds) => void;
  onPinClick: (id: string) => void;
  onPinHover: (id: string | null) => void;
  onPolygonChange: (geoJson: string | null) => void;
  hasPolygon: boolean;
  /** Hydrates the initial viewport (e.g. from a saved search). Only read
   * once, at mount — later changes don't re-fly the map. */
  initialBounds?: MapBounds | null;
}

function toFeatureCollection(
  listings: SearchListing[],
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: listings.map((l) => ({
      type: "Feature",
      id: l.id,
      geometry: { type: "Point", coordinates: [l.lng, l.lat] },
      properties: {
        id: l.id,
        priceLabel:
          l.status === "for-rent"
            ? `€${Math.round(l.price).toLocaleString()}/mo`
            : `€${Math.round(l.price).toLocaleString()}`,
      },
    })),
  };
}

function boundsFromMap(map: mapboxgl.Map): MapBounds {
  const b = map.getBounds()!;
  return {
    minLng: b.getWest(),
    minLat: b.getSouth(),
    maxLng: b.getEast(),
    maxLat: b.getNorth(),
  };
}

export function MapPanel({
  listings,
  selectedId,
  hoveredId,
  onBoundsChange,
  onPinClick,
  onPinHover,
  onPolygonChange,
  hasPolygon,
  initialBounds,
}: MapPanelProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const loadedRef = useRef(false);
  const pendingListingsRef = useRef<SearchListing[]>(listings);
  const highlightedIdsRef = useRef<Set<string>>(new Set());
  const initialBoundsRef = useRef(initialBounds);
  const mapboxPopupRef = useRef<mapboxgl.Popup | null>(null);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const [popup, setPopup] = useState<{
    container: HTMLDivElement;
    listing: SearchListing;
  } | null>(null);

  // Callbacks change identity across renders (they close over parent state);
  // keep the latest version in refs so the map-init effect can stay []‑deps.
  const onBoundsChangeRef = useRef(onBoundsChange);
  const onPinClickRef = useRef(onPinClick);
  const onPinHoverRef = useRef(onPinHover);
  const onPolygonChangeRef = useRef(onPolygonChange);
  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
    onPinClickRef.current = onPinClick;
    onPinHoverRef.current = onPinHover;
    onPolygonChangeRef.current = onPolygonChange;
  });

  useEffect(() => {
    if (!token || !containerRef.current) return;

    mapboxgl.accessToken = token;
    const bounds = initialBoundsRef.current;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      ...(bounds
        ? {
            bounds: [
              [bounds.minLng, bounds.minLat],
              [bounds.maxLng, bounds.maxLat],
            ] as [[number, number], [number, number]],
          }
        : { center: KOSOVO_CENTER, zoom: 8.3 }),
    });
    mapRef.current = map;

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {},
    });
    drawRef.current = draw;
    map.addControl(draw);

    map.on("load", () => {
      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: toFeatureCollection(pendingListingsRef.current),
        cluster: true,
        clusterRadius: 50,
        clusterMaxZoom: 14,
        promoteId: "id",
      });

      map.addLayer({
        id: "clusters",
        type: "circle",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#60a5fa",
            10,
            "#3b82f6",
            50,
            "#1d4ed8",
          ],
          "circle-radius": ["step", ["get", "point_count"], 16, 10, 22, 50, 28],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 12,
        },
        paint: { "text-color": "#ffffff" },
      });

      map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: SOURCE_ID,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": 6,
          "circle-color": [
            "case",
            ["boolean", ["feature-state", "highlighted"], false],
            "#2563eb",
            "#111827",
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      map.addLayer({
        id: "unclustered-price-label",
        type: "symbol",
        source: SOURCE_ID,
        filter: ["!", ["has", "point_count"]],
        layout: {
          "text-field": ["get", "priceLabel"],
          "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 11,
          "text-offset": [0, -1.4],
          "text-anchor": "bottom",
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": [
            "case",
            ["boolean", ["feature-state", "highlighted"], false],
            "#2563eb",
            "#111827",
          ],
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.5,
        },
      });

      loadedRef.current = true;
      onBoundsChangeRef.current(boundsFromMap(map));
    });

    map.on("moveend", () => onBoundsChangeRef.current(boundsFromMap(map)));

    map.on("click", "clusters", (e) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const clusterId = feature.properties?.cluster_id;
      const source = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource;
      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err || zoom == null) return;
        map.easeTo({
          center: (feature.geometry as GeoJSON.Point).coordinates as [
            number,
            number,
          ],
          zoom,
        });
      });
    });

    map.on("click", "unclustered-point", (e) => {
      const feature = e.features?.[0];
      const id = feature?.properties?.id;
      if (!id) return;
      onPinClickRef.current(id);

      const listing = pendingListingsRef.current.find((l) => l.id === id);
      if (!listing) return;
      const coordinates = (feature!.geometry as GeoJSON.Point).coordinates as [
        number,
        number,
      ];

      mapboxPopupRef.current?.remove();
      const container = document.createElement("div");
      const mbPopup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: true,
        maxWidth: "300px",
        offset: 14,
        className: "flake-map-popup",
      })
        .setLngLat(coordinates)
        .setDOMContent(container)
        .addTo(map);
      mbPopup.on("close", () => setPopup(null));
      mapboxPopupRef.current = mbPopup;
      setPopup({ container, listing });
    });

    for (const layer of ["clusters", "unclustered-point"]) {
      map.on("mouseenter", layer, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", layer, () => {
        map.getCanvas().style.cursor = "";
      });
    }

    map.on("mousemove", "unclustered-point", (e) => {
      const id = e.features?.[0]?.properties?.id;
      if (id) onPinHoverRef.current(id);
    });
    map.on("mouseleave", "unclustered-point", () =>
      onPinHoverRef.current(null),
    );

    map.on("draw.create", () => emitPolygon());
    map.on("draw.update", () => emitPolygon());
    map.on("draw.delete", () => onPolygonChangeRef.current(null));

    function emitPolygon() {
      const all = draw.getAll();
      const polygon = all.features.find((f) => f.geometry.type === "Polygon");
      onPolygonChangeRef.current(
        polygon ? JSON.stringify(polygon.geometry) : null,
      );
    }

    return () => {
      map.remove();
      mapRef.current = null;
      drawRef.current = null;
      loadedRef.current = false;
    };
    // token is a NEXT_PUBLIC_ build-time constant, not reactive state — this
    // effect is a genuine one-time init and intentionally has no deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push new listings into the map source once it exists.
  useEffect(() => {
    pendingListingsRef.current = listings;
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    const source = map.getSource(SOURCE_ID) as
      mapboxgl.GeoJSONSource | undefined;
    source?.setData(toFeatureCollection(listings));
  }, [listings]);

  // Keep feature-state in sync with which pin is selected/hovered.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;

    const nextIds = new Set(
      [selectedId, hoveredId].filter(Boolean) as string[],
    );
    for (const id of highlightedIdsRef.current) {
      if (!nextIds.has(id)) {
        map.setFeatureState({ source: SOURCE_ID, id }, { highlighted: false });
      }
    }
    for (const id of nextIds) {
      map.setFeatureState({ source: SOURCE_ID, id }, { highlighted: true });
    }
    highlightedIdsRef.current = nextIds;
  }, [selectedId, hoveredId]);

  if (!token) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-neutral-100 p-6 text-center text-sm text-neutral-500 dark:bg-neutral-900">
        Set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local to enable the map.
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      <div className="absolute top-3 right-3 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => drawRef.current?.changeMode("draw_polygon")}
          className="btn-sm bg-white shadow-md hover:bg-neutral-50 dark:bg-neutral-900 dark:hover:bg-neutral-800"
        >
          Draw search area
        </button>
        {hasPolygon && (
          <button
            type="button"
            onClick={() => {
              drawRef.current?.deleteAll();
              onPolygonChange(null);
            }}
            className="btn-sm text-danger-600 dark:text-danger-400 bg-white shadow-md hover:bg-neutral-50 dark:bg-neutral-900 dark:hover:bg-neutral-800"
          >
            Clear area
          </button>
        )}
      </div>

      {popup &&
        createPortal(
          <MapPinPopup
            listing={popup.listing}
            onViewDetails={(id) => router.push(`/listing/${id}`)}
          />,
          popup.container,
        )}
    </div>
  );
}
