export type VocabEntry = {
  jp:     string;
  kana:   string;
  romaji: string;
  fr:     string;
  jlpt:   number; // 5 = N5 (le plus facile) → 1 = N1 (le plus difficile)
};

export type MasteryLevel = "never" | "new" | "learning" | "almost" | "acquired" | "perfect";

export const MASTERY_CONFIG: Record<MasteryLevel, {
  label: string; color: string; icon: string; description: string;
}> = {
  never:    { label: "Jamais pratiqué", color: "#94a3b8", icon: "○", description: "Pas encore rencontré"      },
  new:      { label: "Nouveau",         color: "#60a5fa", icon: "◉", description: "Première rencontre"        },
  learning: { label: "À travailler",    color: "#f97316", icon: "◐", description: "Des erreurs persistent"    },
  almost:   { label: "Presque acquis",  color: "#eab308", icon: "◕", description: "Sur la bonne voie"         },
  acquired: { label: "Acquis",          color: "#22c55e", icon: "●", description: "Bien maîtrisé"             },
  perfect:  { label: "Parfait",         color: "#a78bfa", icon: "★", description: "Parfaitement maîtrisé"     },
};

export const JLPT_COLORS: Record<number, string> = {
  5: "#22c55e",
  4: "#3b82f6",
  3: "#f59e0b",
  2: "#ef4444",
  1: "#8b5cf6",
};

// Calcule le niveau de maîtrise à partir des stats brutes
export function computeMastery(
  encounters:   number,
  correctCount: number,
  errorCount:   number,
): MasteryLevel {
  if (encounters === 0) return "never";
  if (encounters === 1 && errorCount === 0) return "new";
  const total = correctCount + errorCount;
  const ratio = total > 0 ? correctCount / total : 0;
  if (errorCount >= 3 || ratio < 0.4) return "learning";
  if (ratio < 0.65 || encounters < 4)  return "almost";
  if (ratio < 0.85 || encounters < 8)  return "acquired";
  return "perfect";
}
