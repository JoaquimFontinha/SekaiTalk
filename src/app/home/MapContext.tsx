"use client";

import { createContext, useContext, useRef, useState } from "react";
import type { POIType } from "@/lib/cities";
import type { ActiveEvent } from "@/lib/events";

type MapCtx = {
  mapRef: React.RefObject<any>;
  activeType: POIType | null;
  setActiveType: (t: POIType | null) => void;
  poiClickRef: React.MutableRefObject<((id: string) => void) | null>;
  mapBgClickRef: React.MutableRefObject<(() => void) | null>;
  japanFlyToRef: React.MutableRefObject<((lng: number, lat: number, zoom?: number) => void) | null>;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  poiMoveRef: React.MutableRefObject<((id: string, lat: number, lng: number) => void) | null>;
  poiPositionOverrides: Record<string, { lat: number; lng: number }>;
  updatePoiPosition: (id: string, lat: number, lng: number) => void;
  activeEvents: ActiveEvent[];
  setActiveEvents: (events: ActiveEvent[]) => void;
};

const Ctx = createContext<MapCtx | null>(null);

export function MapProvider({ children }: { children: React.ReactNode }) {
  const mapRef = useRef<any>(null);
  const [activeType, setActiveType] = useState<POIType | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [poiPositionOverrides, setPoiPositionOverrides] = useState<Record<string, { lat: number; lng: number }>>({});
  const [activeEvents, setActiveEvents] = useState<ActiveEvent[]>([]);
  const poiClickRef = useRef<((id: string) => void) | null>(null);
  const mapBgClickRef = useRef<(() => void) | null>(null);
  const japanFlyToRef = useRef<((lng: number, lat: number, zoom?: number) => void) | null>(null);
  const poiMoveRef = useRef<((id: string, lat: number, lng: number) => void) | null>(null);
  const updatePoiPosition = (id: string, lat: number, lng: number) =>
    setPoiPositionOverrides(prev => ({ ...prev, [id]: { lat, lng } }));
  return (
    <Ctx.Provider value={{ mapRef, activeType, setActiveType, poiClickRef, mapBgClickRef, japanFlyToRef, editMode, setEditMode, poiMoveRef, poiPositionOverrides, updatePoiPosition, activeEvents, setActiveEvents }}>
      {children}
    </Ctx.Provider>
  );
}

export function useMapCtx() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useMapCtx must be inside MapProvider");
  return ctx;
}
