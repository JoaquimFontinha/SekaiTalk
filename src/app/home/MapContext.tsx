"use client";

import { createContext, useContext, useRef, useState } from "react";
import type { POIType } from "@/lib/cities";

type MapCtx = {
  mapRef: React.RefObject<any>;
  activeType: POIType | null;
  setActiveType: (t: POIType | null) => void;
  poiClickRef: React.MutableRefObject<((id: string) => void) | null>;
  mapBgClickRef: React.MutableRefObject<(() => void) | null>;
  japanFlyToRef: React.MutableRefObject<((lng: number, lat: number, zoom?: number) => void) | null>;
};

const Ctx = createContext<MapCtx | null>(null);

export function MapProvider({ children }: { children: React.ReactNode }) {
  const mapRef = useRef<any>(null);
  const [activeType, setActiveType] = useState<POIType | null>(null);
  const poiClickRef = useRef<((id: string) => void) | null>(null);
  const mapBgClickRef = useRef<(() => void) | null>(null);
  const japanFlyToRef = useRef<((lng: number, lat: number, zoom?: number) => void) | null>(null);
  return (
    <Ctx.Provider value={{ mapRef, activeType, setActiveType, poiClickRef, mapBgClickRef, japanFlyToRef }}>
      {children}
    </Ctx.Provider>
  );
}

export function useMapCtx() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useMapCtx must be inside MapProvider");
  return ctx;
}
