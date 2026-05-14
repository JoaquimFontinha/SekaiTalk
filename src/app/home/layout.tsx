"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { MapProvider, useMapCtx } from "./MapContext";
import cities from "@/lib/cities";

const GameMap3D  = dynamic(() => import("./[city]/GameMap3D"), { ssr: false });
const JapanMap   = dynamic(() => import("./JapanMap"),         { ssr: false });

const DEFAULT_CITY = cities["tokyo"];

function PersistentMap() {
  const pathname = usePathname();
  const { mapRef, activeType, poiClickRef, mapBgClickRef } = useMapCtx();

  const parts = pathname.replace(/^\/home\/?/, "").split("/").filter(Boolean);
  const citySlug = parts[0] ?? null;
  const city = citySlug ? cities[citySlug] : null;
  const isOnCityPage = !!city?.use3DMap && parts.length === 1;
  const displayCity = city?.use3DMap ? city : DEFAULT_CITY;
  const warmedUp = useRef(false);

  // Préchargement des tuiles des autres villes quand la map est cachée
  // (user en conv ou sur /home) — jumps invisibles, SW met tout en cache
  useEffect(() => {
    if (isOnCityPage || warmedUp.current) return;
    const map = (mapRef.current as any)?.getMap?.();
    if (!map) return;
    warmedUp.current = true;

    const targets = Object.values(cities).filter(c => c.use3DMap);
    let i = 0;
    const next = () => {
      if (i >= targets.length) return;
      const c = targets[i++];
      map.once("idle", () => setTimeout(next, 400));
      map.jumpTo({ center: [c.center[1], c.center[0]], zoom: 15 });
    };
    setTimeout(next, 800);
  }, [isOnCityPage, mapRef]);

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
  const city = citySlug ? cities[citySlug] : null;
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
