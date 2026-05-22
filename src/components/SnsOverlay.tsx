"use client";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { SnsConversation, SnsChoice, SnsStep } from "@/lib/sns-conversations";

// ── Phone dimensions (same as PhoneOverlay) ───────────────────────────────────
const PH  = 720;
const PW  = Math.round(PH * 37 / 76); // 351
const BR  = 50;
const BW  = 3;
const PAD = 10;
const SBR = BR - PAD;
const HUE = 284;

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

const sectionBg = (bottom: boolean) => [
  `radial-gradient(100% 70% at 110% 100%, hsla(${HUE-45},100%,50%,${bottom ? .45 : .65}) 33%, transparent)`,
  `radial-gradient(100% 70% at -10% 100%, hsla(${HUE-45},100%,50%,${bottom ? .45 : .65}) 33%, transparent)`,
  `radial-gradient(150% 100% at 50% 82%, hsla(${HUE+33},100%,${bottom ? 90 : 82}%,${bottom ? .45 : .6}) 35%, transparent)`,
  `hsl(${HUE},100%,${bottom ? 78 : 38}%)`,
].join(", ");

function StatusIcons({ dark = false }: { dark?: boolean }) {
  const fill = dark ? "#333" : "white";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <svg width="17" height="12" viewBox="0 0 17 12" fill={fill}>
        <rect x="0"    y="7.5" width="3" height="4.5" rx="0.5"/>
        <rect x="4.5"  y="5"   width="3" height="7"   rx="0.5"/>
        <rect x="9"    y="2"   width="3" height="10"  rx="0.5"/>
        <rect x="13.5" y="0"   width="3" height="12"  rx="0.5" fillOpacity="0.3"/>
      </svg>
      <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
        <circle cx="8" cy="11" r="1.5" fill={fill}/>
        <path d="M4.2 7.5a5.4 5.4 0 017.6 0"  stroke={fill} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M1.5 4.8A9 9 0 0114.5 4.8"   stroke={fill} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <svg width="26" height="13" viewBox="0 0 26 13">
        <rect x="0.5" y="0.5" width="21" height="12" rx="3.5" stroke={fill} strokeOpacity={dark ? 0.5 : 0.35} fill="none"/>
        <rect x="2"   y="2"   width="15" height="9"  rx="2" fill={fill}/>
        <path d="M23 4.5v4a2 2 0 000-4z" fill={fill} fillOpacity="0.4"/>
      </svg>
    </div>
  );
}

function DynamicIsland() {
  return (
    <div style={{ position: "absolute", zIndex: 12, top: 10, left: 10, right: 10, display: "flex", justifyContent: "center" }}>
      <div style={{ position: "relative", overflow: "hidden", width: "44%", height: 34, borderRadius: 20 }}>
        <div style={{ position: "absolute", inset: 0, background: "#000", borderRadius: "inherit" }}/>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 14 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#060820", boxShadow: "inset 0 0 3px #4c4da3" }}/>
        </div>
      </div>
    </div>
  );
}

type Phase = "intro" | "chat" | "result";
type Rendered = { step: SnsStep; chosen?: SnsChoice };

function ContactAvatar({ image, avatar, size = 40 }: { image?: string; avatar: string; size?: number }) {
  const [err, setErr] = useState(false);
  if (image && !err) {
    return (
      <img
        src={image}
        alt=""
        onError={() => setErr(true)}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "linear-gradient(135deg, #07C160, #04883e)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.45,
    }}>
      {avatar}
    </div>
  );
}

export default function SnsOverlay({
  conversation,
  onClose,
}: {
  conversation: SnsConversation;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<Phase>("intro");
  const [idx, setIdx] = useState(0);
  const [rendered, setRendered] = useState<Rendered[]>([]);
  const [typing, setTyping] = useState(false);
  const [awaitingChoice, setAwaitingChoice] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showTr, setShowTr] = useState(true);
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("ja-JP", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit", hour12: false })
  );
  const endRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  const steps = conversation.steps;
  const totalChoices = steps.filter(s => s.from === "you").length;
  const { name, handle, avatar, image, relation } = conversation.contact;

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

  useEffect(() => {
    if (phase !== "chat") return;
    if (idx >= steps.length) {
      const t = setTimeout(() => setPhase("result"), 800);
      return () => clearTimeout(t);
    }
    const step = steps[idx];
    if (step.from === "you") {
      setAwaitingChoice(true);
      return;
    }
    setTyping(true);
    const delay = 800 + Math.random() * 500;
    const t = setTimeout(() => {
      setTyping(false);
      setRendered(p => [...p, { step }]);
      setIdx(i => i + 1);
    }, delay);
    return () => clearTimeout(t);
  }, [phase, idx, steps]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [rendered.length, typing, awaitingChoice]);

  function pick(choice: SnsChoice) {
    const step = steps[idx];
    setRendered(p => [...p, { step, chosen: choice }]);
    setScore(s => ({ correct: s.correct + (choice.correct ? 1 : 0), total: s.total + 1 }));
    setAwaitingChoice(false);
    setIdx(i => i + 1);
  }

  const phoneFrame = (children: React.ReactNode) => (
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
      <div
        style={{
          position: "relative", width: PW, height: PH,
          borderRadius: BR, background: "#040404",
          transform: visible ? "scale(1) translateY(0)" : "scale(0.88) translateY(32px)",
          transformOrigin: "center center",
          opacity: visible ? 1 : 0,
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

        {/* Screen */}
        <div style={{
          position: "absolute", inset: 0,
          borderRadius: BR, border: `${PAD}px solid black`,
          overflow: "hidden",
          display: "flex", flexDirection: "column",
        }}>
          {children}
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

  // ── Intro (home screen with LINE notification) ────────────────────────────
  if (phase === "intro") return phoneFrame(
    <>
      {/* Gradient BG */}
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

      <DynamicIsland />

      {/* Status bar */}
      <div style={{
        position: "relative", zIndex: 6, width: "100%",
        paddingTop: 16, paddingLeft: 26, paddingRight: 26,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        color: "white", flexShrink: 0,
      }}>
        <span style={{ fontSize: 15.5, fontWeight: 600 }}>{time}</span>
        <StatusIcons />
      </div>

      {/* Clock */}
      <div style={{ position: "relative", zIndex: 6, textAlign: "center", paddingTop: 4, color: "white", flexShrink: 0 }}>
        <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.42)", letterSpacing: "0.1em" }}>Tokyo · 東京</p>
        <p style={{ fontSize: 58, fontWeight: 200, lineHeight: 1.0, letterSpacing: "-0.025em" }}>{time}</p>
      </div>

      {/* LINE notification banner */}
      <div style={{ position: "relative", zIndex: 6, padding: "18px 14px 0", flexShrink: 0 }}>
        <div style={{
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.18)",
          padding: "10px 12px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{
              width: 22, height: 22, borderRadius: 6,
              background: "linear-gradient(135deg,#07C160,#04883e)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, flexShrink: 0,
            }}>💬</div>
            <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 11, fontWeight: 700, letterSpacing: "0.02em" }}>LINE</span>
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, marginLeft: "auto" }}>maintenant</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ContactAvatar image={image} avatar={avatar} size={34} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: "white", fontSize: 12, fontWeight: 700, marginBottom: 1 }}>{name}</p>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {steps[0]?.jp ?? "..."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Context + CTA */}
      <div style={{ position: "relative", zIndex: 6, padding: "14px 14px 0", flexShrink: 0 }}>
        <div style={{
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.08)",
          padding: "10px 12px",
        }}>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 10.5, lineHeight: 1.5, marginBottom: 8 }}>{conversation.context}</p>
          <div style={{ display: "flex", gap: 8, fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
            <span>💬 {totalChoices} choix</span>
            <span>⭐ {conversation.xpReward} XP</span>
            <span>🇯🇵 Argot jeune</span>
          </div>
        </div>
      </div>

      {/* Start button */}
      <div style={{ position: "relative", zIndex: 6, padding: "12px 14px 0", flexShrink: 0 }}>
        <button
          onClick={() => setPhase("chat")}
          style={{
            width: "100%", padding: "11px 0", borderRadius: 14,
            background: "linear-gradient(135deg,#07C160,#04883e)",
            border: "none", color: "white", fontSize: 13, fontWeight: 700,
            cursor: "pointer", boxShadow: "0 4px 16px rgba(7,193,96,0.4)",
          }}
        >
          Ouvrir →
        </button>
      </div>

      {/* Home indicator */}
      <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", width: 130, height: 5, background: "rgba(255,255,255,0.28)", borderRadius: 3, zIndex: 6 }}/>
    </>
  );

  // ── Result ────────────────────────────────────────────────────────────────
  if (phase === "result") {
    const pct = totalChoices > 0 ? Math.round((score.correct / totalChoices) * 100) : 100;
    const msg = pct === 100 ? "Parfait ! 🎉"
              : pct >= 67  ? "Bien joué ! ✨"
              :               "Continue ! 💪";
    return phoneFrame(
      <>
        {/* White bg */}
        <div style={{ position: "absolute", inset: 0, background: "#f5f5f5", borderRadius: SBR }}/>
        <DynamicIsland />
        {/* Status bar dark */}
        <div style={{
          position: "relative", zIndex: 6, width: "100%",
          paddingTop: 16, paddingLeft: 26, paddingRight: 26,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 15.5, fontWeight: 600, color: "#111" }}>{time}</span>
          <StatusIcons dark />
        </div>
        {/* Result content */}
        <div style={{
          position: "relative", zIndex: 6, flex: 1,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 12, padding: "0 20px",
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: pct === 100 ? "#d1fae5" : pct >= 67 ? "#dbeafe" : "#fee2e2",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36,
          }}>
            {pct === 100 ? "🎉" : pct >= 67 ? "😊" : "😅"}
          </div>
          <p style={{ fontSize: 32, fontWeight: 900, color: "#111", margin: 0 }}>{score.correct} / {totalChoices}</p>
          <p style={{ fontSize: 12, color: "#666", margin: 0 }}>{msg}</p>
          {/* Progress bar */}
          <div style={{ width: "100%", height: 8, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: "#07C160", borderRadius: 4, transition: "width 0.6s ease" }}/>
          </div>
          <p style={{ fontSize: 11, color: "#07C160", fontWeight: 700, margin: 0 }}>+{conversation.xpReward} XP gagnés</p>
          <button
            onClick={onClose}
            style={{
              marginTop: 4, width: "100%", padding: "11px 0", borderRadius: 14,
              background: "#111", border: "none", color: "white",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}
          >
            Terminer
          </button>
        </div>
        <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", width: 130, height: 5, background: "rgba(0,0,0,0.15)", borderRadius: 3, zIndex: 6 }}/>
      </>
    );
  }

  // ── Chat ──────────────────────────────────────────────────────────────────
  return phoneFrame(
    <>
      {/* White bg */}
      <div style={{ position: "absolute", inset: 0, background: "#fff", borderRadius: SBR }}/>
      <DynamicIsland />
      {/* Status bar */}
      <div style={{
        position: "relative", zIndex: 6, width: "100%",
        paddingTop: 16, paddingLeft: 26, paddingRight: 26,
        display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
      }}>
        <span style={{ fontSize: 15.5, fontWeight: 600, color: "#111" }}>{time}</span>
        <StatusIcons dark />
      </div>

      {/* Chat header */}
      <div style={{
        position: "relative", zIndex: 6,
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 14px 8px",
        borderBottom: "1px solid #e5e7eb", flexShrink: 0,
        background: "white",
      }}>
        <ContactAvatar image={image} avatar={avatar} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#111", margin: 0, lineHeight: 1.2 }}>{name}</p>
          <p style={{ fontSize: 10, color: "#07C160", margin: 0 }}>{handle}</p>
        </div>
        <button
          onClick={() => setShowTr(t => !t)}
          style={{
            fontSize: 10, padding: "3px 8px", borderRadius: 12, border: "none", cursor: "pointer",
            background: showTr ? "rgba(7,193,96,0.12)" : "#f3f4f6",
            color: showTr ? "#07C160" : "#9ca3af", fontWeight: 700,
          }}
        >
          🇫🇷 trad.
        </button>
      </div>

      {/* Messages */}
      <div
        ref={messagesRef}
        style={{
          position: "relative", zIndex: 6,
          flex: 1, minHeight: 0, overflowY: "auto",
          padding: "10px 10px 6px",
          display: "flex", flexDirection: "column", gap: 6,
          background: "#e8ecf1",
        }}
      >
        {rendered.map((item, i) => {
          if (item.step.from === "them") return (
            <div key={i} style={{ display: "flex", alignItems: "flex-end", gap: 6, alignSelf: "flex-start", maxWidth: "82%" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, marginBottom: 2, overflow: "hidden" }}>
                <ContactAvatar image={image} avatar={avatar} size={24} />
              </div>
              <div>
                <div style={{
                  background: "white", borderRadius: "14px 14px 14px 3px",
                  padding: "7px 10px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}>
                  <p style={{ fontSize: 12, color: "#111", margin: 0, lineHeight: 1.45 }}>{item.step.jp}</p>
                </div>
                {showTr && <p style={{ fontSize: 9.5, color: "#9ca3af", margin: "2px 0 0 4px" }}>{item.step.fr}</p>}
              </div>
            </div>
          );

          const ok = item.chosen?.correct ?? false;
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", alignSelf: "flex-end", maxWidth: "82%" }}>
              <div style={{
                background: ok ? "#07C160" : "#f87171",
                borderRadius: "14px 14px 3px 14px",
                padding: "7px 10px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
              }}>
                <p style={{ fontSize: 12, color: "white", margin: 0, lineHeight: 1.45 }}>{item.chosen?.jp}</p>
              </div>
              {showTr && item.chosen && (
                <p style={{ fontSize: 9.5, color: "#9ca3af", margin: "2px 4px 0 0" }}>{item.chosen.fr}</p>
              )}
              {!ok && item.chosen?.feedback && (
                <p style={{ fontSize: 9.5, color: "#ef4444", margin: "1px 4px 0 0" }}>✗ {item.chosen.feedback}</p>
              )}
            </div>
          );
        })}

        {typing && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, alignSelf: "flex-start" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, overflow: "hidden" }}>
              <ContactAvatar image={image} avatar={avatar} size={24} />
            </div>
            <div style={{
              background: "white", borderRadius: "14px 14px 14px 3px",
              padding: "10px 14px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              display: "flex", gap: 4, alignItems: "center",
            }}>
              {[0, 1, 2].map(j => (
                <div
                  key={j}
                  className="animate-bounce"
                  style={{ width: 6, height: 6, background: "#9ca3af", borderRadius: "50%", animationDelay: `${j * 160}ms` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Choices */}
      {awaitingChoice && steps[idx]?.choices && (
        <div style={{
          position: "relative", zIndex: 6,
          background: "white", borderTop: "1px solid #e5e7eb",
          padding: "8px 10px 10px", flexShrink: 0,
        }}>
          <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: "#9ca3af", fontWeight: 700, margin: "0 0 6px" }}>
            Choisissez
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {steps[idx].choices!.map(c => (
              <button
                key={c.id}
                onClick={() => pick(c)}
                style={{
                  width: "100%", textAlign: "left",
                  borderRadius: 10, border: "1px solid #e5e7eb",
                  background: "#f9fafb", padding: "7px 10px",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 11.5, fontWeight: 600, color: "#374151", display: "block" }}>{c.jp}</span>
                {showTr && <span style={{ fontSize: 9.5, color: "#9ca3af", display: "block", marginTop: 1 }}>{c.fr}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Home indicator */}
      <div style={{
        position: "relative", zIndex: 6,
        display: "flex", justifyContent: "center", alignItems: "center",
        padding: "4px 0 6px", flexShrink: 0, background: "white",
      }}>
        <div style={{ width: 100, height: 4, background: "rgba(0,0,0,0.15)", borderRadius: 3 }}/>
      </div>
    </>
  );
}
