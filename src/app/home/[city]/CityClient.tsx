"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Bell, User, Flame, MapPin, Users, BookOpen, Sparkles, ArrowLeft, X, Loader2, CheckCircle, CheckCircle2, Circle, Settings, ChevronLeft, ChevronRight, Smartphone, GraduationCap, Compass } from "lucide-react";
import PhoneOverlay from "@/components/PhoneOverlay";
import RevisionOverlay from "@/components/RevisionOverlay";
import cities, { POI, POIType } from "@/lib/cities";
import POI_LOGOS from "@/lib/poi-logos";
import { type VocabEntry, JLPT_COLORS } from "@/lib/mastery";
import { CITY_GUIDAGE } from "@/lib/guidage";
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
  vocab: VocabEntry[];
  tasks: { id: string }[];
  userProgress: { id: string; status: string; firstCompletedAt: string | null; taskProgress: { taskId: string; status: string }[] }[];
};

type SidebarPanel = "lieux" | "contacts" | "evenements" | "revision" | "guidage" | null;

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

const CITY_JP: Record<string, string> = { tokyo: "東京", osaka: "大阪", kyoto: "京都" };

const SIDEBAR_BUTTONS: { panel: Exclude<SidebarPanel, null>; Icon: React.ElementType; label: string; enabled: boolean }[] = [
  { panel: "guidage",    Icon: Compass,   label: "Guidage",    enabled: true  },
  { panel: "lieux",      Icon: MapPin,    label: "Lieux",      enabled: true  },
  { panel: "contacts",   Icon: Users,     label: "Contacts",   enabled: true  },
  { panel: "evenements", Icon: Sparkles,  label: "Évènements", enabled: true  },
  { panel: "revision",   Icon: BookOpen,  label: "Révision",   enabled: true  },
];

const DAILY_GOALS = [
  { label: "Lance une conversation",   done: false },
  { label: "Apprends 5 nouveaux mots", done: false },
  { label: "Complète une quête",       done: false },
];

const GLOBAL_STATS = [
  { label: "Conversations",   value: "—", icon: "💬" },
  { label: "Mots maîtrisés",  value: "—", icon: "✨" },
  { label: "Quêtes terminées",value: "—", icon: "🎯" },
];

function getFriendshipLevel(count: number): { label: string; color: string } {
  if (count === 0) return { label: "Étranger",      color: "#6b7280" };
  if (count <= 2)  return { label: "Connaissance",  color: "#0ea5e9" };
  if (count <= 5)  return { label: "Ami",           color: "#22c55e" };
  return                   { label: "Proche",        color: "#a855f7" };
}

const POI_META: Record<POIType, { label: string; color: string; icon: string }> = {
  transport:  { label: "Transport",  color: "#0ea5e9", icon: "🚇" },
  konbini:    { label: "Konbini",    color: "#22c55e", icon: "🏪" },
  izakaya:    { label: "Izakaya",    color: "#f97316", icon: "🍶" },
  site:       { label: "Site",       color: "#8b5cf6", icon: "🏛️" },
  market:     { label: "Marché",     color: "#eab308", icon: "🛒" },
  loisir:     { label: "Loisir",     color: "#14b8a6", icon: "🎭" },
  shop:       { label: "Shop",       color: "#ec4899", icon: "🛍️" },
  restaurant: { label: "Restaurant", color: "#f43f5e", icon: "🍔" },
  cafe:       { label: "Café",       color: "#92400e", icon: "☕" },
  hotel:      { label: "Hôtel",      color: "#0891b2", icon: "🏨" },
  pharmacie:  { label: "Pharmacie",  color: "#059669", icon: "💊" },
  medecin:    { label: "Médecin",    color: "#ef4444", icon: "🏥" },
  poste:      { label: "Poste",      color: "#d97706", icon: "📮" },
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

export default function CityClient({ citySlug, initialCity }: { citySlug: string; initialCity?: import("@/lib/cities").CityData | null }) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { activeType, setActiveType, poiClickRef, mapBgClickRef, mapRef } = useMapCtx();

  // Modal state
  const [selectedPoi, setSelectedPoi]     = useState<POI | null>(null);
  const [poiQuests, setPoiQuests]         = useState<PoiQuest[]>([]);
  const [questsLoading, setQuestsLoading] = useState(false);
  const [questPreview, setQuestPreview]   = useState<{ quest: PoiQuest; poi: POI } | null>(null);
  const [lessonData, setLessonData]       = useState<{ id: string; title: string; validated: boolean; score: number } | null | "none">(null);

  // Sidebar state
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [showPhone, setShowPhone]       = useState(false);
  const [showRevision, setShowRevision] = useState(false);
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
  const [mapLoading, setMapLoading] = useState(!!cities[citySlug]?.use3DMap);
  const [mapFading,  setMapFading]  = useState(false);

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


  const city = initialCity ?? cities[citySlug];

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
    if (map) map.flyTo({ center: [poi.lng, poi.lat], zoom: 19, pitch: 75, duration: 1800 });
  }, [mapRef]);

  const handlePoiClick = useCallback((poiId: string) => {
    const poi = city.pois.find(p => p.id === poiId);
    if (!poi) return;
    setSelectedPoi(poi);
    setPoiQuests([]);
    setQuestsLoading(true);
    setLessonData(null);
    flyToPoi(poi);
    fetch(`/api/quests/poi/${poiId}`)
      .then(r => r.ok ? r.json() : [])
      .then(setPoiQuests)
      .catch(() => setPoiQuests([]))
      .finally(() => setQuestsLoading(false));
    fetch(`/api/lessons/poi/${poiId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) { setLessonData("none"); return; }
        setLessonData({
          id: data.id,
          title: data.title,
          validated: data.userProgress?.validated ?? false,
          score: data.userProgress?.score ?? 0,
        });
      })
      .catch(() => setLessonData("none"));
  }, [city, flyToPoi]);

  const closeModal = useCallback(() => {
    setSelectedPoi(null);
    setPoiQuests([]);
  }, []);

  // Retour depuis une conversation — repositionne la map sur le POI visité
  useEffect(() => {
    const returnPoiId = searchParams.get("poi");
    if (!returnPoiId) return;
    handlePoiClick(returnPoiId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // City loading screen — hide once map has finished flying in
  useEffect(() => {
    if (!cities[citySlug]?.use3DMap) return;
    setMapLoading(true);
    setMapFading(false);
    let done = false;
    const triggerReady = () => {
      if (done) return;
      done = true;
      setMapFading(true);
      setTimeout(() => setMapLoading(false), 400);
    };
    const fallback = setTimeout(triggerReady, 3000);
    let pollId: ReturnType<typeof setTimeout>;
    const tryListen = () => {
      const map = (mapRef as React.RefObject<any>).current?.getMap?.();
      if (map) { map.once("idle", triggerReady); }
      else      { pollId = setTimeout(tryListen, 100); }
    };
    const initId = setTimeout(tryListen, 80);
    return () => { done = true; clearTimeout(fallback); clearTimeout(pollId!); clearTimeout(initId); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citySlug]);

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

  // Register click handlers into shared refs so the persistent map can call them
  useEffect(() => {
    poiClickRef.current = handlePoiClick;
    return () => { poiClickRef.current = null; };
  }, [handlePoiClick, poiClickRef]);

  useEffect(() => {
    mapBgClickRef.current = () => setSidebarPanel(null);
    return () => { mapBgClickRef.current = null; };
  }, [mapBgClickRef]);

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

      {/* ── City loading screen ──────────────────────────────────── */}
      {mapLoading && (
        <div
          className={`pointer-events-auto fixed inset-0 z-[2000] flex flex-col items-center justify-center select-none transition-opacity duration-[400ms] ${mapFading ? "opacity-0" : "opacity-100"}`}
          style={{ background: "white" }}
        >
          <div className="text-center">
            <p className="mb-4 text-[9px] font-bold tracking-[0.5em] uppercase text-gray-300">Japon</p>
            <h1 className="text-7xl font-black tracking-tight text-gray-900 leading-none">{city.name.toUpperCase()}</h1>
            <p className="mt-3 text-2xl font-extralight tracking-[0.35em] text-gray-400">{CITY_JP[citySlug] ?? ""}</p>
            <div className="mx-auto mt-10 h-[1px] w-44 overflow-hidden rounded-full bg-gray-200">
              <div className="h-full w-1/3 rounded-full bg-gray-400" style={{ animation: "loadbar-slide 1.4s ease-in-out infinite" }} />
            </div>
          </div>
          <p className="absolute bottom-8 text-[9px] font-medium tracking-[0.35em] text-gray-300">地図を読み込み中</p>
        </div>
      )}

      {/* ── Sidebar flottante (rétractable) ── */}
      <aside
        className="pointer-events-auto fixed left-5 top-1/2 -translate-y-1/2 z-[1001] flex flex-col overflow-hidden rounded-2xl bg-white transition-all duration-200"
        style={{
          width: sidebarExpanded ? 448 : 60,
          height: "calc(100vh - 40px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        {sidebarExpanded ? (
          /* ── État déployé ── */
          <div className="flex flex-col h-full overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-7 pb-7 shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-3xl">🗾</div>
                <span className="text-xl font-black tracking-tight text-gray-800 leading-none">SekaiTalk</span>
              </div>
              <button
                onClick={() => { setSidebarExpanded(false); setSidebarPanel(null); }}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>

            {/* Objectifs du jour */}
            <div className="px-7 pb-8 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Objectifs du jour</span>
                <span className="text-xs font-semibold text-violet-500 bg-violet-50 px-2.5 py-1 rounded-full">0 / {DAILY_GOALS.length}</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {DAILY_GOALS.map((g, i) => (
                  <div key={i} className="flex items-center gap-3.5 rounded-xl bg-gray-50 px-4 py-3.5">
                    {g.done ? <CheckCircle2 className="h-5 w-5 shrink-0 text-violet-500" /> : <Circle className="h-5 w-5 shrink-0 text-gray-300" />}
                    <span className={`text-sm font-medium ${g.done ? "line-through text-gray-400" : "text-gray-600"}`}>{g.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mx-7 h-px bg-gray-100 shrink-0" />

            {/* Navigation */}
            <div className="px-5 pt-8 pb-8 flex-1">
              <span className="px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Navigation</span>
              <div className="mt-3 flex flex-col gap-1">
                {SIDEBAR_BUTTONS.map(({ panel, Icon, label, enabled }, i) => (
                  <>
                    <button
                      key={panel}
                      onClick={() => {
                        if (!enabled) return;
                        if (panel === "revision") { setShowRevision(true); return; }
                        setSidebarPanel(prev => prev === panel ? null : panel);
                      }}
                      className={`flex items-center gap-4 rounded-xl px-4 py-4 text-left transition-colors ${
                        !enabled ? "cursor-default opacity-40"
                        : sidebarPanel === panel ? "bg-violet-50"
                        : "hover:bg-gray-50"
                      }`}
                    >
                      <Icon className={`h-5 w-5 shrink-0 ${sidebarPanel === panel && enabled ? "text-violet-500" : "text-gray-500"}`} />
                      <span className={`text-base font-medium ${sidebarPanel === panel && enabled ? "text-violet-600" : "text-gray-600"}`}>{label}</span>
                    </button>
                    {i === 3 && (
                      <button
                        key="phone"
                        onClick={() => setShowPhone(true)}
                        className="flex items-center gap-4 rounded-xl px-4 py-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <Smartphone className="h-5 w-5 shrink-0 text-gray-500" />
                        <span className="text-base font-medium text-gray-600">Téléphone</span>
                      </button>
                    )}
                  </>
                ))}
              </div>
            </div>

            <div className="mx-7 h-px bg-gray-100 shrink-0" />

            {/* Mes stats */}
            <div className="px-7 pt-8 pb-8 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Mes stats</span>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {GLOBAL_STATS.map(({ label, value, icon }) => (
                  <div key={label} className="flex flex-col items-center rounded-2xl bg-gray-50 px-3 py-5 gap-2">
                    <span className="text-2xl">{icon}</span>
                    <span className="text-lg font-black text-gray-700 tabular-nums">{value}</span>
                    <span className="text-[10px] text-gray-400 text-center leading-tight">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mx-7 h-px bg-gray-100 shrink-0" />

            {/* Paramètres */}
            <div className="px-5 pt-5 pb-6 shrink-0">
              <button className="flex w-full cursor-default items-center gap-4 rounded-xl px-4 py-4 opacity-40">
                <Settings className="h-5 w-5 shrink-0 text-gray-500" />
                <span className="text-base font-medium text-gray-600">Paramètres</span>
              </button>
            </div>
          </div>
        ) : (
          /* ── État rétracté ── */
          <div className="flex flex-col items-center h-full py-4 gap-1">
            <button
              onClick={() => setSidebarExpanded(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-lg mb-2"
            >
              🗾
            </button>
            {SIDEBAR_BUTTONS.map(({ panel, Icon, label, enabled }) => (
              <button
                key={panel}
                title={label}
                onClick={() => {
                  if (!enabled) return;
                  if (panel === "revision") { setShowRevision(true); return; }
                  setSidebarExpanded(true);
                  setSidebarPanel(panel);
                }}
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                  !enabled ? "opacity-40 cursor-default"
                  : sidebarPanel === panel ? "bg-violet-50 text-violet-500"
                  : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                }`}
              >
                <Icon className="h-5 w-5" />
              </button>
            ))}
            <div className="flex-1" />
            <button
              title="Téléphone"
              onClick={() => setShowPhone(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <Smartphone className="h-5 w-5" />
            </button>
            <button
              onClick={() => setSidebarExpanded(true)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 hover:bg-gray-100 hover:text-gray-500 transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </aside>

      {/* Map zone */}
      <main className="relative flex-1 overflow-hidden">

        {/* ── HUD top-right (même visuel que /home) ── */}
        <div
          className="pointer-events-auto absolute top-5 z-[1000] flex items-center gap-5 rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-md transition-all duration-300 ease-in-out"
          style={{ right: selectedPoi ? 420 + 20 : 20 }}
        >
          {/* Tickets journaliers */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              {[0,1,2,3,4].map(i => (
                <div key={i} className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-lg">🎫</div>
              ))}
              <button className="ml-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-dashed border-gray-200 text-gray-400 hover:border-violet-400 hover:text-violet-500 transition-colors text-sm font-bold">+</button>
            </div>
            <span className="flex items-center gap-1 text-[10px] text-gray-400 leading-none">
              <span>⏱</span><span className="tabular-nums">10h 28min</span>
            </span>
          </div>
          <div className="w-px h-9 bg-gray-100" />
          <button className="flex items-center gap-2 text-gray-400 hover:text-orange-400 transition-colors">
            <Flame className="h-6 w-6 text-orange-300" />
            <span className="text-base font-semibold text-gray-600">0</span>
          </button>
          <button className="text-gray-400 hover:text-gray-700 transition-colors">
            <Bell className="h-6 w-6" />
          </button>
          {/* Avatar + XP ring */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="relative" style={{ width: 64, height: 64 }}>
              <svg width={64} height={64} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
                <circle cx={32} cy={32} r={28} fill="none" stroke="#e5e7eb" strokeWidth={4.5} />
                <circle cx={32} cy={32} r={28} fill="none" stroke="#7c3aed" strokeWidth={4.5}
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 28}
                  strokeDashoffset={2 * Math.PI * 28 * (1 - (userStats?.percent ?? 0) / 100)}
                  style={{ transition: "stroke-dashoffset 0.7s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                  <User className="h-5 w-5" />
                </div>
              </div>
            </div>
            <span className="text-xs font-bold text-gray-700 tabular-nums">Lv. {userStats?.level ?? "—"}</span>
          </div>
        </div>

          {/* HUD title */}
          <div
            className="pointer-events-none absolute top-5 z-[999] flex flex-col gap-2 transition-all duration-300"
            style={{ left: sidebarPanel ? 864 : sidebarExpanded ? 488 : 96 }}
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
            <div className="pointer-events-auto absolute z-[1000] flex overflow-hidden rounded-2xl bg-white"
              style={{ left: 484, top: 20, width: 380, height: "calc(100vh - 40px)", boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1)" }}>

              {/* Type selector column */}
              <div className="flex w-[148px] shrink-0 flex-col overflow-y-auto border-r border-gray-100 bg-white">
                <div className="flex items-center justify-between px-4 py-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Lieux</span>
                  <button onClick={() => setSidebarPanel(null)} className="text-gray-400 transition-colors hover:text-gray-600">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex flex-col gap-0.5 px-2 pb-4">
                  <button
                    onClick={() => setLieuxType(null)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-semibold transition-all ${
                      lieuxType === null
                        ? "bg-violet-50 text-violet-600"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    }`}
                  >
                    <span>Tous</span>
                    <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold text-gray-500">
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
                          background: isActive ? `${meta.color}14` : undefined,
                          color:      isActive ? meta.color : "#6b7280",
                        }}
                        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.04)"; }}
                        onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = ""; }}
                      >
                        <span className="flex items-center gap-1.5">
                          <span>{meta.icon}</span>
                          <span>{meta.label}</span>
                        </span>
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                          style={{ background: isActive ? `${meta.color}20` : "rgba(0,0,0,0.06)", color: isActive ? meta.color : "#9ca3af" }}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* POI list column */}
              <div className="flex flex-1 flex-col overflow-hidden bg-gray-50">
                <div className="shrink-0 px-4 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                    {lieuxType ? POI_META[lieuxType].label : "Tous les lieux"}
                  </p>
                </div>

                <div className="flex flex-col gap-1 overflow-y-auto px-3 pb-4">
                  {panelPois.map(poi => {
                    const qd = poiQuestData[poi.id];
                    return (
                      <div
                        key={poi.id}
                        className="group flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-3 transition-all hover:border-gray-200 hover:bg-gray-50"
                      >
                        <button className="min-w-0 flex-1 text-left" onClick={() => { flyToPoi(poi); handlePoiClick(poi.id); }}>
                          <div className="flex items-center gap-2.5">
                            {POI_LOGOS[poi.id]
                              ? <img src={POI_LOGOS[poi.id]} alt="" className="h-7 w-7 rounded object-contain" />
                              : <span className="text-lg leading-none">{POI_META[poi.type].icon}</span>
                            }
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-gray-700 transition-colors group-hover:text-gray-900">
                                {poi.name}
                              </p>
                              {qd !== undefined && qd.total > 0 ? (
                                <p className="mt-0.5 text-[10px] text-gray-400">
                                  {qd.done}/{qd.total} quête{qd.total > 1 ? "s" : ""}
                                  {qd.done === qd.total && <span className="ml-1 text-emerald-500">✓</span>}
                                </p>
                              ) : qd !== undefined ? (
                                <p className="mt-0.5 text-[10px] text-gray-300">Aucune quête</p>
                              ) : (
                                <p className="mt-0.5 text-[10px] text-gray-300">...</p>
                              )}
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => { setSidebarPanel(null); handlePoiClick(poi.id); }}
                          className="shrink-0 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-[11px] font-bold text-gray-400 opacity-0 transition-all group-hover:opacity-100 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-700"
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

          {/* Guidage panel */}
          {city.use3DMap && sidebarPanel === "guidage" && (() => {
            const themes = CITY_GUIDAGE[citySlug] ?? [];
            return (
              <div className="pointer-events-auto absolute z-[1000] flex w-[380px] flex-col overflow-hidden rounded-2xl bg-white"
                style={{ left: 484, top: 20, height: "calc(100vh - 40px)", boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1)" }}>
                {/* Header */}
                <div className="shrink-0 border-b border-gray-100 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-500">Parcours guidé</span>
                      <h3 className="mt-0.5 text-lg font-black text-gray-900">Guidage</h3>
                    </div>
                    <button onClick={() => setSidebarPanel(null)} className="text-gray-400 transition-colors hover:text-gray-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-gray-400">
                    Suis ce parcours pour apprendre le japonais de manière progressive, du plus simple au plus complexe.
                  </p>
                </div>

                {/* Themes */}
                <div className="flex flex-col overflow-y-auto">
                  {themes.map((theme, ti) => (
                    <div key={theme.id}>
                      {/* Theme header */}
                      <div className="flex items-center gap-3 border-t border-gray-100 bg-gray-50/80 px-5 py-3">
                        <span className="text-xl">{theme.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400">Thème {ti + 1}</p>
                          <p className="text-sm font-bold text-gray-800">{theme.title}</p>
                          <p className="mt-0.5 text-[10px] text-gray-400">{theme.description}</p>
                        </div>
                      </div>

                      {/* POIs */}
                      {theme.poiIds.map((poiId, pi) => {
                        const poi = city.pois.find(p => p.id === poiId);
                        if (!poi) return null;
                        const meta = POI_META[poi.type];
                        const qd = poiQuestData[poiId];
                        const isDone = qd && qd.total > 0 && qd.done === qd.total;
                        return (
                          <button
                            key={poiId}
                            onClick={() => {
                              if (mapRef?.current) {
                                mapRef.current.flyTo({ center: [poi.lng, poi.lat], zoom: 18, pitch: 72, duration: 1600 });
                              }
                              setSidebarPanel(null);
                              handlePoiClick(poi.id);
                            }}
                            className="flex items-center gap-3 border-b border-gray-50 px-5 py-3 text-left transition-colors hover:bg-violet-50/40"
                          >
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors"
                              style={{ background: isDone ? "#22c55e" : "#f3f4f6", color: isDone ? "white" : "#9ca3af" }}>
                              {isDone ? "✓" : pi + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-gray-800">{poi.name}</p>
                              <p className="text-[11px] text-gray-400">{meta.label}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                          </button>
                        );
                      })}
                    </div>
                  ))}
                  {themes.length === 0 && (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-16 text-center">
                      <Compass className="h-10 w-10 text-gray-200" />
                      <p className="text-sm text-gray-400">Aucun guidage disponible pour cette ville.</p>
                    </div>
                  )}
                  <div className="h-4 shrink-0" />
                </div>
              </div>
            );
          })()}

          {/* Évènements panel */}
          {city.use3DMap && sidebarPanel === "evenements" && (
            <div className="pointer-events-auto absolute z-[1000] flex w-[380px] flex-col overflow-hidden rounded-2xl bg-white"
              style={{ left: 484, top: 20, height: "calc(100vh - 40px)", boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1)" }}>
              <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Saison</span>
                  <h3 className="mt-0.5 text-sm font-bold text-gray-800">Évènements</h3>
                </div>
                <button onClick={() => setSidebarPanel(null)} className="text-gray-400 transition-colors hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 text-2xl">🌸</div>
                <div>
                  <p className="text-sm font-semibold text-gray-500">Aucun évènement en cours</p>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-gray-400">
                    Les évènements saisonniers apparaîtront ici — hanami, matsuri, Halloween, illuminations de Noël…
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Contacts panel */}
          {city.use3DMap && sidebarPanel === "contacts" && (
            <div className="pointer-events-auto absolute z-[1000] flex w-[380px] flex-col overflow-hidden rounded-2xl bg-white"
              style={{ left: 484, top: 20, height: "calc(100vh - 40px)", boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1)" }}>
              <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Carnet</span>
                  <h3 className="mt-0.5 text-sm font-bold text-gray-800">Contacts</h3>
                </div>
                <button onClick={() => { setSidebarPanel(null); setRdvOpenId(null); }} className="text-gray-400 transition-colors hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {contactsLoading ? (
                <div className="flex flex-1 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
                </div>
              ) : contacts.length === 0 ? (
                <p className="px-5 py-8 text-center text-[11px] text-gray-400">
                  Parlez à des personnages pour les ajouter ici.
                </p>
              ) : (
                <div className="flex flex-col gap-3 overflow-y-auto px-4 py-4">
                  {contacts.map(contact => {
                    const friendship = getFriendshipLevel(contact.memoryCount);
                    const isRdvOpen  = rdvOpenId === contact.id;
                    return (
                      <div key={contact.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
                        <div className="flex items-center gap-3 p-4">
                          <div className="relative shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={contact.image} alt={contact.name}
                              className="h-14 w-14 rounded-full object-cover"
                              style={{ border: `2px solid ${friendship.color}55` }}
                            />
                            <div
                              className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white"
                              style={{ background: friendship.color }}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-1.5">
                              <p className="truncate text-sm font-bold text-gray-800">{contact.name}</p>
                              <span className="shrink-0 text-[11px] text-gray-400">{contact.nameJp}</span>
                            </div>
                            <p className="mt-0.5 text-[10px] text-gray-400">{contact.role}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <span
                                className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                                style={{ background: `${friendship.color}14`, color: friendship.color, border: `1px solid ${friendship.color}30` }}
                              >
                                {friendship.label}
                              </span>
                              {contact.memoryCount > 0 && (
                                <span className="text-[9px] text-gray-400">
                                  {contact.memoryCount} souvenir{contact.memoryCount > 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => setRdvOpenId(isRdvOpen ? null : contact.id)}
                            className={`shrink-0 rounded-xl border px-3 py-2 text-[10px] font-bold transition-all ${
                              isRdvOpen
                                ? "border-violet-400 bg-violet-50 text-violet-600"
                                : "border-gray-200 bg-white text-gray-500 hover:border-violet-400 hover:bg-violet-50 hover:text-violet-600"
                            }`}
                          >
                            📍 RDV
                          </button>
                        </div>

                        {isRdvOpen && (
                          <div className="border-t border-gray-100 px-4 py-3">
                            <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-gray-400">Choisir un lieu</p>
                            <div className="flex flex-col gap-1">
                              {contact.locations.map(loc => (
                                <div key={loc.poiId} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
                                  <span className="text-xs text-gray-500">{loc.name}</span>
                                  <button disabled className="cursor-not-allowed text-[9px] font-bold text-gray-300" title="Bientôt disponible">
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
          {/* ── POI prev/next navigation ── */}
          {(() => {
            if (!selectedPoi) return null;
            const list = filteredPois;
            const idx  = list.findIndex(p => p.id === selectedPoi.id);
            if (idx === -1 || list.length < 2) return null;
            const prev = list[(idx - 1 + list.length) % list.length];
            const next = list[(idx + 1) % list.length];
            return (
              <div
                className="pointer-events-auto absolute bottom-6 z-[1001] flex items-center gap-3 transition-all duration-300 ease-in-out"
                style={{ left: `calc(50% - ${selectedPoi ? 210 : 0}px)`, transform: "translateX(-50%)" }}
              >
                <button
                  onClick={() => handlePoiClick(prev.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/50 backdrop-blur-md hover:bg-black/65 hover:text-white transition-all"
                  title={prev.name}
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handlePoiClick(next.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/50 backdrop-blur-md hover:bg-black/65 hover:text-white transition-all"
                  title={next.name}
                >
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </button>
              </div>
            );
          })()}

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

              {/* Lesson */}
              {lessonData !== "none" && (
                <div>
                  <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">Leçon</p>
                  {lessonData === null ? (
                    <div className="flex justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-white/30" />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-white/8 bg-white/4 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/20">
                          <GraduationCap className="h-4.5 w-4.5 text-violet-300" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-white truncate">{lessonData.title}</p>
                          {lessonData.validated ? (
                            <p className="mt-0.5 text-[10px] text-emerald-400 font-semibold">
                              Validée ✓  — {lessonData.score} %
                            </p>
                          ) : lessonData.score > 0 ? (
                            <p className="mt-0.5 text-[10px] text-amber-400">
                              Score précédent : {lessonData.score} % (min. 80 %)
                            </p>
                          ) : (
                            <p className="mt-0.5 text-[10px] text-white/35">Non commencée</p>
                          )}
                        </div>
                        {lessonData.validated && (
                          <span className="flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                            <CheckCircle className="h-3 w-3" /> OK
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => selectedPoi && router.push(`/home/${citySlug}/${selectedPoi.id}/lesson`)}
                        className={`mt-3 w-full rounded-lg py-2.5 text-xs font-bold transition-all ${
                          lessonData.validated
                            ? "border border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60"
                            : "border border-violet-500/50 bg-violet-600/80 text-white hover:bg-violet-500"
                        }`}
                      >
                        {lessonData.validated ? "🔄 Refaire la leçon" : lessonData.score > 0 ? "🔄 Réessayer" : "🎓 Commencer la leçon"}
                      </button>
                    </div>
                  )}
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
                            onClick={() => {
                              if (selectedPoi) setQuestPreview({ quest, poi: selectedPoi });
                            }}
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

            </div>
          </div>

        </main>

      {showPhone    && <PhoneOverlay    onClose={() => setShowPhone(false)}    />}
      {showRevision && <RevisionOverlay onClose={() => setShowRevision(false)} />}

      {/* ── Quest preview modal ── */}
      {questPreview && (() => {
        const { quest, poi } = questPreview;
        const jlptLabels: Record<number, string> = { 5: "N5", 4: "N4", 3: "N3", 2: "N2", 1: "N1" };
        const jlptGroups = ([5, 4, 3, 2, 1] as const)
          .map(jlpt => ({ jlpt, label: jlptLabels[jlpt], words: (quest.vocab ?? []).filter(v => v.jlpt === jlpt) }))
          .filter(g => g.words.length > 0);

        return (
          <div
            className="pointer-events-auto fixed inset-0 z-[1100] overflow-y-auto bg-black/70 backdrop-blur-sm"
            onClick={() => setQuestPreview(null)}
          >
            <div className="flex min-h-full items-center justify-center px-4 py-8">
              <div
                className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span>{POI_META[poi.type].icon}</span>
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: POI_META[poi.type].color }}>
                          {poi.name}
                        </span>
                      </div>
                      <h2 className="text-xl font-black text-gray-900 leading-tight">{quest.title}</h2>
                      {quest.description && (
                        <p className="mt-1 text-[12px] text-gray-500 leading-relaxed">{quest.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setQuestPreview(null)}
                      className="shrink-0 rounded-full p-1.5 text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-300">
                      {quest.tasks.length} tâche{quest.tasks.length > 1 ? "s" : ""}
                    </span>
                    {quest.xpReward > 0 && (
                      <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-bold text-violet-600">
                        +{quest.xpReward} XP
                      </span>
                    )}
                    {quest.yenReward > 0 && (
                      <span className="rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-bold text-yellow-600">
                        +¥{quest.yenReward}
                      </span>
                    )}
                  </div>
                </div>

                {/* Vocab */}
                <div className="px-6 pt-4 pb-2">
                  {jlptGroups.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-300">
                        Vocabulaire de cette quête — {(quest.vocab ?? []).length} mots
                      </p>
                      <div className="max-h-[52vh] overflow-y-auto pr-1 flex flex-col gap-4">
                        {jlptGroups.map(({ jlpt, label, words }) => (
                          <div key={jlpt}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black text-white"
                                style={{ background: JLPT_COLORS[jlpt] }}>
                                {label}
                              </span>
                              <span className="text-[10px] text-gray-400">{words.length} mot{words.length > 1 ? "s" : ""}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                              {words.map(v => (
                                <div key={v.jp} className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                                  <div className="flex items-baseline gap-1.5 min-w-0">
                                    <span className="text-base font-bold text-gray-900 leading-none shrink-0">{v.jp}</span>
                                    {v.kana !== v.jp && (
                                      <span className="text-[10px] text-gray-400 truncate">{v.kana}</span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-gray-400 italic mt-0.5">{v.romaji}</p>
                                  <p className="text-[11px] text-gray-600 font-medium mt-0.5 leading-tight">{v.fr}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-xl bg-violet-50 border border-violet-100 px-4 py-2.5 text-center">
                        <p className="text-xs text-violet-600 font-medium">
                          Ces mots seront détectés dans ta prononciation 🎯
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-4 text-center">
                      <p className="text-3xl">📖</p>
                      <p className="text-sm text-gray-400">Pas de vocabulaire prédéfini pour cette quête.</p>
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div className="px-6 py-5 flex gap-3">
                  <button
                    onClick={() => setQuestPreview(null)}
                    className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => {
                      setQuestPreview(null);
                      closeModal();
                      router.push(`/home/${citySlug}/${poi.id}?quest=${quest.id}`);
                    }}
                    className="flex-1 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-500 transition-colors"
                  >
                    Commencer →
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}


