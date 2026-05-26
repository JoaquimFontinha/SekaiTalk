"use client";

import { useState } from "react";
import { setTutoStep } from "@/lib/tutorial";

interface Props {
  onClose: () => void;
}

const PLANS = [
  {
    id: "decouverte",
    name: "Découverte",
    price: "Gratuit",
    color: "#6b7280",
    border: "rgba(107,114,128,0.4)",
    bg: "rgba(107,114,128,0.08)",
    features: [
      "3 conversations / jour",
      "2 quêtes disponibles",
      "Vocabulaire de base",
      "Cartes kana",
    ],
    cta: "Continuer en Découverte",
    ctaStyle: { background: "transparent", border: "1.5px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.55)" },
    free: true,
  },
  {
    id: "voyageur",
    name: "Voyageur",
    price: "9,99 €",
    per: "/ mois",
    color: "#7c3aed",
    border: "rgba(124,58,237,0.5)",
    bg: "rgba(124,58,237,0.1)",
    badge: "Populaire",
    features: [
      "Conversations illimitées",
      "Toutes les quêtes",
      "Voix IA des personnages",
      "Révision SRS complète",
      "Suivi de progression",
    ],
    cta: "Commencer l'essai gratuit",
    ctaStyle: { background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", color: "#fff", boxShadow: "0 4px 20px rgba(124,58,237,0.4)" },
  },
  {
    id: "immersion",
    name: "Immersion",
    price: "19,99 €",
    per: "/ mois",
    color: "#f59e0b",
    border: "rgba(245,158,11,0.4)",
    bg: "rgba(245,158,11,0.08)",
    features: [
      "Tout Voyageur inclus",
      "Tuteur IA personnalisé",
      "Mode hors-ligne",
      "Accès anticipé nouveautés",
      "Certificat de progression",
    ],
    cta: "Choisir Immersion",
    ctaStyle: { background: "linear-gradient(135deg,#d97706,#b45309)", border: "none", color: "#fff" },
  },
];

export default function PricingModal({ onClose }: Props) {
  const [selected, setSelected] = useState("voyageur");

  function handlePlan(planId: string) {
    if (planId === "decouverte") {
      setTutoStep("complete");
      onClose();
    } else {
      // TODO: wire up payment
      setTutoStep("complete");
      onClose();
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: "rgba(0,0,0,0.78)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, fontFamily: "system-ui, sans-serif",
      animation: "screen-fadein 0.35s ease",
      pointerEvents: "auto",
    }}>
      <div style={{
        width: "min(900px, 95vw)",
        background: "rgba(12,9,26,0.98)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 24,
        overflow: "hidden",
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        maxHeight: "90vh",
        overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{
          padding: "36px 36px 28px",
          textAlign: "center",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🗾</div>
          <h2 style={{
            fontSize: 26, fontWeight: 900, color: "#f0eeff",
            margin: "0 0 8px", letterSpacing: "-0.03em",
          }}>
            Continue ton aventure au Japon
          </h2>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, margin: 0, maxWidth: 420, marginInline: "auto" }}>
            Choisis le plan qui correspond à ton niveau d'engagement.
            Essai gratuit 7 jours sur tous les plans payants.
          </p>
        </div>

        {/* Plans */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16, padding: "28px 28px",
        }}>
          {PLANS.map(plan => (
            <div
              key={plan.id}
              onClick={() => setSelected(plan.id)}
              style={{
                position: "relative",
                border: `1.5px solid ${selected === plan.id ? plan.border : "rgba(255,255,255,0.1)"}`,
                borderRadius: 18,
                background: selected === plan.id ? plan.bg : "rgba(255,255,255,0.03)",
                padding: "22px 20px 20px",
                cursor: "pointer",
                transition: "border-color 0.2s, background 0.2s",
              }}
            >
              {plan.badge && (
                <div style={{
                  position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
                  background: plan.color, borderRadius: 99, padding: "3px 14px",
                  fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: "0.05em",
                  whiteSpace: "nowrap",
                }}>
                  {plan.badge}
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: plan.color, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                  {plan.name}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: 28, fontWeight: 900, color: "#f0eeff" }}>{plan.price}</span>
                  {plan.per && <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>{plan.per}</span>}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 20 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                    <span style={{ color: plan.color, fontSize: 11, fontWeight: 900 }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>

              <button
                onClick={e => { e.stopPropagation(); handlePlan(plan.id); }}
                style={{
                  width: "100%", padding: "11px 0", borderRadius: 12,
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                  fontFamily: "system-ui, sans-serif",
                  transition: "opacity 0.15s",
                  ...plan.ctaStyle as React.CSSProperties,
                }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: "0 28px 24px",
          textAlign: "center",
          color: "rgba(255,255,255,0.25)", fontSize: 12,
        }}>
          Annulation à tout moment · Paiement sécurisé · Aucun engagement
        </div>
      </div>
    </div>
  );
}
