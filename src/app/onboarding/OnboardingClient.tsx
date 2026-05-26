"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

// ─── Palette ──────────────────────────────────────────────────────────────────

const C = {
  bg:      "#f7f4f0",
  head:    "#1c1410",
  body:    "#6b5c56",
  muted:   "#a89990",
  green:   "#05df72",
  greenDk: "#00a544",
  border:  "#e8e0d8",
  inputBg: "#faf8f5",
  error:   "#e11d48",
};

// ─── Data ─────────────────────────────────────────────────────────────────────

type Phase = "q1" | "q2" | "q3" | "q4" | "bridge" | "register" | "boarding";

const PHASE_STEP: Record<Phase, number> = {
  q1: 0, q2: 1, q3: 2, q4: 3, bridge: 4, register: 5, boarding: 6,
};
const TOTAL_STEPS = 5;

const MOTIVATIONS = [
  { id: "travel",  emoji: "✈️", label: "Voyager au Japon" },
  { id: "culture", emoji: "🎌", label: "Culture & animes" },
  { id: "work",    emoji: "📚", label: "Travail / études" },
  { id: "fun",     emoji: "🎉", label: "Juste pour le fun" },
  { id: "connect", emoji: "🤝", label: "Rencontrer des Japonais" },
  { id: "other",   emoji: "💭", label: "Autre raison" },
];

const LEVELS = [
  { id: "zero",  label: "Je suis débutant complet",                  bars: 1 },
  { id: "words", label: "Je connais quelques mots",                  bars: 2 },
  { id: "basic", label: "Je peux avoir des conversations simples",   bars: 3 },
  { id: "good",  label: "Je me débrouille bien",                     bars: 4 },
];

const GOALS = [
  { id: "5",  label: "5 min / jour",  tag: "Décontracté" },
  { id: "10", label: "10 min / jour", tag: "Régulier" },
  { id: "15", label: "15 min / jour", tag: "Sérieux" },
  { id: "20", label: "20 min / jour", tag: "Intensif" },
];

const ACHIEVEMENTS = [
  { emoji: "💬", title: "Converser avec confiance",  desc: "Parole et écoute sans stress" },
  { emoji: "📖", title: "Enrichir ton vocabulaire",  desc: "Mots courants et phrases pratiques" },
  { emoji: "🔥", title: "Créer une vraie habitude",  desc: "Rappels intelligents, défis quotidiens" },
];

// ─── Shared components ────────────────────────────────────────────────────────

function Mascot({ msg }: { msg: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 36 }}>
      <div style={{
        width: 58, height: 58, borderRadius: "50%",
        background: "linear-gradient(145deg, #1c1410, #4a3327)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 28, flexShrink: 0,
        boxShadow: "0 4px 16px rgba(28,20,16,0.25)",
      }}>🗾</div>
      <div style={{
        background: "#fff", border: `1.5px solid ${C.border}`,
        borderRadius: "4px 16px 16px 16px",
        padding: "12px 16px", fontSize: 15, fontWeight: 600, color: C.head,
        lineHeight: 1.4, boxShadow: "0 2px 8px rgba(28,20,16,0.06)",
        marginTop: 4,
      }}>
        {msg}
      </div>
    </div>
  );
}

function Bars({ n }: { n: number }) {
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "flex-end", marginRight: 14, flexShrink: 0 }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{
          width: 4, height: 4 + i * 4, borderRadius: 2,
          background: i <= n ? C.greenDk : C.border,
        }}/>
      ))}
    </div>
  );
}

const baseInput: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  padding: "10px 14px", borderRadius: 10,
  border: `1.5px solid ${C.border}`,
  background: C.inputBg, fontSize: 14, color: C.head,
  outline: "none", fontFamily: "system-ui, sans-serif",
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      display: "block", fontSize: 11, fontWeight: 700, color: C.muted,
      letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6,
    }}>{children}</label>
  );
}

const focusHandlers = {
  onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = C.head;
    e.target.style.boxShadow   = "0 0 0 3px rgba(28,20,16,0.07)";
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = C.border;
    e.target.style.boxShadow   = "none";
  },
};

// ─── Phase screens ────────────────────────────────────────────────────────────

function PhaseQ1({ selected, onToggle }: { selected: string[]; onToggle: (id: string) => void }) {
  return (
    <>
      <Mascot msg="Pourquoi veux-tu apprendre le japonais ?" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {MOTIVATIONS.map(opt => {
          const on = selected.includes(opt.id);
          return (
            <button key={opt.id} onClick={() => onToggle(opt.id)} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "14px 16px", borderRadius: 12,
              border: `2px solid ${on ? C.head : C.border}`,
              background: on ? "rgba(28,20,16,0.04)" : "#fff",
              cursor: "pointer", textAlign: "left",
              fontSize: 14, fontWeight: on ? 600 : 500, color: C.head,
              fontFamily: "system-ui, sans-serif",
              transition: "border-color 0.15s, background 0.15s",
            }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{opt.emoji}</span>
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function PhaseQ2({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  return (
    <>
      <Mascot msg="Quel est ton niveau actuel en japonais ?" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {LEVELS.map(opt => {
          const on = selected === opt.id;
          return (
            <button key={opt.id} onClick={() => onSelect(opt.id)} style={{
              display: "flex", alignItems: "center",
              padding: "16px 20px", borderRadius: 12,
              border: `2px solid ${on ? C.greenDk : C.border}`,
              background: on ? "rgba(0,165,68,0.06)" : "#fff",
              cursor: "pointer", fontFamily: "system-ui, sans-serif",
              transition: "border-color 0.15s, background 0.15s",
            }}>
              <Bars n={opt.bars} />
              <span style={{ fontSize: 15, fontWeight: on ? 600 : 500, color: C.head }}>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function PhaseQ3() {
  return (
    <>
      <Mascot msg="Voilà ce que tu vas accomplir !" />
      <div>
        {ACHIEVEMENTS.map((a, i) => (
          <div key={a.title}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 4px" }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: "#f0ebe4",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24, flexShrink: 0,
              }}>{a.emoji}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.head, marginBottom: 3 }}>{a.title}</div>
                <div style={{ fontSize: 13, color: C.muted }}>{a.desc}</div>
              </div>
            </div>
            {i < ACHIEVEMENTS.length - 1 && <div style={{ height: 1, background: C.border }}/>}
          </div>
        ))}
      </div>
    </>
  );
}

function PhaseQ4({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  return (
    <>
      <Mascot msg="Quel est ton objectif quotidien ?" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {GOALS.map(opt => {
          const on = selected === opt.id;
          return (
            <button key={opt.id} onClick={() => onSelect(opt.id)} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px", borderRadius: 12,
              border: `2px solid ${on ? C.head : C.border}`,
              background: on ? "rgba(28,20,16,0.04)" : "#fff",
              cursor: "pointer", fontFamily: "system-ui, sans-serif",
              transition: "border-color 0.15s, background 0.15s",
            }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.head }}>{opt.label}</span>
              <span style={{ fontSize: 13, fontWeight: on ? 600 : 400, color: on ? C.body : C.muted }}>
                {opt.tag}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function PhaseBridge({ level, goal }: { level: string; goal: string }) {
  const levelLabel = LEVELS.find(l => l.id === level)?.label ?? "—";
  const goalLabel  = GOALS.find(g => g.id === goal)?.label   ?? "—";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingTop: 16 }}>
      <div style={{ fontSize: 68, marginBottom: 24 }}>✈️</div>
      <h1 style={{ fontSize: 26, fontWeight: 900, color: C.head, margin: "0 0 12px", letterSpacing: "-0.03em" }}>
        Presque prêt à décoller !
      </h1>
      <p style={{ color: C.body, fontSize: 15, lineHeight: 1.7, maxWidth: 380, margin: "0 0 28px" }}>
        Il nous manque encore quelques informations pour te délivrer ton{" "}
        <strong style={{ color: C.head }}>billet d'embarquement</strong> pour le Japon.
      </p>
      <div style={{
        background: "#fff", border: `1px solid ${C.border}`,
        borderRadius: 16, padding: "20px 24px", width: "100%", maxWidth: 360,
        boxShadow: "0 2px 16px rgba(28,20,16,0.07)", textAlign: "left",
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 14 }}>
          Ton profil d'apprentissage
        </div>
        {[
          { label: "Destination", value: "Tokyo, Japon 🗾" },
          { label: "Niveau",      value: levelLabel },
          { label: "Objectif",    value: goalLabel },
        ].map(row => (
          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
            <span style={{ color: C.muted }}>{row.label}</span>
            <span style={{ fontWeight: 700, color: C.head }}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhaseRegister({ onSuccess }: { onSuccess: (firstName: string) => void }) {
  const [form, setForm] = useState({
    email: "", password: "", pseudo: "", firstName: "", lastName: "", birthDate: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const res  = await fetch("/api/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Une erreur est survenue."); return; }
    await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    onSuccess(form.firstName || form.pseudo);
  }

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: C.head, margin: "0 0 6px", letterSpacing: "-0.03em" }}>
          Presque là ! 🎫
        </h2>
        <p style={{ color: C.muted, fontSize: 14, margin: 0, lineHeight: 1.5 }}>
          Quelques infos pour préparer ton embarquement.
        </p>
      </div>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <FieldLabel>Prénom</FieldLabel>
            <input name="firstName" type="text" required value={form.firstName}
              onChange={handleChange} placeholder="Jean"
              style={baseInput} {...focusHandlers} />
          </div>
          <div>
            <FieldLabel>Nom</FieldLabel>
            <input name="lastName" type="text" required value={form.lastName}
              onChange={handleChange} placeholder="Dupont"
              style={baseInput} {...focusHandlers} />
          </div>
        </div>
        <div>
          <FieldLabel>Pseudo</FieldLabel>
          <input name="pseudo" type="text" required value={form.pseudo}
            onChange={handleChange} placeholder="jean_dupont"
            style={baseInput} {...focusHandlers} />
        </div>
        <div>
          <FieldLabel>Email</FieldLabel>
          <input name="email" type="email" required value={form.email}
            onChange={handleChange} placeholder="toi@exemple.com"
            style={baseInput} {...focusHandlers} />
        </div>
        <div>
          <FieldLabel>Date de naissance</FieldLabel>
          <input name="birthDate" type="date" required value={form.birthDate}
            onChange={handleChange} style={baseInput} {...focusHandlers} />
        </div>
        <div>
          <FieldLabel>Mot de passe</FieldLabel>
          <div style={{ position: "relative" }}>
            <input name="password" type={showPwd ? "text" : "password"}
              required minLength={8} value={form.password}
              onChange={handleChange} placeholder="8 caractères minimum"
              style={{ ...baseInput, paddingRight: 80 }} {...focusHandlers} />
            <button type="button" onClick={() => setShowPwd(v => !v)} style={{
              position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer",
              color: C.greenDk, fontSize: 12, fontWeight: 700,
              padding: 0, fontFamily: "system-ui, sans-serif",
            }}>
              {showPwd ? "Masquer" : "Afficher"}
            </button>
          </div>
        </div>
        {error && (
          <p style={{ color: C.error, fontSize: 13, margin: 0, padding: "8px 12px", background: "#fff1f2", borderRadius: 8 }}>
            {error}
          </p>
        )}
        <button type="submit" disabled={loading} style={{
          width: "100%", padding: "13px", borderRadius: 12,
          background: loading ? C.border : C.head,
          color: loading ? C.muted : "#fff",
          fontSize: 14, fontWeight: 700, border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "system-ui, sans-serif",
          marginTop: 4, transition: "background 0.15s",
        }}>
          {loading ? "Création..." : "Obtenir mon billet d'embarquement 🎫"}
        </button>
        <p style={{ color: C.muted, fontSize: 11, textAlign: "center", margin: "4px 0 0", lineHeight: 1.6 }}>
          En créant un compte, tu acceptes nos{" "}
          <span style={{ color: C.body, fontWeight: 600 }}>CGU</span>
          {" "}et notre{" "}
          <span style={{ color: C.body, fontWeight: 600 }}>Politique de confidentialité</span>.
        </p>

        <button
          type="button"
          onClick={() => onSuccess("Test")}
          style={{
            width: "100%", padding: "10px", borderRadius: 10,
            background: "transparent", border: `1px dashed ${C.border}`,
            color: C.muted, fontSize: 12, fontWeight: 500,
            cursor: "pointer", fontFamily: "system-ui, sans-serif",
            marginTop: 4,
          }}
        >
          [DEV] Passer directement au billet →
        </button>
      </form>
    </>
  );
}

// ─── Boarding pass ────────────────────────────────────────────────────────────

const BAR_HEIGHTS = [3,1,2,1,3,1,2,1,1,3,1,2,1,3,1,1,2,1,3,1,2,1,1,3,1,2,1,3,1,2,1,1,3,1,2,1,3,1,2,1];

function Barcode() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5px", width: 56 }}>
      {BAR_HEIGHTS.map((h, i) => (
        <div key={i} style={{ height: h, width: "100%", background: "#1c1d20" }}/>
      ))}
    </div>
  );
}

const CARD_H  = 230;
const STUB_W  = 84;

function BoardingPass({ name, tearing, onTear }: {
  name: string; tearing: boolean; onTear: () => void;
}) {
  const dateStr = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  }).toUpperCase();

  const LABEL: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: "#5a5750",
    letterSpacing: "0.08em", textTransform: "uppercase" as const,
    marginBottom: 4, lineHeight: 1,
  };
  const VALUE: React.CSSProperties = {
    fontSize: 20, fontWeight: 700, color: "#1c1d20",
    letterSpacing: "-0.02em", lineHeight: 1.1,
  };

  return (
    <div
      onClick={onTear}
      style={{
        position: "relative",
        width: "min(540px, 90vw)",
        height: CARD_H,
        cursor: tearing ? "default" : "pointer",
        userSelect: "none",
        animation: tearing ? "none" : "gentle-sway 8s ease-in-out infinite",
      }}
    >
      {/* Shadow — fades out during tear */}
      <div style={{
        position: "absolute", inset: 0,
        borderRadius: 16,
        boxShadow: "0 20px 52px rgba(0,0,0,0.22), 0 4px 12px rgba(0,0,0,0.08)",
        pointerEvents: "none",
        opacity: tearing ? 0 : 1,
        transition: "opacity 0.15s",
      }}/>

      {/* Left stub — flies left */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: STUB_W,
        background: "#f7f7ed",
        borderTopLeftRadius: 16, borderBottomLeftRadius: 16,
        borderTopRightRadius: 0, borderBottomRightRadius: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        transform: tearing ? "translateX(-220px) rotate(-14deg)" : "none",
        opacity: tearing ? 0 : 1,
        transition: tearing
          ? "transform 0.48s cubic-bezier(0.4,0,1,1), opacity 0.38s ease"
          : "none",
        zIndex: 1,
      }}>
        <Barcode />
      </div>

      {/* Dashed separator */}
      <div style={{
        position: "absolute", left: STUB_W, top: 14, bottom: 14,
        borderLeft: "2px dashed #c4c0b2",
        pointerEvents: "none",
        opacity: tearing ? 0 : 1,
        transition: "opacity 0.1s",
        zIndex: 2,
      }}/>

      {/* Right content — flies right */}
      <div style={{
        position: "absolute", left: STUB_W + 2, top: 0, right: 0, bottom: 0,
        background: "#f7f7ed",
        borderTopRightRadius: 16, borderBottomRightRadius: 16,
        borderTopLeftRadius: 0, borderBottomLeftRadius: 0,
        padding: "26px 26px",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        transform: tearing ? "translateX(140px) rotate(6deg)" : "none",
        opacity: tearing ? 0 : 1,
        transition: tearing
          ? "transform 0.52s cubic-bezier(0.4,0,1,1) 0.04s, opacity 0.38s ease 0.06s"
          : "none",
        zIndex: 1,
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#1c1d20", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 5 }}>
              SekaiTalk Airlines
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#5a5750", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>
              Boarding Pass
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={LABEL}>Class</div>
            <div style={{ ...VALUE, fontSize: 18 }}>PREMIÈRE</div>
          </div>
        </div>

        {/* Passenger */}
        <div>
          <div style={LABEL}>Passenger</div>
          <div style={{ ...VALUE, fontSize: 22 }}>{name || "Voyageur"}</div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: 28 }}>
          {[
            { label: "Date",     value: dateStr },
            { label: "Gate",     value: "日本" },
            { label: "Boarding", value: "18:00" },
          ].map(d => (
            <div key={d.label}>
              <div style={LABEL}>{d.label}</div>
              <div style={VALUE}>{d.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PhaseBoarding({ name, tearing, torn, onTear }: {
  name: string; tearing: boolean; torn: boolean; onTear: () => void;
}) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse 130% 80% at 50% 40%, #b8d8ee 0%, #cde4f2 30%, #daeaf5 55%, #e8f2f8 75%, #f0f5f8 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: 24, fontFamily: "system-ui, sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      {/* Cloud blobs */}
      <div style={{ position: "absolute", top: "8%", left: "5%", width: 260, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.55)", filter: "blur(28px)", pointerEvents: "none" }}/>
      <div style={{ position: "absolute", top: "18%", right: "8%", width: 200, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.45)", filter: "blur(22px)", pointerEvents: "none" }}/>
      <div style={{ position: "absolute", bottom: "20%", left: "12%", width: 180, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.4)", filter: "blur(20px)", pointerEvents: "none" }}/>
      <div style={{ position: "absolute", bottom: "30%", right: "5%", width: 220, height: 90, borderRadius: "50%", background: "rgba(255,255,255,0.5)", filter: "blur(26px)", pointerEvents: "none" }}/>

      {!torn && (
        <>
          <div style={{
            fontSize: 11, fontWeight: 700, color: "rgba(40,70,100,0.55)",
            textTransform: "uppercase" as const, letterSpacing: "0.14em", marginBottom: 24,
            position: "relative", zIndex: 1,
          }}>
            ✈ Ton billet est prêt
          </div>
          <div style={{ position: "relative", zIndex: 1 }}>
            <BoardingPass name={name} tearing={tearing} onTear={onTear} />
          </div>
          <div style={{
            marginTop: 20, fontSize: 12, color: "rgba(40,70,100,0.5)",
            textAlign: "center", position: "relative", zIndex: 1,
            opacity: tearing ? 0 : 1, transition: "opacity 0.2s",
          }}>
            Clique sur le billet pour embarquer
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function OnboardingClient() {
  const router = useRouter();

  const [phase, setPhase]       = useState<Phase>("q1");
  const [visible, setVisible]   = useState(true);
  const [motivations, setMot]   = useState<string[]>([]);
  const [level, setLevel]       = useState("");
  const [goal, setGoal]         = useState("");
  const [userName, setUserName] = useState("");
  const [tearing, setTearing]   = useState(false);
  const [torn, setTorn]         = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [videoFade, setVideoFade] = useState(false);

  const ORDER: Phase[] = ["q1", "q2", "q3", "q4", "bridge", "register", "boarding"];

  function goTo(next: Phase) {
    setVisible(false);
    setTimeout(() => { setPhase(next); setVisible(true); }, 180);
  }

  function handleBack() {
    const idx = ORDER.indexOf(phase);
    if (idx > 0) goTo(ORDER[idx - 1]);
    else router.push("/");
  }

  function handleContinue() {
    const idx = ORDER.indexOf(phase);
    if (idx < ORDER.length - 1) goTo(ORDER[idx + 1]);
  }

  function handleTear() {
    if (tearing || torn) return;
    setTearing(true);
    setTimeout(() => {
      setTorn(true);
      // Brief sky bg visible, then fade to video
      setTimeout(() => {
        setShowVideo(true);
        requestAnimationFrame(() => requestAnimationFrame(() => setVideoFade(true)));
      }, 350);
    }, 550);
  }

  if (phase === "boarding") {
    return (
      <>
        <PhaseBoarding
          name={userName} tearing={tearing} torn={torn} onTear={handleTear}
        />
        {showVideo && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 300,
            background: "#000",
            opacity: videoFade ? 1 : 0,
            transition: "opacity 0.65s ease",
          }}>
            <video
              autoPlay
              playsInline
              src="/videos/tokyo_landing.mp4"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              onEnded={() => router.push(`/tutorial${motivations.length ? `?m=${motivations.join(",")}` : ""}`)}
            />
            <button
              onClick={() => router.push(`/tutorial${motivations.length ? `?m=${motivations.join(",")}` : ""}`)}
              style={{
                position: "absolute", bottom: 40, right: 40,
                padding: "10px 24px", borderRadius: 99,
                background: "rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.75)",
                border: "1px solid rgba(255,255,255,0.22)",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                backdropFilter: "blur(10px)",
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "0.02em",
                transition: "background 0.15s",
              }}
            >
              Passer →
            </button>
          </div>
        )}
      </>
    );
  }

  const pct      = (PHASE_STEP[phase] / TOTAL_STEPS) * 100;
  const disabled =
    (phase === "q1" && motivations.length === 0) ||
    (phase === "q2" && !level) ||
    (phase === "q4" && !goal);
  const showContinue = phase !== "register";

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "system-ui, sans-serif" }}>
      {/* Top bar */}
      <div style={{ padding: "20px 28px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, maxWidth: 600, margin: "0 auto" }}>
          <button onClick={handleBack} style={{
            background: "none", border: "none", cursor: "pointer",
            color: C.muted, fontSize: 20, padding: "4px 8px 4px 0", lineHeight: 1,
          }}>←</button>
          <div style={{ flex: 1, height: 8, background: C.border, borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              height: "100%", background: C.green, borderRadius: 99,
              width: `${pct}%`, transition: "width 0.4s ease",
            }}/>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: 600, width: "100%", margin: "0 auto",
        padding: showContinue ? "32px 28px 120px" : "32px 28px 40px",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        transition: "opacity 0.18s ease, transform 0.18s ease",
      }}>
        {phase === "q1" && (
          <PhaseQ1
            selected={motivations}
            onToggle={(id) => setMot(prev =>
              prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
            )}
          />
        )}
        {phase === "q2" && <PhaseQ2 selected={level} onSelect={setLevel} />}
        {phase === "q3" && <PhaseQ3 />}
        {phase === "q4" && <PhaseQ4 selected={goal} onSelect={setGoal} />}
        {phase === "bridge" && <PhaseBridge level={level} goal={goal} />}
        {phase === "register" && (
          <PhaseRegister
            onSuccess={(name) => { setUserName(name); goTo("boarding"); }}
          />
        )}
      </div>

      {/* Fixed continue button */}
      {showContinue && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          borderTop: `1px solid ${C.border}`,
          background: C.bg, padding: "16px 28px",
          display: "flex", justifyContent: "flex-end",
        }}>
          <button
            onClick={handleContinue}
            disabled={disabled}
            style={{
              padding: "13px 28px", borderRadius: 12,
              background: disabled ? C.border : C.head,
              color: disabled ? C.muted : "#fff",
              border: "none", cursor: disabled ? "default" : "pointer",
              fontSize: 14, fontWeight: 700,
              fontFamily: "system-ui, sans-serif",
              letterSpacing: "-0.01em",
              transition: "background 0.15s, color 0.15s",
              textTransform: "uppercase" as const,
            }}
          >
            {phase === "bridge" ? "Obtenir mon billet 🎫" : "Continuer →"}
          </button>
        </div>
      )}
    </div>
  );
}
