"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Bell, Settings, User, Flame, Menu, Star, ArrowLeft, X, Loader2, CheckCircle } from "lucide-react";
import cities, { POI, POIType } from "@/lib/cities";
import IllustratedMap from "./IllustratedMap";
import { useMapCtx } from "../MapContext";

// ── Types ─────────────────────────────────────────────────────────────────────

type PoiQuest = {
  id: string;
  title: string;
  description: string | null;
  xpReward: number;
  yenReward: number;
  tasks: { id: string }[];
  userProgress: { id: string; status: string; firstCompletedAt: string | null; taskProgress: { taskId: string; status: string }[] }[];
};

// ── Constants ─────────────────────────────────────────────────────────────────

const SIDEBAR_ITEMS = ["Placeholder 1", "Placeholder 2", "Placeholder 3"];

const POI_META: Record<POIType, { label: string; color: string; icon: string }> = {
  station:  { label: "Station",  color: "#0ea5e9", icon: "🚉" },
  konbini:  { label: "Konbini",  color: "#22c55e", icon: "🏪" },
  izakaya:  { label: "Izakaya",  color: "#f97316", icon: "🍶" },
  temple:   { label: "Temple",   color: "#a855f7", icon: "⛩️" },
  market:   { label: "Marché",   color: "#eab308", icon: "🛒" },
  landmark: { label: "Lieu",     color: "#ef4444", icon: "📍" },
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

function MapClickBlocker() { useMapEvents({}); return null; }

// ── Component ─────────────────────────────────────────────────────────────────

export default function CityClient({ citySlug }: { citySlug: string }) {
  const router = useRouter();
  const { activeType, setActiveType, poiClickRef } = useMapCtx();

  // Modal state
  const [selectedPoi, setSelectedPoi]   = useState<POI | null>(null);
  const [poiQuests, setPoiQuests]       = useState<PoiQuest[]>([]);
  const [questsLoading, setQuestsLoading] = useState(false);

  const city = cities[citySlug];

  if (!city) {
    router.push("/home");
    return null;
  }

  const filteredPois = activeType ? city.pois.filter(p => p.type === activeType) : city.pois;

  // Click a POI → open modal and fetch quests
  const handlePoiClick = useCallback((poiId: string) => {
    const poi = city.pois.find(p => p.id === poiId);
    if (!poi) return;
    setSelectedPoi(poi);
    setPoiQuests([]);
    setQuestsLoading(true);
    fetch(`/api/quests/poi/${poiId}`)
      .then(r => r.ok ? r.json() : [])
      .then(setPoiQuests)
      .catch(() => setPoiQuests([]))
      .finally(() => setQuestsLoading(false));
  }, [city]);

  const closeModal = useCallback(() => {
    setSelectedPoi(null);
    setPoiQuests([]);
  }, []);

  // Register click handler into shared ref so the persistent map can call it
  useEffect(() => {
    poiClickRef.current = handlePoiClick;
    return () => { poiClickRef.current = null; };
  }, [handlePoiClick, poiClickRef]);

  return (
    <div className="pointer-events-none flex h-screen flex-col overflow-hidden">

      {/* Navbar */}
      <header className="pointer-events-auto flex h-14 shrink-0 items-center justify-between border-b border-gray-100 bg-white px-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/home")} className="text-gray-400 transition-colors hover:text-gray-700">
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
        <aside className="pointer-events-auto flex w-[72px] shrink-0 flex-col items-center gap-7 border-r border-gray-100 bg-white py-5">
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

        {/* Map zone */}
        <main className="relative flex-1 overflow-hidden">

          {/* HUD title */}
          <div className="pointer-events-none absolute left-5 top-5 z-[999]">
            <h2 className="text-2xl font-black uppercase tracking-widest text-white drop-shadow-lg">{city.name}</h2>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-px w-8 bg-violet-400" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300 drop-shadow">
                {city.pois.length} lieux
              </span>
            </div>
          </div>

          {/* HUD filters */}
          <div className="pointer-events-auto absolute right-5 top-5 z-[999] flex flex-col gap-1.5">
            {(Object.keys(POI_META) as POIType[]).map(type => {
              const meta   = POI_META[type];
              const isActive = activeType === type;
              return (
                <button key={type} onClick={() => setActiveType(isActive ? null : type)}
                  className="flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all"
                  style={{
                    background: isActive ? `${meta.color}22` : "rgba(10,10,20,0.7)",
                    border: `1.5px solid ${isActive ? meta.color : "rgba(255,255,255,0.15)"}`,
                    color: isActive ? meta.color : "rgba(255,255,255,0.7)",
                    boxShadow: isActive ? `0 0 10px ${meta.color}40` : "0 1px 4px rgba(0,0,0,0.3)",
                    backdropFilter: "blur(8px)",
                  }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: meta.color, boxShadow: `0 0 5px ${meta.color}` }} />
                  {meta.label}
                </button>
              );
            })}
          </div>

          {/* Map — 3D map is rendered persistently in home/layout.tsx */}
          {city.use3DMap ? null : city.mapImage && city.mapBounds ? (
            <IllustratedMap city={city} activeType={activeType} loadingPoiId={null} onPoiClick={handlePoiClick} />
          ) : (
            <>
              <div className="pointer-events-none absolute inset-0 z-[998]" style={{ boxShadow: "inset 0 0 60px rgba(0,0,0,0.08)" }} />
              <MapContainer center={city.center} zoom={city.zoom} style={{ height: "100%", width: "100%" }} zoomControl={false} minZoom={12} maxZoom={18}>
                <MapClickBlocker />
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap &copy; CARTO" subdomains="abcd" maxZoom={19} />
                {filteredPois.map(poi => (
                  <Marker key={poi.id} position={[poi.lat, poi.lng]} icon={createMarkerIcon(poi.name, poi.type)} eventHandlers={{ click: () => handlePoiClick(poi.id) }}>
                    <Popup>
                      <button onClick={() => handlePoiClick(poi.id)} className="mt-1 rounded-full bg-violet-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-violet-700">
                        Voir
                      </button>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </>
          )}
        </main>
      </div>

      {/* ── POI Modal ── */}
      {selectedPoi && (
        <div
          className="pointer-events-auto fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-gray-950 shadow-2xl overflow-hidden">

            {/* POI header */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-white/8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{POI_META[selectedPoi.type].icon}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: POI_META[selectedPoi.type].color }}>
                    {POI_META[selectedPoi.type].label}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white">{selectedPoi.name}</h2>
              </div>
              <button onClick={closeModal} className="text-white/30 hover:text-white/70 transition-colors mt-0.5">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quests */}
            <div className="px-5 py-4 flex flex-col gap-3 max-h-[55vh] overflow-y-auto">
              {questsLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
                </div>
              ) : poiQuests.length > 0 ? (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Quêtes disponibles</p>
                  {poiQuests.map(quest => {
                    const progress   = quest.userProgress?.[0];
                    const isDone     = progress?.status === "COMPLETED";
                    const isReplay   = progress?.status === "IN_PROGRESS" && !!progress.firstCompletedAt;
                    const isResume   = progress?.status === "IN_PROGRESS" && !progress.firstCompletedAt;
                    const doneTasks  = isResume
                      ? progress.taskProgress.filter(tp => tp.status === "COMPLETED").length
                      : isDone ? quest.tasks.length : 0;

                    return (
                      <div key={quest.id} className="rounded-xl border border-white/8 bg-white/5 p-4 flex flex-col gap-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-white">{quest.title}</p>
                            {quest.description && (
                              <p className="text-[11px] text-white/40 mt-0.5 leading-snug">{quest.description}</p>
                            )}
                          </div>
                          {isDone && (
                            <span className="shrink-0 flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                              <CheckCircle className="h-3 w-3" /> OK
                            </span>
                          )}
                        </div>

                        {/* Rewards */}
                        {(quest.xpReward > 0 || quest.yenReward > 0) && (
                          <div className="flex items-center gap-1.5">
                            {quest.xpReward > 0 && (
                              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                                isDone || isReplay
                                  ? "border-white/10 text-white/25"
                                  : "border-violet-500/40 bg-violet-500/10 text-violet-300"
                              }`}>+{quest.xpReward} XP</span>
                            )}
                            {quest.yenReward > 0 && (
                              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                                isDone || isReplay
                                  ? "border-white/10 text-white/25"
                                  : "border-yellow-500/40 bg-yellow-500/10 text-yellow-300"
                              }`}>+¥{quest.yenReward}</span>
                            )}
                            {(isDone || isReplay) && (
                              <span className="text-[10px] text-white/20 italic">déjà obtenu</span>
                            )}
                          </div>
                        )}

                        {/* Task dots */}
                        <div className="flex items-center gap-1.5">
                          {quest.tasks.map((_, i) => (
                            <div key={i} className={`h-1.5 w-1.5 rounded-full ${
                              i < doneTasks ? "bg-emerald-400"
                              : isResume && i === doneTasks ? "bg-yellow-400"
                              : "bg-white/20"
                            }`} />
                          ))}
                          <span className="text-[10px] text-white/30 ml-1">{quest.tasks.length} tâches</span>
                        </div>

                        <button
                          onClick={() => { closeModal(); router.push(`/home/${citySlug}/${selectedPoi.id}?quest=${quest.id}`); }}
                          className={`w-full rounded-lg py-2.5 text-xs font-bold transition-all ${
                            isDone || isReplay
                              ? "bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 hover:text-white/60"
                              : isResume
                              ? "bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/25"
                              : "bg-violet-600/80 text-white hover:bg-violet-500 border border-violet-500/50"
                          }`}
                        >
                          {isDone || isReplay
                            ? "🔄 Refaire (sans récompense)"
                            : isResume
                            ? `▶ Continuer (tâche ${doneTasks + 1}/${quest.tasks.length})`
                            : "▶ Faire la quête"}
                        </button>
                      </div>
                    );
                  })}
                </>
              ) : (
                <p className="text-[11px] text-white/30 text-center py-4">
                  Aucune quête disponible ici pour l&apos;instant.
                </p>
              )}
            </div>

            {/* Free conversation */}
            <div className="px-5 py-4 border-t border-white/8 flex flex-col gap-2">
              <button
                onClick={() => { closeModal(); router.push(`/home/${citySlug}/${selectedPoi.id}`); }}
                className="w-full rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-xs font-bold text-white/60 transition-all hover:bg-white/10 hover:text-white hover:border-white/20"
              >
                Conversation libre →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
