"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Bell, Settings, User, Flame, Menu, Star, ArrowLeft } from "lucide-react";
import cities, { POIType } from "@/lib/cities";

const SIDEBAR_ITEMS = ["Placeholder 1", "Placeholder 2", "Placeholder 3"];

const POI_META: Record<POIType, { label: string; color: string }> = {
  station:  { label: "Station",  color: "#0ea5e9" },
  konbini:  { label: "Konbini",  color: "#22c55e" },
  izakaya:  { label: "Izakaya",  color: "#f97316" },
  temple:   { label: "Temple",   color: "#a855f7" },
  market:   { label: "Marché",   color: "#eab308" },
  landmark: { label: "Lieu",     color: "#ef4444" },
};

function createMarkerIcon(name: string, type: POIType) {
  return L.divIcon({
    className: "",
    html: `<div class="game-poi type-${type}">
      <div class="poi-marker-wrap">
        <span class="poi-pulse"></span>
        <span class="poi-dot"></span>
      </div>
      <span class="poi-label">${name}</span>
    </div>`,
    iconSize: [140, 56],
    iconAnchor: [70, 14],
    popupAnchor: [0, -18],
  });
}

function MapClickBlocker() {
  useMapEvents({});
  return null;
}

export default function CityClient({ citySlug }: { citySlug: string }) {
  const router = useRouter();
  const [activeType, setActiveType] = useState<POIType | null>(null);
  const [loadingPoiId, setLoadingPoiId] = useState<string | null>(null);
  const city = cities[citySlug];

  if (!city) {
    router.push("/home");
    return null;
  }

  const filteredPois = activeType
    ? city.pois.filter((p) => p.type === activeType)
    : city.pois;

  const handlePoiClick = useCallback(async (poiId: string) => {
    setLoadingPoiId(poiId);
    const res = await fetch(`/api/characters/${poiId}`);
    setLoadingPoiId(null);
    if (res.ok) {
      router.push(`/home/${citySlug}/${poiId}`);
    }
  }, [router, citySlug]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">

      {/* Navbar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-100 bg-white px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/home")}
            className="text-gray-400 transition-colors hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-xl font-bold tracking-tight text-gray-900">SekaiTalk</span>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-gray-500">{city.name}</span>
        </div>
        <div className="flex items-center gap-5 text-gray-400">
          <button className="flex items-center gap-1.5 transition-colors hover:text-orange-400">
            <Flame className="h-5 w-5 text-orange-300" />
            <span className="text-sm font-semibold text-gray-600">0</span>
          </button>
          <button className="transition-colors hover:text-gray-900"><Bell className="h-5 w-5" /></button>
          <button className="transition-colors hover:text-gray-900"><Settings className="h-5 w-5" /></button>
          <button className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-200 transition-colors hover:border-gray-400 hover:text-gray-900">
            <User className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="flex w-[72px] shrink-0 flex-col items-center gap-7 border-r border-gray-100 bg-white py-5">
          <button className="text-gray-400 transition-colors hover:text-gray-700">
            <Menu className="h-5 w-5" />
          </button>
          {SIDEBAR_ITEMS.map((label, i) => (
            <button key={i} className="group flex flex-col items-center gap-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-200 text-gray-400 transition-all group-hover:border-violet-400 group-hover:bg-violet-50 group-hover:text-violet-500">
                <Star className="h-4 w-4" />
              </div>
              <span className="text-[9px] font-medium text-gray-400 transition-colors group-hover:text-violet-500">
                {label}
              </span>
            </button>
          ))}
        </aside>

        {/* Map area */}
        <main className="relative flex-1 overflow-hidden">

          {/* HUD top-left: titre */}
          <div className="pointer-events-none absolute left-5 top-5 z-[999]">
            <h2 className="text-2xl font-black uppercase tracking-widest text-gray-900 drop-shadow-sm">
              {city.name}
            </h2>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-px w-8 bg-violet-400" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-500">
                {city.pois.length} lieux
              </span>
            </div>
          </div>

          {/* HUD top-right: filtres */}
          <div className="pointer-events-auto absolute right-5 top-5 z-[999] flex flex-col gap-1.5">
            {(Object.keys(POI_META) as POIType[]).map((type) => {
              const meta = POI_META[type];
              const isActive = activeType === type;
              return (
                <button
                  key={type}
                  onClick={() => setActiveType(isActive ? null : type)}
                  className="flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all"
                  style={{
                    background: isActive ? `${meta.color}18` : "rgba(255,255,255,0.9)",
                    border: `1.5px solid ${isActive ? meta.color : "rgba(0,0,0,0.08)"}`,
                    color: isActive ? meta.color : "#6b7280",
                    boxShadow: isActive
                      ? `0 0 10px ${meta.color}30, 0 2px 8px rgba(0,0,0,0.08)`
                      : "0 1px 4px rgba(0,0,0,0.06)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: meta.color, boxShadow: `0 0 5px ${meta.color}` }}
                  />
                  {meta.label}
                </button>
              );
            })}
          </div>

          {/* Vignette */}
          <div
            className="pointer-events-none absolute inset-0 z-[998]"
            style={{ boxShadow: "inset 0 0 60px rgba(0,0,0,0.08)" }}
          />

          {/* Leaflet Map */}
          <MapContainer
            center={city.center}
            zoom={city.zoom}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
            minZoom={12}
            maxZoom={18}
          >
            <MapClickBlocker />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap &copy; CARTO"
              subdomains="abcd"
              maxZoom={19}
            />

            {filteredPois.map((poi) => (
              <Marker
                key={poi.id}
                position={[poi.lat, poi.lng]}
                icon={createMarkerIcon(
                  loadingPoiId === poi.id ? "…" : poi.name,
                  poi.type
                )}
                eventHandlers={{ click: () => handlePoiClick(poi.id) }}
              >
                <Popup>
                  <div className="flex flex-col gap-1">
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: POI_META[poi.type].color }}
                    >
                      {POI_META[poi.type].label}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {poi.name}
                    </span>
                    <button
                      onClick={() => handlePoiClick(poi.id)}
                      className="mt-1 rounded-full bg-violet-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-violet-700"
                    >
                      {loadingPoiId === poi.id ? "Chargement…" : "Parler"}
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </main>
      </div>

    </div>
  );
}
