"use client";

// TEMPORARY: Coming-soon gate page — remove with middleware.ts gate logic when site goes public.

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function ComingSoonClient() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push("/");
      } else {
        setError("Mot de passe incorrect");
        setPassword("");
        inputRef.current?.focus();
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  function revealForm() {
    setShowForm(true);
    setTimeout(() => inputRef.current?.focus(), 80);
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(ellipse farthest-corner at 50% 40%, #2d4a8a 0%, #0f1f4a 60%, #080e28 100%)",
      fontFamily: "'Inter', sans-serif",
      padding: "24px",
      position: "relative",
    }}>

      {/* Stars background */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        {Array.from({ length: 60 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            width: i % 5 === 0 ? 2 : 1,
            height: i % 5 === 0 ? 2 : 1,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.6)",
            top: `${(i * 37 + 11) % 100}%`,
            left: `${(i * 53 + 7) % 100}%`,
            opacity: 0.3 + (i % 7) * 0.1,
          }} />
        ))}
      </div>

      {/* Main content */}
      <div style={{ position: "relative", textAlign: "center", maxWidth: 480 }}>

        {/* Logo */}
        <div style={{ marginBottom: 32 }}>
          <img
            src="/logo_sekai_talk.png"
            alt="SekaiTalk"
            style={{ height: 80, objectFit: "contain", display: "block", margin: "0 auto", filter: "drop-shadow(0 0 20px rgba(99,102,241,0.4))" }}
          />
        </div>

        {/* Japanese */}
        <div style={{
          fontSize: 13,
          letterSpacing: "0.4em",
          color: "rgba(167,139,250,0.8)",
          marginBottom: 16,
          textTransform: "uppercase",
        }}>
          近日公開
        </div>

        <h1 style={{
          fontSize: "clamp(28px, 6vw, 44px)",
          fontWeight: 800,
          color: "#ffffff",
          margin: "0 0 16px",
          lineHeight: 1.2,
          letterSpacing: "-0.02em",
        }}>
          Bientôt disponible
        </h1>

        <p style={{
          fontSize: 16,
          color: "rgba(255,255,255,0.55)",
          margin: "0 0 48px",
          lineHeight: 1.6,
        }}>
          SekaiTalk est en cours de développement.<br />
          Revenez bientôt pour apprendre le japonais autrement.
        </p>

      </div>

      {/* Hidden developer access */}
      <div style={{
        position: "absolute",
        bottom: 24,
        right: 24,
      }}>
        {!showForm ? (
          <button
            onClick={revealForm}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.15)",
              fontSize: 11,
              cursor: "pointer",
              padding: "4px 8px",
              letterSpacing: "0.05em",
            }}
          >
            ···
          </button>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 8,
            }}
          >
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mot de passe"
              autoComplete="off"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 8,
                padding: "8px 14px",
                color: "#fff",
                fontSize: 14,
                outline: "none",
                width: 180,
              }}
            />
            {error && (
              <span style={{ fontSize: 11, color: "#f87171" }}>{error}</span>
            )}
            <button
              type="submit"
              disabled={loading || !password}
              style={{
                background: "rgba(99,102,241,0.8)",
                border: "none",
                borderRadius: 8,
                padding: "7px 18px",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: loading || !password ? "not-allowed" : "pointer",
                opacity: loading || !password ? 0.5 : 1,
              }}
            >
              {loading ? "..." : "Continuer"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
