"use client";

import { useEffect, useState } from "react";
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

const CITY_LOGOS: Record<string, string> = {
  tokyo: "/images/cities/tokyo_home.svg",
};

type UserStats = {
  xp: number; level: number;
  xpInLevel: number; xpNeeded: number | null; percent: number;
};

const NAV_ITEMS: { label: string; enabled: boolean; color: string; svg: React.ReactNode }[] = [
  {
    label: "Lieux", enabled: true, color: "#6366f1",
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  },
  {
    label: "Contacts", enabled: false, color: "#0d9488",
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    label: "Évènements", enabled: true,  color: "#d97706",
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  },
  {
    label: "Révision", enabled: true, color: "#2563eb",
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  },
];

const DAILY_GOALS = [
  { label: "Lance une conversation",   done: false },
  { label: "Apprends 5 nouveaux mots", done: false },
  { label: "Complète une quête",       done: false },
];

function CompassRose() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64">
      <polygon points="32,4 28,24 36,24" fill="#f0ece2" />
      <polygon points="32,60 28,40 36,40" fill="rgba(240,236,226,0.4)" />
      <polygon points="60,32 40,28 40,36" fill="rgba(240,236,226,0.4)" />
      <polygon points="4,32 24,28 24,36" fill="rgba(240,236,226,0.4)" />
      <line x1="32" y1="4" x2="32" y2="60" stroke="rgba(240,236,226,0.2)" strokeWidth="0.8" />
      <line x1="4" y1="32" x2="60" y2="32" stroke="rgba(240,236,226,0.2)" strokeWidth="0.8" />
      <line x1="12" y1="12" x2="52" y2="52" stroke="rgba(240,236,226,0.12)" strokeWidth="0.6" />
      <line x1="52" y1="12" x2="12" y2="52" stroke="rgba(240,236,226,0.12)" strokeWidth="0.6" />
      <circle cx="32" cy="32" r="9" fill="none" stroke="rgba(240,236,226,0.35)" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="3.5" fill="#f0ece2" opacity="0.7" />
      <text x="32" y="14" textAnchor="middle" fontSize="7" fontWeight="700" fill="#f0ece2" fontFamily="serif" letterSpacing="1" opacity="0.9">N</text>
    </svg>
  );
}

export default function HomeClient() {
  const router = useRouter();
  const { japanFlyToRef } = useMapCtx();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [showRevision, setShowRevision] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showStreakPopover, setShowStreakPopover] = useState(false);
  const [showNotifPopover, setShowNotifPopover] = useState(false);
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const [showLieux, setShowLieux] = useState(false);
  const [dbCities, setDbCities] = useState(staticCities);

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

  return (
    <div className="h-screen overflow-hidden">

      {/* ── Floating sidebar ── */}
      <div
        className="pointer-events-auto fixed left-5 top-1/2 -translate-y-1/2 z-[1001] flex flex-col rounded-2xl bg-white overflow-y-auto"
        style={{
          width: 448,
          height: "calc(100vh - 40px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        {/* ── Header ── */}
        <div className="flex items-center px-6 pt-3 pb-2 shrink-0 border-b border-gray-200">
          <img src="/logo_sekai_talk.png" alt="SekaiTalk" className="h-[120px] object-contain" />
        </div>

        {/* ── 1. Mon Objectif ── */}
        <div id="tut-home-objectif" className="shrink-0">
          <MonObjectif />
        </div>

        <div className="mx-6 h-px bg-gray-150 shrink-0" style={{ background: "#e5e7eb" }} />

        {/* ── 2. Objectifs du jour ── */}
        <div id="tut-home-daily" className="px-6 pt-5 pb-5 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Objectifs du jour</span>
            <span className="text-xs font-semibold text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full">
              0 / {DAILY_GOALS.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {DAILY_GOALS.map((g, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
                {g.done
                  ? <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-500" />
                  : <Circle className="h-4 w-4 shrink-0 text-gray-300" />
                }
                <span className={`text-sm font-medium ${g.done ? "line-through text-gray-400" : "text-gray-600"}`}>
                  {g.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-6 h-px shrink-0" style={{ background: "#e5e7eb" }} />

        {/* ── 3. Navigation ── */}
        <div id="tut-home-nav" className="px-4 pt-5 pb-5 flex-1">
          <span className="px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Navigation</span>
          <div className="mt-2 flex flex-col gap-0.5">
            {NAV_ITEMS.map(({ label, enabled, color, svg }) => {
              const handleClick = () => {
                if (label === "Lieux") { setShowLieux(v => !v); return; }
                if (label === "Révision") { setShowRevision(true); return; }
              };
              return enabled ? (
                <button
                  key={label}
                  onClick={handleClick}
                  className={`group flex w-full items-center gap-3.5 rounded-xl px-3 py-3 transition-colors ${label === "Lieux" && showLieux ? "bg-gray-100" : "hover:bg-gray-100"}`}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl p-2 transition-transform group-hover:scale-105"
                    style={{ background: color }}
                  >
                    {svg}
                  </div>
                  <span className="text-[15px] font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                    {label}
                  </span>
                  <ChevronRight className="ml-auto h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ) : (
                <div key={label} className="flex items-center gap-3.5 rounded-xl px-3 py-3 cursor-default select-none">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl p-2" style={{ background: "#d1d5db" }}>
                    {svg}
                  </div>
                  <span className="text-[15px] font-semibold text-gray-400">{label}</span>
                  <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-400">Bientôt</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mx-6 h-px shrink-0" style={{ background: "#e5e7eb" }} />

        {/* ── 4. Paramètres ── */}
        <div id="tut-home-settings" className="px-4 pt-3 pb-4 shrink-0">
          <button
            onClick={() => router.push("/home/settings")}
            className="group flex w-full items-center gap-3.5 rounded-xl px-3 py-3 transition-colors hover:bg-gray-100"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-200 transition-transform group-hover:scale-105">
              <Settings className="h-5 w-5 text-gray-500" />
            </div>
            <span className="text-[15px] font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Paramètres</span>
            <ChevronRight className="ml-auto h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>

      {/* ── Panneau flottant Lieux ── */}
      {showLieux && (
        <div
          className="pointer-events-auto fixed z-[1000] flex flex-col rounded-2xl bg-white overflow-hidden"
          style={{
            left: 488,
            top: "50%",
            transform: "translateY(-50%)",
            width: 320,
            height: "calc(100vh - 40px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
            <span className="text-sm font-bold uppercase tracking-widest text-gray-400">Lieux</span>
            <button onClick={() => setShowLieux(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <ChevronRight className="h-5 w-5 rotate-180" />
            </button>
          </div>

          {/* Liste des villes */}
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1">
            {Object.entries(dbCities).map(([slug, city]) => {
              const isLocked = city.levelRequired > (userStats?.level ?? 0);
              return (
                <button
                  key={slug}
                  disabled={isLocked}
                  onClick={() => japanFlyToRef.current?.(city.center[1], city.center[0], 9)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left w-full transition-colors
                    ${isLocked ? "opacity-40 cursor-default" : "hover:bg-gray-50 cursor-pointer"}`}
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
        </div>
      )}

      {showRevision && <RevisionOverlay onClose={() => setShowRevision(false)} />}
      {showPricing && <PricingModal onClose={() => { storeTutoStep("complete"); setShowPricing(false); }} />}

      <TutorialLayer
        onAdvance={(step) => {
          if (step === "pricing") setShowPricing(true);
        }}
      />

      {/* ── Transparent overlay (HUD, compass, vignette) ── */}
      <main className="pointer-events-none relative h-screen overflow-hidden">

        {/* Stats HUD — top right */}
        <div className="pointer-events-auto absolute top-5 right-5 z-20 flex items-center gap-5 rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-md">

          {/* Cluster 1 — Tickets journaliers */}
          <div id="tut-home-tickets" className="flex flex-col items-center gap-2 px-1">
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
              id="tut-home-flame"
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

          {/* Cluster 3 — Avatar + XP */}
          <div id="tut-home-xp" className="flex items-center gap-4 px-1">
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
              <span className="text-[11px] font-bold text-gray-700 tabular-nums">
                Lv. {userStats?.level ?? "—"}
              </span>
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
                      onClick={() => { setShowProfilePopover(false); setShowPricing(true); }}
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

        {/* Vignette */}
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{ boxShadow: "inset 0 0 120px rgba(0,30,60,0.22), inset 0 0 40px rgba(0,30,60,0.1)" }}
        />


      </main>
    </div>
  );
}
