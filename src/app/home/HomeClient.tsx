"use client";

import { useEffect, useState } from "react";
import { Bell, User, Flame, MapPin, Users, BookOpen, Sparkles, Settings, CheckCircle2, Circle } from "lucide-react";

type UserStats = {
  xp: number; yens: number; level: number;
  xpInLevel: number; xpNeeded: number | null; percent: number;
};

const NAV_ITEMS = [
  { Icon: MapPin,   label: "Lieux"      },
  { Icon: Users,    label: "Contacts"   },
  { Icon: Sparkles, label: "Évènements" },
  { Icon: BookOpen, label: "Révision"   },
];

const DAILY_GOALS = [
  { label: "Lance une conversation",   done: false },
  { label: "Apprends 5 nouveaux mots", done: false },
  { label: "Complète une quête",       done: false },
];


const GLOBAL_STATS = [
  { label: "Conversations", value: "—", icon: "💬" },
  { label: "Mots maîtrisés", value: "—", icon: "✨" },
  { label: "Quêtes terminées", value: "—", icon: "🎯" },
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
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  useEffect(() => {
    fetch("/api/user/stats")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setUserStats(data); })
      .catch(() => {});
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
        <div className="flex items-center gap-4 px-7 pt-8 pb-8 shrink-0">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-3xl">
            🗾
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xl font-black tracking-tight text-gray-800 leading-none">SekaiTalk</span>
          </div>
        </div>

        {/* ── Objectifs du jour ── */}
        <div className="px-7 pb-8 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Objectifs du jour</span>
            <span className="text-xs font-semibold text-violet-500 bg-violet-50 px-2.5 py-1 rounded-full">
              0 / {DAILY_GOALS.length}
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            {DAILY_GOALS.map((g, i) => (
              <div key={i} className="flex items-center gap-3.5 rounded-xl bg-gray-50 px-4 py-3.5">
                {g.done
                  ? <CheckCircle2 className="h-5 w-5 shrink-0 text-violet-500" />
                  : <Circle className="h-5 w-5 shrink-0 text-gray-300" />
                }
                <span className={`text-sm font-medium ${g.done ? "line-through text-gray-400" : "text-gray-600"}`}>
                  {g.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-7 h-px bg-gray-100 shrink-0" />

        {/* ── Navigation ── */}
        <div className="px-5 pt-8 pb-8 flex-1">
          <span className="px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Navigation</span>
          <div className="mt-3 flex flex-col gap-1">
            {NAV_ITEMS.map(({ Icon, label }) => (
              <div
                key={label}
                className="flex cursor-default select-none items-center gap-4 rounded-xl px-4 py-4 opacity-40"
              >
                <Icon className="h-5 w-5 shrink-0 text-gray-500" />
                <span className="text-base font-medium text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-7 h-px bg-gray-100 shrink-0" />

        {/* ── Stats globales ── */}
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

        {/* ── Footer ── */}
        <div className="px-5 pt-5 pb-6 shrink-0">
          <button className="flex w-full cursor-default items-center gap-4 rounded-xl px-4 py-4 opacity-40">
            <Settings className="h-5 w-5 shrink-0 text-gray-500" />
            <span className="text-base font-medium text-gray-600">Paramètres</span>
          </button>
        </div>
      </div>

      {/* ── Transparent overlay (HUD, compass, vignette) ── */}
      <main className="pointer-events-none relative h-screen overflow-hidden">

        {/* Stats HUD — top right */}
        <div className="pointer-events-auto absolute top-5 right-5 z-20 flex items-center gap-5 rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-md">

          {/* Tickets journaliers */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-lg">
                  🎫
                </div>
              ))}
              <button className="ml-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-dashed border-gray-200 text-gray-400 hover:border-violet-400 hover:text-violet-500 transition-colors text-sm font-bold">
                +
              </button>
            </div>
            <span className="flex items-center gap-1 text-[10px] text-gray-400 leading-none">
              <span>⏱</span>
              <span className="tabular-nums">10h 28min</span>
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

          {/* Avatar + XP ring (style Pokémon GO) */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="relative" style={{ width: 64, height: 64 }}>
              <svg width={64} height={64} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
                <circle cx={32} cy={32} r={28} fill="none" stroke="#e5e7eb" strokeWidth={4.5} />
                <circle
                  cx={32} cy={32} r={28}
                  fill="none"
                  stroke="#7c3aed"
                  strokeWidth={4.5}
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
            <span className="text-xs font-bold text-gray-700 tabular-nums">
              Lv. {userStats?.level ?? "—"}
            </span>
          </div>
        </div>

        {/* Vignette */}
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{ boxShadow: "inset 0 0 120px rgba(0,30,60,0.22), inset 0 0 40px rgba(0,30,60,0.1)" }}
        />

        {/* Compass rose */}
        <div className="absolute bottom-8 right-8 z-10">
          <CompassRose />
        </div>

      </main>
    </div>
  );
}
