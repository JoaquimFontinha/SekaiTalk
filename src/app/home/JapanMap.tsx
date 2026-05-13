"use client";

import { useEffect, useState } from "react";
import Map, { Marker } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { useRouter } from "next/navigation";
import cities from "@/lib/cities";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

type UserStats = { level: number };

const CITY_LIST = Object.entries(cities).map(([slug, data]) => ({
  slug,
  name: data.name,
  lng: data.center[1],
  lat: data.center[0],
  levelRequired: data.levelRequired ?? 0,
}));

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
      url: "mapbox://mapbox.mapbox-terrain-dem-v1",
      tileSize: 512,
    },
  },
  layers: [
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
        "hillshade-exaggeration": 0.45,
        "hillshade-shadow-color": "#6b4f2a",
        "hillshade-highlight-color": "#f0e8d0",
        "hillshade-accent-color": "#8a6640",
      },
    },
    {
      id: "non-japan-mask",
      type: "fill" as const,
      source: "country-boundaries",
      "source-layer": "country_boundaries",
      filter: ["!=", ["get", "iso_3166_1"], "JP"],
      paint: { "fill-color": "#1a3568", "fill-opacity": 1 },
    },
  ],
};

export default function JapanMap() {
  const router = useRouter();
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  useEffect(() => {
    fetch("/api/user/stats")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setUserStats(data); })
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
      mapboxAccessToken={MAPBOX_TOKEN}
      mapStyle={MAP_STYLE}
      initialViewState={{
        longitude: 136.5,
        latitude: 36.8,
        zoom: 5.4,
        pitch: 30,
        bearing: 0,
      }}
      dragPan={false}
      dragRotate={false}
      scrollZoom={false}
      touchZoomRotate={false}
      doubleClickZoom={false}
      keyboard={false}
        attributionControl={false}
      style={{ width: "100%", height: "100%" }}
    >
      {CITY_LIST.map(city => {
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
              className={`gm3d-poi${isLocked ? " gm3d-poi--locked" : ""}`}
              style={{ "--pc": isLocked ? "#888" : "#7c3aed" } as React.CSSProperties}
            >
              <div className="gm3d-badge">
                <div className="gm3d-icon-wrap">
                  <span className="gm3d-icon">{isLocked ? "🔒" : "🗾"}</span>
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
