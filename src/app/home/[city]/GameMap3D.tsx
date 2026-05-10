"use client";

import { useRef, useCallback, useEffect } from "react";
import Map, { Marker, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { CityData, POIType } from "@/lib/cities";
import POI_LOGOS from "@/lib/poi-logos";

const STYLE_URL    = "mapbox://styles/mapbox/standard";
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

const POI_COLORS: Record<POIType, string> = {
  transport:  "#0ea5e9",
  konbini:    "#10b981",
  izakaya:    "#f97316",
  site:       "#8b5cf6",
  market:     "#f59e0b",
  loisir:     "#14b8a6",
  shop:       "#ec4899",
  restaurant: "#f43f5e",
  cafe:       "#92400e",
};

const POI_ICONS: Record<POIType, string> = {
  transport:  "🚇",
  konbini:    "🏪",
  izakaya:    "🍶",
  site:       "🏛️",
  market:     "🛒",
  loisir:     "🎭",
  shop:       "🛍️",
  restaurant: "🍔",
  cafe:       "☕",
};


export default function GameMap3D({
  city,
  activeType,
  onPoiClick,
  mapRef: externalRef,
}: {
  city: CityData;
  activeType: POIType | null;
  onPoiClick: (poiId: string) => void;
  mapRef?: React.RefObject<any>;
}) {
  const internalRef = useRef<MapRef>(null);
  const mapRef = (externalRef ?? internalRef) as React.RefObject<MapRef>;
  const pois = activeType ? city.pois.filter(p => p.type === activeType) : city.pois;

  useEffect(() => () => { mapRef.current?.getMap()?.removeImage?.("water-anim"); }, []);

  // Fly to city when city prop changes (persistent map survives city switches)
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    map.flyTo({
      center: [city.center[1], city.center[0]],
      zoom: 15.2,
      duration: 1000,
    });
  }, [city.name]);

  const handleLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    // ── Mapbox Standard style — dusk + no labels ──────────────
    try {
      (map as any).setConfigProperty("basemap", "lightPreset", "dusk");
      (map as any).setConfigProperty("basemap", "showPointOfInterestLabels", false);
      (map as any).setConfigProperty("basemap", "showTransitLabels", false);
      (map as any).setConfigProperty("basemap", "showPlaceLabels", false);
      (map as any).setConfigProperty("basemap", "showRoadLabels", false);
    } catch (e) { console.warn("[Map] setConfigProperty:", e); }

    // ── Anime water ───────────────────────────────────────────
    const waterFillIds: string[] = [];
    map.getStyle().layers.forEach((layer: any) => {
      if (layer.type === "fill" && /water/.test(layer.id)) waterFillIds.push(layer.id);
    });

    if (waterFillIds.length > 0 && !map.hasImage("water-anim")) {
      const SZ  = 128;
      const cvs = document.createElement("canvas");
      cvs.width = SZ; cvs.height = SZ;
      const ctx = cvs.getContext("2d")!;

      map.addImage("water-anim", {
        width: SZ, height: SZ,
        data: new Uint8Array(SZ * SZ * 4),
        render() {
          const t = performance.now() / 1000;
          ctx.clearRect(0, 0, SZ, SZ);
          ctx.fillStyle = "#5badec";
          ctx.fillRect(0, 0, SZ, SZ);
          const spacing = 14;
          const offset  = (t * 10) % spacing;
          ctx.lineWidth = 1.2;
          for (let i = -1; i <= SZ / spacing + 1; i++) {
            const baseY = i * spacing + offset;
            ctx.beginPath();
            for (let x = 0; x <= SZ; x++) {
              const y = baseY + Math.sin((x / SZ) * Math.PI * 4 + t * 1.8) * 2.5;
              x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.strokeStyle = "rgba(255,255,255,0.24)";
            ctx.stroke();
          }
          const d = ctx.getImageData(0, 0, SZ, SZ);
          this.data = new Uint8Array(d.data.buffer);
          map.triggerRepaint();
          return true;
        },
      } as any);

      waterFillIds.forEach(id => {
        try { map.setPaintProperty(id, "fill-pattern", "water-anim"); } catch {}
      });
    }

    // ── Anime grass ───────────────────────────────────────────
    const grassFillIds: string[] = [];
    map.getStyle().layers.forEach((layer: any) => {
      if (layer.type === "fill" && /park|grass|garden|wood|forest|nature|recreation/i.test(layer.id))
        grassFillIds.push(layer.id);
    });

    if (grassFillIds.length > 0 && !map.hasImage("grass-anim")) {
      const GSZ  = 32;
      const gcvs = document.createElement("canvas");
      gcvs.width = GSZ; gcvs.height = GSZ;
      const gctx = gcvs.getContext("2d")!;

      const tufts = [
        { x:  4, h: 4, phase: 0.0 },
        { x: 10, h: 3, phase: 1.1 },
        { x: 17, h: 5, phase: 2.2 },
        { x: 23, h: 3, phase: 0.7 },
        { x: 28, h: 4, phase: 1.8 },
      ];

      map.addImage("grass-anim", {
        width: GSZ, height: GSZ,
        data: new Uint8Array(GSZ * GSZ * 4),
        render() {
          const t = performance.now() / 1000;
          gctx.clearRect(0, 0, GSZ, GSZ);
          gctx.fillStyle = "#b5d97c";
          gctx.fillRect(0, 0, GSZ, GSZ);
          tufts.forEach(({ x, h, phase }) => {
            const sway = Math.sin(t * 1.3 + phase) * 1.2;
            [[0, 1.0, "rgba(45,110,20,0.85)"], [3, 0.7, "rgba(70,145,30,0.55)"]].forEach(
              ([dx, scale, color]) => {
                const bx = x + (dx as number);
                const bh = h * (scale as number);
                const sw = sway * (scale as number);
                gctx.beginPath();
                gctx.moveTo(bx, GSZ);
                gctx.quadraticCurveTo(bx + sw * 0.5, GSZ - bh * 0.55, bx + sw, GSZ - bh);
                gctx.strokeStyle = color as string;
                gctx.lineWidth   = 1.0 * (scale as number);
                gctx.lineCap     = "round";
                gctx.stroke();
              }
            );
          });
          const d = gctx.getImageData(0, 0, GSZ, GSZ);
          this.data = new Uint8Array(d.data.buffer);
          map.triggerRepaint();
          return true;
        },
      } as any);

      grassFillIds.forEach(id => {
        try { map.setPaintProperty(id, "fill-pattern", "grass-anim"); } catch {}
      });
    }

    // ── Bearing clamp ±25° ────────────────────────────────────
    const BASE_BEARING = -20;
    const MAX_DELTA    =  25;
    map.on("rotate", () => {
      const b = map.getBearing();
      const delta = b - BASE_BEARING;
      if (Math.abs(delta) > MAX_DELTA) {
        map.jumpTo({ bearing: BASE_BEARING + Math.sign(delta) * MAX_DELTA });
      }
    });

    // ── Cinematic tilt-in ─────────────────────────────────────
    map.easeTo({
      pitch:    55,
      duration: 1800,
      easing:   (t: number) => 1 - Math.pow(1 - t, 3),
    });
  }, []);

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={MAPBOX_TOKEN}
      mapStyle={STYLE_URL}
      initialViewState={{
        longitude: city.center[1],
        latitude:  city.center[0],
        zoom:      15.2,
        pitch:     0,
        bearing:   -20,
      }}
      minZoom={14}
      maxPitch={85}
      minPitch={20}
      maxBounds={[
        [139.58, 35.52],
        [139.85, 35.75],
      ]}
      style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
      onLoad={handleLoad}
    >
      {pois.map(poi => (
        <Marker
          key={poi.id}
          longitude={poi.lng}
          latitude={poi.lat}
          anchor="bottom"
          onClick={e => { e.originalEvent?.stopPropagation(); onPoiClick(poi.id); }}
        >
          <div
            className="gm3d-poi"
            style={{ "--pc": POI_COLORS[poi.type] } as React.CSSProperties}
          >
            <div className="gm3d-badge">
              <div className={`gm3d-icon-wrap${POI_LOGOS[poi.id] ? " gm3d-icon-wrap--logo" : ""}`}>
                {POI_LOGOS[poi.id]
                  ? <img src={POI_LOGOS[poi.id]} alt="" className="gm3d-logo" />
                  : <span className="gm3d-icon">{POI_ICONS[poi.type]}</span>
                }
              </div>
              <span className="gm3d-name">{poi.name}</span>
            </div>
            <div className="gm3d-stem" />
          </div>
        </Marker>
      ))}
    </Map>
  );
}
