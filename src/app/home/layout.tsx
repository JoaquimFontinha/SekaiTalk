"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { MapProvider, useMapCtx } from "./MapContext";
import staticCities, { type CityData } from "@/lib/cities";

const GameMap3D  = dynamic(() => import("./[city]/GameMap3D"), { ssr: false });
const JapanMap   = dynamic(() => import("./JapanMap"),         { ssr: false });

function PersistentMap() {
  const pathname = usePathname();
  const { mapRef, activeType, poiClickRef, mapBgClickRef, editMode, poiMoveRef } = useMapCtx();
  const [dbCities, setDbCities] = useState<Record<string, CityData>>(staticCities);
  const fetchedRef = useRef(false);

  // Charge les données depuis la DB une seule fois (pour refléter les modifs admin)
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetch("/api/content/cities")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setDbCities(data); })
      .catch(() => {});
  }, []);

  const parts = pathname.replace(/^\/home\/?/, "").split("/").filter(Boolean);
  const citySlug = parts[0] ?? null;
  const city = citySlug ? dbCities[citySlug] : null;
  const isOnCityPage = !!city?.use3DMap && parts.length === 1;
  const displayCity = city?.use3DMap ? city : (dbCities["tokyo"] ?? staticCities["tokyo"]);
  const warmedUp = useRef(false);

  useEffect(() => {
    if (isOnCityPage || warmedUp.current) return;
    const map = (mapRef.current as any)?.getMap?.();
    if (!map) return;
    warmedUp.current = true;

    const targets = Object.values(dbCities).filter(c => c.use3DMap);
    let i = 0;
    const next = () => {
      if (i >= targets.length) return;
      const c = targets[i++];
      map.once("idle", () => setTimeout(next, 400));
      map.jumpTo({ center: [c.center[1], c.center[0]], zoom: 15 });
    };
    setTimeout(next, 800);
  }, [isOnCityPage, mapRef, dbCities]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: "-40px",
        zIndex: 0,
        visibility: isOnCityPage ? "visible" : "hidden",
        pointerEvents: isOnCityPage ? "auto" : "none",
      }}
    >
      <GameMap3D
        mapRef={mapRef}
        city={displayCity}
        activeType={activeType}
        onPoiClick={(id) => poiClickRef.current?.(id)}
        onMapBgClick={() => mapBgClickRef.current?.()}
        editMode={editMode}
        onPoiMove={(id, lat, lng) => poiMoveRef.current?.(id, lat, lng)}
      />
    </div>
  );
}

function PersistentJapanMap() {
  const pathname = usePathname();
  const parts = pathname.replace(/^\/home\/?/, "").split("/").filter(Boolean);
  const isOnHomePage = parts.length === 0;

  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 0,
        visibility: isOnHomePage ? "visible" : "hidden",
        pointerEvents: isOnHomePage ? "auto" : "none",
      }}
    >
      <JapanMap />
    </div>
  );
}

function HomeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const parts = pathname.replace(/^\/home\/?/, "").split("/").filter(Boolean);
  const citySlug = parts[0] ?? null;
  const city = citySlug ? staticCities[citySlug] : null;
  const isOnCityPage = !!city?.use3DMap && parts.length === 1;
  const isOnHomePage = parts.length === 0;

  return (
    <>
      <PersistentJapanMap />
      <PersistentMap />
      {/* pointer-events:none quand une map Mapbox est visible en dessous (city page ou home page) */}
      {/* les éléments UI interactifs (sidebar, HUD) ont pointer-events:auto explicite */}
      <div style={{ position: "relative", zIndex: 1, pointerEvents: (isOnCityPage || isOnHomePage) ? "none" : "auto" }}>
        {children}
      </div>
      {/* Footer links */}
      <div style={{
        position: "fixed", bottom: 16, right: 20,
        zIndex: 10, pointerEvents: "auto",
        display: "flex", alignItems: "center", gap: 16,
        flexWrap: "wrap", justifyContent: "flex-end",
      }}>
        {["À propos", "Blog", "Efficacité", "Termes", "Confidentialité"].map(label => (
          <a
            key={label}
            href="#"
            style={{
              fontSize: 11, fontWeight: 500, letterSpacing: "0.03em",
              color: "rgba(255,255,255,0.45)",
              textDecoration: "none",
              transition: "color 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.85)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
          >
            {label}
          </a>
        ))}
      </div>
    </>
  );
}

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <MapProvider>
      <HomeShell>{children}</HomeShell>
    </MapProvider>
  );
}
