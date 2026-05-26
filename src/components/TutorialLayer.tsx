"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { type TutorialStep, getTutoStep, setTutoStep, initTuto } from "@/lib/tutorial";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  citySlug?: string;
  selectedPoiId?: string;
  onClose?: () => void;
  initOnMount?: boolean;
  sidebarPanel?: string | null;
  lieuxType?: string | null;
  onAdvance?: (step: TutorialStep) => void;
}

// ─── Guide dialogue lines ─────────────────────────────────────────────────────

const CITY_INTRO_LINES: Record<string, string> = {
  city_intro_0: "Bravo ! Tu t'es super bien débrouillé à la douane ! 🎉",
  city_intro_1: "Tu dois avoir un peu faim après tout ce trajet…",
  city_intro_2: "Et si on allait chercher quelque chose à manger au konbini ?\nJe t'emmène au FamilyMart de Shinjuku !",
  pre_lesson_guide: "Commençons par le cours ! 📚\nIl te prépare avec le vocabulaire dont tu auras besoin.",
  pre_quest_guide: "Très bien, tu as suivi le cours ! 🎉\nEssaie maintenant de mettre ça en pratique avec la quête !",
  quest_done_0: "Wow, tu te débrouilles vraiment bien ! 🌟\nTu viens de terminer ta première quête japonaise !",
  quest_done_1: "Laisse-moi te montrer tout ce que tu peux faire dans SekaiTalk !",
  guide_free_0: "Tu connais maintenant les bases de SekaiTalk 🗾\nContinue d'explorer pour progresser !",
  guide_free_1: "Tu es libre d'explorer le Japon comme tu veux !\nReviens régulièrement — chaque session t'améliore !",
  home_map_0: "Voici la carte du Japon ! 🗾\nToutes les villes s'affichent ici. Commence par Tokyo pour poursuivre ton aventure !",
  home_map_1: "Avant d'explorer, laisse-moi te montrer les outils qui vont t'accompagner tout au long du voyage !",
};

const CITY_INTRO_NEXT: Partial<Record<TutorialStep, TutorialStep>> = {
  city_intro_0: "city_intro_1",
  city_intro_1: "city_intro_2",
  city_intro_2: "map_konbini",
  pre_lesson_guide: "drawer_lesson",
  pre_quest_guide: "drawer_quest",
  quest_done_0: "quest_done_1",
  quest_done_1: "sidebar_lieux",
  guide_free_0: "guide_free_1",
  guide_free_1: "home_map_0",
  home_map_0: "home_map_1",
  home_map_1: "home_tickets",
};

// ─── Highlight tooltip data ───────────────────────────────────────────────────

interface HighlightDef {
  targetId: string;
  title: string;
  body: string;
  showDismiss?: boolean; // default true — false = ring only, user must perform action
}

const HIGHLIGHTS: Partial<Record<TutorialStep, HighlightDef>> = {
  map_konbini: {
    targetId: "tut-sidebar-lieux",
    title: "📍 Trouver un konbini",
    body: "Ouvre le panneau Lieux dans ta barre de navigation !",
    showDismiss: false,
  },
  lieux_filter_konbini: {
    targetId: "tut-lieux-filter-konbini",
    title: "🏪 Filtre par type",
    body: "Sélectionne Konbini pour filtrer les lieux !",
    showDismiss: false,
  },
  lieux_select_poi: {
    targetId: "tut-poi-konbini-shinjuku",
    title: "🏪 FamilyMart Shinjuku",
    body: "C'est là ! Clique pour explorer ce konbini.",
    showDismiss: false,
  },
  drawer_lesson: {
    targetId: "tut-lesson-btn",
    title: "📚 Commence le cours",
    body: "Il t'apprend le vocabulaire dont tu auras besoin pour la quête.",
    showDismiss: false,
  },
  drawer_quest: {
    targetId: "tut-quest-btn",
    title: "🎯 Lance la quête",
    body: "Mets en pratique ce que tu as appris dans le cours !",
    showDismiss: false,
  },
  sidebar_lieux: {
    targetId: "tut-sidebar-lieux",
    title: "📍 Lieux",
    body: "Retrouve ici tous les lieux disponibles sur la carte — filtrable par type.",
  },
  sidebar_contacts: {
    targetId: "tut-sidebar-contacts",
    title: "👥 Contacts",
    body: "Les personnages que tu as rencontrés. Plus tu interagis, plus votre relation évolue !",
  },
  sidebar_revision: {
    targetId: "tut-sidebar-revision",
    title: "🔁 Révision",
    body: "Révise ton vocabulaire avec le système SRS — kana, kanji, phrases. Indispensable !",
  },
  sidebar_guidage: {
    targetId: "tut-sidebar-guidage",
    title: "🧭 Guidage",
    body: "Des conseils contextuels sur le quartier que tu explores. Pratique pour découvrir Tokyo !",
  },
  home_tickets: {
    targetId: "tut-home-tickets",
    title: "🎫 Tickets journaliers",
    body: "Chaque quête consomme un ticket. Tu récupères 5 tickets par jour automatiquement.",
  },
  home_flame: {
    targetId: "tut-home-flame",
    title: "🔥 Série quotidienne",
    body: "Ta série augmente chaque jour où tu joues. Garde-la vivante pour progresser plus vite !",
  },
  home_xp: {
    targetId: "tut-home-xp",
    title: "⭐ Expérience & Niveau",
    body: "Tu gagnes de l'XP en complétant quêtes et leçons. Monte de niveau pour débloquer de nouvelles villes !",
  },
  home_daily: {
    targetId: "tut-home-daily",
    title: "📅 Objectifs du jour",
    body: "Complète ces défis quotidiens pour garder une progression régulière.",
  },
  home_nav: {
    targetId: "tut-home-nav",
    title: "🗺️ Navigation",
    body: "Accède à tes révisions, contacts et bien plus depuis ce menu.",
  },
  home_objectif: {
    targetId: "tut-home-objectif",
    title: "🎯 Mon Objectif",
    body: "Définis ton objectif d'apprentissage personnel pour rester motivé tout au long du voyage !",
  },
  home_settings: {
    targetId: "tut-home-settings",
    title: "⚙️ Paramètres",
    body: "Gère ton profil, tes préférences et ton compte depuis ici.",
  },
};

const HIGHLIGHT_NEXT: Partial<Record<TutorialStep, TutorialStep>> = {
  drawer_lesson:    "lesson_active",
  drawer_quest:     "quest_active",
  sidebar_lieux:    "sidebar_contacts",
  sidebar_contacts: "sidebar_revision",
  sidebar_revision: "sidebar_guidage",
  sidebar_guidage:  "guide_free_0",
  home_tickets:  "home_flame",
  home_flame:    "home_xp",
  home_xp:       "home_daily",
  home_daily:    "home_nav",
  home_nav:      "home_objectif",
  home_objectif: "home_settings",
  home_settings: "pricing",
};

// ─── Highlight tooltip with ring ─────────────────────────────────────────────

function HighlightTooltip({
  def, onDismiss,
}: { def: HighlightDef; onDismiss: () => void }) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    function measure() {
      const el = document.getElementById(def.targetId);
      if (el) setRect(el.getBoundingClientRect());
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [def.targetId]);

  if (!rect) return null;

  const BOX_W    = 240;
  const GAP      = 12;
  const hasDismiss = def.showDismiss !== false;
  let top  = rect.top - GAP - (hasDismiss ? 120 : 75);
  let left = rect.left + rect.width / 2 - BOX_W / 2;
  if (top < 12) top = rect.bottom + GAP;
  left = Math.max(12, Math.min(left, window.innerWidth - BOX_W - 12));

  // Determine if tooltip is above or below the target
  const isAbove = top < rect.top;

  return (
    <>
      {/* Dark overlay behind sidebar — dims the map */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 990,
        pointerEvents: "none",
        background: "rgba(0,0,0,0.45)",
      }}/>
      {/* Ring — must be above sidebar (z-1001) so it's visible */}
      <div style={{
        position: "fixed",
        top:    rect.top    - 6,
        left:   rect.left   - 6,
        width:  rect.width  + 12,
        height: rect.height + 12,
        borderRadius: 12,
        boxShadow: "0 0 0 4px #a78bfa, 0 0 0 9999px rgba(0,0,0,0.45)",
        zIndex: 1002,
        pointerEvents: "none",
        animation: "tut-ring-pulse 1.8s ease-in-out infinite",
      }}/>
      {/* Tooltip box */}
      <div style={{
        position: "fixed", top, left, width: BOX_W,
        background: "rgba(18,14,36,0.97)",
        border: "1.5px solid rgba(167,139,250,0.45)",
        borderRadius: 14, padding: "12px 14px 10px",
        zIndex: 1003,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        fontFamily: "system-ui, sans-serif",
        pointerEvents: hasDismiss ? "auto" : "none",
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#e9d5ff", marginBottom: 4 }}>{def.title}</div>
        <div style={{
          fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5,
          marginBottom: hasDismiss ? 10 : 0,
        }}>
          {def.body}
        </div>
        {/* Arrow pointing toward the target */}
        {!hasDismiss && (
          <div style={{
            textAlign: "center", marginTop: 6,
            fontSize: 16, color: "#a78bfa",
            animation: isAbove ? "tut-bounce-down 1s ease-in-out infinite" : "tut-bounce-up 1s ease-in-out infinite",
          }}>
            {isAbove ? "↓" : "↑"}
          </div>
        )}
        {hasDismiss && (
          <button onClick={onDismiss} style={{
            width: "100%", padding: "7px", borderRadius: 9,
            background: "rgba(124,58,237,0.35)", border: "1px solid rgba(124,58,237,0.55)",
            color: "#c4b5fd", fontSize: 12, fontWeight: 700,
            cursor: "pointer", fontFamily: "system-ui, sans-serif",
          }}>
            Compris !
          </button>
        )}
      </div>
    </>
  );
}

// ─── Guide character dialogue ─────────────────────────────────────────────────

function GuideDialogue({ step, onNext }: { step: TutorialStep; onNext: () => void }) {
  const line = CITY_INTRO_LINES[step];
  if (!line) return null;

  const isLast       = step === "city_intro_2";
  const isFree       = step === "guide_free_1" || step === "home_map_1";
  const isAutoAdv    = step === "lieux_select_poi";
  const isCta        = step === "pre_lesson_guide" || step === "pre_quest_guide";

  return (
    <div style={{
      position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
      zIndex: 1005, display: "flex", alignItems: "flex-end", gap: 14,
      width: "min(640px, 92vw)",
      animation: "screen-fadein 0.3s ease",
      pointerEvents: "auto",
    }}>
      <div style={{ flexShrink: 0, width: 72 }}>
        <img src="/character_placeholder.png" alt="Guide" style={{
          width: "100%", objectFit: "contain",
          filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.4))",
        }}/>
      </div>

      <div style={{
        flex: 1,
        background: "rgba(12,9,26,0.94)",
        border: "1.5px solid rgba(167,139,250,0.35)",
        borderRadius: "4px 18px 18px 18px",
        padding: "14px 18px 12px",
        backdropFilter: "blur(16px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 8,
          background: "rgba(124,58,237,0.25)", borderRadius: 99, padding: "2px 12px",
          border: "1px solid rgba(124,58,237,0.4)",
        }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#a78bfa", boxShadow: "0 0 6px #a78bfa" }}/>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#c4b5fd", letterSpacing: "0.06em" }}>GUIDE</span>
        </div>
        <p style={{
          fontSize: 15, fontWeight: 600, color: "#f0eeff",
          lineHeight: 1.6, margin: `0 0 ${isAutoAdv ? 0 : 12}px`, whiteSpace: "pre-line",
        }}>
          {line}
        </p>
        {!isAutoAdv && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 5 }}>
              {["city_intro_0","city_intro_1","city_intro_2"].map((s, i) => (
                step.startsWith("city_intro") && (
                  <div key={i} style={{
                    width: s === step ? 18 : 6, height: 6, borderRadius: 99,
                    background: s === step ? "#a78bfa" : "rgba(255,255,255,0.15)",
                    transition: "width 0.25s",
                  }}/>
                )
              ))}
            </div>
            <button onClick={onNext} style={{
              padding: "7px 20px", borderRadius: 99,
              background: (isFree || isCta) ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "rgba(124,58,237,0.35)",
              border: "1px solid rgba(124,58,237,0.55)",
              color: "#ddd6fe", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "system-ui, sans-serif",
              boxShadow: (isFree || isCta) ? "0 4px 16px rgba(124,58,237,0.4)" : "none",
            }}>
              {isLast ? "Allons-y ! 🏃" : isFree ? "C'est parti ! 🗾" : isCta ? "Allons-y ! →" : "Suivant →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main TutorialLayer ───────────────────────────────────────────────────────

export default function TutorialLayer({
  citySlug, selectedPoiId, onClose, initOnMount, sidebarPanel, lieuxType, onAdvance,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<TutorialStep | null>(null);
  const prevPoiRef = useRef<string | undefined>(undefined);

  const advance = useCallback((next: TutorialStep) => {
    setTutoStep(next);
    setStep(next);
    onAdvance?.(next);
    if (next === "complete" && onClose) onClose();
  }, [onClose, onAdvance]);

  // Load step on mount — merge with auto-advance so both read from localStorage
  // (two separate [] effects would both see step=null since state hasn't updated yet)
  useEffect(() => {
    if (initOnMount) initTuto(true);
    const s = getTutoStep();
    if (s === "lesson_active") {
      const next: TutorialStep = "pre_quest_guide";
      setTutoStep(next); setStep(next); onAdvance?.(next);
    } else if (s === "quest_active") {
      const next: TutorialStep = "quest_done_0";
      setTutoStep(next); setStep(next); onAdvance?.(next);
    } else {
      setStep(s);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // map_konbini → user opens Lieux panel → lieux_filter_konbini
  useEffect(() => {
    if (step !== "map_konbini") return;
    if (sidebarPanel === "lieux") advance("lieux_filter_konbini");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sidebarPanel, step]);

  // lieux_filter_konbini → user selects konbini filter → lieux_select_poi
  useEffect(() => {
    if (step !== "lieux_filter_konbini") return;
    if (lieuxType === "konbini") advance("lieux_select_poi");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lieuxType, step]);

  // lieux_select_poi → user clicks a konbini POI → pre_lesson_guide
  useEffect(() => {
    if (step !== "lieux_select_poi") return;
    if (selectedPoiId && selectedPoiId.includes("konbini") && prevPoiRef.current !== selectedPoiId) {
      advance("pre_lesson_guide");
    }
    prevPoiRef.current = selectedPoiId;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPoiId, step]);

  const handleGuideNext = useCallback(() => {
    if (!step) return;
    const next = CITY_INTRO_NEXT[step];
    if (!next) return;
    if (next === "home_map_0") {
      advance("home_map_0");
      router.push("/home");
    } else {
      advance(next);
    }
  }, [step, advance, router]);

  const handleHighlightDismiss = useCallback(() => {
    if (!step) return;
    const next = HIGHLIGHT_NEXT[step];
    if (next) advance(next);
  }, [step, advance]);

  if (!step) return null;

  if (step in CITY_INTRO_LINES) {
    return <GuideDialogue step={step} onNext={handleGuideNext} />;
  }

  const highlight = HIGHLIGHTS[step];
  if (highlight) {
    return <HighlightTooltip def={highlight} onDismiss={handleHighlightDismiss} />;
  }

  return null;
}
