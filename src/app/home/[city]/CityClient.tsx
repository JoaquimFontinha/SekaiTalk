"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Bell, User, Flame, Menu, MapPin, Users, BookOpen, Sparkles, ArrowLeft, X, Loader2, CheckCircle } from "lucide-react";
import cities, { POI, POIType } from "@/lib/cities";
import { getNeighborhood } from "@/lib/tokyo-neighborhoods";
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

type SidebarPanel = "lieux" | "contacts" | "evenements" | "revision" | null;

type UserStats = {
  xp: number; yens: number; level: number;
  xpInLevel: number; xpNeeded: number | null; percent: number;
};

type Contact = {
  id:          string;
  name:        string;
  nameJp:      string;
  role:        string;
  image:       string;
  memoryCount: number;
  locations:   { poiId: string; name: string }[];
};

// ── Constants ─────────────────────────────────────────────────────────────────

const SIDEBAR_BUTTONS: { panel: Exclude<SidebarPanel, null>; Icon: React.ElementType; label: string; enabled: boolean }[] = [
  { panel: "lieux",      Icon: MapPin,    label: "Lieux",      enabled: true  },
  { panel: "contacts",   Icon: Users,     label: "Contacts",   enabled: true  },
  { panel: "evenements", Icon: Sparkles,  label: "Évènements", enabled: true  },
  { panel: "revision",   Icon: BookOpen,  label: "Révision",   enabled: false },
];

function getFriendshipLevel(count: number): { label: string; color: string } {
  if (count === 0) return { label: "Étranger",      color: "#6b7280" };
  if (count <= 2)  return { label: "Connaissance",  color: "#0ea5e9" };
  if (count <= 5)  return { label: "Ami",           color: "#22c55e" };
  return                   { label: "Proche",        color: "#a855f7" };
}

const POI_META: Record<POIType, { label: string; color: string; icon: string }> = {
  station:    { label: "Station",    color: "#0ea5e9", icon: "🚉" },
  konbini:    { label: "Konbini",    color: "#22c55e", icon: "🏪" },
  izakaya:    { label: "Izakaya",    color: "#f97316", icon: "🍶" },
  temple:     { label: "Temple",     color: "#a855f7", icon: "⛩️" },
  market:     { label: "Marché",     color: "#eab308", icon: "🛒" },
  landmark:   { label: "Lieu",       color: "#ef4444", icon: "📍" },
  shop:       { label: "Shop",       color: "#ec4899", icon: "🛍️" },
  restaurant: { label: "Restaurant", color: "#f43f5e", icon: "🍔" },
  cafe:       { label: "Café",       color: "#92400e", icon: "☕" },
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
  const { activeType, setActiveType, poiClickRef, mapRef } = useMapCtx();

  // Modal state
  const [selectedPoi, setSelectedPoi]     = useState<POI | null>(null);
  const [poiQuests, setPoiQuests]         = useState<PoiQuest[]>([]);
  const [questsLoading, setQuestsLoading] = useState(false);

  // Sidebar panel state
  const [sidebarPanel, setSidebarPanel]   = useState<SidebarPanel>(null);
  const [lieuxType, setLieuxType]         = useState<POIType | null>(null);
  const [poiQuestData, setPoiQuestData]   = useState<Record<string, { done: number; total: number }>>({});

  // Contacts state
  const [contacts, setContacts]             = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [rdvOpenId, setRdvOpenId]           = useState<string | null>(null);

  const [tokyoTime, setTokyoTime]         = useState("");
  const [neighborhood, setNeighborhood]   = useState("");
  const [userStats, setUserStats]         = useState<UserStats | null>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const tick = () => setTokyoTime(
      new Date().toLocaleTimeString("ja-JP", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit", hour12: false })
    );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetch("/api/user/stats")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setUserStats(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!sidebarExpanded) return;
    const handler = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setSidebarExpanded(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sidebarExpanded]);

  const city = cities[citySlug];

  if (!city) {
    router.push("/home");
    return null;
  }

  const filteredPois = activeType ? city.pois.filter(p => p.type === activeType) : city.pois;
  const panelPois    = lieuxType  ? city.pois.filter(p => p.type === lieuxType)  : city.pois;

  // Click a POI → open modal and fetch quests
  // Camera fly-to for panel preview
  const flyToPoi = useCallback((poi: POI) => {
    const map = (mapRef as React.RefObject<any>).current?.getMap?.();
    if (map) map.flyTo({ center: [poi.lng, poi.lat], zoom: 17, pitch: 60, duration: 1500 });
  }, [mapRef]);

  const handlePoiClick = useCallback((poiId: string) => {
    const poi = city.pois.find(p => p.id === poiId);
    if (!poi) return;
    setSelectedPoi(poi);
    setPoiQuests([]);
    setQuestsLoading(true);
    flyToPoi(poi);
    fetch(`/api/quests/poi/${poiId}`)
      .then(r => r.ok ? r.json() : [])
      .then(setPoiQuests)
      .catch(() => setPoiQuests([]))
      .finally(() => setQuestsLoading(false));
  }, [city, flyToPoi]);

  const closeModal = useCallback(() => {
    setSelectedPoi(null);
    setPoiQuests([]);
  }, []);

  // Neighborhood from local static table — zero API calls
  useEffect(() => {
    if (!city.use3DMap) return;
    let map: any;

    const update = () => {
      const { lat, lng } = map.getCenter();
      setNeighborhood(getNeighborhood(lat, lng));
    };

    const init = setTimeout(() => {
      map = (mapRef as React.RefObject<any>).current?.getMap?.();
      if (!map) return;
      map.on("moveend", update);
      update();
    }, 150);

    return () => {
      clearTimeout(init);
      if (map) map.off("moveend", update);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city.use3DMap]);

  // Register click handler into shared ref so the persistent map can call it
  useEffect(() => {
    poiClickRef.current = handlePoiClick;
    return () => { poiClickRef.current = null; };
  }, [handlePoiClick, poiClickRef]);

  // Fetch quest counts for all POIs when Lieux panel opens
  useEffect(() => {
    if (sidebarPanel !== "lieux") return;
    Promise.all(
      city.pois.map(poi =>
        fetch(`/api/quests/poi/${poi.id}`)
          .then(r => r.ok ? r.json() : [])
          .then((quests: PoiQuest[]) => ({
            id:    poi.id,
            done:  quests.filter(q => q.userProgress?.[0]?.status === "COMPLETED").length,
            total: quests.length,
          }))
          .catch(() => ({ id: poi.id, done: 0, total: 0 }))
      )
    ).then(results => {
      const data: Record<string, { done: number; total: number }> = {};
      results.forEach(r => { data[r.id] = { done: r.done, total: r.total }; });
      setPoiQuestData(data);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sidebarPanel, citySlug]);

  // Fetch contacts when Contacts panel opens
  useEffect(() => {
    if (sidebarPanel !== "contacts" || contacts.length > 0) return;
    setContactsLoading(true);
    fetch("/api/contacts")
      .then(r => r.ok ? r.json() : [])
      .then(setContacts)
      .catch(() => setContacts([]))
      .finally(() => setContactsLoading(false));
  }, [sidebarPanel, contacts.length]);

  return (
    <div className="pointer-events-none flex h-screen overflow-hidden">

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`pointer-events-auto relative z-[1001] flex shrink-0 flex-col border-r border-gray-100 bg-white py-5 transition-all duration-200 ${
          sidebarExpanded ? "w-52 items-start gap-1 px-3" : "w-[88px] items-center gap-7"
        }`}
      >
        {/* Hamburger */}
        <button
          onClick={() => setSidebarExpanded(e => !e)}
          className={`flex items-center gap-3 rounded-lg transition-colors hover:bg-gray-100 ${
            sidebarExpanded ? "w-full px-2 py-2" : "p-2.5"
          }`}
        >
          <Menu className="h-5 w-5 shrink-0 text-gray-400" />
          {sidebarExpanded && (
            <span className="text-sm font-black tracking-tight text-gray-800">SekaiTalk</span>
          )}
        </button>

        {/* Nav buttons */}
        {SIDEBAR_BUTTONS.map(({ panel, Icon, label, enabled }) => (
          <button
            key={panel}
            onClick={() => {
              if (!enabled) return;
              setSidebarPanel(prev => prev === panel ? null : panel);
              setSidebarExpanded(false);
            }}
            className={`group flex items-center transition-all ${!enabled ? "cursor-default opacity-35" : ""} ${
              sidebarExpanded
                ? `w-full gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                    sidebarPanel === panel
                      ? "bg-violet-50 text-violet-600"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                  }`
                : "flex-col gap-1"
            }`}
          >
            {sidebarExpanded ? (
              <Icon className={`h-4 w-4 shrink-0 ${sidebarPanel === panel ? "text-violet-500" : "text-gray-400 group-hover:text-gray-700"}`} />
            ) : (
              <div className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all ${
                sidebarPanel === panel
                  ? "border-violet-500 bg-violet-50 text-violet-600"
                  : "border-gray-200 text-gray-400 group-hover:border-violet-400 group-hover:bg-violet-50 group-hover:text-violet-500"
              }`}>
                <Icon className="h-5 w-5" />
              </div>
            )}
            <span className={sidebarExpanded ? "" : `text-[9px] font-medium transition-colors ${
              sidebarPanel === panel ? "text-violet-500" : "text-gray-400 group-hover:text-violet-500"
            }`}>
              {label}
            </span>
          </button>
        ))}
      </aside>

      {/* Map zone */}
      <main className="relative flex-1 overflow-hidden">

        {/* Floating top-right HUD — same as /home */}
        <div className="pointer-events-auto absolute top-4 right-4 z-[1000] flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
          {userStats && (
            <>
              <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
                Nv.{userStats.level}
              </span>
              <div className="flex flex-col gap-1">
                <div className="h-2 w-20 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full bg-violet-500 transition-all duration-700" style={{ width: `${userStats.percent}%` }} />
                </div>
                <span className="text-[9px] text-gray-400 text-right leading-none tabular-nums">
                  {userStats.xpInLevel}/{userStats.xpNeeded ?? "MAX"} XP
                </span>
              </div>
              <div className="w-px h-5 bg-gray-200" />
            </>
          )}
          <button className="flex items-center gap-1.5 text-gray-400 hover:text-orange-400 transition-colors">
            <Flame className="h-5 w-5 text-orange-300" />
            <span className="text-sm font-semibold text-gray-600">0</span>
          </button>
          <button className="text-gray-400 hover:text-gray-700 transition-colors"><Bell className="h-5 w-5" /></button>
          <button className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-700 transition-colors">
            <User className="h-4 w-4" />
          </button>
        </div>

          {/* HUD title */}
          <div
            className="pointer-events-none absolute top-5 z-[999] flex flex-col gap-2 transition-all duration-300"
            style={{ left: sidebarPanel ? 396 : 20 }}
          >

            {/* Back pill */}
            <button
              onClick={() => router.push("/home")}
              className="pointer-events-auto flex w-fit items-center gap-2 rounded-full border border-white/15 bg-black/35 px-4 py-2 text-white/55 backdrop-blur-sm transition-all hover:border-white/30 hover:bg-black/55 hover:text-white/80"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Retour</span>
            </button>

            {/* Info */}
            <div>
              <p className="text-3xl font-black uppercase leading-none tracking-widest text-white drop-shadow-lg">
                {city.name}
                {neighborhood && (
                  <span className="ml-3 text-lg font-semibold normal-case tracking-normal text-white/50">
                    — {neighborhood}
                  </span>
                )}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-px w-10 bg-violet-400" />
                <span className="font-mono text-sm tabular-nums text-violet-300/85">{tokyoTime}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400/50">JST</span>
              </div>
            </div>

          </div>


          {/* Lieux panel — overlay on 3D map */}
          {city.use3DMap && sidebarPanel === "lieux" && (
            <div className="pointer-events-auto absolute left-0 top-0 z-[1000] flex h-full" style={{ width: 380 }}>

              {/* Type selector column */}
              <div className="flex w-[148px] shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-gray-950/93 backdrop-blur-xl">
                <div className="flex items-center justify-between px-4 py-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">Lieux</span>
                  <button onClick={() => setSidebarPanel(null)} className="text-white/30 transition-colors hover:text-white/70">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex flex-col gap-0.5 px-2 pb-4">
                  {/* Tous */}
                  <button
                    onClick={() => setLieuxType(null)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-semibold transition-all ${
                      lieuxType === null
                        ? "bg-white/15 text-white"
                        : "text-white/50 hover:bg-white/8 hover:text-white/80"
                    }`}
                  >
                    <span>Tous</span>
                    <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-bold">
                      {city.pois.length}
                    </span>
                  </button>

                  {(Object.keys(POI_META) as POIType[]).map(type => {
                    const count    = city.pois.filter(p => p.type === type).length;
                    if (count === 0) return null;
                    const meta     = POI_META[type];
                    const isActive = lieuxType === type;
                    return (
                      <button
                        key={type}
                        onClick={() => setLieuxType(type)}
                        className="flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-semibold transition-all"
                        style={{
                          background: isActive ? `${meta.color}18` : undefined,
                          color:      isActive ? meta.color : "rgba(255,255,255,0.5)",
                        }}
                        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
                        onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = ""; }}
                      >
                        <span className="flex items-center gap-1.5">
                          <span>{meta.icon}</span>
                          <span>{meta.label}</span>
                        </span>
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                          style={{ background: isActive ? `${meta.color}28` : "rgba(255,255,255,0.08)" }}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* POI list column */}
              <div className="flex flex-1 flex-col overflow-hidden bg-gray-950/82 backdrop-blur-xl">
                <div className="shrink-0 px-4 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">
                    {lieuxType ? POI_META[lieuxType].label : "Tous les lieux"}
                  </p>
                </div>

                <div className="flex flex-col gap-1 overflow-y-auto px-3 pb-4">
                  {panelPois.map(poi => {
                    const qd = poiQuestData[poi.id];
                    return (
                      <div
                        key={poi.id}
                        className="group flex items-center gap-2 rounded-xl border border-white/6 bg-white/4 px-3 py-3 transition-all hover:border-white/12 hover:bg-white/8"
                      >
                        {/* Preview click (fly-to + open drawer) */}
                        <button className="min-w-0 flex-1 text-left" onClick={() => { flyToPoi(poi); handlePoiClick(poi.id); }}>
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg leading-none">{POI_META[poi.type].icon}</span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-white/85 transition-colors group-hover:text-white">
                                {poi.name}
                              </p>
                              {qd !== undefined && qd.total > 0 ? (
                                <p className="mt-0.5 text-[10px] text-white/35">
                                  {qd.done}/{qd.total} quête{qd.total > 1 ? "s" : ""}
                                  {qd.done === qd.total && (
                                    <span className="ml-1 text-emerald-400">✓</span>
                                  )}
                                </p>
                              ) : qd !== undefined ? (
                                <p className="mt-0.5 text-[10px] text-white/25">Aucune quête</p>
                              ) : (
                                <p className="mt-0.5 text-[10px] text-white/20">...</p>
                              )}
                            </div>
                          </div>
                        </button>

                        {/* Open modal button */}
                        <button
                          onClick={() => { setSidebarPanel(null); handlePoiClick(poi.id); }}
                          className="shrink-0 rounded-lg border border-white/10 bg-white/6 px-2.5 py-1.5 text-[11px] font-bold text-white/45 opacity-0 transition-all group-hover:opacity-100 hover:border-white/20 hover:bg-white/15 hover:text-white"
                        >
                          →
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Évènements panel */}
          {city.use3DMap && sidebarPanel === "evenements" && (
            <div className="pointer-events-auto absolute left-0 top-0 z-[1000] flex h-full w-[380px] flex-col border-r border-white/10 bg-gray-950/93 backdrop-blur-xl">

              <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-5 py-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">Saison</span>
                  <h3 className="mt-0.5 text-sm font-bold text-white">Évènements</h3>
                </div>
                <button onClick={() => setSidebarPanel(null)} className="text-white/30 transition-colors hover:text-white/70">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/8 bg-white/5 text-2xl">
                  🌸
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/60">Aucun évènement en cours</p>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-white/30">
                    Les évènements saisonniers apparaîtront ici — hanami, matsuri, Halloween, illuminations de Noël…
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Contacts panel */}
          {city.use3DMap && sidebarPanel === "contacts" && (
            <div className="pointer-events-auto absolute left-0 top-0 z-[1000] flex h-full w-[380px] flex-col border-r border-white/10 bg-gray-950/93 backdrop-blur-xl">

              {/* Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-5 py-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">Carnet</span>
                  <h3 className="mt-0.5 text-sm font-bold text-white">Contacts</h3>
                </div>
                <button onClick={() => { setSidebarPanel(null); setRdvOpenId(null); }}
                  className="text-white/30 transition-colors hover:text-white/70">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* List */}
              {contactsLoading ? (
                <div className="flex flex-1 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
                </div>
              ) : contacts.length === 0 ? (
                <p className="px-5 py-8 text-center text-[11px] text-white/30">
                  Parlez à des personnages pour les ajouter ici.
                </p>
              ) : (
                <div className="flex flex-col gap-3 overflow-y-auto px-4 py-4">
                  {contacts.map(contact => {
                    const friendship = getFriendshipLevel(contact.memoryCount);
                    const isRdvOpen  = rdvOpenId === contact.id;
                    return (
                      <div key={contact.id} className="overflow-hidden rounded-2xl border border-white/8 bg-white/4">

                        {/* Card */}
                        <div className="flex items-center gap-3 p-4">
                          {/* Avatar */}
                          <div className="relative shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={contact.image} alt={contact.name}
                              className="h-14 w-14 rounded-full object-cover"
                              style={{ border: `2px solid ${friendship.color}55` }}
                            />
                            <div
                              className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-gray-950"
                              style={{ background: friendship.color }}
                            />
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-1.5">
                              <p className="truncate text-sm font-bold text-white">{contact.name}</p>
                              <span className="shrink-0 text-[11px] text-white/30">{contact.nameJp}</span>
                            </div>
                            <p className="mt-0.5 text-[10px] text-white/40">{contact.role}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <span
                                className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                                style={{
                                  background: `${friendship.color}18`,
                                  color:      friendship.color,
                                  border:     `1px solid ${friendship.color}35`,
                                }}
                              >
                                {friendship.label}
                              </span>
                              {contact.memoryCount > 0 && (
                                <span className="text-[9px] text-white/30">
                                  {contact.memoryCount} souvenir{contact.memoryCount > 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* RDV button */}
                          <button
                            onClick={() => setRdvOpenId(isRdvOpen ? null : contact.id)}
                            className={`shrink-0 rounded-xl border px-3 py-2 text-[10px] font-bold transition-all ${
                              isRdvOpen
                                ? "border-violet-500/50 bg-violet-500/20 text-violet-300"
                                : "border-white/10 bg-white/5 text-white/45 hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-violet-300"
                            }`}
                          >
                            📍 RDV
                          </button>
                        </div>

                        {/* Location picker */}
                        {isRdvOpen && (
                          <div className="border-t border-white/8 px-4 py-3">
                            <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">
                              Choisir un lieu
                            </p>
                            <div className="flex flex-col gap-1">
                              {contact.locations.map(loc => (
                                <div key={loc.poiId}
                                  className="flex items-center justify-between rounded-lg border border-white/6 bg-white/4 px-3 py-2.5">
                                  <span className="text-xs text-white/60">{loc.name}</span>
                                  <button
                                    disabled
                                    className="cursor-not-allowed text-[9px] font-bold text-white/20"
                                    title="Bientôt disponible"
                                  >
                                    Inviter →
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

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
          {/* ── POI Drawer ── */}
          <div
            className="absolute right-0 top-0 z-[1000] flex h-full w-[420px] flex-col border-l border-white/10 bg-gray-950/96 backdrop-blur-xl transition-transform duration-300 ease-in-out"
            style={{
              transform:     selectedPoi ? "translateX(0)"    : "translateX(100%)",
              pointerEvents: selectedPoi ? "auto"             : "none",
            }}
          >
            {/* Hero */}
            <div className="relative h-52 shrink-0 overflow-hidden">
              {selectedPoi?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedPoi.image} alt={selectedPoi.name} className="h-full w-full object-cover" />
              ) : (
                <div
                  className="h-full w-full"
                  style={{
                    background: selectedPoi
                      ? `linear-gradient(135deg, ${POI_META[selectedPoi.type].color}12 0%, ${POI_META[selectedPoi.type].color}30 100%)`
                      : "transparent",
                  }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent" />
              <button
                onClick={closeModal}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/60 backdrop-blur-sm transition-all hover:border-white/30 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
              {selectedPoi && (
                <div className="absolute bottom-4 left-5">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-sm">{POI_META[selectedPoi.type].icon}</span>
                    <span className="text-[9px] font-bold uppercase tracking-[0.18em]"
                      style={{ color: POI_META[selectedPoi.type].color }}>
                      {POI_META[selectedPoi.type].label}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-white drop-shadow-lg">{selectedPoi.name}</h2>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">

              {/* Travel tip */}
              {selectedPoi?.description && (
                <div>
                  <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">À savoir</p>
                  <p className="text-[13px] leading-relaxed text-white/65">{selectedPoi.description}</p>
                </div>
              )}

              {/* Quests */}
              <div>
                <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">Quêtes</p>
                {questsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
                  </div>
                ) : poiQuests.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {poiQuests.map(quest => {
                      const progress  = quest.userProgress?.[0];
                      const isDone    = progress?.status === "COMPLETED";
                      const isReplay  = progress?.status === "IN_PROGRESS" && !!progress.firstCompletedAt;
                      const isResume  = progress?.status === "IN_PROGRESS" && !progress.firstCompletedAt;
                      const doneTasks = isResume
                        ? progress.taskProgress.filter(tp => tp.status === "COMPLETED").length
                        : isDone ? quest.tasks.length : 0;
                      return (
                        <div key={quest.id} className="rounded-xl border border-white/8 bg-white/4 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-white">{quest.title}</p>
                              {quest.description && (
                                <p className="mt-0.5 text-[11px] leading-snug text-white/40">{quest.description}</p>
                              )}
                            </div>
                            {isDone && (
                              <span className="flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                                <CheckCircle className="h-3 w-3" /> OK
                              </span>
                            )}
                          </div>
                          {(quest.xpReward > 0 || quest.yenReward > 0) && (
                            <div className="mt-2 flex items-center gap-1.5">
                              {quest.xpReward > 0 && (
                                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${isDone || isReplay ? "border-white/10 text-white/25" : "border-violet-500/40 bg-violet-500/10 text-violet-300"}`}>
                                  +{quest.xpReward} XP
                                </span>
                              )}
                              {quest.yenReward > 0 && (
                                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${isDone || isReplay ? "border-white/10 text-white/25" : "border-yellow-500/40 bg-yellow-500/10 text-yellow-300"}`}>
                                  +¥{quest.yenReward}
                                </span>
                              )}
                              {(isDone || isReplay) && <span className="text-[10px] italic text-white/20">déjà obtenu</span>}
                            </div>
                          )}
                          <div className="mt-2 flex items-center gap-1.5">
                            {quest.tasks.map((_, i) => (
                              <div key={i} className={`h-1.5 w-1.5 rounded-full ${i < doneTasks ? "bg-emerald-400" : isResume && i === doneTasks ? "bg-yellow-400" : "bg-white/20"}`} />
                            ))}
                            <span className="ml-1 text-[10px] text-white/30">{quest.tasks.length} tâches</span>
                          </div>
                          <button
                            onClick={() => { closeModal(); if (selectedPoi) router.push(`/home/${citySlug}/${selectedPoi.id}?quest=${quest.id}`); }}
                            className={`mt-3 w-full rounded-lg py-2.5 text-xs font-bold transition-all ${
                              isDone || isReplay ? "border border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60"
                              : isResume ? "border border-yellow-400/30 bg-yellow-400/15 text-yellow-400 hover:bg-yellow-400/25"
                              : "border border-violet-500/50 bg-violet-600/80 text-white hover:bg-violet-500"
                            }`}
                          >
                            {isDone || isReplay ? "🔄 Refaire (sans récompense)" : isResume ? `▶ Continuer (tâche ${doneTasks + 1}/${quest.tasks.length})` : "▶ Faire la quête"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-3 text-center text-[11px] text-white/25">Aucune quête disponible ici pour l&apos;instant.</p>
                )}
              </div>

              {/* Free conversation */}
              <div className="pb-2">
                <button
                  onClick={() => { closeModal(); if (selectedPoi) router.push(`/home/${citySlug}/${selectedPoi.id}`); }}
                  className="w-full rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-xs font-bold text-white/60 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
                >
                  Conversation libre →
                </button>
              </div>

            </div>
          </div>

        </main>
    </div>
  );
}


