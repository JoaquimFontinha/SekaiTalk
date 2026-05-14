"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

// ── Phone dimensions (aspect 37:76) ───────────────────────────────────────────
const PH  = 600;
const PW  = Math.round(PH * 37 / 76);  // 292
const BR  = 50;
const BW  = 3;
const PAD = 10;
const SBR = BR - PAD;
const HUE = 284;

// ── Apps — pure gradient squircles, no emoji inside ───────────────────────────
// Each app: name, top gradient color, bottom gradient color, label
const APPS = [
  { name: "LINE",      c1: "#07C160", c2: "#04883e" },
  { name: "Amazon",    c1: "#FF9900", c2: "#e06e00" },
  { name: "Rakuten",   c1: "#BF0000", c2: "#7a0000" },
  { name: "Maps",      c1: "#3DD68C", c2: "#1FA060" },
  { name: "PayPay",    c1: "#FF3366", c2: "#CC0033" },
  { name: "Suica",     c1: "#00C8A0", c2: "#008B6E" },
  { name: "Tabelog",   c1: "#F5A623", c2: "#E8501A" },
  { name: "Yahoo!",    c1: "#FF0033", c2: "#880022" },
  { name: "X",         c1: "#1A1A1A", c2: "#0d0d0d" },
  { name: "Mercari",   c1: "#FF6B6B", c2: "#E03030" },
  { name: "Google",    c1: "#4285F4", c2: "#1A73E8" },
  { name: "Instagram", c1: "#E1306C", c2: "#833AB4" },
];

const DOCK = [
  { name: "Tél.",    c1: "#34C759", c2: "#28a047" },
  { name: "SMS",     c1: "#34C759", c2: "#28a047" },
  { name: "Safari",  c1: "#55B4F5", c2: "#007AFF" },
  { name: "Musique", c1: "#FC6D70", c2: "#FC3C44" },
];

// ── Side buttons ──────────────────────────────────────────────────────────────
const LEFT_BTNS: [number, number][] = [
  [BR * 2,      22],
  [BR * 2 + 34, 46],
  [BR * 2 + 92, 46],
];
const RIGHT_BTN: [number, number] = [BR * 3, 72];

const btnStyle = (flip = false): React.CSSProperties => ({
  position:    "absolute",
  width:       4,
  background:  `linear-gradient(${flip ? 270 : 90}deg, hsl(${HUE},18%,60%) 0%, hsl(${HUE},22%,86%) 50%, hsl(${HUE},18%,60%) 100%)`,
  borderRadius: flip ? "0 2px 2px 0" : "2px 0 0 2px",
  boxShadow:   `inset ${flip ? 1.5 : -1.5}px 0 1px rgba(0,0,0,0.8), inset 0 2px 1px rgba(255,255,255,0.28), inset 0 -2px 1px rgba(0,0,0,0.5)`,
});

// ── Screen BG section ─────────────────────────────────────────────────────────
const sectionBg = (bottom: boolean) => [
  `radial-gradient(100% 70% at 110% 100%, hsla(${HUE-45},100%,50%,${bottom?.45:.65}) 33%, transparent)`,
  `radial-gradient(100% 70% at -10% 100%, hsla(${HUE-45},100%,50%,${bottom?.45:.65}) 33%, transparent)`,
  `radial-gradient(150% 100% at 50% 82%, hsla(${HUE+33},100%,${bottom?90:82}%,${bottom?.45:.6}) 35%, transparent)`,
  `hsl(${HUE},100%,${bottom?78:38}%)`,
].join(", ");

// ── Squircle icon ─────────────────────────────────────────────────────────────
function AppIcon({ c1, c2, size = 52 }: { c1: string; c2: string; size?: number }) {
  return (
    <div
      className="group-hover:scale-110 group-active:scale-95 transition-transform duration-[150ms] ease-out"
      style={{
        width: size, height: size,
        borderRadius: "22%",
        background: `linear-gradient(170deg, ${c1} 0%, ${c2} 100%)`,
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 3px 12px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.2)",
        flexShrink: 0,
      }}
    >
      {/* Top specular highlight */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(170deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 40%, transparent 55%)",
        pointerEvents: "none",
      }} />
      {/* Bottom inner glow (CodePen border effect) */}
      <div style={{
        position: "absolute", inset: 0,
        borderRadius: "inherit",
        boxShadow: "inset 0 -1px 0 rgba(255,255,255,0.15), inset 0 1px 0 rgba(255,255,255,0.25)",
        pointerEvents: "none",
      }} />
    </div>
  );
}

// ── Status icons ──────────────────────────────────────────────────────────────
function StatusIcons() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <svg width="17" height="12" viewBox="0 0 17 12" fill="white">
        <rect x="0"    y="7.5" width="3" height="4.5" rx="0.5"/>
        <rect x="4.5"  y="5"   width="3" height="7"   rx="0.5"/>
        <rect x="9"    y="2"   width="3" height="10"  rx="0.5"/>
        <rect x="13.5" y="0"   width="3" height="12"  rx="0.5" fillOpacity="0.3"/>
      </svg>
      <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
        <circle cx="8" cy="11" r="1.5" fill="white"/>
        <path d="M4.2 7.5a5.4 5.4 0 017.6 0"  stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M1.5 4.8A9 9 0 0114.5 4.8"   stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <svg width="26" height="13" viewBox="0 0 26 13">
        <rect x="0.5" y="0.5" width="21" height="12" rx="3.5" stroke="white" strokeOpacity="0.35" fill="none"/>
        <rect x="2"   y="2"   width="15" height="9"  rx="2" fill="white"/>
        <path d="M23 4.5v4a2 2 0 000-4z" fill="white" fillOpacity="0.4"/>
      </svg>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PhoneOverlay({ onClose }: { onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("ja-JP", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit", hour12: false })
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const id = setInterval(() =>
      setTime(new Date().toLocaleTimeString("ja-JP", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit", hour12: false }))
    , 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[2000] flex items-center justify-center"
      style={{
        background: "rgba(0,0,0,0.82)",
        backdropFilter: "blur(24px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.3s ease",
      }}
      onClick={onClose}
    >
      {/* ══ Phone frame ══════════════════════════════════════════════════════ */}
      <div
        style={{
          position: "relative", width: PW, height: PH,
          borderRadius: BR, background: "#040404",
          transform: visible ? "scale(1) translateY(0)"    : "scale(0.88) translateY(32px)",
          opacity:   visible ? 1 : 0,
          transition: "transform 0.55s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease",
          boxShadow: [
            `0 0 1px 2px hsl(${HUE},18%,18%)`,
            `0 0 0 ${BW}px hsl(${HUE},28%,82%)`,
            "0 70px 140px rgba(0,0,0,0.92)",
            "0 20px 48px rgba(0,0,0,0.55)",
          ].join(", "),
          userSelect: "none",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Metallic center band */}
        <div style={{
          position: "absolute", top: BR, right: -BW, bottom: BR, left: -BW,
          borderTop: `3px solid hsl(${HUE},14%,26%)`,
          borderBottom: `3px solid hsl(${HUE},14%,26%)`,
          pointerEvents: "none",
        }}/>

        {/* Left buttons */}
        {LEFT_BTNS.map(([top, h], i) => (
          <div key={i} style={{ ...btnStyle(), left: -4, top, height: h }}/>
        ))}

        {/* Right button */}
        <div style={{ ...btnStyle(true), right: -4, top: RIGHT_BTN[0], height: RIGHT_BTN[1] }}/>


        {/* ══ Screen ══════════════════════════════════════════════════════════ */}
        <div style={{
          position: "absolute", inset: 0,
          borderRadius: BR, border: `${PAD}px solid black`,
          overflow: "hidden",
          display: "flex", flexDirection: "column", alignItems: "center",
        }}>

          {/* ── Gradient background ── */}
          <div style={{ position: "absolute", inset: 0, borderRadius: SBR, overflow: "hidden", background: `hsl(${HUE},100%,10%)` }}>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: "62%",
              borderRadius: `${SBR}px`, borderBottomLeftRadius: 90, borderBottomRightRadius: 90,
              background: sectionBg(false),
            }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "inherit", background: `radial-gradient(80% 150% at 50% 100%, hsl(${HUE},100%,52%), transparent 70%)`, mixBlendMode: "overlay" }}/>
            </div>
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: "45%",
              borderRadius: `${SBR}px`, borderTopLeftRadius: 90, borderTopRightRadius: 90,
              transform: "scaleY(-1)",
              background: sectionBg(true),
            }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "inherit", background: `radial-gradient(80% 150% at 50% 100%, hsl(${HUE},70%,72%), transparent 70%)`, mixBlendMode: "overlay" }}/>
            </div>
          </div>

          {/* ── Dynamic island ── */}
          <div style={{ position: "absolute", zIndex: 12, top: 10, left: 10, right: 10, display: "flex", justifyContent: "center" }}>
            <div style={{
              position: "relative", overflow: "hidden",
              width: "44%", height: 34, borderRadius: 20,
            }}>
              <div style={{ position: "absolute", inset: 0, background: "#000", borderRadius: "inherit" }}/>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 14 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#060820", boxShadow: "inset 0 0 3px #4c4da3" }}/>
              </div>
            </div>
          </div>

          {/* ── Status bar ── */}
          <div style={{
            position: "relative", zIndex: 6, width: "100%",
            paddingTop: 16, paddingLeft: 26, paddingRight: 26,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            color: "white", flexShrink: 0,
          }}>
            <span style={{ fontSize: 15.5, fontWeight: 600 }}>{time}</span>
            <StatusIcons/>
          </div>

          {/* ── Clock ── */}
          <div style={{ position: "relative", zIndex: 6, textAlign: "center", paddingTop: 4, color: "white", flexShrink: 0 }}>
            <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.42)", letterSpacing: "0.1em" }}>Tokyo · 東京</p>
            <p style={{ fontSize: 62, fontWeight: 200, lineHeight: 1.0, letterSpacing: "-0.025em" }}>{time}</p>
          </div>

          {/* ── App grid ── */}
          <div style={{
            position: "relative", zIndex: 6,
            width: "100%",
            padding: "10px 14px 0",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            rowGap: 10,
            columnGap: 6,
            flexShrink: 0,
          }}>
            {APPS.map(app => (
              <button
                key={app.name}
                className="group"
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                <AppIcon c1={app.c1} c2={app.c2} size={50} />
                <span style={{ color: "rgba(255,255,255,0.88)", fontSize: 9, fontWeight: 500, textShadow: "0 1px 3px rgba(0,0,0,0.8)", textAlign: "center", lineHeight: 1.2 }}>
                  {app.name}
                </span>
              </button>
            ))}
          </div>

          {/* ── Dock ── */}
          <div style={{
            position: "absolute", bottom: 26, left: 12, right: 12, zIndex: 6,
            background: "rgba(255,255,255,0.11)",
            borderRadius: 26,
            backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
            border: "1px solid rgba(255,255,255,0.07)",
            padding: "10px 12px",
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6,
          }}>
            {DOCK.map(app => (
              <button
                key={app.name}
                className="group"
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                <AppIcon c1={app.c1} c2={app.c2} size={48} />
                <span style={{ color: "rgba(255,255,255,0.72)", fontSize: 9, textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>{app.name}</span>
              </button>
            ))}
          </div>

          {/* Home indicator */}
          <div style={{
            position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)",
            width: 130, height: 5, background: "rgba(255,255,255,0.28)", borderRadius: 3, zIndex: 6,
          }}/>
        </div>
      </div>

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-8 right-8 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-all"
      >
        <X className="h-5 w-5"/>
      </button>
    </div>
  );
}
