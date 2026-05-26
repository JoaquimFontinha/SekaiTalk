"use client";

import { useState, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  head:    "#1c1410",
  body:    "#6b5c56",
  muted:   "#a89990",
  green:   "#00a544",
  border:  "#e8e0d8",
  inputBg: "#faf8f5",
  error:   "#e11d48",
};

const baseInput: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  padding: "10px 14px", borderRadius: 10,
  border: `1.5px solid ${C.border}`,
  background: C.inputBg,
  fontSize: 14, color: C.head,
  outline: "none",
  fontFamily: "system-ui, -apple-system, sans-serif",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      display: "block", fontSize: 11, fontWeight: 700,
      color: C.muted, letterSpacing: "0.08em",
      textTransform: "uppercase", marginBottom: 6,
    }}>{children}</label>
  );
}

function useFocusHandlers() {
  return {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.style.borderColor = C.head;
      e.target.style.boxShadow   = "0 0 0 3px rgba(28,20,16,0.07)";
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.style.borderColor = C.border;
      e.target.style.boxShadow   = "none";
    },
  };
}

function ShowHideBtn({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} style={{
      position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
      background: "none", border: "none", cursor: "pointer",
      color: C.green, fontSize: 12, fontWeight: 700,
      padding: 0, fontFamily: "system-ui, sans-serif",
    }}>
      {show ? "Masquer" : "Afficher"}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function OrDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0" }}>
      <div style={{ flex: 1, height: 1, background: C.border }}/>
      <span style={{ color: C.muted, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em" }}>OU</span>
      <div style={{ flex: 1, height: 1, background: C.border }}/>
    </div>
  );
}

// ─── Login form ───────────────────────────────────────────────────────────────
function LoginForm() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const focus = useFocusHandlers();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) setError("Email ou mot de passe incorrect.");
    else router.push("/home");
  }

  return (
    <>
      <h2 style={{ fontSize: 24, fontWeight: 900, color: C.head, margin: "0 0 4px", letterSpacing: "-0.03em", textAlign: "center" }}>
        Bienvenue
      </h2>
      <p style={{ color: C.muted, fontSize: 13.5, textAlign: "center", margin: "0 0 22px", lineHeight: 1.5 }}>
        Connecte-toi pour continuer ton aventure
      </p>

      <button onClick={() => signIn("google", { callbackUrl: "/home" })} type="button" style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        padding: "11px 16px", borderRadius: 10, border: `1.5px solid ${C.border}`,
        background: "#fff", fontSize: 14, fontWeight: 500, color: C.head,
        cursor: "pointer", fontFamily: "system-ui, sans-serif",
      }}>
        <GoogleIcon /> Continuer avec Google
      </button>
      <OrDivider />

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
        <div>
          <Label>Email</Label>
          <input type="email" required value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="toi@exemple.com"
            style={baseInput} {...focus} />
        </div>

        <div>
          <Label>Mot de passe</Label>
          <div style={{ position: "relative" }}>
            <input type={showPwd ? "text" : "password"} required value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ ...baseInput, paddingRight: 80 }} {...focus} />
            <ShowHideBtn show={showPwd} onToggle={() => setShowPwd(v => !v)} />
          </div>
        </div>

        {error && (
          <p style={{ color: C.error, fontSize: 13, margin: 0, padding: "8px 12px", background: "#fff1f2", borderRadius: 8 }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} style={{
          width: "100%", padding: "12px", borderRadius: 10,
          background: C.head, color: "#fff",
          fontSize: 14, fontWeight: 700, border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "-0.01em", marginTop: 4,
        }}>
          {loading ? "Connexion..." : "Se connecter →"}
        </button>
      </form>
    </>
  );
}

// ─── Register form ────────────────────────────────────────────────────────────
function RegisterForm() {
  const [form, setForm] = useState({
    email: "", password: "", pseudo: "",
    firstName: "", lastName: "", birthDate: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const focus = useFocusHandlers();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const res  = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Une erreur est survenue."); return; }
    await signIn("credentials", { email: form.email, password: form.password, callbackUrl: "/home" });
  }

  return (
    <>
      <h2 style={{ fontSize: 24, fontWeight: 900, color: C.head, margin: "0 0 4px", letterSpacing: "-0.03em", textAlign: "center" }}>
        Bienvenue
      </h2>
      <p style={{ color: C.muted, fontSize: 13.5, textAlign: "center", margin: "0 0 22px", lineHeight: 1.5 }}>
        Crée ton compte pour explorer le Japon
      </p>

      <button onClick={() => signIn("google", { callbackUrl: "/home" })} type="button" style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        padding: "11px 16px", borderRadius: 10, border: `1.5px solid ${C.border}`,
        background: "#fff", fontSize: 14, fontWeight: 500, color: C.head,
        cursor: "pointer", fontFamily: "system-ui, sans-serif",
      }}>
        <GoogleIcon /> Continuer avec Google
      </button>
      <OrDivider />

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <Label>Prénom</Label>
            <input name="firstName" type="text" required value={form.firstName}
              onChange={handleChange} placeholder="Jean"
              style={baseInput} {...focus} />
          </div>
          <div>
            <Label>Nom</Label>
            <input name="lastName" type="text" required value={form.lastName}
              onChange={handleChange} placeholder="Dupont"
              style={baseInput} {...focus} />
          </div>
        </div>

        <div>
          <Label>Pseudo</Label>
          <input name="pseudo" type="text" required value={form.pseudo}
            onChange={handleChange} placeholder="jean_dupont"
            style={baseInput} {...focus} />
        </div>

        <div>
          <Label>Email</Label>
          <input name="email" type="email" required value={form.email}
            onChange={handleChange} placeholder="toi@exemple.com"
            style={baseInput} {...focus} />
        </div>

        <div>
          <Label>Date de naissance</Label>
          <input name="birthDate" type="date" required value={form.birthDate}
            onChange={handleChange} style={baseInput} {...focus} />
        </div>

        <div>
          <Label>Mot de passe</Label>
          <div style={{ position: "relative" }}>
            <input name="password" type={showPwd ? "text" : "password"}
              required minLength={8} value={form.password}
              onChange={handleChange} placeholder="8 caractères minimum"
              style={{ ...baseInput, paddingRight: 80 }} {...focus} />
            <ShowHideBtn show={showPwd} onToggle={() => setShowPwd(v => !v)} />
          </div>
        </div>

        {error && (
          <p style={{ color: C.error, fontSize: 13, margin: 0, padding: "8px 12px", background: "#fff1f2", borderRadius: 8 }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} style={{
          width: "100%", padding: "12px", borderRadius: 10,
          background: C.head, color: "#fff",
          fontSize: 14, fontWeight: 700, border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "-0.01em", marginTop: 2,
        }}>
          {loading ? "Création..." : "Créer mon compte →"}
        </button>

        <p style={{ color: C.muted, fontSize: 11, textAlign: "center", margin: "2px 0 0", lineHeight: 1.6 }}>
          En créant un compte, tu acceptes nos{" "}
          <span style={{ color: C.body, fontWeight: 600 }}>CGU</span>
          {" "}et notre{" "}
          <span style={{ color: C.body, fontWeight: 600 }}>Politique de confidentialité</span>.
        </p>
      </form>
    </>
  );
}

// ─── Main AuthPage (flip animation) ──────────────────────────────────────────
type Tab   = "login" | "register";
type Phase = "idle" | "out" | "between" | "in";

export default function AuthPage({ initialTab }: { initialTab: Tab }) {
  const [tab, setTab]     = useState<Tab>(initialTab);
  const [phase, setPhase] = useState<Phase>("idle");
  const busy              = useRef(false);

  function switchTo(next: Tab) {
    if (next === tab || busy.current) return;
    busy.current = true;

    // Step 1 — animate 0° → 90° (card disappears)
    setPhase("out");

    setTimeout(() => {
      // Step 2 — no transition: jump to −90° and swap content
      setTab(next);
      window.history.pushState(null, "", next === "login" ? "/login" : "/register");
      setPhase("between");

      // Step 3 — next paint: animate −90° → 0° (card appears)
      requestAnimationFrame(() => requestAnimationFrame(() => {
        setPhase("in");
        setTimeout(() => {
          setPhase("idle");
          busy.current = false;
        }, 320);
      }));
    }, 320);
  }

  const transform =
    phase === "out"     ? "perspective(1000px) rotateY(90deg)"  :
    phase === "between" ? "perspective(1000px) rotateY(-90deg)" :
    phase === "in"      ? "perspective(1000px) rotateY(0deg)"   :
    "perspective(1000px) rotateY(0deg)";

  const transition =
    phase === "out" || phase === "in"
      ? "transform 0.32s cubic-bezier(0.4, 0, 0.6, 1)"
      : "none";

  return (
    <main style={{
      minHeight: "100vh",
      background: "#f7f4f0",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px",
      position: "relative", overflow: "hidden",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      {/* Blobs */}
      <div style={{ position: "absolute", top: -80, right: -80, width: 420, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(5,223,114,0.13) 0%, transparent 70%)", filter: "blur(44px)", pointerEvents: "none" }}/>
      <div style={{ position: "absolute", bottom: -60, left: -60, width: 360, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(217,119,6,0.09) 0%, transparent 70%)", filter: "blur(44px)", pointerEvents: "none" }}/>

      {/* Flip wrapper */}
      <div style={{ width: "100%", maxWidth: 440, transform, transition }}>
        {/* Card */}
        <div style={{
          background: "#fff",
          borderRadius: 24,
          boxShadow: "0 4px 48px rgba(28,20,16,0.08), 0 1px 4px rgba(28,20,16,0.04)",
          padding: "32px 36px 40px",
        }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 22 }}>🗾</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: C.head, letterSpacing: "-0.03em" }}>SekaiTalk</span>
            </Link>
          </div>

          {/* Tab switcher */}
          <div style={{
            display: "flex", background: "#f0ebe4",
            borderRadius: 99, padding: "4px",
            border: "1px solid rgba(0,0,0,0.05)",
            marginBottom: 28,
          }}>
            {(["login", "register"] as Tab[]).map((t) => (
              <button key={t} onClick={() => switchTo(t)} style={{
                flex: 1, padding: "9px 14px", borderRadius: 99,
                background: tab === t ? "#fff" : "transparent",
                boxShadow: tab === t ? "0 1px 6px rgba(28,20,16,0.1)" : "none",
                color: tab === t ? C.head : C.muted,
                fontSize: 13, fontWeight: tab === t ? 600 : 500,
                border: "none", cursor: "pointer",
                whiteSpace: "nowrap",
                fontFamily: "system-ui, sans-serif",
                transition: "background 0.15s, box-shadow 0.15s, color 0.15s",
              }}>
                {t === "login" ? "Connexion" : "Créer un compte"}
              </button>
            ))}
          </div>

          {/* Form content */}
          {tab === "login" ? <LoginForm /> : <RegisterForm />}
        </div>
      </div>
    </main>
  );
}
