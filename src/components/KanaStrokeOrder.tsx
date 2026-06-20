"use client";

import { useState, useCallback } from "react";
import { KANA_STROKES } from "@/lib/kana-strokes";

const DURATION = 0.65;
const DELAY = 0.5;

export function KanaStrokeOrder({ char, size = 220 }: { char: string; size?: number }) {
  const [animKey, setAnimKey] = useState(0);
  const paths = KANA_STROKES[char] ?? [];

  const replay = useCallback(() => setAnimKey((k) => k + 1), []);

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        border: "1.5px solid #e5e7eb",
        borderRadius: 16,
        background: "#fafafa",
        flexShrink: 0,
      }}
    >
      <svg viewBox="0 0 109 109" width={size} height={size} style={{ display: "block" }}>
        {/* Grid */}
        <line x1="54.5" y1="4" x2="54.5" y2="105" stroke="#e5e7eb" strokeWidth="1" />
        <line x1="4" y1="54.5" x2="105" y2="54.5" stroke="#e5e7eb" strokeWidth="1" />
        <rect x="14" y="14" width="81" height="81" fill="none" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 3" />

        {paths.map((d, i) => (
          <path
            key={`${animKey}-${i}`}
            d={d}
            pathLength="1"
            fill="none"
            stroke="#374151"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 1,
              strokeDashoffset: 1,
              animation: `kana-stroke ${DURATION}s ease forwards`,
              animationDelay: `${i * DELAY}s`,
            }}
          />
        ))}
      </svg>

      {paths.length > 0 && (
        <div style={{
          position: "absolute", top: 8, left: 8,
          background: "#eff6ff", color: "#3b82f6",
          fontSize: 10, fontWeight: 700,
          padding: "2px 7px", borderRadius: 4, letterSpacing: 0.3,
        }}>
          {paths.length} {paths.length === 1 ? "trait" : "traits"}
        </div>
      )}

      <button
        onClick={replay}
        title="Rejouer"
        style={{
          position: "absolute", bottom: 8, right: 8,
          width: 30, height: 30, borderRadius: "50%",
          background: "#fff", border: "1.5px solid #e5e7eb",
          cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 15, color: "#6b7280",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        }}
      >
        ↺
      </button>
    </div>
  );
}
