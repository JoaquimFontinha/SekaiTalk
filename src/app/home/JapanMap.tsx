"use client";

import { useEffect, useRef, useState } from "react";
import Map, { Marker } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { useRouter } from "next/navigation";
import staticCities from "@/lib/cities";
import { useMapCtx } from "./MapContext";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

type UserStats = { level: number };
type CityEntry = { slug: string; name: string; lng: number; lat: number; levelRequired: number };

function toCityList(cities: Record<string, { name: string; center: [number,number]; levelRequired: number }>): CityEntry[] {
  return Object.entries(cities).map(([slug, data]) => ({
    slug, name: data.name, lng: data.center[1], lat: data.center[0], levelRequired: data.levelRequired ?? 0,
  }));
}

const JAPAN_REGIONS_GEOJSON = {
  type: "FeatureCollection" as const,
  features: [
    { type: "Feature" as const, geometry: { type: "Point" as const, coordinates: [142.8, 43.5] }, properties: { name: "HOKKAIDŌ" } },
    { type: "Feature" as const, geometry: { type: "Point" as const, coordinates: [140.8, 39.2] }, properties: { name: "TŌHOKU" } },
    { type: "Feature" as const, geometry: { type: "Point" as const, coordinates: [139.6, 36.0] }, properties: { name: "KANTŌ" } },
    { type: "Feature" as const, geometry: { type: "Point" as const, coordinates: [137.2, 36.6] }, properties: { name: "CHŪBU" } },
    { type: "Feature" as const, geometry: { type: "Point" as const, coordinates: [135.4, 34.9] }, properties: { name: "KANSAI" } },
    { type: "Feature" as const, geometry: { type: "Point" as const, coordinates: [133.0, 34.8] }, properties: { name: "CHŪGOKU" } },
    { type: "Feature" as const, geometry: { type: "Point" as const, coordinates: [133.6, 33.6] }, properties: { name: "SHIKOKU" } },
    { type: "Feature" as const, geometry: { type: "Point" as const, coordinates: [130.5, 33.0] }, properties: { name: "KYŪSHŪ" } },
    { type: "Feature" as const, geometry: { type: "Point" as const, coordinates: [127.7, 26.4] }, properties: { name: "OKINAWA" } },
  ],
};

const MAP_STYLE = {
  version: 8 as const,
  glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
  sources: {
    "country-boundaries": {
      type: "vector" as const,
      url: "mapbox://mapbox.country-boundaries-v1",
    },
    "terrain-dem": {
      type: "raster-dem" as const,
      encoding: "terrarium" as const,
      tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
      tileSize: 256,
    },
    "japan-regions": {
      type: "geojson" as const,
      data: JAPAN_REGIONS_GEOJSON,
    },
  },
  layers: [
    {
      id: "ocean-background",
      type: "background" as const,
      paint: { "background-color": "#1a3568" },
    },
    {
      id: "non-japan-mask-base",
      type: "fill" as const,
      source: "country-boundaries",
      "source-layer": "country_boundaries",
      filter: ["!=", ["get", "iso_3166_1"], "JP"],
      paint: { "fill-color": "#1a3568", "fill-opacity": 1, "fill-antialias": false },
    },
    {
      id: "japan-fill",
      type: "fill" as const,
      source: "country-boundaries",
      "source-layer": "country_boundaries",
      filter: ["==", ["get", "iso_3166_1"], "JP"],
      paint: { "fill-color": "#b8a07a", "fill-opacity": 1 },
    },
    {
      id: "japan-hillshade",
      type: "hillshade" as const,
      source: "terrain-dem",
      paint: {
        "hillshade-illumination-direction": 335,
        "hillshade-exaggeration": 0.15,
        "hillshade-shadow-color": "#1a3568",
        "hillshade-highlight-color": "#ddd5be",
        "hillshade-accent-color": "#1a3568",
      },
    },
    {
      id: "non-japan-mask",
      type: "fill" as const,
      source: "country-boundaries",
      "source-layer": "country_boundaries",
      filter: ["!=", ["get", "iso_3166_1"], "JP"],
      paint: { "fill-color": "#1a3568", "fill-opacity": 1, "fill-antialias": false },
    },
    {
      id: "japan-region-labels",
      type: "symbol" as const,
      source: "japan-regions",
      minzoom: 5.8,
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["DIN Offc Pro Bold", "Arial Unicode MS Bold"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 5.8, 9, 9, 13],
        "text-letter-spacing": 0.18,
        "text-anchor": "center" as const,
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": "rgba(255,255,255,0.55)",
        "text-halo-color": "rgba(0,0,0,0.3)",
        "text-halo-width": 1,
        "text-opacity": ["interpolate", ["linear"], ["zoom"], 5.8, 0, 6.5, 1],
      },
    },
  ],
};

const CITY_LOGOS: Record<string, string> = {
  tokyo: "/images/cities/tokyo_home.svg",
};

const CENTER_LNG  = 136.5;
const CENTER_LAT  = 36.8;
const INIT_ZOOM   = 5.4;
const SIDEBAR_PX  = 468; // sidebar width (448) + left offset (20)
// Mobile: collapsed sheet = 84px + 14px bottom margin = ~98px from bottom
function getMapPadding() {
  const mobile = typeof window !== "undefined" && window.innerWidth < 640;
  return mobile
    ? { left: 0, top: 0, right: 0, bottom: 100 }
    : { left: SIDEBAR_PX, top: 0, right: 0, bottom: 0 };
}

export default function JapanMap() {
  const router = useRouter();
  const mapRef = useRef<MapRef>(null);
  const { japanFlyToRef } = useMapCtx();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [cityList, setCityList] = useState<CityEntry[]>(toCityList(staticCities));

  useEffect(() => {
    fetch("/api/user/stats")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setUserStats(data); })
      .catch(() => {});
    fetch("/api/content/cities")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setCityList(toCityList(data)); })
      .catch(() => {});
  }, []);

  return (
    <div style={{
      position: "relative",
      width: "100%",
      height: "100%",
      background: "radial-gradient(ellipse farthest-corner at 54% 50%, #3a5fa0 0%, #1a3568 100%)",
    }}>
    <Map
      ref={mapRef}
      mapboxAccessToken={MAPBOX_TOKEN}
      mapStyle={MAP_STYLE}
      initialViewState={{
        longitude: CENTER_LNG,
        latitude: CENTER_LAT,
        zoom: INIT_ZOOM,
        pitch: 30,
        bearing: 0,
      }}
      onLoad={() => {
        const map = mapRef.current?.getMap();
        if (!map) return;
        map.setPadding(getMapPadding());
        map.jumpTo({ center: [CENTER_LNG, CENTER_LAT], zoom: INIT_ZOOM });
        japanFlyToRef.current = (lng, lat, zoom = 7) => {
          map.flyTo({ center: [lng, lat], zoom, duration: 1200, essential: true });
        };
        // Update padding on resize (e.g. orientation change)
        const onResize = () => {
          map.setPadding(getMapPadding());
          map.jumpTo({ center: [CENTER_LNG, CENTER_LAT], zoom: INIT_ZOOM });
        };
        window.addEventListener("resize", onResize);
      }}
      minZoom={5.4}
      maxZoom={9}
      maxBounds={[[122, 23], [155, 47]]}
      dragPan={true}
      dragRotate={false}
      scrollZoom={true}
      touchZoomRotate={true}
      doubleClickZoom={true}
      keyboard={false}
      attributionControl={false}
      style={{ width: "100%", height: "100%" }}
    >
      {cityList.map(city => {
        const isLocked = city.levelRequired > (userStats?.level ?? 0);

        return (
          <Marker
            key={city.slug}
            longitude={city.lng}
            latitude={city.lat}
            anchor="bottom"
            onClick={e => {
              e.originalEvent?.stopPropagation();
              if (!isLocked) router.push(`/home/${city.slug}`);
            }}
          >
            <div
              className={`gm3d-poi japan-poi${isLocked ? " gm3d-poi--locked" : ""}`}
              style={{ "--pc": isLocked ? "#888" : "#6366f1" } as React.CSSProperties}
            >
              <div className="gm3d-badge">
                <div className="gm3d-icon-wrap">
                  {!isLocked && CITY_LOGOS[city.slug]
                    ? <img src={CITY_LOGOS[city.slug]} alt={city.name} style={{ width: 30, height: 30, objectFit: "contain" }} />
                    : <span className="gm3d-icon">{isLocked ? "🔒" : "🗾"}</span>
                  }
                </div>
                <span className="gm3d-name">
                  {isLocked ? (city.levelRequired >= 99 ? "Bientôt" : `Nv.${city.levelRequired} requis`) : city.name}
                </span>
              </div>
              <div className="gm3d-stem" />
              <span className="gm3d-city-label">
                {city.name.toUpperCase()}
              </span>
            </div>
          </Marker>
        );
      })}
    </Map>
  </div>
  );
}
