"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { Bell, User, Flame, Lock } from "lucide-react";
import cities from "@/lib/cities";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const worldAtlas = require("world-atlas/countries-50m.json");

type UserStats = {
  xp: number; yens: number; level: number;
  xpInLevel: number; xpNeeded: number | null; percent: number;
};

const CITY_LIST = Object.entries(cities).map(([slug, data]) => ({
  slug,
  name: data.name,
  coordinates: [data.center[1], data.center[0]] as [number, number], // [lng, lat] for react-simple-maps
  levelRequired: data.levelRequired,
}));

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
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  useEffect(() => {
    fetch("/api/user/stats")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setUserStats(data); })
      .catch(() => {});
  }, []);

  return (
    <div className="relative h-screen overflow-hidden">

      {/* Floating HUD — top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 pt-4 pointer-events-none">
        {/* Logo */}
        <div className="pointer-events-auto rounded-xl bg-white shadow-sm border border-gray-200 px-4 py-2">
          <span className="text-base font-black tracking-tight text-gray-900">SekaiTalk</span>
        </div>

        {/* Stats */}
        <div className="pointer-events-auto flex items-center gap-3 rounded-xl bg-white shadow-sm border border-gray-200 px-4 py-2">
          {userStats && (
            <>
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                Nv.{userStats.level}
              </span>
              <div className="flex flex-col gap-0.5">
                <div className="h-1.5 w-16 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-violet-500 transition-all duration-700"
                    style={{ width: `${userStats.percent}%` }}
                  />
                </div>
                <span className="text-[8px] text-gray-400 text-right leading-none tabular-nums">
                  {userStats.xpInLevel}/{userStats.xpNeeded ?? "MAX"} XP
                </span>
              </div>
              <div className="w-px h-4 bg-gray-200" />
            </>
          )}
          <button className="flex items-center gap-1 text-gray-400 hover:text-orange-400 transition-colors">
            <Flame className="h-4 w-4 text-orange-300" />
            <span className="text-xs font-semibold text-gray-600">0</span>
          </button>
          <button className="text-gray-400 hover:text-gray-700 transition-colors"><Bell className="h-4 w-4" /></button>
          <button className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-700 transition-colors">
            <User className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Full-screen map */}
      <main
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 65% 35%, #9ec5d8 0%, #7aaec5 45%, #5f97b0 100%)",
        }}
      >
          {/* Dot grid ocean texture */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)",
              backgroundSize: "30px 30px",
            }}
          />

          {/* Vignette */}
          <div
            className="pointer-events-none absolute inset-0 z-10"
            style={{ boxShadow: "inset 0 0 120px rgba(0,30,60,0.22), inset 0 0 40px rgba(0,30,60,0.1)" }}
          />

          {/* Sea of Japan label */}
          <div
            className="pointer-events-none absolute z-10 select-none uppercase"
            style={{
              left: "13%", top: "41%",
              fontSize: "10px",
              letterSpacing: "0.3em",
              color: "rgba(255,255,255,0.35)",
              fontWeight: 500,
              transform: "rotate(-6deg)",
            }}
          >
            Sea of Japan
          </div>

          {/* Pacific Ocean label */}
          <div
            className="pointer-events-none absolute z-10 select-none text-center uppercase"
            style={{
              right: "7%", top: "50%",
              fontSize: "10px",
              letterSpacing: "0.3em",
              color: "rgba(255,255,255,0.3)",
              fontWeight: 500,
              lineHeight: "1.8",
            }}
          >
            Pacific<br />Ocean
          </div>

          {/* Compass rose */}
          <div className="absolute bottom-8 right-8 z-10">
            <CompassRose />
          </div>

          {/* Map label bottom-left */}
          <div className="pointer-events-none absolute bottom-8 left-8 z-10 select-none">
            <span
              style={{
                fontSize: "9px",
                letterSpacing: "0.25em",
                color: "rgba(255,255,255,0.4)",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              Japan
            </span>
            <div style={{ height: 1, width: 40, background: "rgba(255,255,255,0.2)", marginTop: 4 }} />
          </div>

          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ center: [137, 37], scale: 1350 }}
            style={{ width: "100%", height: "100%", position: "relative", zIndex: 5 }}
          >
            <defs>
              <filter id="landShadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="rgba(0,20,50,0.35)" />
              </filter>
              <linearGradient id="landGrad" x1="0%" y1="0%" x2="30%" y2="100%">
                <stop offset="0%" stopColor="#f5f1e4" />
                <stop offset="100%" stopColor="#e8e2cf" />
              </linearGradient>
            </defs>

            <Geographies geography={worldAtlas}>
              {({ geographies }: { geographies: any[] }) =>
                geographies
                  .filter((geo: any) => geo.id === "392")
                  .map((geo: any) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="url(#landGrad)"
                      stroke="#d6cfba"
                      strokeWidth={0.6}
                      style={{
                        default: { outline: "none", filter: "url(#landShadow)" },
                        hover:   { outline: "none", filter: "url(#landShadow)" },
                        pressed: { outline: "none", filter: "url(#landShadow)" },
                      }}
                    />
                  ))
              }
            </Geographies>

            {CITY_LIST.map((city) => {
              const isHovered = hoveredCity === city.name;
              const isLocked  = userStats !== null && city.levelRequired > userStats.level;

              return (
                <Marker
                  key={city.name}
                  coordinates={city.coordinates}
                  onMouseEnter={() => setHoveredCity(city.name)}
                  onMouseLeave={() => setHoveredCity(null)}
                  onClick={() => { if (!isLocked) router.push(`/home/${city.slug}`); }}
                >
                  {/* Animated ping on hover (unlocked only) */}
                  {isHovered && !isLocked && (
                    <circle
                      r={26}
                      fill="none"
                      stroke="#7c3aed"
                      strokeWidth={1.5}
                      opacity={0.45}
                      className="animate-ping"
                      style={{ transformBox: "fill-box", transformOrigin: "center" }}
                    />
                  )}

                  {/* Halo */}
                  <circle
                    r={isHovered ? 19 : 16}
                    fill={
                      isLocked
                        ? "rgba(100,100,120,0.15)"
                        : isHovered
                        ? "rgba(124,58,237,0.1)"
                        : "rgba(255,255,255,0.15)"
                    }
                    stroke={
                      isLocked
                        ? "rgba(150,150,170,0.25)"
                        : isHovered
                        ? "rgba(124,58,237,0.3)"
                        : "rgba(255,255,255,0.3)"
                    }
                    strokeWidth={1}
                    style={{ transition: "all 0.25s ease" }}
                  />

                  {/* Main marker */}
                  <circle
                    r={11}
                    fill={isLocked ? "rgba(80,80,100,0.7)" : isHovered ? "white" : "rgba(255,255,255,0.92)"}
                    stroke={isLocked ? "#666" : isHovered ? "#7c3aed" : "#2d3748"}
                    strokeWidth={2}
                    style={{
                      cursor: isLocked ? "default" : "pointer",
                      transition: "all 0.25s ease",
                      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.25))",
                    }}
                  />

                  {/* Lock icon (locked) or center dot (unlocked) */}
                  {isLocked ? (
                    <text
                      textAnchor="middle"
                      dy="4"
                      style={{ fontSize: "10px", userSelect: "none", pointerEvents: "none" }}
                    >
                      🔒
                    </text>
                  ) : (
                    <circle
                      r={isHovered ? 5 : 3.5}
                      fill={isHovered ? "#7c3aed" : "#1a202c"}
                      style={{ cursor: "pointer", transition: "all 0.25s ease" }}
                    />
                  )}

                  {/* Label pill */}
                  <rect
                    x={-32} y={-44}
                    width={64} height={18}
                    fill={
                      isLocked
                        ? "rgba(60,60,80,0.8)"
                        : isHovered
                        ? "rgba(124,58,237,0.9)"
                        : "rgba(29,36,50,0.75)"
                    }
                    rx={9}
                    style={{
                      transition: "all 0.25s ease",
                      filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.3))",
                    }}
                  />

                  {/* City name */}
                  <text
                    textAnchor="middle"
                    y={-31}
                    style={{
                      fontSize: "9.5px",
                      fontWeight: "600",
                      fill: isLocked ? "rgba(180,180,200,0.7)" : "white",
                      pointerEvents: "none",
                      userSelect: "none",
                      fontFamily: "inherit",
                      letterSpacing: "0.6px",
                    }}
                  >
                    {city.name.toUpperCase()}
                  </text>

                  {/* "Niveau X requis" tooltip on hover for locked cities */}
                  {isHovered && isLocked && (
                    <>
                      <rect x={-44} y={14} width={88} height={18} fill="rgba(30,10,60,0.92)" rx={9} />
                      <text
                        textAnchor="middle"
                        y={27}
                        style={{
                          fontSize: "8.5px",
                          fontWeight: "600",
                          fill: "#c084fc",
                          pointerEvents: "none",
                          userSelect: "none",
                          fontFamily: "inherit",
                          letterSpacing: "0.3px",
                        }}
                      >
                        Niveau {city.levelRequired} requis
                      </text>
                    </>
                  )}
                </Marker>
              );
            })}
          </ComposableMap>
        </main>
    </div>
  );
}
