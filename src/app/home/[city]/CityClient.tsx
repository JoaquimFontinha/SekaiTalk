"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Bell, User, Flame, ArrowLeft, X, Loader2, CheckCircle, CheckCircle2, Circle, Settings, ChevronLeft, ChevronRight, GraduationCap, Compass, MessageCircle } from "lucide-react";
import RevisionOverlay from "@/components/RevisionOverlay";
import SnsOverlay from "@/components/SnsOverlay";
import MonObjectif from "@/components/MonObjectif";
import TutorialLayer from "@/components/TutorialLayer";
import { getTutoStep, setTutoStep as storeTutoStep } from "@/lib/tutorial";
import type { SnsConversation } from "@/lib/sns-conversations";
import { useDailyGoals } from "@/hooks/useDailyGoals";
import type { EventsResponse, ActiveEvent } from "@/lib/events";
import { formatExpiry } from "@/lib/events";
import cities, { POI, POIType } from "@/lib/cities";
import POI_LOGOS from "@/lib/poi-logos";
import { type VocabEntry, JLPT_COLORS } from "@/lib/mastery";
import { CITY_GUIDAGE, POI_JLPT_LEVEL } from "@/lib/guidage";
import { getNeighborhood } from "@/lib/tokyo-neighborhoods";
import IllustratedMap from "./IllustratedMap";
import { useMapCtx } from "../MapContext";

// ── Types ─────────────────────────────────────────────────────────────────────

type PoiQuest = {
  id: string;
  title: string;
  description: string | null;
  xpReward: number;
  vocab: VocabEntry[];
  tasks: { id: string }[];
  userProgress: { id: string; status: string; firstCompletedAt: string | null; taskProgress: { taskId: string; status: string }[] }[];
};

type SidebarPanel = "lieux" | "contacts" | "evenements" | "revision" | "guidage" | null;

type UserStats = {
  xp: number; level: number;
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

const SIDEBAR_BUTTONS: { panel: Exclude<SidebarPanel, null>; label: string; enabled: boolean; color: string; svg: React.ReactNode }[] = [
  { panel: "guidage",    label: "Thèmes",     enabled: true,  color: "#f97316",
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg> },
  { panel: "lieux",      label: "Lieux",      enabled: true,  color: "#6366f1",
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> },
  { panel: "contacts",   label: "Contacts",   enabled: false, color: "#0d9488",
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { panel: "evenements", label: "Évènements", enabled: true,  color: "#d97706",
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
  { panel: "revision",   label: "Révision",   enabled: true,  color: "#2563eb",
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
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

// ── EventCard ─────────────────────────────────────────────────────────────────

function EventCard({ ev, tick, onClick }: {
  ev: ActiveEvent; tick: number; onClick: () => void;
}) {
  void tick; // trigger re-render for countdown
  const expiry  = formatExpiry(ev.expiresAt, ev.type);
  const isDaily = ev.type === "DAILY_INSTANCE";

  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border border-gray-100 bg-white p-3.5 text-left shadow-sm transition-all hover:border-gray-200 hover:shadow-md active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        {/* Emoji circle */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl"
          style={{ background: `${ev.color}18` }}>
          {ev.emoji}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-bold text-gray-800">{ev.title}</p>
          </div>
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-gray-500">{ev.description}</p>

          {/* Footer badges */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {/* Countdown */}
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              isDaily ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"
            }`}>
              {isDaily ? "⏱" : "📅"} {expiry}
            </span>
            {/* XP */}
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
              +{ev.xpReward} XP
            </span>
            {/* POI name */}
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-[10px] text-gray-400">
              📍 {ev.poiName}
            </span>
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-gray-300" />
      </div>
    </button>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CityClient({ citySlug, initialCity }: { citySlug: string; initialCity?: import("@/lib/cities").CityData | null }) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { activeType, poiClickRef, mapBgClickRef, mapRef, editMode, setEditMode, poiMoveRef, setActiveEvents } = useMapCtx();
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.isAdmin === true;

  // Modal state
  const [selectedPoi, setSelectedPoi]     = useState<POI | null>(null);
  const [poiBackground, setPoiBackground] = useState<string | null>(null);
  const [poiQuests, setPoiQuests]         = useState<PoiQuest[]>([]);
  const [questsLoading, setQuestsLoading] = useState(false);
  const [questPreview, setQuestPreview]   = useState<{ quest: PoiQuest; poi: POI } | null>(null);
  const [lessonData, setLessonData]       = useState<{ id: string; title: string; validated: boolean; score: number } | null | "none">(null);

  // Sidebar state
  const { goals: dailyGoals, doneCount: goalsDone } = useDailyGoals();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [showRevision, setShowRevision]       = useState(false);
  const [showStreakPopover, setShowStreakPopover]   = useState(false);
  const [showNotifPopover, setShowNotifPopover]    = useState(false);
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const [moveToast, setMoveToast] = useState<string | null>(null);
  const [showSns, setShowSns]                 = useState(false);
  const [snsConversation, setSnsConversation] = useState<SnsConversation | null>(null);
  const [sidebarPanel, setSidebarPanel]   = useState<SidebarPanel>(null);
  const [lieuxType, setLieuxType]         = useState<POIType | null>(null);
  const [poiQuestData, setPoiQuestData]   = useState<Record<string, { done: number; total: number }>>({});
  const [collapsedThemes, setCollapsedThemes] = useState<Set<string>>(
    () => new Set((CITY_GUIDAGE[citySlug] ?? []).map(t => t.id))
  );
  const [themesLevel, setThemesLevel] = useState<5 | 4 | 3 | null>(null);

  // Events state
  const [events, setEvents]               = useState<EventsResponse | null>(null);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsTick, setEventsTick]       = useState(0); // force countdown re-render each minute

  // Contacts state
  const [contacts, setContacts]             = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [rdvOpenId, setRdvOpenId]           = useState<string | null>(null);

  const [tokyoTime, setTokyoTime]         = useState("");
  const [neighborhood, setNeighborhood]   = useState("");
  const [userStats, setUserStats]         = useState<UserStats | null>(null);
  const [mapLoading, setMapLoading] = useState(!!cities[citySlug]?.use3DMap);
  const [mapFading,  setMapFading]  = useState(false);
  const [tutoRestrictFilters, setTutoRestrictFilters] = useState(false);

  // Mobile responsive
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );
  const [sheetState, setSheetState] = useState<"collapsed" | "half" | "full">("collapsed");
  const [mobileTab, setMobileTab] = useState<"objectif" | "guidage" | "lieux" | "evenements">("objectif");
  const touchStartY = useRef<number>(0);

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
    const s = getTutoStep();
    setTutoRestrictFilters(s === "lieux_filter_konbini" || s === "lieux_select_poi");
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
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
    if (!map) return;
    const padding = isMobile
      ? { bottom: Math.round(window.innerHeight * 0.62), top: 80, left: 0, right: 0 }
      : undefined;
    map.flyTo({ center: [poi.lng, poi.lat], zoom: 19, pitch: 75, duration: 1800, ...(padding ? { padding } : {}) });
  }, [mapRef, isMobile]);

  const handlePoiClick = useCallback((poiId: string) => {
    const poi = city.pois.find(p => p.id === poiId);
    if (!poi) return;
    setSelectedPoi(poi);
    setPoiBackground(null);
    setPoiQuests([]);
    setQuestsLoading(true);
    setLessonData(null);
    setSnsConversation(null);
    flyToPoi(poi);
    fetch(`/api/scenes/poi/${poiId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setPoiBackground(d?.backgroundImage ?? null))
      .catch(() => {});
    fetch(`/api/sns/poi/${poiId}`)
      .then(r => r.ok ? r.json() : null)
      .then(setSnsConversation)
      .catch(() => {});
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
    setSheetState("collapsed");
  }, []);

  // Retour depuis une conversation — repositionne la map sur le POI visité
  useEffect(() => {
    const returnPoiId = searchParams.get("poi");
    if (!returnPoiId) return;
    handlePoiClick(returnPoiId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Open Haneda POI drawer on tutorial start — same as clicking the POI
  useEffect(() => {
    if (searchParams.get("tuto") !== "start") return;
    let attempts = 0;
    const tryOpen = () => {
      const map = (mapRef as React.RefObject<any>).current?.getMap?.();
      if (map) {
        handlePoiClick("haneda-airport");
      } else if (attempts++ < 40) {
        setTimeout(tryOpen, 200);
      }
    };
    const id = setTimeout(tryOpen, 1000);
    return () => clearTimeout(id);
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

  // Register POI move handler (admin edit mode)
  useEffect(() => {
    poiMoveRef.current = async (poiId: string, lat: number, lng: number) => {
      try {
        const res = await fetch(`/api/admin/pois/${poiId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lng }),
        });
        if (!res.ok) throw new Error();
        setMoveToast(`✓ ${poiId} repositionné`);
        setTimeout(() => setMoveToast(null), 2500);
      } catch {
        setMoveToast("✗ Erreur de sauvegarde");
        setTimeout(() => setMoveToast(null), 2500);
      }
    };
    return () => { poiMoveRef.current = null; };
  }, [poiMoveRef]);

  // Fetch quest counts for all POIs when Lieux or Guidage panel opens (desktop or mobile)
  useEffect(() => {
    const shouldFetch = isMobile
      ? (mobileTab === "lieux" || mobileTab === "guidage")
      : (sidebarPanel === "lieux");
    if (!shouldFetch) return;
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
  }, [sidebarPanel, mobileTab, isMobile, citySlug]);

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

  // Fetch events au montage → injecte dans le context pour la carte
  useEffect(() => {
    setEventsLoading(true);
    fetch("/api/events")
      .then(r => r.ok ? r.json() : { seasonal: [], daily: [] })
      .then((data: EventsResponse) => {
        setEvents(data);
        setActiveEvents([...data.seasonal, ...data.daily]);
      })
      .catch(() => setEvents({ seasonal: [], daily: [] }))
      .finally(() => setEventsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown tick every minute
  useEffect(() => {
    const id = setInterval(() => setEventsTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // ─── Mobile helpers ──────────────────────────────────────────────────────────
  const SHEET_HEIGHTS = { collapsed: 82, half: "48vh", full: "78vh" } as const;

  const handleCityDragEnd = (dy: number) => {
    if (sheetState === "collapsed") {
      if (dy > 60) setSheetState("full");
      else if (dy > 20) setSheetState("half");
    } else if (sheetState === "half") {
      if (dy > 30) setSheetState("full");
      else if (dy < -20) setSheetState("collapsed");
    } else {
      if (dy < -30) setSheetState("half");
      else if (dy < -80) setSheetState("collapsed");
    }
  };

  const handleCityTabClick = (tab: "objectif" | "guidage" | "lieux" | "evenements") => {
    if (tab === mobileTab && sheetState !== "collapsed") { setSheetState("collapsed"); return; }
    setMobileTab(tab);
    setSheetState(sheetState === "collapsed" ? "half" : sheetState);
  };

  // ─── Mobile layout ───────────────────────────────────────────────────────────
  if (isMobile) return (
    <div className="pointer-events-none flex h-screen overflow-hidden">

      {/* Loading screen */}
      {mapLoading && (
        <div className={`pointer-events-auto fixed inset-0 z-[2000] flex flex-col items-center justify-center select-none transition-opacity duration-[400ms] ${mapFading ? "opacity-0" : "opacity-100"}`} style={{ background: "white" }}>
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

      {/* Top-left: Back + city info */}
      <div className="pointer-events-auto fixed top-4 left-3 z-[1002] flex flex-col gap-1">
        <button
          onClick={() => router.push("/home")}
          className="flex w-fit items-center gap-1.5 rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-white/55 backdrop-blur-sm hover:bg-black/55 hover:text-white/80"
        >
          <ArrowLeft className="h-3 w-3" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Retour</span>
        </button>
        <div>
          <p className="text-lg font-black uppercase leading-none tracking-widest text-white drop-shadow-lg">
            {city.name}
            {neighborhood && <span className="ml-2 text-xs font-semibold normal-case tracking-normal text-white/50">— {neighborhood}</span>}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <div className="h-px w-5 bg-indigo-400" />
            <span className="font-mono text-xs tabular-nums text-indigo-300/85">{tokyoTime}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-400/50">JST</span>
          </div>
        </div>
      </div>

      {/* Top-right: HUD */}
      <div className="pointer-events-auto fixed z-[1003]" style={{ top: 16, right: 14 }}>
        <div className="flex items-center gap-2 rounded-2xl bg-white/95 px-3 py-2 shadow-md" style={{ backdropFilter: "blur(8px)" }}>
          <Flame className={`h-4 w-4 ${0 > 0 ? "text-orange-400" : "text-gray-300"}`} />
          <span className={`text-sm font-black tabular-nums ${0 > 0 ? "text-orange-500" : "text-gray-300"}`}>0</span>
          <div className="w-px h-4 bg-gray-200" />
          <span className="text-xs font-bold text-indigo-500 tabular-nums">Lv.{userStats?.level ?? "—"}</span>
          <div className="w-px h-4 bg-gray-200" />
          <div className="relative">
            <button
              onClick={() => setShowProfilePopover(v => !v)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors"
            >
              <User className="h-3.5 w-3.5" />
            </button>
            {showProfilePopover && (
              <>
                <div className="fixed inset-0 z-[1010]" onClick={() => setShowProfilePopover(false)} />
                <div className="absolute top-full right-0 mt-2 z-[1011] w-52 rounded-2xl bg-white border border-gray-100 shadow-xl overflow-hidden">
                  <button onClick={() => { setShowProfilePopover(false); router.push("/home/settings"); }}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <User className="h-4 w-4 text-gray-400" /> Modifier le profil
                  </button>
                  <div className="mx-4 h-px bg-gray-100" />
                  <button onClick={() => { setShowProfilePopover(false); router.push("/home/settings"); }}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <Settings className="h-4 w-4 text-gray-400" /> Paramètres
                  </button>
                  <div className="mx-4 h-px bg-gray-100" />
                  <button onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-sm font-medium text-red-500 hover:bg-red-50">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Se déconnecter
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* POI Drawer — slides up from bottom */}
      <div
        className="pointer-events-auto fixed inset-x-0 bottom-0 z-[1020] flex flex-col rounded-t-3xl bg-gray-950/98 backdrop-blur-xl overflow-hidden"
        style={{
          height: selectedPoi ? "58vh" : 0,
          transition: "height 0.38s cubic-bezier(0.32, 0.72, 0, 1)",
          pointerEvents: selectedPoi ? "auto" : "none",
        }}
      >
        <div
          className="shrink-0 flex items-center justify-center pt-3 pb-1 relative cursor-pointer"
          onTouchStart={(e) => { touchStartY.current = e.touches[0].clientY; }}
          onTouchEnd={(e) => {
            const dy = e.changedTouches[0].clientY - touchStartY.current;
            if (dy > 60) closeModal();
          }}
        >
          <div className="w-10 h-1 rounded-full bg-white/20" />
          <button onClick={closeModal}
            className="absolute right-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/70 hover:bg-white/20">
            <X className="h-4 w-4" />
          </button>
        </div>

        {selectedPoi && (
          <>
            {/* Hero image */}
            <div className="relative h-24 shrink-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={poiBackground ?? "/background_placeholder.png"}
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent" />
              <div className="absolute bottom-3 left-4">
                <div className="mb-0.5 flex items-center gap-1.5">
                  <span className="text-sm">{POI_META[selectedPoi.type].icon}</span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: POI_META[selectedPoi.type].color }}>
                    {POI_META[selectedPoi.type].label}
                  </span>
                </div>
                <h2 className="text-lg font-black text-white drop-shadow-lg">{selectedPoi.name}</h2>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 flex flex-col gap-4">
              {selectedPoi.description && (
                <div>
                  <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">À savoir</p>
                  <p className="text-[13px] leading-relaxed text-white/65">{selectedPoi.description}</p>
                </div>
              )}

              {lessonData !== "none" && (
                <div>
                  <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">Leçon</p>
                  {lessonData === null ? (
                    <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin text-white/30" /></div>
                  ) : (
                    <div className="rounded-xl border border-white/8 bg-white/4 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20">
                          <GraduationCap className="h-4 w-4 text-indigo-300" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-white truncate">{lessonData.title}</p>
                          {lessonData.validated ? (
                            <p className="mt-0.5 text-[10px] text-emerald-400 font-semibold">Validée ✓ — {lessonData.score}%</p>
                          ) : lessonData.score > 0 ? (
                            <p className="mt-0.5 text-[10px] text-amber-400">Score : {lessonData.score}% (min. 80%)</p>
                          ) : (
                            <p className="mt-0.5 text-[10px] text-white/35">Non commencée</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => { if (!selectedPoi) return; if (getTutoStep() === "drawer_lesson") storeTutoStep("lesson_active"); router.push(`/home/${citySlug}/${selectedPoi.id}/lesson`); }}
                        className={`mt-3 w-full rounded-lg py-2.5 text-xs font-bold transition-all ${
                          lessonData.validated ? "border border-white/10 bg-white/5 text-white/40 hover:bg-white/10" : "border border-indigo-500/50 bg-indigo-600/80 text-white hover:bg-indigo-500"
                        }`}
                      >
                        {lessonData.validated ? "🔄 Refaire la leçon" : lessonData.score > 0 ? "🔄 Réessayer" : "🎓 Commencer la leçon"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div>
                <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">Quêtes</p>
                {questsLoading ? (
                  <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-indigo-400" /></div>
                ) : poiQuests.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {poiQuests.map((quest, questIdx) => {
                      const progress = quest.userProgress?.[0];
                      const isDone = progress?.status === "COMPLETED";
                      const isReplay = progress?.status === "IN_PROGRESS" && !!progress.firstCompletedAt;
                      const isResume = progress?.status === "IN_PROGRESS" && !progress.firstCompletedAt;
                      const doneTasks = isResume ? progress.taskProgress.filter(tp => tp.status === "COMPLETED").length : isDone ? quest.tasks.length : 0;
                      return (
                        <div key={quest.id} className="rounded-xl border border-white/8 bg-white/4 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-white">{quest.title}</p>
                              {quest.description && <p className="mt-0.5 text-[11px] text-white/40">{quest.description}</p>}
                            </div>
                            {isDone && (
                              <span className="flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                                <CheckCircle className="h-3 w-3" /> OK
                              </span>
                            )}
                          </div>
                          {quest.xpReward > 0 && (
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${isDone || isReplay ? "border-white/10 text-white/25" : "border-indigo-500/40 bg-indigo-500/10 text-indigo-300"}`}>
                                +{quest.xpReward} XP
                              </span>
                              {(isDone || isReplay) && <span className="text-[10px] italic text-white/20">déjà obtenu</span>}
                            </div>
                          )}
                          <div className="mt-1.5 flex items-center gap-1">
                            {quest.tasks.map((_, i) => (
                              <div key={i} className={`h-1.5 w-1.5 rounded-full ${i < doneTasks ? "bg-emerald-400" : isResume && i === doneTasks ? "bg-yellow-400" : "bg-white/20"}`} />
                            ))}
                            <span className="ml-1 text-[10px] text-white/30">{quest.tasks.length} tâches</span>
                          </div>
                          <button
                            id={questIdx === 0 ? "tut-quest-btn" : undefined}
                            onClick={() => { if (selectedPoi) setQuestPreview({ quest, poi: selectedPoi }); }}
                            className={`mt-3 w-full rounded-lg py-2.5 text-xs font-bold transition-all ${
                              isDone || isReplay ? "border border-white/10 bg-white/5 text-white/40"
                              : isResume ? "border border-yellow-400/30 bg-yellow-400/15 text-yellow-400"
                              : "border border-indigo-500/50 bg-indigo-600/80 text-white hover:bg-indigo-500"
                            }`}
                          >
                            {isDone || isReplay ? "🔄 Refaire" : isResume ? `▶ Continuer (tâche ${doneTasks + 1}/${quest.tasks.length})` : "▶ Faire la quête"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-3 text-center text-[11px] text-white/25">Aucune quête disponible ici pour l&apos;instant.</p>
                )}
              </div>

              {snsConversation && (() => {
                const conv = snsConversation;
                return (
                  <div>
                    <span className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Discussion SNS</span>
                      <span className="text-[9px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.5 rounded-full">Beta</span>
                    </span>
                    <button onClick={() => setShowSns(true)}
                      className="mt-2 w-full rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-3.5 text-left hover:bg-emerald-900/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xl shrink-0">{conv.contact.avatar}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{conv.contact.name}</p>
                          <p className="text-[11px] text-emerald-400 truncate">{conv.context}</p>
                        </div>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold shrink-0">+{conv.xpReward} XP</span>
                      </div>
                    </button>
                  </div>
                );
              })()}
            </div>
          </>
        )}
      </div>

      {/* Bottom sheet — hidden when POI drawer is open */}
      <div
        className="pointer-events-auto fixed z-[1001] flex flex-col bg-white rounded-2xl overflow-hidden"
        style={{
          bottom: 14, left: 12, right: 12,
          height: selectedPoi ? 0 : SHEET_HEIGHTS[sheetState],
          opacity: selectedPoi ? 0 : 1,
          pointerEvents: selectedPoi ? "none" : "auto",
          transition: "height 0.38s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.2s",
          boxShadow: "0 8px 40px rgba(0,0,0,0.18), 0 2px 12px rgba(0,0,0,0.10)",
        }}
      >
        {/* Drag handle */}
        <div
          className="shrink-0 flex justify-center pt-3 pb-2 cursor-pointer"
          onTouchStart={(e) => { touchStartY.current = e.touches[0].clientY; }}
          onTouchEnd={(e) => { handleCityDragEnd(touchStartY.current - e.changedTouches[0].clientY); }}
          onClick={() => {
            if (sheetState === "collapsed") setSheetState("half");
            else if (sheetState === "half") setSheetState("full");
            else setSheetState("collapsed");
          }}
        >
          <div className="w-9 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Content — hidden when collapsed */}
        <div className="flex-1 min-h-0 overflow-y-auto" style={{ display: sheetState === "collapsed" ? "none" : undefined }}>

          {/* OBJECTIF */}
          {mobileTab === "objectif" && (
            <div className="px-4 pb-4">
              <MonObjectif />
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Objectifs du jour</span>
                  <span className="text-xs font-semibold text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full">{goalsDone} / {dailyGoals.length || 3}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {dailyGoals.map((g) => (
                    <div key={g.type} className={`flex items-center gap-3 rounded-xl px-3 py-3 ${g.done ? "bg-indigo-50" : "bg-gray-50"}`}>
                      {g.done ? <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-500" /> : <Circle className="h-4 w-4 shrink-0 text-gray-300" />}
                      <span className="text-base shrink-0 leading-none">{g.icon}</span>
                      <span className={`flex-1 text-sm font-medium ${g.done ? "line-through text-gray-400" : "text-gray-600"}`}>{g.label}</span>
                      {g.target > 1 && !g.done && <span className="text-[11px] font-bold text-gray-400 shrink-0">{g.progress}/{g.target}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* GUIDAGE / THÈMES */}
          {mobileTab === "guidage" && (() => {
            const themes = CITY_GUIDAGE[citySlug] ?? [];
            return (
              <div>
                <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-2.5 z-10">
                  <div className="flex gap-1.5">
                    {([null, 5, 4, 3] as const).map(lvl => {
                      const labels: Record<string, string> = { "null": "Tous", "5": "N5", "4": "N4", "3": "N3" };
                      const colors: Record<string, string> = { "null": "#6366f1", "5": "#16a34a", "4": "#2563eb", "3": "#dc2626" };
                      const key = String(lvl); const active = themesLevel === lvl;
                      return (
                        <button key={key} onClick={() => setThemesLevel(lvl)}
                          className="flex-1 rounded-lg py-1.5 text-[11px] font-bold"
                          style={{ background: active ? colors[key] : "#f3f4f6", color: active ? "white" : "#6b7280" }}>
                          {labels[key]}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {themes.map((theme, ti) => {
                  const filteredPoiIds = theme.poiIds.filter(id => themesLevel === null || POI_JLPT_LEVEL[id] === themesLevel);
                  if (filteredPoiIds.length === 0) return null;
                  return (
                    <div key={theme.id}>
                      <button
                        className="flex w-full items-center gap-3 px-4 py-3 text-left"
                        style={{ background: "linear-gradient(to right, #f5f3ff, #eef2ff)" }}
                        onClick={() => setCollapsedThemes(prev => { const next = new Set(prev); next.has(theme.id) ? next.delete(theme.id) : next.add(theme.id); return next; })}
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-base" style={{ background: "#ede9fe" }}>{theme.emoji}</div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-indigo-400">Thème {ti + 1}</p>
                          <p className="text-sm font-extrabold text-gray-900">{theme.title}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-indigo-300 transition-transform duration-200" style={{ transform: collapsedThemes.has(theme.id) ? "rotate(0deg)" : "rotate(90deg)" }} />
                      </button>
                      {!collapsedThemes.has(theme.id) && filteredPoiIds.map((poiId, pi) => {
                        const poi = city.pois.find(p => p.id === poiId); if (!poi) return null;
                        const meta = POI_META[poi.type];
                        const qd = poiQuestData[poiId];
                        const isDone = qd && qd.total > 0 && qd.done === qd.total;
                        const lvl = POI_JLPT_LEVEL[poiId];
                        const lvlColor: Record<number, string> = { 5: "#16a34a", 4: "#2563eb", 3: "#dc2626" };
                        return (
                          <button key={poiId} onClick={() => { handlePoiClick(poi.id); setSheetState("collapsed"); }}
                            className="flex w-full items-center gap-3 border-b border-gray-50 px-4 py-3 text-left hover:bg-indigo-50/40">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                              style={{ background: isDone ? "#22c55e" : "#f3f4f6", color: isDone ? "white" : "#9ca3af" }}>
                              {isDone ? "✓" : pi + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-gray-800">{poi.name}</p>
                              <p className="text-[11px] text-gray-400">{meta.label}</p>
                            </div>
                            {lvl && <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-black text-white" style={{ background: lvlColor[lvl] }}>N{lvl}</span>}
                            <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* LIEUX */}
          {mobileTab === "lieux" && (
            <div>
              {/* Horizontal type filter */}
              <div className="sticky top-0 bg-white border-b border-gray-100 z-10 px-3 py-2"
                style={{ overflowX: "auto", scrollbarWidth: "none", display: "flex", gap: 6 }}>
                <button onClick={() => setLieuxType(null)}
                  className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all"
                  style={{ background: lieuxType === null ? "#6366f1" : "#f3f4f6", color: lieuxType === null ? "white" : "#6b7280" }}>
                  Tous ({city.pois.length})
                </button>
                {(Object.keys(POI_META) as POIType[]).filter(type => city.pois.some(p => p.type === type)).map(type => {
                  const meta = POI_META[type]; const isActive = lieuxType === type;
                  return (
                    <button key={type} onClick={() => setLieuxType(type)}
                      className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all"
                      style={{ background: isActive ? meta.color : "#f3f4f6", color: isActive ? "white" : "#6b7280" }}>
                      {meta.icon} {meta.label}
                    </button>
                  );
                })}
              </div>
              {/* POI list */}
              <div className="flex flex-col gap-1.5 px-3 py-2">
                {panelPois.map(poi => {
                  const qd = poiQuestData[poi.id];
                  return (
                    <button key={poi.id} onClick={() => { handlePoiClick(poi.id); setSheetState("collapsed"); }}
                      className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white px-3 py-3 text-left hover:border-gray-200 w-full">
                      {POI_LOGOS[poi.id]
                        ? <img src={POI_LOGOS[poi.id]} alt="" className="h-7 w-7 rounded object-contain shrink-0" />
                        : <span className="text-xl shrink-0">{POI_META[poi.type].icon}</span>}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 truncate">{poi.name}</p>
                        {qd !== undefined && qd.total > 0 ? (
                          <p className="text-[10px] text-gray-400">{qd.done}/{qd.total} quête{qd.total > 1 ? "s" : ""}{qd.done === qd.total && <span className="ml-1 text-emerald-500">✓</span>}</p>
                        ) : <p className="text-[10px] text-gray-300">{qd !== undefined ? "Aucune quête" : "..."}</p>}
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ÉVÈNEMENTS */}
          {mobileTab === "evenements" && (
            <div className="px-3 py-3 flex flex-col gap-3">
              {eventsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-amber-400" /></div>
              ) : !events || (events.seasonal.length === 0 && events.daily.length === 0) ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 text-xl">🌸</div>
                  <p className="text-sm font-semibold text-gray-500">Aucun évènement en cours</p>
                </div>
              ) : (
                <>
                  {events.seasonal.length > 0 && (
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Saisonniers</p>
                      <div className="flex flex-col gap-2">
                        {events.seasonal.map(ev => <EventCard key={ev.id} ev={ev} tick={eventsTick} onClick={() => { handlePoiClick(ev.poiId); setSheetState("collapsed"); }} />)}
                      </div>
                    </div>
                  )}
                  {events.daily.length > 0 && (
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Aujourd'hui</p>
                      <div className="flex flex-col gap-2">
                        {events.daily.map(ev => <EventCard key={ev.id} ev={ev} tick={eventsTick} onClick={() => { handlePoiClick(ev.poiId); setSheetState("collapsed"); }} />)}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div className="shrink-0 flex items-stretch border-t border-gray-100">
          <button onClick={() => handleCityTabClick("objectif")}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-3 transition-colors ${mobileTab === "objectif" && sheetState !== "collapsed" ? "text-indigo-600" : "text-gray-400"}`}>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
            <span className="text-[9px] font-bold uppercase tracking-wider">Objectif</span>
          </button>
          <button onClick={() => handleCityTabClick("guidage")}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-3 transition-colors ${mobileTab === "guidage" && sheetState !== "collapsed" ? "text-orange-500" : "text-gray-400"}`}>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
            <span className="text-[9px] font-bold uppercase tracking-wider">Thèmes</span>
          </button>
          <button onClick={() => handleCityTabClick("lieux")}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-3 transition-colors ${mobileTab === "lieux" && sheetState !== "collapsed" ? "text-indigo-600" : "text-gray-400"}`}>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span className="text-[9px] font-bold uppercase tracking-wider">Lieux</span>
          </button>
          <button onClick={() => handleCityTabClick("evenements")}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-3 transition-colors ${mobileTab === "evenements" && sheetState !== "collapsed" ? "text-amber-500" : "text-gray-400"}`}>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span className="text-[9px] font-bold uppercase tracking-wider">Évènements</span>
          </button>
          <button onClick={() => setShowRevision(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-3 text-gray-400">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            <span className="text-[9px] font-bold uppercase tracking-wider">Révision</span>
          </button>
        </div>
      </div>

      {editMode && (
        <div className="pointer-events-none fixed bottom-28 left-1/2 -translate-x-1/2 z-[1500]">
          <div className="flex items-center gap-2 rounded-full border border-orange-400/40 bg-orange-500/90 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur-sm">
            Mode placement — glissez les POIs
          </div>
        </div>
      )}
      {moveToast && (
        <div className="pointer-events-none fixed bottom-36 left-1/2 -translate-x-1/2 z-[1500] rounded-full bg-gray-900/90 px-5 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-sm">
          {moveToast}
        </div>
      )}

      {showRevision && <RevisionOverlay onClose={() => setShowRevision(false)} />}
      {showSns && snsConversation && <SnsOverlay conversation={snsConversation} onClose={() => setShowSns(false)} />}

      <TutorialLayer
        citySlug={citySlug} selectedPoiId={selectedPoi?.id} sidebarPanel={sidebarPanel} lieuxType={lieuxType}
        initOnMount={searchParams.get("tuto") === "start"}
        onAdvance={(step) => setTutoRestrictFilters(step === "lieux_filter_konbini" || step === "lieux_select_poi")}
      />

      {questPreview && (() => {
        const { quest, poi } = questPreview;
        const jlptLabels: Record<number, string> = { 5: "N5", 4: "N4", 3: "N3", 2: "N2", 1: "N1" };
        const jlptGroups = ([5, 4, 3, 2, 1] as const)
          .map(jlpt => ({ jlpt, label: jlptLabels[jlpt], words: (quest.vocab ?? []).filter(v => v.jlpt === jlpt) }))
          .filter(g => g.words.length > 0);
        return (
          <div className="pointer-events-auto fixed inset-0 z-[1100] overflow-y-auto bg-black/70 backdrop-blur-sm" onClick={() => setQuestPreview(null)}>
            <div className="flex min-h-full items-center justify-center px-4 py-8">
              <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span>{POI_META[poi.type].icon}</span>
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: POI_META[poi.type].color }}>{poi.name}</span>
                      </div>
                      <h2 className="text-xl font-black text-gray-900 leading-tight">{quest.title}</h2>
                      {quest.description && <p className="mt-1 text-[12px] text-gray-500">{quest.description}</p>}
                    </div>
                    <button onClick={() => setQuestPreview(null)} className="shrink-0 rounded-full p-1.5 text-gray-300 hover:text-gray-600 hover:bg-gray-100"><X className="h-4 w-4" /></button>
                  </div>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-300">{quest.tasks.length} tâche{quest.tasks.length > 1 ? "s" : ""}</span>
                    {quest.xpReward > 0 && <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">+{quest.xpReward} XP</span>}
                  </div>
                </div>
                <div className="px-6 pt-4 pb-2">
                  {jlptGroups.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-300">Vocabulaire — {(quest.vocab ?? []).length} mots</p>
                      <div className="max-h-[40vh] overflow-y-auto pr-1 flex flex-col gap-4">
                        {jlptGroups.map(({ jlpt, label, words }) => (
                          <div key={jlpt}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black text-white" style={{ background: JLPT_COLORS[jlpt] }}>{label}</span>
                              <span className="text-[10px] text-gray-400">{words.length} mot{words.length > 1 ? "s" : ""}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                              {words.map(v => (
                                <div key={v.jp} className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                                  <div className="flex items-baseline gap-1.5 min-w-0">
                                    <span className="text-base font-bold text-gray-900 leading-none shrink-0">{v.jp}</span>
                                    {v.kana !== v.jp && <span className="text-[10px] text-gray-400 truncate">{v.kana}</span>}
                                  </div>
                                  <p className="text-[10px] text-gray-400 italic mt-0.5">{v.romaji}</p>
                                  <p className="text-[11px] text-gray-600 font-medium mt-0.5">{v.fr}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-4 text-center">
                      <p className="text-3xl">📖</p>
                      <p className="text-sm text-gray-400">Pas de vocabulaire prédéfini.</p>
                    </div>
                  )}
                </div>
                <div className="px-6 py-5 flex gap-3">
                  <button onClick={() => setQuestPreview(null)} className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50">Annuler</button>
                  <button onClick={() => { if (getTutoStep() === "drawer_quest") storeTutoStep("quest_active"); setQuestPreview(null); closeModal(); router.push(`/home/${citySlug}/${poi.id}?quest=${quest.id}`); }}
                    className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-500">Commencer →</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );

  // ─── Desktop layout ───────────────────────────────────────────────────────────
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
            <div className="flex items-center justify-between px-6 pt-3 pb-2 shrink-0 border-b border-gray-200">
              <img src="/logo_sekai_talk.png" alt="SekaiTalk" className="h-[120px] object-contain" />
              <button
                onClick={() => { setSidebarExpanded(false); setSidebarPanel(null); }}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>

            {/* Mon Objectif */}
            <div className="px-5 pb-2 shrink-0">
              <MonObjectif />
            </div>

            <div className="mx-7 h-px bg-gray-100 shrink-0" />

            {/* Objectifs du jour */}
            <div className="px-7 pb-8 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Objectifs du jour</span>
                <span className="text-xs font-semibold text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full">{goalsDone} / {dailyGoals.length || 3}</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {dailyGoals.map((g) => (
                  <div key={g.type} className={`flex items-center gap-3.5 rounded-xl px-4 py-3.5 transition-colors ${g.done ? "bg-indigo-50" : "bg-gray-50"}`}>
                    {g.done ? <CheckCircle2 className="h-5 w-5 shrink-0 text-indigo-500" /> : <Circle className="h-5 w-5 shrink-0 text-gray-300" />}
                    <span className="text-lg shrink-0 leading-none">{g.icon}</span>
                    <span className={`flex-1 text-sm font-medium ${g.done ? "line-through text-gray-400" : "text-gray-600"}`}>{g.label}</span>
                    {g.target > 1 && !g.done && (
                      <span className="text-[11px] font-bold text-gray-400 shrink-0">{g.progress}/{g.target}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mx-7 h-px bg-gray-100 shrink-0" />

            {/* Navigation */}
            <div className="px-5 pt-8 pb-8 flex-1">
              <span className="px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Navigation</span>
              <div className="mt-3 flex flex-col gap-1">
                {SIDEBAR_BUTTONS.map(({ panel, svg, color, label, enabled }) => (
                  <button
                    key={panel}
                    id={`tut-sidebar-${panel}`}
                    onClick={() => {
                      if (!enabled) return;
                      if (panel === "revision") { setShowRevision(true); return; }
                      setSidebarPanel(prev => prev === panel ? null : panel);
                    }}
                    className={`group flex items-center gap-3.5 rounded-xl px-3 py-3 text-left transition-colors ${
                      !enabled ? "cursor-default opacity-40"
                      : sidebarPanel === panel ? "bg-gray-100"
                      : "hover:bg-gray-100"
                    }`}
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl p-2 transition-transform group-hover:scale-105"
                      style={{ background: enabled ? color : "#d1d5db" }}
                    >
                      {svg}
                    </div>
                    <span className="text-[15px] font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">{label}</span>
                    {!enabled
                      ? <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-400">Bientôt</span>
                      : <ChevronRight className="ml-auto h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    }
                  </button>
                ))}
              </div>
            </div>

            <div className="mx-7 h-px bg-gray-100 shrink-0" />

            {/* Paramètres */}
            <div className="px-5 pt-5 pb-6 shrink-0">
              <button
                onClick={() => router.push("/home/settings")}
                className="group flex w-full items-center gap-4 rounded-xl px-4 py-4 hover:bg-gray-50 transition-colors"
              >
                <Settings className="h-5 w-5 shrink-0 text-gray-400 group-hover:text-gray-600 transition-colors" />
                <span className="text-base font-medium text-gray-500 group-hover:text-gray-700 transition-colors">Paramètres</span>
                <ChevronRight className="ml-auto h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>
        ) : (
          /* ── État rétracté ── */
          <div className="flex flex-col items-center h-full py-4 gap-1">
            <button
              onClick={() => setSidebarExpanded(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-lg mb-2"
            >
              🗾
            </button>
            {SIDEBAR_BUTTONS.map(({ panel, svg, color, label, enabled }) => (
              <button
                key={panel}
                title={label}
                onClick={() => {
                  if (!enabled) return;
                  if (panel === "revision") { setShowRevision(true); return; }
                  setSidebarExpanded(true);
                  setSidebarPanel(panel);
                }}
                className={`flex h-10 w-10 items-center justify-center rounded-xl p-2 transition-colors ${
                  !enabled ? "opacity-40 cursor-default" : "hover:scale-105"
                }`}
                style={{ background: sidebarPanel === panel ? color : "transparent",
                         opacity: !enabled ? 0.4 : sidebarPanel === panel ? 1 : 0.55 }}
              >
                <div className="flex h-full w-full items-center justify-center"
                  style={{ filter: sidebarPanel === panel ? "none" : "saturate(0) brightness(0.4)" }}>
                  {svg}
                </div>
              </button>
            ))}
            <div className="flex-1" />
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
          {/* Cluster 1 — Tickets journaliers */}
          <div className="flex flex-col items-center gap-2 px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Tickets</span>
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4].map(i => (
                <svg key={i} width="18" height="18" viewBox="0 0 1792 1792" fill="#6366f1" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1024 452l316 316-572 572-316-316zm-211 979l618-618q19-19 19-45t-19-45l-362-362q-18-18-45-18t-45 18l-618 618q-19 19-19 45t19 45l362 362q18 18 45 18t45-18zm889-637l-907 908q-37 37-90.5 37t-90.5-37l-126-126q56-56 56-136t-56-136-136-56-136 56l-125-126q-37-37-37-90.5t37-90.5l907-906q37-37 90.5-37t90.5 37l125 125q-56 56-56 136t56 136 136 56 136-56l126 125q37 37 37 90.5t-37 90.5z"/>
                </svg>
              ))}
              <button className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors text-xs font-bold">
                +
              </button>
            </div>
            <span className="text-[10px] text-gray-400 tabular-nums">⏱ 10h 28min</span>
          </div>

          <div className="w-px h-12 bg-gray-100" />

          {/* Cluster 2 — Streak */}
          <div className="relative flex items-center">
            <button
              className="flex items-center gap-2"
              onClick={() => setShowStreakPopover(v => !v)}
            >
              <Flame className={`h-8 w-8 shrink-0 ${0 > 0 ? "text-orange-400" : "text-gray-300"}`} />
              <span className={`text-3xl font-black tabular-nums ${0 > 0 ? "text-orange-500" : "text-gray-300"}`}>0</span>
            </button>

            {showStreakPopover && (
              <>
                <div className="fixed inset-0 z-[1010]" onClick={() => setShowStreakPopover(false)} />
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 z-[1011] w-52 rounded-2xl bg-white border border-gray-100 shadow-xl p-4 flex flex-col gap-3">
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-white border-l border-t border-gray-100" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400">Meilleure série</span>
                    <div className="flex items-center gap-1">
                      <Flame className="h-4 w-4 text-gray-300" />
                      <span className="text-sm font-black text-gray-400 tabular-nums">0</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400">Freeze restants</span>
                    <div className="flex items-center gap-1">
                      <span className="text-base leading-none">🧊</span>
                      <span className="text-sm font-black text-gray-400 tabular-nums">0</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="w-px h-12 bg-gray-100" />

          {/* Cluster 3 — Bell + Avatar */}
          <div className="flex items-center gap-4 px-1">
            <div className="relative flex items-center">
              <button
                className="text-gray-300 hover:text-gray-500 transition-colors"
                onClick={() => setShowNotifPopover(v => !v)}
              >
                <Bell className="h-6 w-6" />
              </button>
              {showNotifPopover && (
                <>
                  <div className="fixed inset-0 z-[1010]" onClick={() => setShowNotifPopover(false)} />
                  <div className="absolute top-full right-0 mt-3 z-[1011] w-64 rounded-2xl bg-white border border-gray-100 shadow-xl p-4">
                    <div className="absolute -top-1.5 right-3 w-3 h-3 rotate-45 bg-white border-l border-t border-gray-100" />
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Notifications</p>
                    <p className="text-sm text-gray-400 text-center py-2">Aucune nouvelle notification</p>
                  </div>
                </>
              )}
            </div>
            <div className="relative flex flex-col items-center gap-1">
              <button
                onClick={() => setShowProfilePopover(v => !v)}
                className="relative focus:outline-none"
                style={{ width: 60, height: 60 }}
              >
                <svg width={60} height={60} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
                  <circle cx={30} cy={30} r={26} fill="none" stroke="#e5e7eb" strokeWidth={4} />
                  <circle
                    cx={30} cy={30} r={26}
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth={4}
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 26}
                    strokeDashoffset={2 * Math.PI * 26 * (1 - (userStats?.percent ?? 0) / 100)}
                    style={{ transition: "stroke-dashoffset 0.7s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors">
                    <User className="h-5 w-5" />
                  </div>
                </div>
              </button>
              <span className="text-[11px] font-bold text-gray-700 tabular-nums">Lv. {userStats?.level ?? "—"}</span>
              {showProfilePopover && (
                <>
                  <div className="fixed inset-0 z-[1010]" onClick={() => setShowProfilePopover(false)} />
                  <div className="absolute top-full right-0 mt-3 z-[1011] w-56 rounded-2xl bg-white border border-gray-100 shadow-xl overflow-hidden">
                    <div className="absolute -top-1.5 right-6 w-3 h-3 rotate-45 bg-white border-l border-t border-gray-100" />
                    <button
                      onClick={() => { setShowProfilePopover(false); router.push("/home/settings"); }}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User className="h-4 w-4 text-gray-400" />
                      Modifier le profil
                    </button>
                    <div className="mx-4 h-px bg-gray-100" />
                    <button
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                      <svg className="h-4 w-4 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      Passer au forfait supérieur
                    </button>
                    <div className="mx-4 h-px bg-gray-100" />
                    <button
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      Se déconnecter
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

          {/* HUD title */}
          <div
            className="pointer-events-none absolute top-5 z-[999] flex flex-col gap-2 transition-all duration-300"
            style={{ left: sidebarPanel ? 864 : sidebarExpanded ? 488 : 96 }}
          >

            {/* Back pill + edit mode toggle */}
            <div className="pointer-events-auto flex items-center gap-2">
              <button
                onClick={() => router.push("/home")}
                className="flex w-fit items-center gap-2 rounded-full border border-white/15 bg-black/35 px-4 py-2 text-white/55 backdrop-blur-sm transition-all hover:border-white/30 hover:bg-black/55 hover:text-white/80"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Retour</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => setEditMode(!editMode)}
                  className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.15em] backdrop-blur-sm transition-all ${
                    editMode
                      ? "border-orange-400/60 bg-orange-500/80 text-white hover:bg-orange-600/80"
                      : "border-white/15 bg-black/35 text-white/55 hover:border-orange-400/40 hover:bg-black/55 hover:text-orange-300"
                  }`}
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
                  {editMode ? "Mode placement actif" : "Placement"}
                </button>
              )}
            </div>

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
                <div className="h-px w-10 bg-indigo-400" />
                <span className="font-mono text-sm tabular-nums text-indigo-300/85">{tokyoTime}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400/50">JST</span>
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
                    onClick={() => { if (!tutoRestrictFilters) setLieuxType(null); }}
                    className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-semibold transition-all ${
                      lieuxType === null
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    }`}
                    style={tutoRestrictFilters ? { opacity: 0.3, pointerEvents: "none" } : undefined}
                  >
                    <span>Tous</span>
                    <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold text-gray-500">
                      {city.pois.length}
                    </span>
                  </button>

                  {(Object.keys(POI_META) as POIType[]).map(type => {
                    const count        = city.pois.filter(p => p.type === type).length;
                    if (count === 0) return null;
                    const meta         = POI_META[type];
                    const isActive     = lieuxType === type;
                    const isKonbini    = type === "konbini";
                    const isTutoLocked = tutoRestrictFilters && !isKonbini;
                    return (
                      <button
                        key={type}
                        id={isKonbini ? "tut-lieux-filter-konbini" : undefined}
                        onClick={() => { if (!isTutoLocked) setLieuxType(type); }}
                        className="flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-semibold transition-all"
                        style={{
                          background:    isActive ? `${meta.color}14` : undefined,
                          color:         isActive ? meta.color : "#6b7280",
                          opacity:       isTutoLocked ? 0.3 : 1,
                          pointerEvents: isTutoLocked ? "none" : undefined,
                        }}
                        onMouseEnter={e => { if (!isActive && !isTutoLocked) (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.04)"; }}
                        onMouseLeave={e => { if (!isActive && !isTutoLocked) (e.currentTarget as HTMLElement).style.background = ""; }}
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
                        id={poi.id === "konbini-shinjuku" ? "tut-poi-konbini-shinjuku" : undefined}
                        className="group flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-3 transition-all hover:border-gray-200 hover:bg-gray-50"
                      >
                        <button className="min-w-0 flex-1 text-left" onClick={() => {
                          flyToPoi(poi);
                          handlePoiClick(poi.id);
                          if (getTutoStep() === "lieux_select_poi") setSidebarPanel(null);
                        }}>
                          <div className="flex items-center gap-2.5">
                            {POI_LOGOS[poi.id]
                              ? <img src={POI_LOGOS[poi.id]} alt="" className="h-7 w-7 rounded object-contain" />
                              : <span className="text-lg leading-none">{POI_META[poi.type].icon}</span>
                            }
                            <div className="min-w-0">
                              <p className="text-sm font-semibold leading-tight text-gray-700 transition-colors group-hover:text-gray-900">
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
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-500">Parcours guidé</span>
                      <h3 className="mt-0.5 text-lg font-black text-gray-900">Thèmes</h3>
                    </div>
                    <button onClick={() => setSidebarPanel(null)} className="text-gray-400 transition-colors hover:text-gray-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {/* Level selector */}
                  <div className="flex gap-1.5">
                    {([null, 5, 4, 3] as const).map(lvl => {
                      const labels: Record<string, string> = { "null": "Tous", "5": "N5", "4": "N4", "3": "N3" };
                      const colors: Record<string, string> = { "null": "#6366f1", "5": "#16a34a", "4": "#2563eb", "3": "#dc2626" };
                      const key = String(lvl);
                      const active = themesLevel === lvl;
                      return (
                        <button
                          key={key}
                          onClick={() => setThemesLevel(lvl)}
                          className="flex-1 rounded-lg py-1.5 text-[11px] font-bold transition-all"
                          style={{
                            background: active ? colors[key] : "#f3f4f6",
                            color: active ? "white" : "#6b7280",
                          }}
                        >
                          {labels[key]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Themes */}
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
                  {themes.map((theme, ti) => {
                    const filteredPoiIds = theme.poiIds.filter(id =>
                      themesLevel === null || POI_JLPT_LEVEL[id] === themesLevel
                    );
                    if (filteredPoiIds.length === 0) return null;
                    return (
                    <div key={theme.id}>
                      {/* Theme header */}
                      <button
                        className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-opacity hover:opacity-80"
                        style={{ background: "linear-gradient(to right, #f5f3ff, #eef2ff)" }}
                        onClick={() => setCollapsedThemes(prev => {
                          const next = new Set(prev);
                          next.has(theme.id) ? next.delete(theme.id) : next.add(theme.id);
                          return next;
                        })}
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg" style={{ background: "#ede9fe" }}>
                          {theme.emoji}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-indigo-400">Thème {ti + 1}</p>
                          <p className="text-sm font-extrabold text-gray-900 leading-tight">{theme.title}</p>
                        </div>
                        <ChevronRight
                          className="h-4 w-4 shrink-0 text-indigo-300 transition-transform duration-200"
                          style={{ transform: collapsedThemes.has(theme.id) ? "rotate(0deg)" : "rotate(90deg)" }}
                        />
                      </button>

                      {/* POIs */}
                      {!collapsedThemes.has(theme.id) && filteredPoiIds.map((poiId, pi) => {
                        const poi = city.pois.find(p => p.id === poiId);
                        if (!poi) return null;
                        const meta = POI_META[poi.type];
                        const qd = poiQuestData[poiId];
                        const isDone = qd && qd.total > 0 && qd.done === qd.total;
                        const lvl = POI_JLPT_LEVEL[poiId];
                        const lvlColor: Record<number, string> = { 5: "#16a34a", 4: "#2563eb", 3: "#dc2626" };
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
                            className="flex w-full items-center gap-3 border-b border-gray-50 px-5 text-left transition-colors hover:bg-indigo-50/40"
                            style={{ height: 56, minHeight: 56, flexShrink: 0 }}
                          >
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors"
                              style={{ background: isDone ? "#22c55e" : "#f3f4f6", color: isDone ? "white" : "#9ca3af" }}>
                              {isDone ? "✓" : pi + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-gray-800">{poi.name}</p>
                              <p className="text-[11px] text-gray-400">{meta.label}</p>
                            </div>
                            {lvl && (
                              <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-black text-white"
                                style={{ background: lvlColor[lvl] }}>
                                N{lvl}
                              </span>
                            )}
                            <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                          </button>
                        );
                      })}
                    </div>
                    );
                  })}
                  {themes.every(t => t.poiIds.filter(id => themesLevel === null || POI_JLPT_LEVEL[id] === themesLevel).length === 0) && (
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
          {city.use3DMap && sidebarPanel === "evenements" && (() => {
            const allEvents = events ? [...events.seasonal, ...events.daily] : [];
            const hasEvents = allEvents.length > 0;

            const handleEventClick = (ev: ActiveEvent) => {
              // Ferme le panneau, ouvre le drawer du POI + fly
              setSidebarPanel(null);
              handlePoiClick(ev.poiId);
            };

            return (
              <div className="pointer-events-auto absolute z-[1000] flex w-[380px] flex-col overflow-hidden rounded-2xl bg-white"
                style={{ left: 484, top: 20, height: "calc(100vh - 40px)", boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1)" }}>

                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">En cours</span>
                    <h3 className="mt-0.5 text-sm font-bold text-gray-800">Évènements</h3>
                  </div>
                  <button onClick={() => setSidebarPanel(null)} className="text-gray-400 transition-colors hover:text-gray-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Body */}
                {eventsLoading ? (
                  <div className="flex flex-1 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
                  </div>
                ) : !hasEvents ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 text-2xl">🌸</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500">Aucun évènement en cours</p>
                      <p className="mt-1.5 text-[11px] leading-relaxed text-gray-400">
                        Les évènements saisonniers et quotidiens apparaîtront ici — hanami, matsuri, Halloween, aides ponctuelles…
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col gap-0 overflow-y-auto">

                    {/* Saisonniers */}
                    {events!.seasonal.length > 0 && (
                      <div className="px-4 pt-4">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Saisonniers</p>
                        <div className="flex flex-col gap-2">
                          {events!.seasonal.map(ev => (
                            <EventCard key={ev.id} ev={ev} tick={eventsTick} onClick={() => handleEventClick(ev)} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quotidiens */}
                    {events!.daily.length > 0 && (
                      <div className="px-4 pt-4 pb-4">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Aujourd'hui</p>
                        <div className="flex flex-col gap-2">
                          {events!.daily.map(ev => (
                            <EventCard key={ev.id} ev={ev} tick={eventsTick} onClick={() => handleEventClick(ev)} />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="h-4 shrink-0" />
                  </div>
                )}
              </div>
            );
          })()}

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
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
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
                                ? "border-indigo-400 bg-indigo-50 text-indigo-600"
                                : "border-gray-200 bg-white text-gray-500 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600"
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
                      <button onClick={() => handlePoiClick(poi.id)} className="mt-1 rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-indigo-700">
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={poiBackground ?? "/background_placeholder.png"}
                alt=""
                className="h-full w-full object-cover"
              />
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
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20">
                          <GraduationCap className="h-4.5 w-4.5 text-indigo-300" />
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
                        id="tut-lesson-btn"
                        onClick={() => {
                          if (!selectedPoi) return;
                          if (getTutoStep() === "drawer_lesson") storeTutoStep("lesson_active");
                          router.push(`/home/${citySlug}/${selectedPoi.id}/lesson`);
                        }}
                        className={`mt-3 w-full rounded-lg py-2.5 text-xs font-bold transition-all ${
                          lessonData.validated
                            ? "border border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60"
                            : "border border-indigo-500/50 bg-indigo-600/80 text-white hover:bg-indigo-500"
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
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                  </div>
                ) : poiQuests.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {poiQuests.map((quest, questIdx) => {
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
                          {quest.xpReward > 0 && (
                            <div className="mt-2 flex items-center gap-1.5">
                              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${isDone || isReplay ? "border-white/10 text-white/25" : "border-indigo-500/40 bg-indigo-500/10 text-indigo-300"}`}>
                                +{quest.xpReward} XP
                              </span>
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
                            id={questIdx === 0 ? "tut-quest-btn" : undefined}
                            onClick={() => {
                              if (selectedPoi) setQuestPreview({ quest, poi: selectedPoi });
                            }}
                            className={`mt-3 w-full rounded-lg py-2.5 text-xs font-bold transition-all ${
                              isDone || isReplay ? "border border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60"
                              : isResume ? "border border-yellow-400/30 bg-yellow-400/15 text-yellow-400 hover:bg-yellow-400/25"
                              : "border border-indigo-500/50 bg-indigo-600/80 text-white hover:bg-indigo-500"
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

              {/* ── SNS section ── */}
              {selectedPoi && snsConversation && (() => {
                const conv = snsConversation;
                return (
                  <div className="mt-2 px-4 pb-4">
                    <span className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Discussion SNS</span>
                      <span className="text-[9px] font-bold uppercase tracking-wide bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.5 rounded-full">Beta</span>
                    </span>
                    <button
                      onClick={() => setShowSns(true)}
                      className="mt-3 w-full rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-3.5 text-left hover:bg-emerald-900/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xl shrink-0">
                          {conv.contact.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{conv.contact.name}</p>
                          <p className="text-[11px] text-emerald-400 truncate">{conv.context}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                            +{conv.xpReward} XP
                          </span>
                          <MessageCircle className="h-4 w-4 text-emerald-500/50" />
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })()}

            </div>
          </div>

        </main>

      {showRevision && <RevisionOverlay onClose={() => setShowRevision(false)} />}
      {showSns && snsConversation && (
        <SnsOverlay conversation={snsConversation} onClose={() => setShowSns(false)} />
      )}

      {/* ── Admin edit mode banner + toast ── */}
      {editMode && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 -translate-x-1/2 z-[1500] flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-orange-400/40 bg-orange-500/90 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur-sm">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
            Mode placement — glissez les POIs pour les repositionner
          </div>
        </div>
      )}
      {moveToast && (
        <div className="pointer-events-none fixed bottom-20 left-1/2 -translate-x-1/2 z-[1500] rounded-full bg-gray-900/90 px-5 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-sm">
          {moveToast}
        </div>
      )}

      <TutorialLayer
        citySlug={citySlug}
        selectedPoiId={selectedPoi?.id}
        sidebarPanel={sidebarPanel}
        lieuxType={lieuxType}
        initOnMount={searchParams.get("tuto") === "start"}
        onAdvance={(step) => setTutoRestrictFilters(step === "lieux_filter_konbini" || step === "lieux_select_poi")}
      />

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
                      <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">
                        +{quest.xpReward} XP
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
                      <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-2.5 text-center">
                        <p className="text-xs text-indigo-600 font-medium">
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
                      if (getTutoStep() === "drawer_quest") storeTutoStep("quest_active");
                      setQuestPreview(null);
                      closeModal();
                      router.push(`/home/${citySlug}/${poi.id}?quest=${quest.id}`);
                    }}
                    className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-500 transition-colors"
                  >
                    Commencer →
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Footer links — drawer-aware positioning */}
      <div
        className="pointer-events-auto fixed bottom-4 z-10 flex items-center gap-4 transition-all duration-300"
        style={{ right: selectedPoi ? 440 : 20 }}
      >
        {(["À propos", "Blog", "Efficacité", "Termes", "Confidentialité"] as const).map(label => (
          <a
            key={label}
            href="#"
            style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.03em", color: "rgba(255,255,255,0.45)", textDecoration: "none", transition: "color 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.85)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
          >
            {label}
          </a>
        ))}
        <a
          href="https://github.com/JoaquimFontinha/SekaiTalk/issues/new"
          target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.03em", color: "rgba(255,255,255,0.45)", textDecoration: "none", transition: "color 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.85)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
        >
          Signaler un bug
        </a>
      </div>
    </div>
  );
}


