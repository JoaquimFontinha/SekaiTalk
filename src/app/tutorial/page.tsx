"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const LINES = [
  "On est enfin arrivés au Japon ! ✈️",
  "Bienvenue sur SekaiTalk !",
  "Moi c'est [Nom du guide à venir]",
  "et je serai ton guide ici !",
  "J'espère que t'as fait un bon vol ! Mais c'est pas encore le moment de se reposer…",
  "on doit encore passer la douane !",
];

function TutorialScene() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const motivation   = searchParams.get("m") ?? "";

  const [lineIdx, setLineIdx]   = useState(0);
  const [visible, setVisible]   = useState(true);
  const [charLoaded, setCharLoaded] = useState(false);

  const isLast = lineIdx === LINES.length - 1;

  const advance = useCallback(() => {
    if (isLast) {
      const dest = `/tutorial/douane${motivation ? `?m=${motivation}` : ""}`;
      router.push(dest);
      return;
    }
    setVisible(false);
    setTimeout(() => { setLineIdx(i => i + 1); setVisible(true); }, 160);
  }, [isLast, motivation, router]);

  // keyboard / tap support
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter" || e.key === "ArrowRight") advance();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance]);

  return (
    <div
      onClick={advance}
      style={{
        minHeight: "100vh", width: "100%",
        position: "relative", overflow: "hidden",
        cursor: "pointer", userSelect: "none",
        fontFamily: "system-ui, -apple-system, sans-serif",
        background: "#1a1a2e",
      }}
    >
      {/* Background */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "url('/backgrounds/aeroport_tutoriel.avif')",
        backgroundSize: "cover", backgroundPosition: "center",
        filter: "brightness(0.82)",
      }}/>

      {/* Dark vignette bottom */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 45%, transparent 70%)",
        pointerEvents: "none",
      }}/>

      {/* Character */}
      <div style={{
        position: "absolute", bottom: 160, left: "50%",
        transform: "translateX(-50%)",
        height: "52vh", maxHeight: 440,
        opacity: charLoaded ? 1 : 0,
        transition: "opacity 0.4s ease",
        zIndex: 1,
        filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.5))",
      }}>
        <img
          src="/character_placeholder.png"
          alt="Guide"
          style={{ height: "100%", width: "auto", objectFit: "contain" }}
          onLoad={() => setCharLoaded(true)}
        />
      </div>

      {/* Dialogue box */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "0 20px 28px",
        zIndex: 2,
      }}>
        <div style={{
          maxWidth: 720, margin: "0 auto",
          background: "rgba(10, 8, 20, 0.88)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 18,
          backdropFilter: "blur(16px)",
          padding: "20px 28px 22px",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.3)",
        }}>
          {/* Name badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(124,58,237,0.3)",
            border: "1px solid rgba(124,58,237,0.5)",
            borderRadius: 99, padding: "3px 14px",
            marginBottom: 12,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#a78bfa", display: "inline-block",
              boxShadow: "0 0 6px rgba(167,139,250,0.8)",
            }}/>
            <span style={{
              fontSize: 12, fontWeight: 700, color: "#c4b5fd",
              letterSpacing: "0.06em",
            }}>GUIDE</span>
          </div>

          {/* Line text */}
          <p style={{
            fontSize: 18, fontWeight: 600, color: "#f0eeff",
            lineHeight: 1.55, margin: 0,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(6px)",
            transition: "opacity 0.16s ease, transform 0.16s ease",
            minHeight: 56,
          }}>
            {LINES[lineIdx]}
          </p>

          {/* Footer: progress dots + hint */}
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between", marginTop: 18,
          }}>
            <div style={{ display: "flex", gap: 6 }}>
              {LINES.map((_, i) => (
                <div key={i} style={{
                  width: i === lineIdx ? 18 : 6,
                  height: 6, borderRadius: 99,
                  background: i === lineIdx
                    ? "#a78bfa"
                    : i < lineIdx ? "rgba(167,139,250,0.4)" : "rgba(255,255,255,0.18)",
                  transition: "width 0.25s ease, background 0.25s ease",
                }}/>
              ))}
            </div>

            {isLast ? (
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "rgba(124,58,237,0.35)",
                border: "1px solid rgba(124,58,237,0.6)",
                borderRadius: 99, padding: "5px 16px",
                fontSize: 13, fontWeight: 700, color: "#ddd6fe",
                letterSpacing: "0.02em",
              }}>
                Aller à la douane →
              </div>
            ) : (
              <span style={{
                fontSize: 12, color: "rgba(255,255,255,0.35)",
                letterSpacing: "0.04em", fontStyle: "italic",
              }}>
                Cliquer pour continuer
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TutorialPage() {
  return (
    <Suspense>
      <TutorialScene />
    </Suspense>
  );
}
