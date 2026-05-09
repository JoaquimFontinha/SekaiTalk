"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { MapProvider, useMapCtx } from "./MapContext";
import cities from "@/lib/cities";

const GameMap3D = dynamic(() => import("./[city]/GameMap3D"), { ssr: false });

const DEFAULT_CITY = cities["tokyo"];

function PersistentMap() {
  const pathname = usePathname();
  const { mapRef, activeType, poiClickRef } = useMapCtx();

  const parts = pathname.replace(/^\/home\/?/, "").split("/").filter(Boolean);
  const citySlug = parts[0] ?? null;
  const city = citySlug ? cities[citySlug] : null;
  const isOnCityPage = !!city?.use3DMap && parts.length === 1;
  const displayCity = city?.use3DMap ? city : DEFAULT_CITY;

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
      />
    </div>
  );
}

function HomeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const parts = pathname.replace(/^\/home\/?/, "").split("/").filter(Boolean);
  const citySlug = parts[0] ?? null;
  const city = citySlug ? cities[citySlug] : null;
  const isOnCityPage = !!city?.use3DMap && parts.length === 1;

  return (
    <>
      <PersistentMap />
      {/* pointer-events:none uniquement quand la map est visible (city page) */}
      {/* sur les autres pages (/home, /home/[city]/[poi]) tout doit être cliquable */}
      <div style={{ position: "relative", zIndex: 1, pointerEvents: isOnCityPage ? "none" : "auto" }}>
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
