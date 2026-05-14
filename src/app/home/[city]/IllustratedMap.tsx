"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { CityData, POIType, POI } from "@/lib/cities";

const POI_META: Record<POIType, { label: string; color: string; icon: string }> = {
  transport:  { label: "Transport",    color: "#0ea5e9", icon: "🚇" },
  konbini:    { label: "Konbini",      color: "#10b981", icon: "🏪" },
  izakaya:    { label: "Izakaya",      color: "#f97316", icon: "🍶" },
  site:       { label: "Site iconique",color: "#8b5cf6", icon: "🏛️" },
  market:     { label: "Marché",       color: "#f59e0b", icon: "🛒" },
  loisir:     { label: "Loisir",       color: "#14b8a6", icon: "🎭" },
  shop:       { label: "Boutique",     color: "#ec4899", icon: "🛍️" },
  restaurant: { label: "Restaurant",   color: "#f43f5e", icon: "🍔" },
  cafe:       { label: "Café",         color: "#92400e", icon: "☕" },
  hotel:      { label: "Hôtel",        color: "#0891b2", icon: "🏨" },
  pharmacie:  { label: "Pharmacie",    color: "#059669", icon: "💊" },
  medecin:    { label: "Médecin",      color: "#ef4444", icon: "🏥" },
  poste:      { label: "Poste",        color: "#d97706", icon: "📮" },
};

interface Props {
  city: CityData;
  activeType: POIType | null;
  loadingPoiId: string | null;
  onPoiClick: (poiId: string) => void;
}

function latLngToPercent(
  lat: number, lng: number,
  bounds: NonNullable<CityData["mapBounds"]>
) {
  const x = ((lng - bounds.lngMin) / (bounds.lngMax - bounds.lngMin)) * 100;
  const y = ((bounds.latMax - lat) / (bounds.latMax - bounds.latMin)) * 100;
  return { x, y };
}

export default function IllustratedMap({ city, activeType, loadingPoiId, onPoiClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [hoveredPoi, setHoveredPoi] = useState<string | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; tx: number; ty: number } | null>(null);
  const fitScaleRef = useRef(1);

  const bounds = city.mapBounds!;
  const filteredPois = activeType
    ? city.pois.filter(p => p.type === activeType)
    : city.pois;

  // Compute fit-to-container scale from natural image dimensions
  const onImgLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const container = containerRef.current;
    if (!container) return;
    const fitScale = Math.min(
      container.clientWidth / img.naturalWidth,
      container.clientHeight / img.naturalHeight,
    );
    fitScaleRef.current = fitScale;
    setTransform({ x: 0, y: 0, scale: fitScale });
  }, []);

  // ── Zoom molette ──────────────────────────────────────────────
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.12 : 0.12;
    setTransform(t => ({
      ...t,
      scale: Math.min(4, Math.max(0.3, t.scale + delta)),
    }));
  }, []);

  // ── Pan souris ────────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-poi]")) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, tx: transform.x, ty: transform.y };
  }, [transform]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    setTransform(t => ({ ...t, x: drag.tx + dx, y: drag.ty + dy }));
  }, []);

  const onMouseUp = useCallback(() => { dragRef.current = null; }, []);

  // ── Touch pan ─────────────────────────────────────────────────
  const touchRef = useRef<{ startX: number; startY: number; tx: number; ty: number } | null>(null);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    touchRef.current = { startX: t.clientX, startY: t.clientY, tx: transform.x, ty: transform.y };
  }, [transform]);
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - touchRef.current.startX;
    const dy = t.clientY - touchRef.current.startY;
    setTransform(prev => ({ ...prev, x: touchRef.current!.tx + dx, y: touchRef.current!.ty + dy }));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => e.preventDefault();
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-[#1a1f2e] cursor-grab active:cursor-grabbing"
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={() => { touchRef.current = null; }}
    >
      {/* Flex centering so image is centered at scale=fitScale */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Transformable wrapper — natural image size, no fixed w/h */}
        <div
          style={{
            position: "relative",
            flexShrink: 0,
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: "center center",
            transition: dragRef.current ? "none" : "transform 0.05s ease-out",
          }}
        >
          {/* Image à taille naturelle — aucun crop */}
          <img
            src={city.mapImage}
            alt={city.name}
            draggable={false}
            onLoad={onImgLoad}
            style={{ display: "block", maxWidth: "none", userSelect: "none" }}
          />

          {/* Marqueurs POI positionnés en % de l'image */}
          {filteredPois.map((poi: POI) => {
            const { x, y } = latLngToPercent(poi.lat, poi.lng, bounds);
            const meta = POI_META[poi.type];
            const isHovered = hoveredPoi === poi.id;
            const isLoading = loadingPoiId === poi.id;

            return (
              <div
                key={poi.id}
                data-poi="true"
                onClick={() => onPoiClick(poi.id)}
                onMouseEnter={() => setHoveredPoi(poi.id)}
                onMouseLeave={() => setHoveredPoi(null)}
                style={{
                  position: "absolute",
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: `translate(-50%, -100%) scale(${(isHovered ? 1.2 : 1) / transform.scale})`,
                  transformOrigin: "bottom center",
                  transition: "transform 0.15s ease",
                  cursor: "pointer",
                  zIndex: isHovered ? 20 : 10,
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <div style={{
                    background: isHovered ? meta.color : "rgba(10,10,20,0.85)",
                    border: `2.5px solid ${meta.color}`,
                    borderRadius: "50%",
                    width: 38,
                    height: 38,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    boxShadow: isHovered ? `0 0 16px ${meta.color}, 0 4px 12px rgba(0,0,0,0.5)` : `0 2px 8px rgba(0,0,0,0.5)`,
                    transition: "all 0.15s ease",
                  }}>
                    {isLoading ? "⏳" : meta.icon}
                  </div>
                  <div style={{ width: 2, height: 8, background: meta.color, borderRadius: 2, opacity: 0.8 }} />
                  <div style={{
                    background: isHovered ? meta.color : "rgba(10,10,20,0.85)",
                    color: isHovered ? "#000" : "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 20,
                    whiteSpace: "nowrap",
                    border: `1px solid ${meta.color}`,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                    letterSpacing: "0.3px",
                    transition: "all 0.15s ease",
                  }}>
                    {poi.name}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contrôles zoom */}
      <div className="absolute bottom-5 right-5 z-30 flex flex-col gap-1">
        {[{ label: "+", delta: 0.25 }, { label: "−", delta: -0.25 }].map(btn => (
          <button key={btn.label}
            onClick={() => setTransform(t => ({ ...t, scale: Math.min(4, Math.max(0.3, t.scale + btn.delta)) }))}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white text-lg font-bold backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors">
            {btn.label}
          </button>
        ))}
        <button
          onClick={() => setTransform({ x: 0, y: 0, scale: fitScaleRef.current })}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white text-xs font-bold backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors">
          ↺
        </button>
      </div>
    </div>
  );
}
