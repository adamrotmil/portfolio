"use client";

import { useEffect, useMemo, useRef } from "react";
import maplibregl, {
  Map as MapLibreMap,
  Marker,
  type LayerSpecification,
} from "maplibre-gl";
import type { City, Restaurant } from "@/map/types";
import type { Telemetry } from "@/map/useTelemetry";

// Tactical surface for the Table deck.  Same Esri World Imagery base
// as the Airbnb-era map, dimmed and desaturated to read as a night
// operations background rather than a glossy satellite postcard.
//
// Custom DOM markers show a status dot + live wait time (fed from the
// telemetry hook upstream) instead of the Airbnb-style price pill.
// The selected target gets a crosshair range ring rendered as a
// standalone marker positioned at the same lngLat.
//
// Heat overlay is a GeoJSON source updated every few seconds against
// the current telemetry map; when enabled, it becomes a diffuse
// reservation-pressure heatmap on top of the satellite.

interface Props {
  city: City;
  restaurants: Restaurant[];
  telemetry: Telemetry;
  hoveredId: string | null;
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string | null) => void;
  heatmap: boolean;
}

// Esri World Imagery + a desaturating color matrix that we apply as a
// CSS filter in the container — cheaper and more faithful than a
// per-tile pixel pass, and MapLibre's raster layer doesn't support
// per-channel matrix anyway.
const SATELLITE_STYLE = {
  version: 8 as const,
  sources: {
    "esri-world-imagery": {
      type: "raster" as const,
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution:
        "Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics",
      maxzoom: 19,
    },
    "esri-reference": {
      type: "raster" as const,
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 13,
    },
  },
  layers: [
    {
      id: "satellite",
      type: "raster" as const,
      source: "esri-world-imagery",
    },
    {
      id: "places",
      type: "raster" as const,
      source: "esri-reference",
      paint: { "raster-opacity": 0.35 },
    },
  ],
  glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
};

const HEAT_SOURCE = "rsv-pressure";
const HEAT_LAYER = "rsv-pressure-heat";

export default function TacticalMap({
  city,
  restaurants,
  telemetry,
  hoveredId,
  selectedId,
  onHover,
  onSelect,
  heatmap,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const loadedRef = useRef(false);

  const markersRef = useRef<Map<string, Marker>>(new Map());
  const nodesRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const ringRef = useRef<Marker | null>(null);

  // Stable callbacks
  const onHoverRef = useRef(onHover);
  const onSelectRef = useRef(onSelect);
  onHoverRef.current = onHover;
  onSelectRef.current = onSelect;

  // Init
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: SATELLITE_STYLE,
      center: city.center,
      zoom: city.zoom,
      attributionControl: { compact: true },
      minZoom: 10,
      maxZoom: 18,
      cooperativeGestures: false,
      pitchWithRotate: false,
      dragRotate: false,
    });
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false, showZoom: true }),
      "top-right",
    );

    map.on("load", () => {
      loadedRef.current = true;
      // Empty source; the heatmap effect below keeps it up to date.
      map.addSource(HEAT_SOURCE, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer(
        {
          id: HEAT_LAYER,
          type: "heatmap",
          source: HEAT_SOURCE,
          maxzoom: 16,
          paint: {
            "heatmap-weight": ["interpolate", ["linear"], ["get", "w"], 0, 0, 1, 1],
            "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 10, 0.6, 14, 1.2],
            "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 10, 18, 14, 52, 16, 92],
            "heatmap-opacity": 0,      // toggled on by the heatmap prop effect
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0, "rgba(0,0,0,0)",
              0.15, "rgba(94,162,255,0.45)",
              0.45, "rgba(242,178,74,0.65)",
              0.75, "rgba(239,90,90,0.8)",
              1, "rgba(239,90,90,0.95)",
            ],
          } as LayerSpecification["paint"],
        } as LayerSpecification,
      );
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
      nodesRef.current.clear();
      ringRef.current = null;
      loadedRef.current = false;
    };
  }, [city]);

  // Marker reconciliation when the visible set changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const nextIds = new Set(restaurants.map((r) => r.id));
    for (const [id, marker] of markersRef.current) {
      if (!nextIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
        nodesRef.current.delete(id);
      }
    }

    for (const r of restaurants) {
      if (markersRef.current.has(r.id)) continue;
      const node = document.createElement("div");
      node.className = "tgt-pin";
      node.setAttribute("data-id", r.id);
      node.innerHTML = `
        <div class="tgt-pin__ring"></div>
        <div class="tgt-pin__body">
          <span class="tgt-pin__dot"></span>
          <span class="tgt-pin__wait" data-wait>–</span>
          <span class="tgt-pin__unit">m</span>
        </div>
        <div class="tgt-pin__code">${r.id.slice(0, 3).toUpperCase()}</div>
      `;
      node.addEventListener("mouseenter", () => onHoverRef.current(r.id));
      node.addEventListener("mouseleave", () => onHoverRef.current(null));
      node.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectRef.current(r.id);
      });
      const marker = new maplibregl.Marker({ element: node, anchor: "center" })
        .setLngLat([r.lng, r.lat])
        .addTo(map);
      markersRef.current.set(r.id, marker);
      nodesRef.current.set(r.id, node);
    }
  }, [restaurants]);

  // Push live telemetry into the pin DOM on every frame of telemetry
  // state.  Cheap: we only touch the wait number + status dot.
  useEffect(() => {
    for (const [id, node] of nodesRef.current) {
      const t = telemetry[id];
      if (!t) continue;
      const waitEl = node.querySelector("[data-wait]") as HTMLElement | null;
      if (waitEl) waitEl.textContent = String(Math.round(t.wait));
      node.dataset.load = statusBand(t.kitchenLoad);
      node.dataset.open = t.open ? "true" : "false";
    }
  }, [telemetry]);

  // Hover / selected state classes.
  useEffect(() => {
    for (const [id, node] of nodesRef.current) {
      node.dataset.hovered = hoveredId === id ? "true" : "false";
      node.dataset.selected = selectedId === id ? "true" : "false";
      node.style.zIndex =
        selectedId === id ? "30" : hoveredId === id ? "20" : "10";
    }
  }, [hoveredId, selectedId, restaurants]);

  // Range ring marker around the selected target.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (ringRef.current) {
      ringRef.current.remove();
      ringRef.current = null;
    }
    if (!selectedId) return;
    const r = restaurants.find((x) => x.id === selectedId);
    if (!r) return;
    const el = document.createElement("div");
    el.className = "tgt-ring";
    el.innerHTML = `<span></span><span></span>`;
    ringRef.current = new maplibregl.Marker({ element: el, anchor: "center" })
      .setLngLat([r.lng, r.lat])
      .addTo(map);
  }, [selectedId, restaurants]);

  // Fly-to on select.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const r = restaurants.find((x) => x.id === selectedId);
    if (!r) return;
    map.flyTo({
      center: [r.lng, r.lat],
      zoom: Math.max(map.getZoom(), 14.2),
      speed: 0.9,
      curve: 1.4,
      essential: true,
    });
  }, [selectedId, restaurants]);

  // Fit-bounds when filter set materially changes + no selection.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || restaurants.length === 0 || selectedId) return;
    if (restaurants.length === 1) {
      map.flyTo({ center: [restaurants[0].lng, restaurants[0].lat], zoom: 14 });
      return;
    }
    const bounds = new maplibregl.LngLatBounds();
    for (const r of restaurants) bounds.extend([r.lng, r.lat]);
    map.fitBounds(bounds, {
      padding: { top: 60, right: 60, bottom: 60, left: 60 },
      maxZoom: 14,
      duration: 700,
    });
  }, [restaurants, selectedId]);

  // Feed the heatmap source with telemetry each tick — weights are
  // reservation pressure so the heat reflects where it's hardest to
  // get a table right now.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    const src = map.getSource(HEAT_SOURCE) as maplibregl.GeoJSONSource | undefined;
    if (!src) return;
    src.setData({
      type: "FeatureCollection",
      features: restaurants.map((r) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [r.lng, r.lat] },
        properties: {
          w: telemetry[r.id]?.rsvPressure ?? 0,
        },
      })),
    });
  }, [restaurants, telemetry]);

  // Toggle heatmap layer visibility via opacity so we keep the
  // animation cheap and don't thrash the layer.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    if (!map.getLayer(HEAT_LAYER)) return;
    map.setPaintProperty(HEAT_LAYER, "heatmap-opacity", heatmap ? 0.85 : 0);
  }, [heatmap]);

  useMemo(() => void 0, []);

  return (
    <div
      className="absolute inset-0"
      style={{ background: "#05070a" }}
      onClick={() => onSelect(null)}
    >
      <div
        ref={containerRef}
        className="tactical-map"
        style={{
          width: "100%",
          height: "100%",
          // Desaturate + darken the satellite so it reads as a tactical
          // ground layer instead of a postcard.
          filter:
            "grayscale(0.28) brightness(0.62) contrast(1.08) saturate(0.72) hue-rotate(-6deg)",
        }}
      />
    </div>
  );
}

function statusBand(load: number): "ok" | "warn" | "hot" {
  if (load < 0.55) return "ok";
  if (load < 0.82) return "warn";
  return "hot";
}
