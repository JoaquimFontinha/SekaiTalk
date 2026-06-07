"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// ─── Light-mode palette (Cleo warm + Traqo clean) ─────────────────────────────
const BG_PAGE  = "#f7f4f0";
const BG_WHITE = "#ffffff";
const BG_DEEP  = "#eee8e1";
const COL_HEAD = "#1c1410";
const COL_BODY = "#6b5c56";
const COL_MUTED = "#a89990";
const COL_GREEN = "#05df72";

// ─── Data ──────────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: "🗾", tag: "Carte 3D",
    title: "Tokyo en immersion totale",
    desc: "Naviguez une carte 3D de Tokyo avec 44 lieux réels — konbinis, temples, gares, cafés. Chaque lieu a ses personnages et quêtes.",
    color: "#00a544",
  },
  {
    icon: "🤖", tag: "IA Claude",
    title: "Conversations naturelles alimentées par l'IA",
    desc: "Dialoguez avec des personnages japonais générés par Claude AI. Les réponses s'adaptent à votre niveau et au contexte.",
    color: "#d97706",
  },
  {
    icon: "📜", tag: "Quêtes",
    title: "Apprenez en accomplissant des missions",
    desc: "Des quêtes scénarisées vous guident dans de vraies situations — commander au konbini, demander son chemin à la gare.",
    color: "#7c3aed",
  },
  {
    icon: "🔊", tag: "Vocal",
    title: "Entraînez votre oreille et votre accent",
    desc: "TTS ElevenLabs, transcription Whisper, test de prononciation. Parlez pour de vrai, pas juste pour lire.",
    color: "#e11d48",
  },
];

const STEPS = [
  { num: "01", icon: "🏙", title: "Choisissez une ville", desc: "Tokyo vous attend au niveau 1. Osaka, Kyoto et d'autres villes se débloquent en progressant." },
  { num: "02", icon: "🚪", title: "Entrez dans un lieu",  desc: "Chaque POI a son ambiance sonore, son personnage IA et ses quêtes scénarisées." },
  { num: "03", icon: "💬", title: "Pratiquez le japonais", desc: "Conversations IA, quiz JLPT, leçons culturelles, révision SRS. Tout dans un seul lieu." },
];

const STATS = [
  { value: "44+",   label: "lieux à Tokyo"   },
  { value: "7",     label: "villes du Japon"  },
  { value: "N5→N1", label: "niveaux JLPT"    },
  { value: "100%",  label: "IA native"        },
];

const CITIES = [
  { name: "Tokyo",     nameJp: "東京", locked: false, emoji: "🗼" },
  { name: "Osaka",     nameJp: "大阪", locked: true,  emoji: "🏯" },
  { name: "Kyoto",     nameJp: "京都", locked: true,  emoji: "⛩" },
  { name: "Hiroshima", nameJp: "広島", locked: true,  emoji: "🕊" },
  { name: "Sapporo",   nameJp: "札幌", locked: true,  emoji: "❄" },
  { name: "Fukuoka",   nameJp: "福岡", locked: true,  emoji: "🌸" },
];

const NAV_LINKS = ["Fonctionnalités", "Comment ça marche", "Tarifs", "Blog"];

// ─── Responsive hook ──────────────────────────────────────────────────────────
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}

// ─── Scroll reveal ────────────────────────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".lp-reveal");
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("lp-visible"); obs.unobserve(e.target); }
      }),
      { threshold: 0.12 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
      background: scrolled ? "rgba(255,255,255,0.94)" : "transparent",
      backdropFilter: scrolled ? "blur(20px)" : "none",
      borderBottom: scrolled ? "1px solid rgba(0,0,0,0.07)" : "none",
      padding: isMobile ? "10px 20px" : "12px 32px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      transition: "background 0.3s ease, border-color 0.3s ease",
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <span style={{ fontSize: 22 }}>🗾</span>
        <span style={{
          fontSize: 16, fontWeight: 800, color: COL_HEAD,
          letterSpacing: "-0.03em", fontFamily: "system-ui, sans-serif",
        }}>SekaiTalk</span>
      </div>

      {/* Center pill nav — desktop only */}
      {!isMobile && (
        <div style={{
          display: "inline-flex", gap: 1,
          background: "#ede7e0",
          borderRadius: 99, padding: "3px",
          border: "1px solid rgba(0,0,0,0.06)",
        }}>
          {NAV_LINKS.map((label, i) => (
            <button key={i} style={{
              padding: "7px 18px", borderRadius: 99,
              background: i === 0 ? COL_HEAD : "transparent",
              color: i === 0 ? "#fff" : COL_BODY,
              fontSize: 13, fontWeight: i === 0 ? 600 : 500,
              border: "none", cursor: "pointer",
              transition: "all 0.18s",
              fontFamily: "system-ui, sans-serif",
              whiteSpace: "nowrap",
              letterSpacing: "-0.01em",
            }}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Right CTAs */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {!isMobile && (
          <Link href="/login" style={{
            padding: "8px 18px", borderRadius: 99,
            color: COL_BODY, fontSize: 13, fontWeight: 500,
            textDecoration: "none", whiteSpace: "nowrap",
          }}>
            Se connecter
          </Link>
        )}
        <Link href="/onboarding" style={{
          padding: isMobile ? "8px 16px" : "8px 22px",
          borderRadius: 99,
          background: COL_HEAD, color: "#fff",
          fontSize: 13, fontWeight: 700,
          textDecoration: "none", letterSpacing: "-0.01em",
          whiteSpace: "nowrap",
        }}>
          {isMobile ? "Commencer" : "Essayer →"}
        </Link>
      </div>
    </nav>
  );
}

// ─── 3D iPhone mockup ─────────────────────────────────────────────────────────
function IPhone3D({ loaded, scale = 1 }: { loaded: boolean; scale?: number }) {
  const [tilt, setTilt] = useState({ x: 4, y: -10 });
  const rafRef     = useRef<number>(0);
  const targetRef  = useRef({ x: 4, y: -10 });
  const currentRef = useRef({ x: 4, y: -10 });

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      const cx = window.innerWidth * 0.70;
      const cy = window.innerHeight * 0.5;
      const dx = (e.clientX - cx) / (window.innerWidth  * 0.3);
      const dy = (e.clientY - cy) / (window.innerHeight * 0.5);
      targetRef.current = {
        x: Math.max(-12, Math.min(12,  4 - dy * 8)),
        y: Math.max(-22, Math.min(4,  -10 + dx * 14)),
      };
    };
    const loop = () => {
      const { x: tx, y: ty } = targetRef.current;
      const { x: cx, y: cy } = currentRef.current;
      const nx = cx + (tx - cx) * 0.06;
      const ny = cy + (ty - cy) * 0.06;
      currentRef.current = { x: nx, y: ny };
      setTilt({ x: nx, y: ny });
      rafRef.current = requestAnimationFrame(loop);
    };
    window.addEventListener("mousemove", handleMouse, { passive: true });
    rafRef.current = requestAnimationFrame(loop);
    return () => { window.removeEventListener("mousemove", handleMouse); cancelAnimationFrame(rafRef.current); };
  }, []);

  const W = 278, H = 570;

  return (
    <div style={{
      perspective: "1100px", perspectiveOrigin: "50% 40%",
      filter: "drop-shadow(0 60px 80px rgba(0,0,0,0.22)) drop-shadow(0 20px 40px rgba(0,0,0,0.14))",
      transform: `scale(${scale})`,
      transformOrigin: "center top",
    }}>
      <div style={{
        width: W, height: H,
        transform: loaded
          ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
          : "rotateX(6deg) rotateY(28deg) scale(0.9)",
        transition: loaded ? "none" : "transform 1.2s cubic-bezier(0.16,1,0.3,1)",
        transformStyle: "preserve-3d",
        borderRadius: 46,
        background: "linear-gradient(160deg, #2e2e30 0%, #1c1c1e 55%, #141414 100%)",
        boxShadow: [
          "inset 0 1px 0 rgba(255,255,255,0.14)",
          "inset 0 -1px 0 rgba(0,0,0,0.45)",
          "0 0 0 1px rgba(255,255,255,0.07)",
        ].join(", "),
        position: "relative", flexShrink: 0,
      }}>
        {/* Screen */}
        <div style={{ position: "absolute", inset: 7, borderRadius: 40, overflow: "hidden", background: "#000" }}>
          {/* Dynamic island */}
          <div style={{
            position: "absolute", top: 11, left: "50%", transform: "translateX(-50%)",
            width: 110, height: 32, borderRadius: 20,
            background: "#000", zIndex: 10, border: "1.5px solid #1c1c1e",
          }}/>
          {/* App bg */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, #090f1a 0%, #101726 100%)" }}>
            {/* Status bar */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 50,
              display: "flex", alignItems: "flex-end", padding: "0 18px 6px", justifyContent: "space-between", zIndex: 5,
            }}>
              <span style={{ color: "white", fontSize: 10, fontWeight: 700 }}>9:41</span>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <svg width="13" height="9" viewBox="0 0 13 9" fill="none">
                  <rect x="0.5" y="4" width="2" height="5" rx="0.5" fill="white" opacity="0.4"/>
                  <rect x="3.5" y="3" width="2" height="6" rx="0.5" fill="white" opacity="0.65"/>
                  <rect x="6.5" y="1.5" width="2" height="7.5" rx="0.5" fill="white" opacity="0.85"/>
                  <rect x="9.5" y="0" width="2" height="9" rx="0.5" fill="white"/>
                </svg>
                <svg width="16" height="9" viewBox="0 0 16 9" fill="none">
                  <rect x="0.5" y="0.5" width="12" height="8" rx="1.5" stroke="white" strokeOpacity="0.45"/>
                  <rect x="1.5" y="1.5" width="9" height="6" rx="0.8" fill="white"/>
                  <path d="M13.5 3v3" stroke="white" strokeOpacity="0.45" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            {/* Map + sidebar */}
            <div style={{ position: "absolute", top: 50, left: 0, right: 0, bottom: 0, display: "flex" }}>
              {/* Sidebar */}
              <div style={{
                width: 52, background: "rgba(255,255,255,0.025)",
                borderRight: "1px solid rgba(255,255,255,0.05)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 14, paddingTop: 12,
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 7,
                  background: `linear-gradient(135deg, ${COL_GREEN}, #00a544)`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
                }}>🗾</div>
                {["🧭","📍","👥","📅"].map((ic, idx) => (
                  <div key={idx} style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: idx === 1 ? "rgba(5,223,114,0.18)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11,
                  }}>{ic}</div>
                ))}
              </div>
              {/* Map */}
              <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #0a1628, #0d1f3c)" }}>
                <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.18 }}>
                  <path d="M0,58 Q50,48 82,62 T190,52" stroke="rgba(255,255,255,0.6)" strokeWidth="2" fill="none"/>
                  <path d="M42,0 L46,165" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" fill="none"/>
                  <path d="M112,0 L106,165" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" fill="none"/>
                </svg>
                {[
                  { x: 36, y: 40, color: COL_GREEN, l: "コンビニ" },
                  { x: 55, y: 60, color: "#38bdf8",  l: "駅" },
                  { x: 73, y: 28, color: "#c084fc",  l: "寺" },
                  { x: 22, y: 73, color: "#fb923c",  l: "居酒屋" },
                ].map(({ x, y, color, l }, idx) => (
                  <div key={idx} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}`, border: "1px solid rgba(255,255,255,0.7)" }}/>
                    <div style={{ background: "rgba(255,255,255,0.92)", color: "#111", fontSize: 5, fontWeight: 700, padding: "0 3px", borderRadius: 3, whiteSpace: "nowrap", fontFamily: "serif" }}>{l}</div>
                  </div>
                ))}
                <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(5,223,114,0.15)", border: "1px solid rgba(5,223,114,0.4)", borderRadius: 6, padding: "3px 7px", display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: COL_GREEN }}/>
                  <span style={{ color: COL_GREEN, fontSize: 6, fontWeight: 700 }}>Quête · 2/4</span>
                </div>
                <div style={{ position: "absolute", bottom: 10, right: 8, left: 18, background: "rgba(9,13,24,0.96)", border: "1px solid rgba(5,223,114,0.28)", borderRadius: "8px 8px 2px 8px", padding: "6px 8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
                    <div style={{ width: 13, height: 13, borderRadius: "50%", background: `linear-gradient(135deg, ${COL_GREEN}, #00a544)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 6 }}>🧑</div>
                    <span style={{ color: COL_GREEN, fontSize: 6, fontWeight: 700 }}>Kenji</span>
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.88)", fontSize: 7, margin: 0, lineHeight: 1.5, fontFamily: "serif" }}>
                    いらっしゃいませ！<br/>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 6 }}>Bienvenue !</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Buttons */}
        <div style={{ position: "absolute", left: -3, top: 100, width: 3, height: 28, borderRadius: "2px 0 0 2px", background: "#3c3c3e" }}/>
        <div style={{ position: "absolute", left: -3, top: 138, width: 3, height: 48, borderRadius: "2px 0 0 2px", background: "#3c3c3e" }}/>
        <div style={{ position: "absolute", left: -3, top: 196, width: 3, height: 48, borderRadius: "2px 0 0 2px", background: "#3c3c3e" }}/>
        <div style={{ position: "absolute", right: -3, top: 148, width: 3, height: 68, borderRadius: "0 2px 2px 0", background: "#3c3c3e" }}/>
        <div style={{ position: "absolute", bottom: 13, left: "50%", transform: "translateX(-50%)", width: 102, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.22)" }}/>
      </div>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  const [loaded, setLoaded] = useState(false);
  const isMobile = useIsMobile();
  useEffect(() => { const t = setTimeout(() => setLoaded(true), 80); return () => clearTimeout(t); }, []);

  return (
    <section style={{
      position: "relative", minHeight: "100vh",
      background: BG_PAGE, overflow: "hidden",
      display: "flex", alignItems: "center",
      padding: isMobile ? "88px 0 60px" : "100px 0 80px",
    }}>
      {/* Gradient blobs */}
      <div style={{
        position: "absolute", top: -120, left: -120,
        width: 520, height: 520, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(5,223,114,0.14) 0%, transparent 70%)",
        filter: "blur(40px)", pointerEvents: "none",
      }}/>
      <div style={{
        position: "absolute", top: -80, right: -80,
        width: 560, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(217,119,6,0.1) 0%, transparent 70%)",
        filter: "blur(50px)", pointerEvents: "none",
      }}/>

      <div style={{
        maxWidth: 1200, margin: "0 auto", width: "100%",
        padding: isMobile ? "0 24px" : "0 56px",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "flex-start" : "center",
        gap: isMobile ? 48 : 64,
      }}>
        {/* Left — text */}
        <div style={{ flex: isMobile ? "unset" : "0 0 520px", width: "100%" }}>
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "5px 14px 5px 8px", borderRadius: 99,
            background: "rgba(5,223,114,0.1)",
            border: "1px solid rgba(5,223,114,0.28)",
            marginBottom: 28,
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateY(0)" : "translateY(14px)",
            transition: "all 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s",
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: "50%",
              background: COL_GREEN,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11,
            }}>🇯🇵</div>
            <span style={{ color: "#00a544", fontSize: 12.5, fontWeight: 600, letterSpacing: "-0.01em" }}>
              Apprendre le japonais autrement
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: isMobile ? "2.6rem" : "clamp(3rem, 4.8vw, 4.4rem)",
            fontWeight: 900, lineHeight: 1.06,
            letterSpacing: "-0.04em",
            color: COL_HEAD, margin: "0 0 18px",
            fontFamily: "system-ui, -apple-system, sans-serif",
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateY(0)" : "translateY(22px)",
            transition: "all 0.8s cubic-bezier(0.16,1,0.3,1) 0.2s",
          }}>
            Parlez japonais<br/>
            <span style={{ color: "#00a544" }}>en explorant</span><br/>
            <span style={{ color: "#00a544" }}>Tokyo.</span>
          </h1>

          <p style={{
            fontSize: "1rem", color: COL_BODY,
            maxWidth: "100%", lineHeight: 1.72, margin: "0 0 32px",
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateY(0)" : "translateY(14px)",
            transition: "all 0.8s cubic-bezier(0.16,1,0.3,1) 0.32s",
          }}>
            Conversations IA, quêtes scénarisées, carte 3D interactive.
            La seule app qui vous plonge dans le Japon réel.
          </p>

          {/* CTAs */}
          <div style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: 12, alignItems: isMobile ? "stretch" : "center",
            marginBottom: 20,
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateY(0)" : "translateY(14px)",
            transition: "all 0.8s cubic-bezier(0.16,1,0.3,1) 0.44s",
          }}>
            <Link href="/onboarding" style={{
              padding: "14px 30px", borderRadius: 99,
              background: COL_HEAD, color: "#fff",
              fontSize: 14, fontWeight: 700,
              textDecoration: "none", letterSpacing: "-0.01em",
              boxShadow: "0 4px 16px rgba(28,20,16,0.22)",
              textAlign: "center",
            }}>
              Créer mon compte gratuit →
            </Link>
            <Link href="/login" style={{
              padding: "14px 22px", borderRadius: 99,
              border: "1.5px solid " + BG_DEEP,
              color: COL_BODY, fontSize: 14, fontWeight: 500,
              textDecoration: "none", background: BG_WHITE,
              letterSpacing: "-0.01em",
              textAlign: "center",
            }}>
              Se connecter
            </Link>
          </div>

          {/* Trust line */}
          <div style={{
            opacity: loaded ? 0.7 : 0,
            transition: "all 0.8s cubic-bezier(0.16,1,0.3,1) 0.56s",
          }}>
            <p style={{ color: COL_MUTED, fontSize: 12, margin: "0 0 8px" }}>
              Gratuit pour commencer · Sans carte de crédit
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              {["✓ Conversations IA", "✓ Carte 3D Tokyo", "✓ Révision JLPT"].map((t, i) => (
                <span key={i} style={{ color: COL_MUTED, fontSize: 12, fontWeight: 500 }}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* iPhone mockup */}
        <div style={{
          flex: 1, display: "flex",
          justifyContent: isMobile ? "center" : "center",
          alignItems: "center",
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.9s cubic-bezier(0.16,1,0.3,1) 0.55s",
          ...(isMobile ? { height: 340, overflow: "hidden" } : {}),
        }}>
          <IPhone3D loaded={loaded} scale={isMobile ? 0.58 : 1} />
        </div>
      </div>
    </section>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────
function StatsBar() {
  const isMobile = useIsMobile();
  return (
    <div style={{
      background: BG_WHITE,
      borderTop: `1px solid ${BG_DEEP}`,
      borderBottom: `1px solid ${BG_DEEP}`,
      padding: isMobile ? "28px 24px" : "36px 48px",
    }}>
      <div style={{
        maxWidth: 900, margin: "0 auto",
        display: "grid",
        gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)",
        gap: isMobile ? "24px 0" : 0,
      }}>
        {STATS.map(({ value, label }, i) => (
          <div key={i} style={{
            display: "flex", flexDirection: "column", alignItems: "center", padding: "0 16px",
            borderRight: isMobile
              ? (i % 2 === 0 ? `1px solid ${BG_DEEP}` : "none")
              : (i < 3 ? `1px solid ${BG_DEEP}` : "none"),
          }}>
            <span style={{
              fontSize: "2rem", fontWeight: 900, color: COL_HEAD,
              letterSpacing: "-0.04em", lineHeight: 1, fontFamily: "system-ui, sans-serif",
            }}>{value}</span>
            <span style={{ color: COL_MUTED, fontSize: 12, marginTop: 4, fontWeight: 500 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
function Features() {
  const isMobile = useIsMobile();
  return (
    <section style={{ background: BG_PAGE, padding: isMobile ? "72px 24px" : "110px 48px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className="lp-reveal" style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{
            display: "inline-block", padding: "5px 16px", borderRadius: 99,
            background: "rgba(28,20,16,0.06)",
            color: COL_BODY, fontSize: 11, fontWeight: 700,
            letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 18,
          }}>Fonctionnalités</div>
          <h2 style={{
            fontSize: isMobile ? "1.9rem" : "clamp(2rem,3.8vw,3rem)",
            fontWeight: 900,
            color: COL_HEAD, margin: "0 0 12px",
            letterSpacing: "-0.04em", lineHeight: 1.05, fontFamily: "system-ui, sans-serif",
          }}>
            Tout pour parler japonais,<br/>
            <span style={{ color: COL_MUTED }}>rien de superflu.</span>
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)",
          gap: 18,
        }}>
          {FEATURES.map(({ icon, tag, title, desc, color }, i) => (
            <div key={i} className={`lp-reveal lp-reveal-d${i + 1}`} style={{
              background: BG_WHITE,
              border: `1px solid ${BG_DEEP}`,
              borderRadius: 20, padding: "28px",
              transition: "transform 0.22s ease, box-shadow 0.22s ease",
              cursor: "default",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "0 16px 40px rgba(28,20,16,0.08)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
            }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "4px 13px", borderRadius: 99,
                background: color + "15", marginBottom: 16,
              }}>
                <span style={{ fontSize: 14 }}>{icon}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: "0.06em", textTransform: "uppercase" }}>{tag}</span>
              </div>
              <h3 style={{
                color: COL_HEAD, fontSize: "1.05rem", fontWeight: 700,
                margin: "0 0 10px", lineHeight: 1.35, letterSpacing: "-0.02em",
                fontFamily: "system-ui, sans-serif",
              }}>{title}</h3>
              <p style={{ color: COL_BODY, fontSize: 14, lineHeight: 1.72, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const isMobile = useIsMobile();
  return (
    <section style={{ background: BG_WHITE, padding: isMobile ? "72px 24px" : "110px 48px", borderTop: `1px solid ${BG_DEEP}` }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div className="lp-reveal" style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{
            display: "inline-block", padding: "5px 16px", borderRadius: 99,
            background: "rgba(0,165,68,0.1)", color: "#00a544",
            fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 18,
          }}>Comment ça marche</div>
          <h2 style={{
            fontSize: isMobile ? "1.9rem" : "clamp(2rem,3.8vw,3rem)",
            fontWeight: 900,
            color: COL_HEAD, margin: 0,
            letterSpacing: "-0.04em", lineHeight: 1.05, fontFamily: "system-ui, sans-serif",
          }}>
            En 3 étapes,<br/>vous êtes dans le bain.
          </h2>
        </div>

        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 32 : 0,
          position: "relative",
        }}>
          {!isMobile && (
            <div style={{
              position: "absolute", top: 28, left: "calc(16.6% + 20px)", right: "calc(16.6% + 20px)",
              height: 1, background: `linear-gradient(90deg, ${COL_GREEN}55, ${BG_DEEP}, ${COL_GREEN}55)`,
            }}/>
          )}
          {STEPS.map(({ num, title, desc, icon }, i) => (
            <div key={i} className={`lp-reveal lp-reveal-d${i + 1}`} style={{
              flex: 1,
              display: "flex",
              flexDirection: isMobile ? "row" : "column",
              alignItems: isMobile ? "flex-start" : "center",
              textAlign: isMobile ? "left" : "center",
              padding: isMobile ? "0" : "0 32px",
              gap: isMobile ? 16 : 0,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: i === 0 ? COL_HEAD : BG_PAGE,
                border: i === 0 ? "none" : `1.5px solid ${BG_DEEP}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22,
                marginBottom: isMobile ? 0 : 22,
                position: "relative", zIndex: 1,
                boxShadow: i === 0 ? "0 4px 16px rgba(28,20,16,0.2)" : "none",
                flexShrink: 0,
              }}>{icon}</div>
              <div>
                <div style={{ color: "#00a544", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", marginBottom: 6, opacity: 0.8 }}>
                  ÉTAPE {num}
                </div>
                <h3 style={{
                  color: COL_HEAD, fontSize: "1rem", fontWeight: 700,
                  margin: "0 0 8px", lineHeight: 1.35,
                  letterSpacing: "-0.02em", fontFamily: "system-ui, sans-serif",
                }}>{title}</h3>
                <p style={{ color: COL_BODY, fontSize: 13, lineHeight: 1.72, margin: 0 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Cities ───────────────────────────────────────────────────────────────────
function Cities() {
  const isMobile = useIsMobile();
  return (
    <section style={{ background: BG_PAGE, padding: isMobile ? "72px 24px" : "110px 48px", borderTop: `1px solid ${BG_DEEP}` }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div className="lp-reveal" style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            display: "inline-block", padding: "5px 16px", borderRadius: 99,
            background: "rgba(28,20,16,0.06)", color: COL_BODY,
            fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 18,
          }}>Destinations</div>
          <h2 style={{
            fontSize: isMobile ? "1.9rem" : "clamp(2rem,3.8vw,3rem)",
            fontWeight: 900,
            color: COL_HEAD, margin: "0 0 12px",
            letterSpacing: "-0.04em", lineHeight: 1.05, fontFamily: "system-ui, sans-serif",
          }}>7 villes. Des dizaines d'aventures.</h2>
          <p style={{ color: COL_BODY, fontSize: 15, margin: 0 }}>
            Commencez à Tokyo. Débloquez le reste en progressant.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(3,1fr)",
          gap: 14,
        }}>
          {CITIES.map(({ name, nameJp, locked, emoji }, i) => (
            <div key={i} className={`lp-reveal lp-reveal-d${Math.min(i + 1, 4)}`} style={{
              position: "relative", borderRadius: 18, padding: isMobile ? "20px 16px" : "26px 22px",
              background: locked ? "rgba(28,20,16,0.03)" : BG_WHITE,
              border: `1px solid ${locked ? BG_DEEP : COL_MUTED + "55"}`,
              opacity: locked ? 0.55 : 1,
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={e => {
              if (!locked) {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 10px 28px rgba(28,20,16,0.09)";
              }
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
            }}>
              {!locked && (
                <div style={{
                  position: "absolute", top: 10, right: 10,
                  background: COL_GREEN + "22",
                  border: `1px solid ${COL_GREEN}66`,
                  borderRadius: 99, padding: "2px 8px",
                  fontSize: 9, fontWeight: 700, color: "#00a544",
                  letterSpacing: "0.06em",
                }}>DISPO</div>
              )}
              {locked && <div style={{ position: "absolute", top: 12, right: 12, fontSize: 14, opacity: 0.3 }}>🔒</div>}
              <div style={{ fontSize: 30, marginBottom: 8 }}>{emoji}</div>
              <div style={{ color: COL_HEAD, fontSize: 14, fontWeight: 700, fontFamily: "system-ui, sans-serif" }}>{name}</div>
              <div style={{ color: COL_MUTED, fontSize: 13, fontFamily: "serif" }}>{nameJp}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────
function FinalCTA() {
  const isMobile = useIsMobile();
  return (
    <section style={{
      position: "relative", overflow: "hidden",
      background: COL_HEAD,
      padding: isMobile ? "80px 24px" : "130px 48px",
      textAlign: "center",
    }}>
      <div style={{ position: "absolute", top: -80, left: "20%", width: 400, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(5,223,114,0.12) 0%, transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }}/>
      <div style={{ position: "absolute", bottom: -60, right: "15%", width: 350, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(5,223,114,0.09) 0%, transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }}/>

      <div className="lp-reveal" style={{ position: "relative" }}>
        <div style={{ fontSize: "3.2rem", marginBottom: 18, display: "inline-block" }}>🗾</div>
        <h2 style={{
          fontSize: isMobile ? "2rem" : "clamp(2.4rem,5.5vw,4.2rem)",
          fontWeight: 900,
          color: "#f8f6f2", margin: "0 0 16px",
          letterSpacing: "-0.04em", lineHeight: 1.06, fontFamily: "system-ui, sans-serif",
        }}>
          Prêt à parler japonais ?
        </h2>
        <p style={{
          color: "rgba(248,246,242,0.55)", fontSize: isMobile ? "0.95rem" : "1.05rem",
          maxWidth: 460, margin: "0 auto 36px", lineHeight: 1.72,
        }}>
          Rejoignez SekaiTalk et explorez le Japon comme vous n'avez jamais imaginé l'apprendre.
        </p>
        <Link href="/onboarding" style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          padding: isMobile ? "14px 32px" : "15px 40px", borderRadius: 99,
          background: COL_GREEN, color: COL_HEAD,
          fontSize: 15, fontWeight: 700,
          textDecoration: "none", letterSpacing: "-0.01em",
          boxShadow: "0 0 40px rgba(5,223,114,0.28)",
        }}>
          Commencer gratuitement <span style={{ fontSize: 17 }}>→</span>
        </Link>
        <p style={{ color: "rgba(248,246,242,0.28)", fontSize: 12, marginTop: 18 }}>
          Aucune carte de crédit requise · Gratuit pour commencer
        </p>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const isMobile = useIsMobile();
  return (
    <footer style={{
      background: "#0f0c0a",
      borderTop: "1px solid rgba(255,255,255,0.06)",
      padding: isMobile ? "28px 24px" : "36px 48px",
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: isMobile ? 16 : 0,
      textAlign: isMobile ? "center" : "left",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <span style={{ fontSize: 18 }}>🗾</span>
        <span style={{ color: COL_MUTED, fontSize: 13, fontWeight: 600, fontFamily: "system-ui, sans-serif" }}>SekaiTalk</span>
      </div>
      <span style={{ color: "rgba(168,153,144,0.38)", fontSize: 12 }}>
        © 2026 SekaiTalk · Apprenez le japonais autrement
      </span>
      <div style={{ display: "flex", gap: 24 }}>
        {["Connexion","Inscription"].map((l, i) => (
          <Link key={i} href={i === 0 ? "/login" : "/onboarding"} style={{
            color: "rgba(168,153,144,0.45)", fontSize: 13, textDecoration: "none", fontWeight: 500,
          }}>{l}</Link>
        ))}
      </div>
    </footer>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  useScrollReveal();
  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <Nav />
      <Hero />
      <StatsBar />
      <Features />
      <HowItWorks />
      <Cities />
      <FinalCTA />
      <Footer />
    </div>
  );
}
