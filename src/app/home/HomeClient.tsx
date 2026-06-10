"use client";

import { useEffect, useRef, useState } from "react";
import React from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Bell, User, Flame, Settings, CheckCircle2, Circle, ChevronRight, Lock } from "lucide-react";
import RevisionOverlay from "@/components/RevisionOverlay";
import MonObjectif from "@/components/MonObjectif";
import PricingModal from "@/components/PricingModal";
import TutorialLayer from "@/components/TutorialLayer";
import { getTutoStep, setTutoStep as storeTutoStep } from "@/lib/tutorial";
import { useMapCtx } from "./MapContext";
import staticCities from "@/lib/cities";
import { useDailyGoals } from "@/hooks/useDailyGoals";

const CITY_LOGOS: Record<string, string> = {
  tokyo: "/images/cities/tokyo_home.svg",
};

type UserStats = {
  xp: number; level: number;
  xpInLevel: number; xpNeeded: number | null; percent: number;
};
type MobileTab = "objectif" | "lieux" | "revision";
type SheetState = "collapsed" | "half" | "full";

const SHEET_HEIGHTS: Record<SheetState, string | number> = {
  collapsed: 82,
  half: "42vh",
  full: "75vh",
};

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

const NAV_ITEMS: { label: string; enabled: boolean; svg: React.ReactNode }[] = [
  {
    label: "Lieux", enabled: true,
    svg: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>,
  },
  {
    label: "Contacts", enabled: false,
    svg: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>,
  },
  {
    label: "Évènements", enabled: true,
    svg: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>,
  },
  {
    label: "Révision", enabled: true,
    svg: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>,
  },
];

// ── Onglet Objectif ──────────────────────────────────────────────────
function TabObjectif({ dailyGoals, goalsDone }: { dailyGoals: ReturnType<typeof useDailyGoals>["goals"]; goalsDone: number }) {
  return (
    <div className="flex flex-col">
      <div id="tut-home-objectif">
        <MonObjectif />
      </div>
      <div className="mx-5 h-px" style={{ background: "#e5e7eb" }} />
      <div id="tut-home-daily" className="px-5 pt-4 pb-5">
        <div className="flex flex-col gap-2">
          {dailyGoals.map((g) => (
            <div key={g.type} className={`flex items-center gap-3 rounded-xl px-4 py-3 ${g.done ? "bg-indigo-50" : "bg-gray-50"}`}>
              {g.done
                ? <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-500" />
                : <Circle className="h-4 w-4 shrink-0 text-gray-300" />
              }
              <span className="text-lg shrink-0 leading-none">{g.icon}</span>
              <span className={`flex-1 text-sm font-medium ${g.done ? "line-through text-gray-400" : "text-gray-600"}`}>
                {g.label}
              </span>
              {g.target > 1 && !g.done && (
                <span className="text-[11px] font-bold text-gray-400 shrink-0">{g.progress}/{g.target}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Onglet Lieux ─────────────────────────────────────────────────────
function TabLieux({
  dbCities, userStats, onCityClick,
}: {
  dbCities: typeof staticCities;
  userStats: UserStats | null;
  onCityClick: (lng: number, lat: number) => void;
}) {
  return (
    <div className="flex flex-col px-3 py-3 gap-1">
      {Object.entries(dbCities).map(([slug, city]) => {
        const isLocked = city.levelRequired > (userStats?.level ?? 0);
        return (
          <button
            key={slug}
            disabled={isLocked}
            onClick={() => onCityClick(city.center[1], city.center[0])}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left w-full transition-colors
              ${isLocked ? "opacity-40 cursor-default" : "hover:bg-gray-50 active:bg-gray-100 cursor-pointer"}`}
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl overflow-hidden text-lg"
              style={{ background: isLocked ? "#f3f4f6" : "#6366f122" }}
            >
              {isLocked
                ? <Lock className="h-4 w-4 text-gray-400" />
                : CITY_LOGOS[slug]
                  ? <img src={CITY_LOGOS[slug]} alt={city.name} className="h-8 w-8 object-contain" />
                  : <span>🗾</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[15px] font-semibold truncate ${isLocked ? "text-gray-400" : "text-gray-800"}`}>
                {city.name}
              </p>
              {isLocked && (
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {city.levelRequired >= 99 ? "Bientôt disponible" : `Nv. ${city.levelRequired} requis`}
                </p>
              )}
            </div>
            {!isLocked && <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}

export default function HomeClient() {
  const router = useRouter();
  const { japanFlyToRef } = useMapCtx();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [showRevision, setShowRevision] = useState(false);
  const { goals: dailyGoals, doneCount: goalsDone } = useDailyGoals();
  const [showPricing, setShowPricing] = useState(false);
  const [showStreakPopover, setShowStreakPopover] = useState(false);
  const [showNotifPopover, setShowNotifPopover] = useState(false);
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const [showLieux, setShowLieux] = useState(false);
  const [dbCities, setDbCities] = useState(staticCities);

  // Mobile sheet state
  const [sheetState, setSheetState] = useState<SheetState>("collapsed");
  const [mobileTab, setMobileTab] = useState<MobileTab>("objectif");
  const touchStartY = useRef<number>(0);

  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    fetch("/api/content/cities")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setDbCities(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/user/stats")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setUserStats(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (getTutoStep() === "pricing") setShowPricing(true);
  }, []);

  const streak = 0;

  const handleTabClick = (tab: MobileTab) => {
    if (tab === "revision") { setShowRevision(true); return; }
    if (tab === mobileTab && sheetState !== "collapsed") {
      setSheetState("collapsed");
      return;
    }
    setMobileTab(tab);
    setSheetState(sheetState === "collapsed" ? "half" : sheetState);
  };

  const handleDragEnd = (dy: number) => {
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

  // ── MOBILE LAYOUT ────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="h-screen overflow-hidden">

        {/* HUD top-right */}
        <div className="pointer-events-auto fixed z-[1003]" style={{ top: 16, right: 14 }}>
          <div className="flex items-center gap-2 rounded-2xl bg-white/95 px-3 py-2 shadow-md" style={{ backdropFilter: "blur(8px)" }}>
            <Flame className={`h-4 w-4 ${streak > 0 ? "text-orange-400" : "text-gray-300"}`} />
            <span className={`text-sm font-black tabular-nums ${streak > 0 ? "text-orange-500" : "text-gray-300"}`}>{streak}</span>
            <div className="w-px h-4 bg-gray-200" />
            <span className="text-xs font-bold text-indigo-500 tabular-nums">Lv.{userStats?.level ?? "—"}</span>
            <div className="w-px h-4 bg-gray-200" />
            <div className="relative">
              <button
                onClick={() => setShowProfilePopover(v => !v)}
                className="relative focus:outline-none"
                style={{ width: 32, height: 32 }}
              >
                <svg width={32} height={32} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
                  <circle cx={16} cy={16} r={13} fill="none" stroke="#e5e7eb" strokeWidth={2.5} />
                  <circle cx={16} cy={16} r={13} fill="none" stroke="#6366f1" strokeWidth={2.5} strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 13}
                    strokeDashoffset={2 * Math.PI * 13 * (1 - (userStats?.percent ?? 0) / 100)}
                    style={{ transition: "stroke-dashoffset 0.7s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100">
                    <User className="h-3 w-3 text-gray-500" />
                  </div>
                </div>
              </button>
              {showProfilePopover && (
                <>
                  <div className="fixed inset-0 z-[1010]" onClick={() => setShowProfilePopover(false)} />
                  <div className="absolute top-full right-0 mt-2 z-[1011] w-52 rounded-2xl bg-white border border-gray-100 shadow-xl overflow-hidden">
                    <button onClick={() => { setShowProfilePopover(false); router.push("/home/settings"); }}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                      <User className="h-4 w-4 text-gray-400" />Modifier le profil
                    </button>
                    <div className="mx-4 h-px bg-gray-100" />
                    <button onClick={() => { setShowProfilePopover(false); router.push("/home/settings"); }}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                      <Settings className="h-4 w-4 text-gray-400" />Paramètres
                    </button>
                    <div className="mx-4 h-px bg-gray-100" />
                    <button onClick={() => signOut({ callbackUrl: "/login" })}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      Se déconnecter
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom sheet */}
        <div
          className="pointer-events-auto fixed z-[1001] flex flex-col bg-white rounded-2xl overflow-hidden"
          style={{
            bottom: 14, left: 12, right: 12,
            height: SHEET_HEIGHTS[sheetState],
            transition: "height 0.38s cubic-bezier(0.32, 0.72, 0, 1)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.18), 0 2px 12px rgba(0,0,0,0.10)",
          }}
        >
          {/* Drag handle — tappable, triggers expand/collapse */}
          <div
            className="shrink-0 flex justify-center pt-3 pb-2 cursor-pointer"
            onTouchStart={(e) => { touchStartY.current = e.touches[0].clientY; }}
            onTouchEnd={(e) => {
              const dy = touchStartY.current - e.changedTouches[0].clientY;
              handleDragEnd(dy);
            }}
            onClick={() => {
              if (sheetState === "collapsed") setSheetState("half");
              else if (sheetState === "half") setSheetState("full");
              else setSheetState("collapsed");
            }}
          >
            <div className="w-9 h-1 rounded-full bg-gray-200" />
          </div>

          {/* Scrollable content — visible only when expanded */}
          <div className="flex-1 overflow-y-auto min-h-0" style={{ display: sheetState === "collapsed" ? "none" : undefined }}>
            {mobileTab === "objectif" && (
              <TabObjectif dailyGoals={dailyGoals} goalsDone={goalsDone} />
            )}
            {mobileTab === "lieux" && (
              <TabLieux
                dbCities={dbCities}
                userStats={userStats}
                onCityClick={(lng, lat) => {
                  japanFlyToRef.current?.(lng, lat, 9);
                  setSheetState("collapsed");
                }}
              />
            )}
          </div>

          {/* ── Tab bar — always visible ── */}
          <div className="shrink-0 flex items-stretch border-t border-gray-100">
            {/* Objectif */}
            <button
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors ${mobileTab === "objectif" && sheetState !== "collapsed" ? "text-indigo-600" : "text-gray-400"}`}
              onClick={() => handleTabClick("objectif")}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
              </svg>
              <span className="text-[10px] font-bold uppercase tracking-wider">Objectif</span>
            </button>

            <div className="w-px my-3 bg-gray-100" />

            {/* Lieux */}
            <button
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors ${mobileTab === "lieux" && sheetState !== "collapsed" ? "text-indigo-600" : "text-gray-400"}`}
              onClick={() => handleTabClick("lieux")}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <span className="text-[10px] font-bold uppercase tracking-wider">Lieux</span>
            </button>

            <div className="w-px my-3 bg-gray-100" />

            {/* Révision */}
            <button
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-gray-400 transition-colors active:text-indigo-600"
              onClick={() => handleTabClick("revision")}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
              <span className="text-[10px] font-bold uppercase tracking-wider">Révision</span>
            </button>
          </div>
        </div>

        {showRevision && <RevisionOverlay onClose={() => setShowRevision(false)} />}
        {showPricing && <PricingModal onClose={() => { storeTutoStep("complete"); setShowPricing(false); }} />}
      </div>
    );
  }

  // ── DESKTOP LAYOUT ───────────────────────────────────────────────────
  return (
    <div className="h-screen overflow-hidden">

      {/* ── Floating sidebar ── */}
      <div
        className="pointer-events-auto fixed left-5 top-1/2 -translate-y-1/2 z-[1001] flex flex-col rounded-2xl bg-white overflow-hidden"
        style={{
          width: 448,
          height: "calc(100vh - 40px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        {/* Header */}
        <div className="flex items-center px-6 pt-3 pb-2 shrink-0 border-b border-gray-200">
          <img src="/logo_sekai_talk.png" alt="SekaiTalk" className="h-[120px] object-contain" />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
          <div id="tut-home-objectif" className="shrink-0">
            <MonObjectif />
          </div>

          <div className="mx-6 h-px shrink-0" style={{ background: "#e5e7eb" }} />

          <div id="tut-home-daily" className="px-6 pt-4 pb-4 shrink-0">
            <div className="flex flex-col gap-2.5">
              {dailyGoals.map((g) => (
                <div key={g.type} className={`flex items-center gap-3.5 rounded-xl px-4 py-3.5 transition-colors ${g.done ? "bg-indigo-50" : "bg-gray-50"}`}>
                  {g.done
                    ? <CheckCircle2 className="h-5 w-5 shrink-0 text-indigo-500" />
                    : <Circle className="h-5 w-5 shrink-0 text-gray-300" />
                  }
                  <div className={`h-5 w-5 shrink-0 ${g.done ? "text-indigo-400" : GOAL_COLORS[g.icon]}`}>{GOAL_ICONS[g.icon]}</div>
                  <span className={`flex-1 text-sm font-medium ${g.done ? "line-through text-gray-400" : "text-gray-600"}`}>
                    {g.label}
                  </span>
                  {g.target > 1 && !g.done && (
                    <span className="text-[11px] font-bold text-gray-400 shrink-0">{g.progress}/{g.target}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mx-6 h-px shrink-0" style={{ background: "#e5e7eb" }} />

          <div id="tut-home-nav" className="px-4 pt-4 pb-4 shrink-0">
            <span className="px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Navigation</span>
            <div className="mt-2 flex flex-col gap-0.5">
              {NAV_ITEMS.map(({ label, enabled, svg }) => {
                const isActive = label === "Lieux" && showLieux;
                const handleClick = () => {
                  if (label === "Lieux") { setShowLieux(v => !v); return; }
                  if (label === "Révision") { setShowRevision(true); return; }
                };
                return enabled ? (
                  <button key={label} onClick={handleClick}
                    className={`group flex w-full items-center gap-3.5 rounded-xl px-3 py-3 transition-colors ${isActive ? "bg-gray-50" : "hover:bg-gray-50"}`}>
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"}`}>
                      {svg}
                    </div>
                    <span className={`text-[15px] font-medium transition-colors ${isActive ? "text-gray-900" : "text-gray-600 group-hover:text-gray-800"}`}>{label}</span>
                    <ChevronRight className={`ml-auto h-4 w-4 transition-opacity ${isActive ? "text-indigo-400 opacity-100" : "text-gray-300 opacity-0 group-hover:opacity-100"}`} />
                  </button>
                ) : (
                  <div key={label} className="flex items-center gap-3.5 rounded-xl px-3 py-3 cursor-default select-none opacity-35">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-400">{svg}</div>
                    <span className="text-[15px] font-medium text-gray-500">{label}</span>
                    <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-400">Bientôt</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex-1" />
        </div>

        <div className="mx-6 h-px shrink-0" style={{ background: "#e5e7eb" }} />

        <div id="tut-home-settings" className="px-4 pt-3 pb-4 shrink-0">
          <button onClick={() => router.push("/home/settings")}
            className="group flex w-full items-center gap-3.5 rounded-xl px-3 py-3 transition-colors hover:bg-gray-100">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-200 transition-transform group-hover:scale-105">
              <svg className="h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
            </div>
            <span className="text-[15px] font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Paramètres</span>
            <ChevronRight className="ml-auto h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>

      {/* ── Panneau flottant Lieux (desktop) ── */}
      {showLieux && (
        <div className="pointer-events-auto fixed z-[1000] flex flex-col rounded-2xl bg-white overflow-hidden"
          style={{ left: 488, top: "50%", transform: "translateY(-50%)", width: 320, height: "calc(100vh - 40px)", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
            <span className="text-sm font-bold uppercase tracking-widest text-gray-400">Lieux</span>
            <button onClick={() => setShowLieux(false)} className="flex items-center justify-center h-8 w-8 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <ChevronRight className="h-5 w-5 rotate-180" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1">
            {Object.entries(dbCities).map(([slug, city]) => {
              const isLocked = city.levelRequired > (userStats?.level ?? 0);
              return (
                <button key={slug} disabled={isLocked}
                  onClick={() => japanFlyToRef.current?.(city.center[1], city.center[0], 9)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left w-full transition-colors ${isLocked ? "opacity-40 cursor-default" : "hover:bg-gray-50 cursor-pointer"}`}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl overflow-hidden text-lg" style={{ background: isLocked ? "#f3f4f6" : "#6366f122" }}>
                    {isLocked ? <Lock className="h-4 w-4 text-gray-400" /> : CITY_LOGOS[slug] ? <img src={CITY_LOGOS[slug]} alt={city.name} className="h-8 w-8 object-contain" /> : <span>🗾</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[15px] font-semibold truncate ${isLocked ? "text-gray-400" : "text-gray-800"}`}>{city.name}</p>
                    {isLocked && <p className="text-[11px] text-gray-400 mt-0.5">{city.levelRequired >= 99 ? "Bientôt disponible" : `Nv. ${city.levelRequired} requis`}</p>}
                  </div>
                  {!isLocked && <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showRevision && <RevisionOverlay onClose={() => setShowRevision(false)} />}
      {showPricing && <PricingModal onClose={() => { storeTutoStep("complete"); setShowPricing(false); }} />}

      <TutorialLayer onAdvance={(step) => { if (step === "pricing") setShowPricing(true); }} />

      {/* ── Desktop HUD top-right ── */}
      <main className="pointer-events-none relative h-screen overflow-hidden">
        <div className="pointer-events-auto absolute top-5 right-5 z-20 flex items-center gap-5 rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-md">
          <div id="tut-home-tickets" className="flex flex-col items-center gap-2 px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Tickets</span>
            <div className="flex items-center gap-1">
              {[0,1,2,3,4].map(i => (
                <svg key={i} width="18" height="18" viewBox="0 0 1792 1792" fill="#6366f1"><path d="M1024 452l316 316-572 572-316-316zm-211 979l618-618q19-19 19-45t-19-45l-362-362q-18-18-45-18t-45 18l-618 618q-19 19-19 45t19 45l362 362q18 18 45 18t45-18zm889-637l-907 908q-37 37-90.5 37t-90.5-37l-126-126q56-56 56-136t-56-136-136-56-136 56l-125-126q-37-37-37-90.5t37-90.5l907-906q37-37 90.5-37t90.5 37l125 125q-56 56-56 136t56 136 136 56 136-56l126 125q37 37 37 90.5t-37 90.5z"/></svg>
              ))}
              <button className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors text-xs font-bold">+</button>
            </div>
            <span className="text-[10px] text-gray-400 tabular-nums">⏱ 10h 28min</span>
          </div>
          <div className="w-px h-12 bg-gray-100" />
          <div className="relative flex items-center">
            <button id="tut-home-flame" className="flex items-center gap-2" onClick={() => setShowStreakPopover(v => !v)}>
              <Flame className={`h-8 w-8 shrink-0 ${streak > 0 ? "text-orange-400" : "text-gray-300"}`} />
              <span className={`text-3xl font-black tabular-nums ${streak > 0 ? "text-orange-500" : "text-gray-300"}`}>{streak}</span>
            </button>
            {showStreakPopover && (
              <>
                <div className="fixed inset-0 z-[1010]" onClick={() => setShowStreakPopover(false)} />
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 z-[1011] w-52 rounded-2xl bg-white border border-gray-100 shadow-xl p-4 flex flex-col gap-3">
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-white border-l border-t border-gray-100" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400">Meilleure série</span>
                    <div className="flex items-center gap-1"><Flame className="h-4 w-4 text-gray-300" /><span className="text-sm font-black text-gray-400">0</span></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400">Freeze restants</span>
                    <div className="flex items-center gap-1"><span className="text-base">🧊</span><span className="text-sm font-black text-gray-400">0</span></div>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="w-px h-12 bg-gray-100" />
          <div id="tut-home-xp" className="flex items-center gap-4 px-1">
            <div className="relative flex items-center">
              <button className="text-gray-300 hover:text-gray-500 transition-colors" onClick={() => setShowNotifPopover(v => !v)}>
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
              <button onClick={() => setShowProfilePopover(v => !v)} className="relative focus:outline-none" style={{ width: 60, height: 60 }}>
                <svg width={60} height={60} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
                  <circle cx={30} cy={30} r={26} fill="none" stroke="#e5e7eb" strokeWidth={4} />
                  <circle cx={30} cy={30} r={26} fill="none" stroke="#6366f1" strokeWidth={4} strokeLinecap="round"
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
                    <button onClick={() => { setShowProfilePopover(false); router.push("/home/settings"); }}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                      <User className="h-4 w-4 text-gray-400" />Modifier le profil
                    </button>
                    <div className="mx-4 h-px bg-gray-100" />
                    <button onClick={() => { setShowProfilePopover(false); setShowPricing(true); }}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors">
                      <svg className="h-4 w-4 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      Passer au forfait supérieur
                    </button>
                    <div className="mx-4 h-px bg-gray-100" />
                    <button onClick={() => signOut({ callbackUrl: "/login" })}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      Se déconnecter
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 z-10"
          style={{ boxShadow: "inset 0 0 120px rgba(0,30,60,0.22), inset 0 0 40px rgba(0,30,60,0.1)" }} />
      </main>
    </div>
  );
}
