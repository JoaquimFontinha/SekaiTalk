"use client";
import Link from "next/link";

interface AuthCardProps {
  activeTab: "login" | "register";
  children: React.ReactNode;
}

export function AuthCard({ activeTab, children }: AuthCardProps) {
  return (
    <main style={{
      minHeight: "100vh",
      background: "#f7f4f0",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px",
      position: "relative", overflow: "hidden",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      {/* Background blobs */}
      <div style={{
        position: "absolute", top: -80, right: -80,
        width: 420, height: 320, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(5,223,114,0.13) 0%, transparent 70%)",
        filter: "blur(44px)", pointerEvents: "none",
      }}/>
      <div style={{
        position: "absolute", bottom: -60, left: -60,
        width: 360, height: 280, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(217,119,6,0.09) 0%, transparent 70%)",
        filter: "blur(44px)", pointerEvents: "none",
      }}/>

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: 440,
        background: "#fff",
        borderRadius: 24,
        boxShadow: "0 4px 48px rgba(28,20,16,0.08), 0 1px 4px rgba(28,20,16,0.04)",
        padding: "32px 36px 40px",
        position: "relative",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Link href="/" style={{
            textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 22 }}>🗾</span>
            <span style={{
              fontSize: 16, fontWeight: 800, color: "#1c1410",
              letterSpacing: "-0.03em",
            }}>SekaiTalk</span>
          </Link>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: "flex",
          background: "#f0ebe4",
          borderRadius: 99, padding: "4px",
          marginBottom: 28,
          border: "1px solid rgba(0,0,0,0.05)",
        }}>
          <Link href="/login" style={{
            flex: 1, textAlign: "center", textDecoration: "none",
            padding: "9px 14px", borderRadius: 99,
            background: activeTab === "login" ? "#fff" : "transparent",
            boxShadow: activeTab === "login" ? "0 1px 6px rgba(28,20,16,0.1)" : "none",
            color: activeTab === "login" ? "#1c1410" : "#a89990",
            fontSize: 13, fontWeight: activeTab === "login" ? 600 : 500,
            whiteSpace: "nowrap",
            transition: "all 0.2s",
          }}>
            Connexion
          </Link>
          <Link href="/register" style={{
            flex: 1, textAlign: "center", textDecoration: "none",
            padding: "9px 14px", borderRadius: 99,
            background: activeTab === "register" ? "#fff" : "transparent",
            boxShadow: activeTab === "register" ? "0 1px 6px rgba(28,20,16,0.1)" : "none",
            color: activeTab === "register" ? "#1c1410" : "#a89990",
            fontSize: 13, fontWeight: activeTab === "register" ? 600 : 500,
            whiteSpace: "nowrap",
            transition: "all 0.2s",
          }}>
            Créer un compte
          </Link>
        </div>

        {children}
      </div>
    </main>
  );
}

export function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

// Shared styles
export const C = {
  head:    "#1c1410",
  body:    "#6b5c56",
  muted:   "#a89990",
  green:   "#00a544",
  border:  "#e8e0d8",
  inputBg: "#faf8f5",
  error:   "#e11d48",
};

export const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  padding: "10px 14px", borderRadius: 10,
  border: `1.5px solid ${C.border}`,
  background: C.inputBg,
  fontSize: 14, color: C.head,
  outline: "none",
  fontFamily: "system-ui, -apple-system, sans-serif",
};

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      display: "block",
      fontSize: 11, fontWeight: 700,
      color: C.muted,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      marginBottom: 6,
    }}>
      {children}
    </label>
  );
}

export function OrDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
      <div style={{ flex: 1, height: 1, background: C.border }}/>
      <span style={{ color: C.muted, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em" }}>OU</span>
      <div style={{ flex: 1, height: 1, background: C.border }}/>
    </div>
  );
}

export function GoogleButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} type="button" style={{
      width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
      padding: "11px 16px", borderRadius: 10,
      border: `1.5px solid ${C.border}`,
      background: "#fff", fontSize: 14, fontWeight: 500, color: C.head,
      cursor: "pointer", fontFamily: "system-ui, sans-serif",
      transition: "background 0.15s",
    }}
    onMouseEnter={e => (e.currentTarget.style.background = "#faf8f5")}
    onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
    >
      <GoogleIcon /> Continuer avec Google
    </button>
  );
}

export function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button type="submit" disabled={loading} style={{
      width: "100%", padding: "12px", borderRadius: 10,
      background: C.head, color: "#fff",
      fontSize: 14, fontWeight: 700, border: "none",
      cursor: loading ? "not-allowed" : "pointer",
      opacity: loading ? 0.6 : 1,
      fontFamily: "system-ui, sans-serif",
      letterSpacing: "-0.01em",
      marginTop: 6,
      transition: "opacity 0.2s",
    }}>
      {label}
    </button>
  );
}
