// Système d'objectifs du jour — pool + sets rotatifs + vérification de completion

export type GoalType =
  | "complete_quest"
  | "complete_2_quests"
  | "complete_lesson"
  | "complete_2_lessons"
  | "finish_session"
  | "complete_3_sessions"
  | "complete_sns"
  | "practice_vocab_5"
  | "practice_vocab_10"
  | "quest_and_lesson";

export type GoalResult = {
  type: GoalType;
  label: string;
  icon: string;
  done: boolean;
  progress: number;
  target: number;
};

type GoalDef = { label: string; icon: string; target: number };

const POOL: Record<GoalType, GoalDef> = {
  complete_quest:       { label: "Complète une quête",                  icon: "quest",   target: 1  },
  complete_2_quests:    { label: "Complète 2 quêtes",                   icon: "quest",   target: 2  },
  complete_lesson:      { label: "Valide une leçon (score ≥ 80 %)",     icon: "lesson",  target: 1  },
  complete_2_lessons:   { label: "Valide 2 leçons",                     icon: "lesson",  target: 2  },
  finish_session:       { label: "Termine une conversation",             icon: "chat",    target: 1  },
  complete_3_sessions:  { label: "Lance 3 conversations",               icon: "chat",    target: 3  },
  complete_sns:         { label: "Complète une discussion SNS",         icon: "sns",     target: 1  },
  practice_vocab_5:     { label: "Révise 5 mots",                       icon: "vocab",   target: 5  },
  practice_vocab_10:    { label: "Révise 10 mots",                      icon: "vocab",   target: 10 },
  quest_and_lesson:     { label: "Complète une quête et une leçon",     icon: "zap",     target: 2  },
};

// 14 sets — un nouveau set tous les jours, cycle de 2 semaines
const SETS: GoalType[][] = [
  ["complete_quest",      "complete_lesson",    "practice_vocab_5"  ],
  ["finish_session",      "complete_sns",       "practice_vocab_5"  ],
  ["complete_2_quests",   "practice_vocab_10",  "complete_lesson"   ],
  ["quest_and_lesson",    "complete_sns",       "practice_vocab_5"  ],
  ["complete_quest",      "practice_vocab_10",  "finish_session"    ],
  ["complete_2_lessons",  "complete_sns",       "practice_vocab_5"  ],
  ["complete_3_sessions", "complete_lesson",    "practice_vocab_5"  ],
  ["complete_quest",      "complete_sns",       "practice_vocab_10" ],
  ["finish_session",      "complete_2_quests",  "practice_vocab_5"  ],
  ["complete_lesson",     "complete_sns",       "practice_vocab_10" ],
  ["quest_and_lesson",    "practice_vocab_5",   "finish_session"    ],
  ["complete_quest",      "practice_vocab_10",  "complete_sns"      ],
  ["complete_2_quests",   "complete_lesson",    "practice_vocab_5"  ],
  ["complete_sns",        "finish_session",     "practice_vocab_10" ],
];

// Référence fixe : jour 0 = 2026-01-01 UTC
const EPOCH_MS = Date.UTC(2026, 0, 1);

export function getTodayIndex(): number {
  return Math.floor((Date.now() - EPOCH_MS) / 86_400_000);
}

export function getTodayGoalTypes(): GoalType[] {
  return SETS[getTodayIndex() % SETS.length];
}

export type GoalCounters = {
  questsToday: number;
  lessonsToday: number;
  vocabToday: number;
  snsToday: number;
  sessionsToday: number;
};

export function buildGoalResults(counters: GoalCounters): GoalResult[] {
  return getTodayGoalTypes().map(type => {
    const def = POOL[type];
    let progress: number;
    switch (type) {
      case "complete_quest":      progress = counters.questsToday;   break;
      case "complete_2_quests":   progress = counters.questsToday;   break;
      case "complete_lesson":     progress = counters.lessonsToday;  break;
      case "complete_2_lessons":  progress = counters.lessonsToday;  break;
      case "finish_session":      progress = counters.sessionsToday; break;
      case "complete_3_sessions": progress = counters.sessionsToday; break;
      case "complete_sns":        progress = counters.snsToday;      break;
      case "practice_vocab_5":    progress = counters.vocabToday;    break;
      case "practice_vocab_10":   progress = counters.vocabToday;    break;
      case "quest_and_lesson":
        progress = Math.min(counters.questsToday, 1) + Math.min(counters.lessonsToday, 1);
        break;
      default: progress = 0;
    }
    const clamped = Math.min(progress, def.target);
    return { type, label: def.label, icon: def.icon, done: clamped >= def.target, progress: clamped, target: def.target };
  });
}

// Version sans auth : objectifs du jour sans progression
export function buildEmptyGoalResults(): GoalResult[] {
  return getTodayGoalTypes().map(type => {
    const def = POOL[type];
    return { type, label: def.label, icon: def.icon, done: false, progress: 0, target: def.target };
  });
}
