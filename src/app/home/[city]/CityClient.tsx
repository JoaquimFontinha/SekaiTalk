"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Bell, User, Flame, ArrowLeft, X, Loader2, CheckCircle, CheckCircle2, Circle, Settings, ChevronLeft, ChevronRight, Compass, MessageCircle } from "lucide-react";
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

const GOAL_ICONS: Record<string, React.ReactNode> = {
  quest:  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>,
  lesson: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg>,
  chat:   <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>,
  sns:    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/></svg>,
  vocab:  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>,
  zap:    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>,
};
const GOAL_COLORS: Record<string, string> = {
  quest:  "text-orange-400",
  lesson: "text-violet-500",
  chat:   "text-emerald-500",
  sns:    "text-sky-500",
  vocab:  "text-indigo-500",
  zap:    "text-amber-400",
};

const SIDEBAR_BUTTONS: { panel: Exclude<SidebarPanel, null>; label: string; enabled: boolean; svg: React.ReactNode }[] = [
  { panel: "guidage",    label: "Thèmes",     enabled: true,
    svg: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.1 14.9L7 7l7.19 3.1 3.1 7.19-7.29-3.39zm1.1-4.4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg> },
  { panel: "lieux",      label: "Lieux",      enabled: true,
    svg: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg> },
  { panel: "contacts",   label: "Contacts",   enabled: false,
    svg: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg> },
  { panel: "evenements", label: "Évènements", enabled: true,
    svg: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg> },
  { panel: "revision",   label: "Étudier",    enabled: true,
    svg: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg> },
];



function getFriendshipLevel(count: number): { label: string; color: string } {
  if (count === 0) return { label: "Étranger",      color: "#6b7280" };
  if (count <= 2)  return { label: "Connaissance",  color: "#0ea5e9" };
  if (count <= 5)  return { label: "Ami",           color: "#22c55e" };
  return                   { label: "Proche",        color: "#a855f7" };
}

const THEME_ICONS: Record<string, React.ReactNode> = {
  "theme-transport": <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>,
  "theme-hotel":     <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/></svg>,
  "theme-quotidien": <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>,
  "theme-food":      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M18.06 22.99h1.66c.84 0 1.53-.64 1.63-1.46L23 5.05h-5V1h-1.97v4.05h-4.97l.3 2.34c1.71.47 3.31 1.32 4.27 2.26 1.44 1.42 2.43 2.89 2.43 5.29v8.05zM1 21.99V21h15.03v.99c0 .55-.45 1-1.01 1H2.01c-.56 0-1.01-.45-1.01-1zm15.03-7c0-3.5-15.03-3.5-15.03 0h15.03zM1.02 17h15v2h-15z"/></svg>,
  "theme-shopping":  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm0 10c-1.66 0-3-1.34-3-3h2c0 .55.45 1 1 1s1-.45 1-1h2c0 1.66-1.34 3-3 3z"/></svg>,
  "theme-culture":   <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M12 3L2 12h3v8h6v-5h2v5h6v-8h3L12 3zm0 12.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>,
};

const POI_META: Record<POIType, { label: string; color: string; icon: React.ReactNode }> = {
  transport:  { label: "Transport",  color: "#0ea5e9", icon: <svg viewBox="0 0 24 24" fill="currentColor" style={{width:16,height:16}}><path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/></svg> },
  konbini:    { label: "Konbini",    color: "#22c55e", icon: <svg viewBox="0 0 24 24" fill="currentColor" style={{width:16,height:16}}><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg> },
  izakaya:    { label: "Izakaya",    color: "#f97316", icon: <svg viewBox="0 0 24 24" fill="currentColor" style={{width:16,height:16}}><path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z"/></svg> },
  site:       { label: "Site",       color: "#8b5cf6", icon: <svg viewBox="0 0 24 24" fill="currentColor" style={{width:16,height:16}}><path d="M12 3L2 12h3v8h6v-5h2v5h6v-8h3L12 3zm0 12.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg> },
  market:     { label: "Marché",     color: "#eab308", icon: <svg viewBox="0 0 24 24" fill="currentColor" style={{width:16,height:16}}><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96C5 16.1 6.9 18 9 18h12v-2H9.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63H19c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 23.43 5H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg> },
  loisir:     { label: "Loisir",     color: "#14b8a6", icon: <svg viewBox="0 0 24 24" fill="currentColor" style={{width:16,height:16}}><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm4.24 16L12 15.45 7.77 18l1.12-4.81-3.73-3.23 4.92-.42L12 5l1.92 4.53 4.92.42-3.73 3.23L16.23 18z"/></svg> },
  shop:       { label: "Shop",       color: "#ec4899", icon: <svg viewBox="0 0 24 24" fill="currentColor" style={{width:16,height:16}}><path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm0 10c-1.66 0-3-1.34-3-3h2c0 .55.45 1 1 1s1-.45 1-1h2c0 1.66-1.34 3-3 3z"/></svg> },
  restaurant: { label: "Restaurant", color: "#f43f5e", icon: <svg viewBox="0 0 24 24" fill="currentColor" style={{width:16,height:16}}><path d="M18.06 22.99h1.66c.84 0 1.53-.64 1.63-1.46L23 5.05h-5V1h-1.97v4.05h-4.97l.3 2.34c1.71.47 3.31 1.32 4.27 2.26 1.44 1.42 2.43 2.89 2.43 5.29v8.05zM1 21.99V21h15.03v.99c0 .55-.45 1-1.01 1H2.01c-.56 0-1.01-.45-1.01-1zm15.03-7c0-3.5-15.03-3.5-15.03 0h15.03zM1.02 17h15v2h-15z"/></svg> },
  cafe:       { label: "Café",       color: "#92400e", icon: <svg viewBox="0 0 24 24" fill="currentColor" style={{width:16,height:16}}><path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z"/></svg> },
  hotel:      { label: "Hôtel",      color: "#0891b2", icon: <svg viewBox="0 0 24 24" fill="currentColor" style={{width:16,height:16}}><path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/></svg> },
  pharmacie:  { label: "Pharmacie",  color: "#059669", icon: <svg viewBox="0 0 24 24" fill="currentColor" style={{width:16,height:16}}><path d="M10.5 15.5h3v-2.5H16v-3h-2.5V7.5h-3V10H8v3h2.5zM19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 16H6c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h12c.55 0 1 .45 1 1v12c0 .55-.45 1-1 1z"/></svg> },
  medecin:    { label: "Médecin",    color: "#ef4444", icon: <svg viewBox="0 0 24 24" fill="currentColor" style={{width:16,height:16}}><path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/></svg> },
  poste:      { label: "Poste",      color: "#d97706", icon: <svg viewBox="0 0 24 24" fill="currentColor" style={{width:16,height:16}}><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg> },
  school:     { label: "École",      color: "#7c3aed", icon: <svg viewBox="0 0 24 24" fill="currentColor" style={{width:16,height:16}}><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg> },
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
  const { activeType, poiClickRef, mapBgClickRef, mapRef, editMode, setEditMode, poiMoveRef, pinPoiRef, setActiveEvents, mapReady } = useMapCtx();
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.isAdmin === true;

  // Modal state
  const [selectedPoi, setSelectedPoi]     = useState<POI | null>(null);
  const [poiBackground, setPoiBackground] = useState<string | null>(null);
  const [poiQuests, setPoiQuests]         = useState<PoiQuest[]>([]);
  const [questsLoading, setQuestsLoading] = useState(false);
  const [questPreview, setQuestPreview]   = useState<{ quest: PoiQuest; poi: POI } | null>(null);
  const [lessonData, setLessonData]       = useState<{ id: string; title: string; validated: boolean; score: number } | null | "none">(null);
  const poiDataCacheRef = useRef<Record<string, { backgroundImage: string | null; snsConversation: SnsConversation | null; quests: PoiQuest[]; lesson: { id: string; title: string; validated: boolean; score: number } | null }>>({});

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

  const applyPoiData = useCallback((data: { backgroundImage: string | null; snsConversation: SnsConversation | null; quests: PoiQuest[]; lesson: { id: string; title: string; validated: boolean; score: number } | null }) => {
    setPoiBackground(data.backgroundImage);
    setSnsConversation(data.snsConversation);
    setPoiQuests(data.quests ?? []);
    setQuestsLoading(false);
    setLessonData(data.lesson === null ? "none" : data.lesson);
  }, []);

  const handlePoiClick = useCallback((poiId: string) => {
    const poi = city.pois.find(p => p.id === poiId);
    if (!poi) return;
    if (poi.type === "school") {
      router.push(`/home/${citySlug}/school`);
      return;
    }
    flyToPoi(poi);

    const cached = poiDataCacheRef.current[poiId];
    if (cached) {
      setSelectedPoi(poi);
      applyPoiData(cached);
    } else {
      setSelectedPoi(poi);
      setPoiBackground(null);
      setPoiQuests([]);
      setQuestsLoading(true);
      setLessonData(null);
      setSnsConversation(null);
    }

    fetch(`/api/poi-data/${poiId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) { setQuestsLoading(false); return; }
        poiDataCacheRef.current[poiId] = data;
        // only update state if this POI is still selected
        setSelectedPoi(cur => {
          if (cur?.id === poiId) applyPoiData(data);
          return cur;
        });
      })
      .catch(() => setQuestsLoading(false));
  }, [city, flyToPoi, applyPoiData]);


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


  // City loading screen — show on mount, hide once GameMap3D signals idle
  useEffect(() => {
    if (!cities[citySlug]?.use3DMap) return;
    setMapLoading(true);
    setMapFading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citySlug]);

  useEffect(() => {
    if (!mapLoading || !mapReady) return;
    setMapFading(true);
    const id = setTimeout(() => setMapLoading(false), 400);
    return () => clearTimeout(id);
  }, [mapReady, mapLoading]);

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
        className="pointer-events-auto fixed inset-x-0 bottom-0 z-[1020] flex flex-col rounded-t-3xl bg-white overflow-hidden"
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
          <div className="w-10 h-1 rounded-full bg-gray-200" />
          <button onClick={closeModal}
            className="absolute right-4 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-gray-500 hover:bg-gray-200">
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
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
                  <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-gray-400">À savoir</p>
                  <p className="text-[13px] leading-relaxed text-gray-600">{selectedPoi.description}</p>
                </div>
              )}

              {lessonData !== "none" && (
                <div>
                  <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-gray-400">Leçon</p>
                  {lessonData === null ? (
                    <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin text-gray-300" /></div>
                  ) : (
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                          <svg viewBox="0 0 24 24" className="h-4 w-4"><defs><linearGradient id="lg-lesson-m" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#3b82f6"/><stop offset="100%" stopColor="#4f46e5"/></linearGradient></defs><path fill="url(#lg-lesson-m)" d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-bold text-gray-900 truncate">{lessonData.title}</p>
                          {lessonData.validated ? null : lessonData.score > 0 ? (
                            <p className="mt-0.5 text-[10px] text-amber-500">Score : {lessonData.score}% (min. 80%)</p>
                          ) : (
                            <span />
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => { if (!selectedPoi) return; if (getTutoStep() === "drawer_lesson") storeTutoStep("lesson_active"); router.push(`/home/${citySlug}/${selectedPoi.id}/lesson`); }}
                        className={`mt-3 w-full rounded-lg py-2.5 text-xs font-bold transition-all ${
                          lessonData.validated
                            ? "border border-gray-200 bg-white text-gray-400 hover:bg-gray-50"
                            : "border-0 text-white"
                        }`}
                        style={!lessonData.validated ? { background: "linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)" } : undefined}
                      >
                        {lessonData.validated ? "Refaire la leçon" : lessonData.score > 0 ? "Réessayer" : "Commencer la leçon"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div>
                <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-gray-400">Quêtes</p>
                {questsLoading ? (
                  <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
                ) : poiQuests.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {poiQuests.map((quest, questIdx) => {
                      const progress = quest.userProgress?.[0];
                      const isDone = progress?.status === "COMPLETED";
                      const isReplay = progress?.status === "IN_PROGRESS" && !!progress.firstCompletedAt;
                      const isResume = progress?.status === "IN_PROGRESS" && !progress.firstCompletedAt;
                      const doneTasks = isResume ? progress.taskProgress.filter(tp => tp.status === "COMPLETED").length : isDone ? quest.tasks.length : 0;
                      return (
                        <div key={quest.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900">{quest.title}</p>
                              {quest.description && <p className="mt-0.5 text-[11px] text-gray-500">{quest.description}</p>}
                            </div>
                            {isDone && (
                              <span className="flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                                <CheckCircle className="h-3 w-3" />
                              </span>
                            )}
                          </div>
                          {quest.xpReward > 0 && (
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${isDone || isReplay ? "border-gray-200 text-gray-400" : "border-gray-200 bg-gray-50 text-gray-700"}`}>
                                +{quest.xpReward} XP
                              </span>
                              {(isDone || isReplay) && <span className="text-[10px] italic text-gray-400">déjà obtenu</span>}
                            </div>
                          )}
                          <button
                            id={questIdx === 0 ? "tut-quest-btn" : undefined}
                            onClick={() => { if (selectedPoi) setQuestPreview({ quest, poi: selectedPoi }); }}
                            className={`mt-3 w-full rounded-lg py-2.5 text-xs font-bold transition-all ${
                              isDone || isReplay ? "border border-gray-200 bg-white text-gray-400 hover:bg-gray-50"
                              : isResume ? "border border-yellow-400/50 bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                              : "border-0 text-white"
                            }`}
                            style={!(isDone || isReplay) && !isResume ? { background: "linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)" } : undefined}
                          >
                            {isDone || isReplay ? "Refaire" : isResume ? `▶ Continuer (tâche ${doneTasks + 1}/${quest.tasks.length})` : "Faire la quête"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-3 text-center text-[11px] text-gray-400">Aucune quête disponible ici pour l&apos;instant.</p>
                )}
              </div>

              {snsConversation && (() => {
                const conv = snsConversation;
                return (
                  <div>
                    <span className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Discussion SNS</span>
                      <span className="text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full">Beta</span>
                    </span>
                    <button onClick={() => setShowSns(true)}
                      className="mt-2 w-full rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-left hover:bg-emerald-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-xl shrink-0">{conv.contact.avatar}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{conv.contact.name}</p>
                          <p className="text-[11px] text-emerald-600 truncate">{conv.context}</p>
                        </div>
                        <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-600 px-2 py-0.5 rounded-full font-bold shrink-0">+{conv.xpReward} XP</span>
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
                <div className="flex flex-col gap-2">
                  {dailyGoals.map((g) => (
                    <div key={g.type} className={`flex items-center gap-3 rounded-xl px-3 py-3 ${g.done ? "bg-indigo-50" : "bg-gray-50"}`}>
                      {g.done ? <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-500" /> : <Circle className="h-4 w-4 shrink-0 text-gray-300" />}
                      <div className={`h-4 w-4 shrink-0 ${g.done ? "text-indigo-400" : GOAL_COLORS[g.icon]}`}>{GOAL_ICONS[g.icon]}</div>
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
                        style={{ background: "linear-gradient(to right, #f8fafc, #f1f5f9)" }}
                        onClick={() => setCollapsedThemes(prev => { const next = new Set(prev); next.has(theme.id) ? next.delete(theme.id) : next.add(theme.id); return next; })}
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-500" style={{ background: "#f1f5f9" }}>{THEME_ICONS[theme.id] ?? theme.emoji}</div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">Thème {ti + 1}</p>
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
                            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden"
                              style={{ background: "#f3f4f6" }}>
                              {POI_LOGOS[poi.id]
                                ? <img src={POI_LOGOS[poi.id]} alt={poi.name} className="h-6 w-6 object-contain" />
                                : <span className="text-sm">{meta.icon}</span>}
                              {isDone && <div className="absolute inset-0 flex items-center justify-center rounded-full bg-green-500/90 text-[10px] font-black text-white">✓</div>}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-gray-800">{poi.name}</p>
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
          <button onClick={() => router.push(`/home/${citySlug}/school`)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-3 text-gray-400">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg>
            <span className="text-[9px] font-bold uppercase tracking-wider">Étudier</span>
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
                    {quest.xpReward > 0 && <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-700">+{quest.xpReward} XP</span>}
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
                    className="flex-1 rounded-xl bg-gray-800 py-3 text-sm font-bold text-white hover:bg-gray-900">Commencer →</button>
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
              <div className="flex flex-col gap-2.5">
                {dailyGoals.map((g) => (
                  <div key={g.type} className={`flex items-center gap-3.5 rounded-xl px-4 py-3.5 transition-colors ${g.done ? "bg-indigo-50" : "bg-gray-50"}`}>
                    {g.done ? <CheckCircle2 className="h-5 w-5 shrink-0 text-indigo-500" /> : <Circle className="h-5 w-5 shrink-0 text-gray-300" />}
                    <div className={`h-5 w-5 shrink-0 ${g.done ? "text-indigo-400" : GOAL_COLORS[g.icon]}`}>{GOAL_ICONS[g.icon]}</div>
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
            <div className="px-5 pt-4 pb-4 shrink-0">
              <span className="px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Navigation</span>
              <div className="mt-2 flex flex-col gap-0.5">
                {SIDEBAR_BUTTONS.map(({ panel, svg, label, enabled }) => (
                  <button
                    key={panel}
                    id={`tut-sidebar-${panel}`}
                    onClick={() => {
                      if (!enabled) return;
                      if (panel === "revision") { router.push(`/home/${citySlug}/school`); return; }
                      setSidebarPanel(prev => prev === panel ? null : panel);
                    }}
                    className={`group flex items-center gap-3.5 rounded-xl px-3 py-3 text-left transition-colors ${
                      !enabled ? "cursor-default opacity-35"
                      : sidebarPanel === panel ? "bg-gray-50"
                      : "hover:bg-gray-50"
                    }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                      sidebarPanel === panel ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"
                    }`}>
                      {svg}
                    </div>
                    <span className={`text-[15px] font-medium transition-colors ${
                      sidebarPanel === panel ? "text-gray-900" : "text-gray-600 group-hover:text-gray-800"
                    }`}>{label}</span>
                    {!enabled
                      ? <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-400">Bientôt</span>
                      : <ChevronRight className={`ml-auto h-4 w-4 transition-opacity ${sidebarPanel === panel ? "text-indigo-400 opacity-100" : "text-gray-300 opacity-0 group-hover:opacity-100"}`} />
                    }
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1" />

            <div className="mx-7 h-px bg-gray-100 shrink-0" />

            {/* Paramètres */}
            <div className="px-5 pt-4 pb-5 shrink-0">
              <button
                onClick={() => router.push("/home/settings")}
                className="group flex w-full items-center gap-4 rounded-xl px-4 py-4 hover:bg-gray-50 transition-colors"
              >
                <svg className="h-5 w-5 shrink-0 text-gray-400 group-hover:text-gray-600 transition-colors" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
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
            {SIDEBAR_BUTTONS.map(({ panel, svg, label, enabled }) => (
              <button
                key={panel}
                title={label}
                onClick={() => {
                  if (!enabled) return;
                  if (panel === "revision") { router.push(`/home/${citySlug}/school`); return; }
                  setSidebarExpanded(true);
                  setSidebarPanel(panel);
                }}
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                  !enabled ? "opacity-30 cursor-default"
                  : sidebarPanel === panel ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                }`}
              >
                {svg}
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
                        style={{ background: "linear-gradient(to right, #f8fafc, #f1f5f9)" }}
                        onClick={() => setCollapsedThemes(prev => {
                          const next = new Set(prev);
                          next.has(theme.id) ? next.delete(theme.id) : next.add(theme.id);
                          return next;
                        })}
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500" style={{ background: "#f1f5f9" }}>
                          {THEME_ICONS[theme.id] ?? theme.emoji}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">Thème {ti + 1}</p>
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
                            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden"
                              style={{ background: "#f3f4f6" }}>
                              {POI_LOGOS[poi.id]
                                ? <img src={POI_LOGOS[poi.id]} alt={poi.name} className="h-6 w-6 object-contain" />
                                : <span className="text-sm">{meta.icon}</span>}
                              {isDone && <div className="absolute inset-0 flex items-center justify-center rounded-full bg-green-500/90 text-[10px] font-black text-white">✓</div>}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-gray-800">{poi.name}</p>
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
                style={(() => {
                  const leftPx = sidebarPanel ? 864 : sidebarExpanded ? 468 : 80;
                  const rightPx = selectedPoi ? 420 : 0;
                  return { left: `calc(50% + ${(leftPx - rightPx) / 2}px)`, transform: "translateX(-50%)" };
                })()}
              >
                <button
                  onClick={() => { pinPoiRef.current?.(prev.id); handlePoiClick(prev.id); }}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/50 backdrop-blur-md hover:bg-black/65 hover:text-white transition-all"
                  title={prev.name}
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => { pinPoiRef.current?.(next.id); handlePoiClick(next.id); }}
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
            className="absolute right-0 top-0 z-[1000] flex h-full w-[420px] flex-col border-l border-gray-200 bg-white transition-transform duration-300 ease-in-out"
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <button
                onClick={closeModal}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/70 backdrop-blur-sm transition-all hover:bg-black/60 hover:text-white"
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
                  <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-gray-400">À savoir</p>
                  <p className="text-[13px] leading-relaxed text-gray-600">{selectedPoi.description}</p>
                </div>
              )}

              {/* Lesson */}
              {lessonData !== "none" && (
                <div>
                  <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.18em] text-gray-400">Leçon</p>
                  {lessonData === null ? (
                    <div className="flex justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-300" />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5"><defs><linearGradient id="lg-lesson-d" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#3b82f6"/><stop offset="100%" stopColor="#4f46e5"/></linearGradient></defs><path fill="url(#lg-lesson-d)" d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-bold text-gray-900 truncate">{lessonData.title}</p>
                          {lessonData.validated ? null : lessonData.score > 0 ? (
                            <p className="mt-0.5 text-[10px] text-amber-500">
                              Score précédent : {lessonData.score} % (min. 80 %)
                            </p>
                          ) : (
                            <span />
                          )}
                        </div>
                        {lessonData.validated && (
                          <span className="flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                            <CheckCircle className="h-3 w-3" />
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
                            ? "border border-gray-200 bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                            : "border-0 text-white"
                        }`}
                        style={!lessonData.validated ? { background: "linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)" } : undefined}
                      >
                        {lessonData.validated ? "Refaire la leçon" : lessonData.score > 0 ? "Réessayer" : "Commencer la leçon"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Quests */}
              <div>
                <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.18em] text-gray-400">Quêtes</p>
                {questsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
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
                        <div key={quest.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900">{quest.title}</p>
                              {quest.description && (
                                <p className="mt-0.5 text-[11px] leading-snug text-gray-500">{quest.description}</p>
                              )}
                            </div>
                            {isDone && (
                              <span className="flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                                <CheckCircle className="h-3 w-3" />
                              </span>
                            )}
                          </div>
                          {quest.xpReward > 0 && (
                            <div className="mt-2 flex items-center gap-1.5">
                              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${isDone || isReplay ? "border-gray-200 text-gray-400" : "border-gray-200 bg-gray-50 text-gray-700"}`}>
                                +{quest.xpReward} XP
                              </span>
                              {(isDone || isReplay) && <span className="text-[10px] italic text-gray-400">déjà obtenu</span>}
                            </div>
                          )}
                          <button
                            id={questIdx === 0 ? "tut-quest-btn" : undefined}
                            onClick={() => {
                              if (selectedPoi) setQuestPreview({ quest, poi: selectedPoi });
                            }}
                            className={`mt-3 w-full rounded-lg py-2.5 text-xs font-bold transition-all ${
                              isDone || isReplay ? "border border-gray-200 bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                              : isResume ? "border border-yellow-400/50 bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                              : "border-0 text-white"
                            }`}
                            style={!(isDone || isReplay) && !isResume ? { background: "linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)" } : undefined}
                          >
                            {isDone || isReplay ? "Refaire" : isResume ? `▶ Continuer (tâche ${doneTasks + 1}/${quest.tasks.length})` : "Faire la quête"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-3 text-center text-[11px] text-gray-400">Aucune quête disponible ici pour l&apos;instant.</p>
                )}
              </div>

              {/* ── SNS section ── */}
              {selectedPoi && snsConversation && (() => {
                const conv = snsConversation;
                return (
                  <div className="mt-2 px-4 pb-4">
                    <span className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Discussion SNS</span>
                      <span className="text-[9px] font-bold uppercase tracking-wide bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full">Beta</span>
                    </span>
                    <button
                      onClick={() => setShowSns(true)}
                      className="mt-3 w-full rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-left hover:bg-emerald-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-xl shrink-0">
                          {conv.contact.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{conv.contact.name}</p>
                          <p className="text-[11px] text-emerald-600 truncate">{conv.context}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-600 px-2 py-0.5 rounded-full font-bold">
                            +{conv.xpReward} XP
                          </span>
                          <MessageCircle className="h-4 w-4 text-emerald-400" />
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
                      <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-700">
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
                      <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-2.5 text-center">
                        <p className="text-xs text-gray-500 font-medium">
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
                    className="flex-1 rounded-xl bg-gray-800 py-3 text-sm font-bold text-white hover:bg-gray-900 transition-colors"
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


