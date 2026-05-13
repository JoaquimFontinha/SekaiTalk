"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, User, Flame, Menu, MapPin, Users, BookOpen, Sparkles } from "lucide-react";

type UserStats = {
  xp: number; yens: number; level: number;
  xpInLevel: number; xpNeeded: number | null; percent: number;
};

const SIDEBAR_BUTTONS = [
  { Icon: MapPin,   label: "Lieux"      },
  { Icon: Users,    label: "Contacts"   },
  { Icon: Sparkles, label: "Évènements" },
  { Icon: BookOpen, label: "Révision"   },
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
  const [userStats, setUserStats]             = useState<UserStats | null>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

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

  return (
    <div className="flex h-screen overflow-hidden">

      {/* Sidebar — same as /home/[city] */}
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

        {/* Nav buttons — disabled on home, panels not available here */}
        {SIDEBAR_BUTTONS.map(({ Icon, label }) => (
          <div
            key={label}
            className={`flex cursor-default items-center opacity-35 ${
              sidebarExpanded
                ? "w-full gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500"
                : "flex-col gap-1"
            }`}
          >
            {sidebarExpanded ? (
              <Icon className="h-4 w-4 shrink-0 text-gray-400" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-200 text-gray-400">
                <Icon className="h-5 w-5" />
              </div>
            )}
            <span className={sidebarExpanded ? "" : "text-[9px] font-medium text-gray-400"}>{label}</span>
          </div>
        ))}
      </aside>

      {/* Map area — transparent, Mapbox Japan map comes from layout */}
      <main className="relative flex-1 overflow-hidden pointer-events-none">

        {/* Stats HUD — top right */}
        <div className="pointer-events-auto absolute top-4 right-4 z-20 flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
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
