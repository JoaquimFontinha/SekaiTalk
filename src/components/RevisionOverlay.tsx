"use client";

import { useState, useEffect, useCallback } from "react";
import { X, BookOpen, ChevronRight, RotateCcw, Trophy, Loader2 } from "lucide-react";
import { type VocabEntry, type MasteryLevel, MASTERY_CONFIG, JLPT_COLORS, computeMastery } from "@/lib/mastery";

// ── Types ─────────────────────────────────────────────────────────────────────

type RevisionWord = VocabEntry & {
  questId:      string | null;
  lessonId:     string | null;
  encounters:   number;
  correctCount: number;
  errorCount:   number;
  lastSeenAt:   string;
  mastery:      MasteryLevel;
};

type Stats = { toWork: number; toReview: number; acquired: number };

type ExerciseType = "JP_TO_FR" | "FR_TO_JP" | "WRITE_JP";

type Exercise = {
  word:    RevisionWord;
  type:    ExerciseType;
  choices: string[];
  correct: string;
};

type SessionResult = { word: RevisionWord; correct: boolean };

// ── Kana Data ─────────────────────────────────────────────────────────────────

type KC         = { kana: string; romaji: string };
type KanaGroup  = "basic" | "dakuten" | "combo";
type KRow       = { id: string; label: string; group: KanaGroup; cells: (KC | null)[] };
type KanaScript = "hiragana" | "katakana";
type KanaMode     = "kana_to_romaji" | "romaji_to_kana" | "mixed";
type KanaExercise = {
  char:    KC & { script: KanaScript };
  mode:    "kana_to_romaji" | "romaji_to_kana";
  choices: string[];
  correct: string;
};

const H: KRow[] = [
  // ── basic ──
  { id:"a",  label:"—", group:"basic",   cells:[{kana:"あ",romaji:"a"},{kana:"い",romaji:"i"},{kana:"う",romaji:"u"},{kana:"え",romaji:"e"},{kana:"お",romaji:"o"}] },
  { id:"k",  label:"k", group:"basic",   cells:[{kana:"か",romaji:"ka"},{kana:"き",romaji:"ki"},{kana:"く",romaji:"ku"},{kana:"け",romaji:"ke"},{kana:"こ",romaji:"ko"}] },
  { id:"s",  label:"s", group:"basic",   cells:[{kana:"さ",romaji:"sa"},{kana:"し",romaji:"shi"},{kana:"す",romaji:"su"},{kana:"せ",romaji:"se"},{kana:"そ",romaji:"so"}] },
  { id:"t",  label:"t", group:"basic",   cells:[{kana:"た",romaji:"ta"},{kana:"ち",romaji:"chi"},{kana:"つ",romaji:"tsu"},{kana:"て",romaji:"te"},{kana:"と",romaji:"to"}] },
  { id:"n",  label:"n", group:"basic",   cells:[{kana:"な",romaji:"na"},{kana:"に",romaji:"ni"},{kana:"ぬ",romaji:"nu"},{kana:"ね",romaji:"ne"},{kana:"の",romaji:"no"}] },
  { id:"h",  label:"h", group:"basic",   cells:[{kana:"は",romaji:"ha"},{kana:"ひ",romaji:"hi"},{kana:"ふ",romaji:"fu"},{kana:"へ",romaji:"he"},{kana:"ほ",romaji:"ho"}] },
  { id:"m",  label:"m", group:"basic",   cells:[{kana:"ま",romaji:"ma"},{kana:"み",romaji:"mi"},{kana:"む",romaji:"mu"},{kana:"め",romaji:"me"},{kana:"も",romaji:"mo"}] },
  { id:"y",  label:"y", group:"basic",   cells:[{kana:"や",romaji:"ya"},null,{kana:"ゆ",romaji:"yu"},null,{kana:"よ",romaji:"yo"}] },
  { id:"r",  label:"r", group:"basic",   cells:[{kana:"ら",romaji:"ra"},{kana:"り",romaji:"ri"},{kana:"る",romaji:"ru"},{kana:"れ",romaji:"re"},{kana:"ろ",romaji:"ro"}] },
  { id:"w",  label:"w", group:"basic",   cells:[{kana:"わ",romaji:"wa"},null,null,null,{kana:"を",romaji:"wo"}] },
  { id:"nn", label:"n", group:"basic",   cells:[{kana:"ん",romaji:"n"},null,null,null,null] },
  // ── dakuten ──
  { id:"g",  label:"g", group:"dakuten", cells:[{kana:"が",romaji:"ga"},{kana:"ぎ",romaji:"gi"},{kana:"ぐ",romaji:"gu"},{kana:"げ",romaji:"ge"},{kana:"ご",romaji:"go"}] },
  { id:"z",  label:"z", group:"dakuten", cells:[{kana:"ざ",romaji:"za"},{kana:"じ",romaji:"ji"},{kana:"ず",romaji:"zu"},{kana:"ぜ",romaji:"ze"},{kana:"ぞ",romaji:"zo"}] },
  { id:"d",  label:"d", group:"dakuten", cells:[{kana:"だ",romaji:"da"},{kana:"ぢ",romaji:"ji"},{kana:"づ",romaji:"zu"},{kana:"で",romaji:"de"},{kana:"ど",romaji:"do"}] },
  { id:"b",  label:"b", group:"dakuten", cells:[{kana:"ば",romaji:"ba"},{kana:"び",romaji:"bi"},{kana:"ぶ",romaji:"bu"},{kana:"べ",romaji:"be"},{kana:"ぼ",romaji:"bo"}] },
  { id:"p",  label:"p", group:"dakuten", cells:[{kana:"ぱ",romaji:"pa"},{kana:"ぴ",romaji:"pi"},{kana:"ぷ",romaji:"pu"},{kana:"ぺ",romaji:"pe"},{kana:"ぽ",romaji:"po"}] },
  // ── combos ──
  { id:"kya",label:"ky",group:"combo",   cells:[{kana:"きゃ",romaji:"kya"},{kana:"きゅ",romaji:"kyu"},{kana:"きょ",romaji:"kyo"}] },
  { id:"sha",label:"sh",group:"combo",   cells:[{kana:"しゃ",romaji:"sha"},{kana:"しゅ",romaji:"shu"},{kana:"しょ",romaji:"sho"}] },
  { id:"cha",label:"ch",group:"combo",   cells:[{kana:"ちゃ",romaji:"cha"},{kana:"ちゅ",romaji:"chu"},{kana:"ちょ",romaji:"cho"}] },
  { id:"nya",label:"ny",group:"combo",   cells:[{kana:"にゃ",romaji:"nya"},{kana:"にゅ",romaji:"nyu"},{kana:"にょ",romaji:"nyo"}] },
  { id:"hya",label:"hy",group:"combo",   cells:[{kana:"ひゃ",romaji:"hya"},{kana:"ひゅ",romaji:"hyu"},{kana:"ひょ",romaji:"hyo"}] },
  { id:"mya",label:"my",group:"combo",   cells:[{kana:"みゃ",romaji:"mya"},{kana:"みゅ",romaji:"myu"},{kana:"みょ",romaji:"myo"}] },
  { id:"rya",label:"ry",group:"combo",   cells:[{kana:"りゃ",romaji:"rya"},{kana:"りゅ",romaji:"ryu"},{kana:"りょ",romaji:"ryo"}] },
  { id:"gya",label:"gy",group:"combo",   cells:[{kana:"ぎゃ",romaji:"gya"},{kana:"ぎゅ",romaji:"gyu"},{kana:"ぎょ",romaji:"gyo"}] },
  { id:"ja", label:"j", group:"combo",   cells:[{kana:"じゃ",romaji:"ja"},{kana:"じゅ",romaji:"ju"},{kana:"じょ",romaji:"jo"}] },
  { id:"bya",label:"by",group:"combo",   cells:[{kana:"びゃ",romaji:"bya"},{kana:"びゅ",romaji:"byu"},{kana:"びょ",romaji:"byo"}] },
  { id:"pya",label:"py",group:"combo",   cells:[{kana:"ぴゃ",romaji:"pya"},{kana:"ぴゅ",romaji:"pyu"},{kana:"ぴょ",romaji:"pyo"}] },
];

const K: KRow[] = [
  // ── basic ──
  { id:"a",  label:"—", group:"basic",   cells:[{kana:"ア",romaji:"a"},{kana:"イ",romaji:"i"},{kana:"ウ",romaji:"u"},{kana:"エ",romaji:"e"},{kana:"オ",romaji:"o"}] },
  { id:"k",  label:"k", group:"basic",   cells:[{kana:"カ",romaji:"ka"},{kana:"キ",romaji:"ki"},{kana:"ク",romaji:"ku"},{kana:"ケ",romaji:"ke"},{kana:"コ",romaji:"ko"}] },
  { id:"s",  label:"s", group:"basic",   cells:[{kana:"サ",romaji:"sa"},{kana:"シ",romaji:"shi"},{kana:"ス",romaji:"su"},{kana:"セ",romaji:"se"},{kana:"ソ",romaji:"so"}] },
  { id:"t",  label:"t", group:"basic",   cells:[{kana:"タ",romaji:"ta"},{kana:"チ",romaji:"chi"},{kana:"ツ",romaji:"tsu"},{kana:"テ",romaji:"te"},{kana:"ト",romaji:"to"}] },
  { id:"n",  label:"n", group:"basic",   cells:[{kana:"ナ",romaji:"na"},{kana:"ニ",romaji:"ni"},{kana:"ヌ",romaji:"nu"},{kana:"ネ",romaji:"ne"},{kana:"ノ",romaji:"no"}] },
  { id:"h",  label:"h", group:"basic",   cells:[{kana:"ハ",romaji:"ha"},{kana:"ヒ",romaji:"hi"},{kana:"フ",romaji:"fu"},{kana:"ヘ",romaji:"he"},{kana:"ホ",romaji:"ho"}] },
  { id:"m",  label:"m", group:"basic",   cells:[{kana:"マ",romaji:"ma"},{kana:"ミ",romaji:"mi"},{kana:"ム",romaji:"mu"},{kana:"メ",romaji:"me"},{kana:"モ",romaji:"mo"}] },
  { id:"y",  label:"y", group:"basic",   cells:[{kana:"ヤ",romaji:"ya"},null,{kana:"ユ",romaji:"yu"},null,{kana:"ヨ",romaji:"yo"}] },
  { id:"r",  label:"r", group:"basic",   cells:[{kana:"ラ",romaji:"ra"},{kana:"リ",romaji:"ri"},{kana:"ル",romaji:"ru"},{kana:"レ",romaji:"re"},{kana:"ロ",romaji:"ro"}] },
  { id:"w",  label:"w", group:"basic",   cells:[{kana:"ワ",romaji:"wa"},null,null,null,{kana:"ヲ",romaji:"wo"}] },
  { id:"nn", label:"n", group:"basic",   cells:[{kana:"ン",romaji:"n"},null,null,null,null] },
  // ── dakuten ──
  { id:"g",  label:"g", group:"dakuten", cells:[{kana:"ガ",romaji:"ga"},{kana:"ギ",romaji:"gi"},{kana:"グ",romaji:"gu"},{kana:"ゲ",romaji:"ge"},{kana:"ゴ",romaji:"go"}] },
  { id:"z",  label:"z", group:"dakuten", cells:[{kana:"ザ",romaji:"za"},{kana:"ジ",romaji:"ji"},{kana:"ズ",romaji:"zu"},{kana:"ゼ",romaji:"ze"},{kana:"ゾ",romaji:"zo"}] },
  { id:"d",  label:"d", group:"dakuten", cells:[{kana:"ダ",romaji:"da"},{kana:"ヂ",romaji:"ji"},{kana:"ヅ",romaji:"zu"},{kana:"デ",romaji:"de"},{kana:"ド",romaji:"do"}] },
  { id:"b",  label:"b", group:"dakuten", cells:[{kana:"バ",romaji:"ba"},{kana:"ビ",romaji:"bi"},{kana:"ブ",romaji:"bu"},{kana:"ベ",romaji:"be"},{kana:"ボ",romaji:"bo"}] },
  { id:"p",  label:"p", group:"dakuten", cells:[{kana:"パ",romaji:"pa"},{kana:"ピ",romaji:"pi"},{kana:"プ",romaji:"pu"},{kana:"ペ",romaji:"pe"},{kana:"ポ",romaji:"po"}] },
  // ── combos ──
  { id:"kya",label:"ky",group:"combo",   cells:[{kana:"キャ",romaji:"kya"},{kana:"キュ",romaji:"kyu"},{kana:"キョ",romaji:"kyo"}] },
  { id:"sha",label:"sh",group:"combo",   cells:[{kana:"シャ",romaji:"sha"},{kana:"シュ",romaji:"shu"},{kana:"ショ",romaji:"sho"}] },
  { id:"cha",label:"ch",group:"combo",   cells:[{kana:"チャ",romaji:"cha"},{kana:"チュ",romaji:"chu"},{kana:"チョ",romaji:"cho"}] },
  { id:"nya",label:"ny",group:"combo",   cells:[{kana:"ニャ",romaji:"nya"},{kana:"ニュ",romaji:"nyu"},{kana:"ニョ",romaji:"nyo"}] },
  { id:"hya",label:"hy",group:"combo",   cells:[{kana:"ヒャ",romaji:"hya"},{kana:"ヒュ",romaji:"hyu"},{kana:"ヒョ",romaji:"hyo"}] },
  { id:"mya",label:"my",group:"combo",   cells:[{kana:"ミャ",romaji:"mya"},{kana:"ミュ",romaji:"myu"},{kana:"ミョ",romaji:"myo"}] },
  { id:"rya",label:"ry",group:"combo",   cells:[{kana:"リャ",romaji:"rya"},{kana:"リュ",romaji:"ryu"},{kana:"リョ",romaji:"ryo"}] },
  { id:"gya",label:"gy",group:"combo",   cells:[{kana:"ギャ",romaji:"gya"},{kana:"ギュ",romaji:"gyu"},{kana:"ギョ",romaji:"gyo"}] },
  { id:"ja", label:"j", group:"combo",   cells:[{kana:"ジャ",romaji:"ja"},{kana:"ジュ",romaji:"ju"},{kana:"ジョ",romaji:"jo"}] },
  { id:"bya",label:"by",group:"combo",   cells:[{kana:"ビャ",romaji:"bya"},{kana:"ビュ",romaji:"byu"},{kana:"ビョ",romaji:"byo"}] },
  { id:"pya",label:"py",group:"combo",   cells:[{kana:"ピャ",romaji:"pya"},{kana:"ピュ",romaji:"pyu"},{kana:"ピョ",romaji:"pyo"}] },
];

function getKanaPool(script: KanaScript | "both", groups: Set<KanaGroup>): (KC & { script: KanaScript })[] {
  const from = (rows: KRow[], s: KanaScript) =>
    rows.filter(r => groups.has(r.group))
        .flatMap(r => r.cells)
        .filter((c): c is KC => c !== null)
        .map(c => ({ ...c, script: s }));
  const pool: (KC & { script: KanaScript })[] = [];
  if (script !== "katakana") pool.push(...from(H, "hiragana"));
  if (script !== "hiragana") pool.push(...from(K, "katakana"));
  return pool;
}

function generateKanaSession(
  script: KanaScript | "both",
  groups: Set<KanaGroup>,
  mode: KanaMode = "kana_to_romaji",
  count = 20,
): KanaExercise[] {
  const pool = getKanaPool(script, groups);
  if (pool.length < 2) return [];
  const selected = [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(count, pool.length));

  return selected.map(char => {
    const resolved: "kana_to_romaji" | "romaji_to_kana" =
      mode === "mixed" ? (Math.random() < 0.5 ? "kana_to_romaji" : "romaji_to_kana") : mode;

    if (resolved === "romaji_to_kana") {
      // choices = kana chars; correct = char.kana
      const usedKana = new Set([char.kana]);
      const distractors: string[] = [];
      for (const c of [...pool].filter(c => c.romaji !== char.romaji).sort(() => Math.random() - 0.5)) {
        if (!usedKana.has(c.kana)) { usedKana.add(c.kana); distractors.push(c.kana); }
        if (distractors.length === 3) break;
      }
      return { char, mode: resolved, choices: [...distractors, char.kana].sort(() => Math.random() - 0.5), correct: char.kana };
    }

    // kana_to_romaji: choices = unique romaji; correct = char.romaji
    const usedRomaji = new Set([char.romaji]);
    const distractors: string[] = [];
    for (const c of [...pool].filter(c => c.romaji !== char.romaji).sort(() => Math.random() - 0.5)) {
      if (!usedRomaji.has(c.romaji)) { usedRomaji.add(c.romaji); distractors.push(c.romaji); }
      if (distractors.length === 3) break;
    }
    return { char, mode: resolved, choices: [...distractors, char.romaji].sort(() => Math.random() - 0.5), correct: char.romaji };
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, "");
}

function checkWrittenAnswer(input: string, word: RevisionWord): boolean {
  const n = normalize(input);
  if (!n) return false;
  return (
    n === normalize(word.jp) ||
    n === normalize(word.kana) ||
    (!!word.romaji && n === normalize(word.romaji))
  );
}

function generateSession(pool: RevisionWord[], count = 10): Exercise[] {
  if (pool.length < 4) return [];
  const priority: MasteryLevel[] = ["never", "new", "learning", "almost", "acquired", "perfect"];
  const sorted = [...pool].sort((a, b) => priority.indexOf(a.mastery) - priority.indexOf(b.mastery));
  const selected = sorted.slice(0, Math.min(count, sorted.length));

  return selected.map(word => {
    const r = Math.random();
    const type: ExerciseType = r < 0.34 ? "WRITE_JP" : r < 0.67 ? "JP_TO_FR" : "FR_TO_JP";
    if (type === "WRITE_JP") {
      return { word, type, choices: [], correct: word.jp };
    }
    const distractors = [...pool]
      .filter(w => w.jp !== word.jp)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => type === "JP_TO_FR" ? w.fr : w.jp);
    const correct = type === "JP_TO_FR" ? word.fr : word.jp;
    const choices = [...distractors, correct].sort(() => Math.random() - 0.5);
    return { word, type, choices, correct };
  });
}

function applyFilter(words: RevisionWord[], filter: string): RevisionWord[] {
  if (filter === "toWork")   return words.filter(w => ["never", "new", "learning"].includes(w.mastery));
  if (filter === "toReview") return words.filter(w => ["almost", "acquired"].includes(w.mastery));
  if (filter === "perfect")  return words.filter(w => w.mastery === "perfect");
  if (["5", "4", "3", "2", "1"].includes(filter)) return words.filter(w => w.jlpt === Number(filter));
  return words;
}

// ── Kana Mastery (localStorage) ───────────────────────────────────────────────

const KANA_MASTERY_KEY = "sekai-kana-mastery";
type KanaMasteryEntry = { correct: number; total: number };
type KanaMasteryStore = Record<string, KanaMasteryEntry>;

function loadKanaMastery(): KanaMasteryStore {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(KANA_MASTERY_KEY) ?? "{}"); } catch { return {}; }
}
function saveKanaMastery(store: KanaMasteryStore) {
  try { localStorage.setItem(KANA_MASTERY_KEY, JSON.stringify(store)); } catch {}
}
function kanaMasteryLevel(e?: KanaMasteryEntry): "none" | "learning" | "good" | "mastered" {
  if (!e || e.total < 1) return "none";
  const r = e.correct / e.total;
  if (e.total >= 5 && r >= 0.9) return "mastered";
  if (e.total >= 3 && r >= 0.7) return "good";
  return "learning";
}

// ── KanaTableSection ──────────────────────────────────────────────────────────

function KanaTableSection({ label, rows, isCombo, defaultOpen = true, mastery }: {
  label: string; rows: KRow[]; isCombo: boolean; defaultOpen?: boolean; mastery: KanaMasteryStore;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const cols = isCombo ? ["ya", "yu", "yo"] : ["a", "i", "u", "e", "o"];

  const cellBg: Record<ReturnType<typeof kanaMasteryLevel>, string> = {
    none:     "",
    learning: "bg-orange-50",
    good:     "bg-emerald-50",
    mastered: "bg-amber-100",
  };

  return (
    <div className="mb-5">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 mb-2 w-full text-left group">
        <ChevronRight className={`h-3 w-3 text-gray-300 transition-transform ${open ? "rotate-90" : ""}`} />
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-gray-600 transition-colors">{label}</span>
      </button>
      {open && (
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          <div className="grid bg-gray-50 border-b border-gray-100" style={{ gridTemplateColumns: `40px repeat(${cols.length}, 1fr)` }}>
            <div />
            {cols.map(c => <div key={c} className="py-2 text-center text-[10px] font-bold text-gray-400">{c}</div>)}
          </div>
          {rows.map(row => (
            <div key={row.id} className="grid border-b border-gray-50 last:border-0" style={{ gridTemplateColumns: `40px repeat(${cols.length}, 1fr)` }}>
              <div className="flex items-center justify-center text-[11px] font-bold text-gray-300">{row.label}</div>
              {row.cells.map((cell, i) => {
                const lvl = cell ? kanaMasteryLevel(mastery[cell.kana]) : "none";
                return (
                  <div key={i} className={`flex flex-col items-center justify-center py-3 gap-0.5 transition-colors ${cell ? "cursor-default" : ""} ${cell ? cellBg[lvl] : ""}`}>
                    {cell ? (
                      <>
                        <span className="text-2xl leading-none" style={{ fontFamily: "serif" }}>{cell.kana}</span>
                        <span className={`text-[9px] font-medium mt-0.5 ${lvl === "mastered" ? "text-amber-600" : "text-gray-400"}`}>{cell.romaji}</span>
                        {lvl === "mastered" && <span className="text-[9px] text-amber-500 leading-none">★</span>}
                      </>
                    ) : (
                      <span className="text-gray-100">—</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── KanaPanel ─────────────────────────────────────────────────────────────────

function KanaPanel({ onClose }: { onClose: () => void }) {
  const [tableScript, setTableScript]       = useState<KanaScript>("hiragana");
  const [practiceScript, setPracticeScript] = useState<KanaScript | "both">("hiragana");
  const [groups, setGroups]                 = useState<Set<KanaGroup>>(new Set<KanaGroup>(["basic"]));
  const [kanaMode, setKanaMode]             = useState<KanaMode>("kana_to_romaji");
  const [kanaView, setKanaView]             = useState<"table" | "session" | "summary">("table");
  const [mastery, setMastery]               = useState<KanaMasteryStore>(() => loadKanaMastery());
  const [session, setSession]               = useState<KanaExercise[]>([]);
  const [idx, setIdx]                       = useState(0);
  const [kSel, setKSel]                     = useState<string | null>(null);
  const [results, setResults]               = useState<{ char: KC & { script: KanaScript }; correct: boolean }[]>([]);

  const toggleGroup = (g: KanaGroup) => setGroups(prev => {
    const next = new Set(prev);
    if (next.has(g) && next.size > 1) next.delete(g); else next.add(g);
    return next;
  });

  const poolCount = getKanaPool(practiceScript, groups).length;

  const applyMastery = (rr: typeof results) => {
    const next = { ...mastery };
    for (const r of rr) {
      const prev = next[r.char.kana] ?? { correct: 0, total: 0 };
      next[r.char.kana] = { correct: prev.correct + (r.correct ? 1 : 0), total: prev.total + 1 };
    }
    setMastery(next);
    saveKanaMastery(next);
  };

  const startKana = () => {
    const s = generateKanaSession(practiceScript, groups, kanaMode, 20);
    if (!s.length) return;
    setSession(s); setIdx(0); setKSel(null); setResults([]);
    setKanaView("session");
  };

  const answerKana = (choice: string) => {
    if (kSel !== null) return;
    setKSel(choice);
    const ex = session[idx];
    setResults(prev => [...prev, { char: ex.char, correct: choice === ex.correct }]);
  };

  const nextKana = () => {
    if (idx < session.length - 1) { setIdx(i => i + 1); setKSel(null); }
    else { applyMastery(results); setKanaView("summary"); }
  };

  // ── Session ────────────────────────────────────────────────────────────────
  if (kanaView === "session") {
    const ex         = session[idx];
    const isAnswered = kSel !== null;
    const isCorrect  = kSel === ex.correct;
    const isKanaChoice = ex.mode === "romaji_to_kana";

    return (
      <div className="pointer-events-auto fixed inset-0 z-[2010] flex flex-col bg-white">
        <div className="h-2 shrink-0 bg-gray-100">
          <div className="h-full bg-violet-400 transition-all duration-500" style={{ width: `${(idx / session.length) * 100}%` }} />
        </div>
        <div className="shrink-0 flex items-center justify-between border-b border-gray-100 px-8 py-4">
          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{idx + 1} / {session.length}</span>
          <button onClick={() => setKanaView("table")} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-8 gap-8 max-w-2xl mx-auto w-full">
          {/* Question card */}
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-5">
              {ex.mode === "kana_to_romaji" ? "Quelle est la lecture de ce caractère ?" : "Quel caractère correspond à cette lecture ?"}
            </p>
            <div className="inline-flex flex-col items-center gap-3 rounded-2xl border-2 border-gray-200 bg-gray-50 px-16 py-10">
              {ex.mode === "kana_to_romaji" ? (
                <>
                  <span className="text-8xl leading-none" style={{ fontFamily: "serif" }}>{ex.char.kana}</span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest">
                    {ex.char.script === "hiragana" ? "Hiragana" : "Katakana"}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-5xl font-bold text-gray-900 tracking-widest">{ex.char.romaji}</span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest">
                    {ex.char.script === "hiragana" ? "Hiragana" : "Katakana"}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Choices */}
          <div className="flex flex-col gap-3 w-full">
            <div className="grid grid-cols-2 gap-3">
              {ex.choices.map((choice, ci) => {
                let cls = "border-gray-200 bg-white text-gray-700 hover:border-violet-300 hover:bg-violet-50";
                if (isAnswered) {
                  if (choice === ex.correct)  cls = "border-emerald-400 bg-emerald-50 text-emerald-700";
                  else if (choice === kSel)    cls = "border-red-400 bg-red-50 text-red-700";
                  else                         cls = "border-gray-100 bg-gray-50 text-gray-300";
                }
                return (
                  <button key={`${choice}-${ci}`} onClick={() => answerKana(choice)} disabled={isAnswered}
                    className={`rounded-xl border-2 px-4 py-4 text-center transition-all ${isKanaChoice ? "text-3xl" : "text-base font-semibold"} ${cls}`}
                    style={isKanaChoice ? { fontFamily: "serif" } : undefined}>
                    {choice}
                  </button>
                );
              })}
            </div>
            {!isAnswered && (
              <div className="flex justify-center">
                <button onClick={() => answerKana("__skip__")} className="text-[12px] text-gray-400 hover:text-gray-600 transition-colors py-1">
                  Je ne sais pas
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Feedback bar */}
        {isAnswered && (
          <div className={`shrink-0 flex items-center justify-between px-8 py-5 border-t ${isCorrect ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{isCorrect ? "✓" : "✗"}</span>
              <div>
                <p className={`text-sm font-bold ${isCorrect ? "text-emerald-700" : "text-red-700"}`}>
                  {isCorrect ? "Correct !" : "Pas tout à fait..."}
                </p>
                {!isCorrect && (
                  <p className="text-[11px] text-red-500 mt-0.5">
                    Réponse :{" "}
                    <span className="font-bold" style={isKanaChoice ? { fontFamily: "serif", fontSize: "1.1em" } : undefined}>
                      {ex.correct}
                    </span>
                    {isKanaChoice && <span className="ml-1 text-red-400">({ex.char.romaji})</span>}
                  </p>
                )}
              </div>
            </div>
            <button onClick={nextKana}
              className={`rounded-xl px-6 py-3 text-sm font-bold text-white transition-all ${isCorrect ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"}`}>
              {idx < session.length - 1 ? "Continuer →" : "Terminer →"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  if (kanaView === "summary") {
    const correctCount = results.filter(r => r.correct).length;
    const score        = Math.round((correctCount / results.length) * 100);
    const wrong        = results.filter(r => !r.correct);
    return (
      <div className="pointer-events-auto fixed inset-0 z-[2010] flex flex-col items-center justify-center overflow-y-auto bg-white px-8 py-12">
        <div className="w-full max-w-lg text-center">
          <div className="flex justify-center mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-violet-100">
              <Trophy className="h-10 w-10 text-violet-600" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Session terminée !</h2>
          <p className="text-gray-500 mb-6">{correctCount} / {results.length} bonnes réponses</p>
          <div className="text-6xl font-black mb-1 leading-none"
            style={{ color: score >= 80 ? "#16a34a" : score >= 60 ? "#d97706" : "#dc2626" }}>
            {score}%
          </div>
          <p className="text-[11px] uppercase tracking-widest text-gray-400 mb-10">Score de la session</p>
          {wrong.length > 0 && (
            <div className="mb-8 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-left">
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-3">À retravailler</p>
              <div className="flex flex-wrap gap-2">
                {wrong.map((r, i) => (
                  <div key={i} className="flex flex-col items-center rounded-xl bg-white border border-red-100 px-4 py-3 min-w-[60px]">
                    <span className="text-2xl leading-none" style={{ fontFamily: "serif" }}>{r.char.kana}</span>
                    <span className="text-[11px] font-bold text-red-500 mt-1">{r.char.romaji}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={startKana}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
              <RotateCcw className="h-4 w-4" /> Refaire
            </button>
            <button onClick={() => setKanaView("table")}
              className="flex-1 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-500 transition-colors">
              Retour au tableau
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Table ──────────────────────────────────────────────────────────────────
  const tableRows   = tableScript === "hiragana" ? H : K;
  const basicRows   = tableRows.filter(r => r.group === "basic");
  const dakutenRows = tableRows.filter(r => r.group === "dakuten");
  const comboRows   = tableRows.filter(r => r.group === "combo");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Script toggle */}
      <div className="shrink-0 flex gap-1 px-4 pt-3 pb-2">
        {(["hiragana", "katakana"] as const).map(s => (
          <button key={s} onClick={() => { setTableScript(s); if (practiceScript !== "both") setPracticeScript(s); }}
            className={`flex-1 rounded-lg py-2 text-[13px] font-bold transition-colors ${tableScript === s ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
            {s === "hiragana" ? "Hiragana　ひ" : "Katakana　カ"}
          </button>
        ))}
      </div>

      {/* Légende maîtrise */}
      <div className="shrink-0 flex items-center gap-3 px-6 py-1.5 border-b border-gray-100">
        {([
          ["bg-orange-50",  "text-orange-400", "En cours"],
          ["bg-emerald-50", "text-emerald-600", "Bien"],
          ["bg-amber-100",  "text-amber-600",   "★ Maîtrisé"],
        ] as const).map(([bg, txt, lbl]) => (
          <div key={lbl} className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${bg}`}>
            <span className={`text-[10px] font-bold ${txt}`}>{lbl}</span>
          </div>
        ))}
      </div>

      {/* Scrollable table */}
      <div className="flex-1 overflow-y-auto px-6 py-2">
        <KanaTableSection label="Basiques — 46 caractères" rows={basicRows} isCombo={false} defaultOpen={true} mastery={mastery} />
        <KanaTableSection label="Avec accent — dakuten ゛゜" rows={dakutenRows} isCombo={false} defaultOpen={false} mastery={mastery} />
        <KanaTableSection label="Combinaisons — yōon" rows={comboRows} isCombo={true} defaultOpen={false} mastery={mastery} />
      </div>

      {/* Practice CTA */}
      <div className="shrink-0 border-t border-gray-100 bg-white px-6 py-4 space-y-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Groupes :</span>
          {([["basic","Basiques"], ["dakuten","Accent"], ["combo","Combinaisons"]] as [KanaGroup, string][]).map(([g, lbl]) => (
            <label key={g} className="flex items-center gap-1.5 cursor-pointer select-none">
              <input type="checkbox" checked={groups.has(g)} onChange={() => toggleGroup(g)} className="accent-violet-600" />
              <span className="text-[12px] text-gray-600">{lbl}</span>
            </label>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Script :</span>
          {([
            [tableScript, tableScript === "hiragana" ? "Hiragana seulement" : "Katakana seulement"],
            ["both", "Les deux mélangés"],
          ] as [KanaScript | "both", string][]).map(([s, lbl]) => (
            <label key={s} className="flex items-center gap-1.5 cursor-pointer select-none">
              <input type="radio" name="pScript" checked={practiceScript === s} onChange={() => setPracticeScript(s)} className="accent-violet-600" />
              <span className="text-[12px] text-gray-600">{lbl}</span>
            </label>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Mode :</span>
          {([
            ["kana_to_romaji", "Kana → Rōmaji"],
            ["romaji_to_kana", "Rōmaji → Kana"],
            ["mixed",          "Aléatoire"],
          ] as [KanaMode, string][]).map(([m, lbl]) => (
            <label key={m} className="flex items-center gap-1.5 cursor-pointer select-none">
              <input type="radio" name="kMode" checked={kanaMode === m} onChange={() => setKanaMode(m)} className="accent-violet-600" />
              <span className="text-[12px] text-gray-600">{lbl}</span>
            </label>
          ))}
        </div>
        <button onClick={startKana} disabled={poolCount < 2}
          className="w-full rounded-xl bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          Commencer les flashcards · {poolCount} caractères
        </button>
      </div>
    </div>
  );
}

// ── WordList ──────────────────────────────────────────────────────────────────

function WordList({ words }: { words: RevisionWord[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (jp: string) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(jp) ? next.delete(jp) : next.add(jp);
    return next;
  });

  if (words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <p className="text-3xl">🔍</p>
        <p className="text-sm text-gray-400">Aucun mot dans ce filtre.</p>
      </div>
    );
  }

  return (
    <>
      {words.map(word => {
        const isOpen = expanded.has(word.jp);
        const cfg = MASTERY_CONFIG[word.mastery];
        return (
          <div key={`${word.jp}-${word.questId}`}>
            <button
              onClick={() => toggle(word.jp)}
              className="grid w-full grid-cols-[1fr_1fr_200px] gap-4 px-8 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <ChevronRight className={`h-3 w-3 shrink-0 text-gray-300 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                <div className="min-w-0">
                  <span className="text-sm font-bold text-gray-900">{word.jp}</span>
                  {word.kana !== word.jp && (
                    <span className="ml-1.5 text-[11px] text-gray-400">{word.kana}</span>
                  )}
                  <span className="ml-1.5 text-[10px] italic text-gray-300">{word.romaji}</span>
                </div>
                <span
                  className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-black text-white ml-1"
                  style={{ background: JLPT_COLORS[word.jlpt] }}
                >
                  N{word.jlpt}
                </span>
              </div>
              <span className="text-sm text-gray-500 self-center truncate">{word.fr}</span>
              <div className="flex items-center gap-2 self-center">
                <span className="text-sm">{cfg.icon}</span>
                <span className="text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
              </div>
            </button>
            {isOpen && (
              <div className="border-t border-gray-50 bg-gray-50 px-8 py-3">
                <div className="grid grid-cols-3 gap-6 text-[12px]">
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-gray-300 mb-0.5">Rencontres</span>
                    <span className="font-semibold text-gray-700">{word.encounters}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-gray-300 mb-0.5">Correctes</span>
                    <span className="font-semibold text-emerald-600">{word.correctCount}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-gray-300 mb-0.5">Erreurs</span>
                    <span className="font-semibold text-red-500">{word.errorCount}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type View = "overview" | "session" | "summary";

export default function RevisionOverlay({ onClose }: { onClose: () => void }) {
  const [tab, setTab]             = useState<"vocab" | "kana">("vocab");
  const [view, setView]           = useState<View>("overview");
  const [words, setWords]         = useState<RevisionWord[]>([]);
  const [stats, setStats]         = useState<Stats>({ toWork: 0, toReview: 0, acquired: 0 });
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("all");
  const [exercises, setExercises]   = useState<Exercise[]>([]);
  const [exIndex, setExIndex]       = useState(0);
  const [selected, setSelected]     = useState<string | null>(null);
  const [writtenInput, setWrittenInput] = useState("");
  const [results, setResults]       = useState<SessionResult[]>([]);
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    fetch("/api/revision/vocab")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) { setWords(data.words); setStats(data.stats); } })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const startSession = useCallback((overrideFilter?: string) => {
    const f = overrideFilter ?? filter;
    let pool = applyFilter(words, f);
    if (pool.length < 4) pool = words;
    const exs = generateSession(pool, Math.min(10, pool.length));
    if (exs.length === 0) return;
    setExercises(exs);
    setExIndex(0);
    setSelected(null);
    setWrittenInput("");
    setResults([]);
    setView("session");
  }, [words, filter]);

  const handleAnswer = useCallback((choice: string) => {
    if (selected !== null) return;
    setSelected(choice);
    const exercise = exercises[exIndex];
    const correct = exercise.type === "WRITE_JP"
      ? checkWrittenAnswer(choice, exercise.word)
      : choice === exercise.correct;
    setResults(prev => [...prev, { word: exercise.word, correct }]);
  }, [selected, exercises, exIndex]);

  const handleNext = useCallback(async () => {
    if (exIndex < exercises.length - 1) {
      setExIndex(i => i + 1);
      setSelected(null);
      setWrittenInput("");
    } else {
      setSaving(true);
      await fetch("/api/revision/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          results: results.map(r => ({ wordJp: r.word.jp, correct: r.correct })),
        }),
      }).catch(() => {});
      setSaving(false);
      setView("summary");
    }
  }, [exIndex, exercises.length, results]);

  const filteredWords = applyFilter(words, filter);

  // ── Overview ────────────────────────────────────────────────────────────────

  if (view === "overview") {
    return (
      <div className="pointer-events-auto fixed inset-0 z-[2000] flex flex-col bg-white">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-gray-100 px-8 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-2xl font-black text-gray-900">Révision</h1>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="shrink-0 flex border-b border-gray-100">
          {([["vocab","📖  Vocabulaire"],["kana","あ  Kana"]] as ["vocab"|"kana", string][]).map(([t, lbl]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-[13px] font-bold transition-colors border-b-2 ${tab === t ? "text-violet-600 border-violet-500" : "text-gray-400 border-transparent hover:text-gray-600"}`}>
              {lbl}
            </button>
          ))}
        </div>

        {tab === "kana" ? (
          <div className="flex flex-1 flex-col overflow-hidden">
            <KanaPanel onClose={onClose} />
          </div>
        ) : loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
          </div>
        ) : words.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <p className="text-5xl">📚</p>
            <p className="text-lg font-bold text-gray-700">Aucun vocabulaire pour l&apos;instant</p>
            <p className="text-sm text-gray-400 max-w-sm">
              Complète des quêtes pour accumuler du vocabulaire à réviser.
            </p>
            <button
              onClick={onClose}
              className="mt-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-bold text-white hover:bg-violet-500 transition-colors"
            >
              Retour
            </button>
          </div>
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Stats */}
            <div className="shrink-0 px-8 py-6 bg-gray-50 border-b border-gray-100">
              <h2 className="text-xl font-black text-gray-900 mb-5">Ton vocabulaire</h2>
              <div className="flex items-end gap-8">
                {[
                  { count: stats.toWork,   label: "Mots à travailler", color: "#f87171" },
                  { count: stats.toReview, label: "À revoir",          color: "#fb923c" },
                  { count: stats.acquired, label: "Mots bien acquis",  color: "#4ade80" },
                ].map(({ count, label, color }) => (
                  <div key={label} className="flex items-end gap-3">
                    <div
                      className="w-[74px] h-[74px] rounded-2xl border-2 border-gray-200 bg-white relative overflow-hidden"
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 transition-all duration-700"
                        style={{ height: `${words.length ? Math.min(100, (count / words.length) * 100) : 0}%`, background: color }}
                      />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-gray-900 leading-none">{count}</p>
                      <p className="mt-1 text-[11px] text-gray-500 font-medium">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Filter + CTA */}
            <div className="shrink-0 flex items-center justify-between px-8 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-gray-500">Filtrer par :</span>
                <select
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-300"
                >
                  <option value="all">Tous ({words.length})</option>
                  <option value="toWork">À travailler ({stats.toWork})</option>
                  <option value="toReview">À revoir ({stats.toReview})</option>
                  <option value="perfect">Acquis ({stats.acquired})</option>
                  {[5, 4, 3, 2, 1].map(n => {
                    const c = words.filter(w => w.jlpt === n).length;
                    return c > 0 ? <option key={n} value={String(n)}>N{n} ({c})</option> : null;
                  })}
                </select>
              </div>
              <button
                onClick={() => startSession()}
                disabled={words.length < 4}
                className="rounded-xl bg-blue-500 px-5 py-2.5 text-[13px] font-bold text-white hover:bg-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Réviser maintenant
              </button>
            </div>

            {/* Column headers */}
            <div className="shrink-0 grid grid-cols-[1fr_1fr_200px] gap-4 border-b border-gray-100 bg-white px-8 py-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Japonais</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Français</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Connaissance du mot</span>
            </div>

            {/* Word list */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              <WordList words={filteredWords} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Session ─────────────────────────────────────────────────────────────────

  if (view === "session") {
    const exercise  = exercises[exIndex];
    const isAnswered = selected !== null;
    const isCorrect = exercise?.type === "WRITE_JP"
      ? selected !== null && checkWrittenAnswer(selected, exercise.word)
      : selected === exercise?.correct;

    return (
      <div className="pointer-events-auto fixed inset-0 z-[2000] flex flex-col bg-white">
        {/* Progress bar */}
        <div className="h-2 shrink-0 bg-gray-100">
          <div
            className="h-full bg-emerald-400 transition-all duration-500"
            style={{ width: `${(exIndex / exercises.length) * 100}%` }}
          />
        </div>

        {/* Top bar */}
        <div className="shrink-0 flex items-center justify-between border-b border-gray-100 px-8 py-4">
          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
            {exIndex + 1} / {exercises.length}
          </span>
          <button
            onClick={() => { setView("overview"); setSelected(null); }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Exercise */}
        <div className="flex flex-1 flex-col items-center justify-center px-8 py-8 gap-8 max-w-2xl mx-auto w-full">
          {/* Instruction + word card */}
          <div className="text-center w-full">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-5">
              {exercise.type === "JP_TO_FR"
                ? "Que signifie ce mot en français ?"
                : exercise.type === "FR_TO_JP"
                ? "Comment dit-on en japonais ?"
                : "Écris ce mot en japonais"}
            </p>
            <div className="inline-block rounded-2xl border-2 border-gray-200 bg-gray-50 px-12 py-8">
              {exercise.type === "JP_TO_FR" ? (
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-5xl font-black text-gray-900">{exercise.word.jp}</span>
                  {exercise.word.kana !== exercise.word.jp && (
                    <span className="text-lg text-gray-400">{exercise.word.kana}</span>
                  )}
                  <span className="text-sm italic text-gray-400">{exercise.word.romaji}</span>
                  <span
                    className="mt-2 rounded-full px-2.5 py-0.5 text-[10px] font-black text-white"
                    style={{ background: JLPT_COLORS[exercise.word.jlpt] }}
                  >
                    N{exercise.word.jlpt}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-3xl font-bold text-gray-900">{exercise.word.fr}</span>
                  <span
                    className="mt-2 rounded-full px-2.5 py-0.5 text-[10px] font-black text-white"
                    style={{ background: JLPT_COLORS[exercise.word.jlpt] }}
                  >
                    N{exercise.word.jlpt}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Choices or write input */}
          {exercise.type === "WRITE_JP" ? (
            <div className="flex flex-col items-center gap-3 w-full max-w-sm">
              <input
                autoFocus
                type="text"
                value={writtenInput}
                onChange={e => !isAnswered && setWrittenInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !isAnswered && writtenInput.trim()) {
                    handleAnswer(writtenInput.trim());
                  }
                }}
                disabled={isAnswered}
                placeholder="Hiragana, katakana, kanji ou romaji…"
                className={`w-full rounded-xl border-2 px-5 py-4 text-center text-lg font-semibold outline-none transition-all
                  ${isAnswered
                    ? isCorrect
                      ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                      : "border-red-400 bg-red-50 text-red-700"
                    : "border-gray-200 bg-white text-gray-900 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  }`}
              />
              {!isAnswered && (
                <div className="flex flex-col items-center gap-2 w-full">
                  <button
                    onClick={() => { if (writtenInput.trim()) handleAnswer(writtenInput.trim()); }}
                    disabled={!writtenInput.trim()}
                    className="w-full rounded-xl bg-violet-600 px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Vérifier
                  </button>
                  <button
                    onClick={() => handleAnswer("__skip__")}
                    className="text-[12px] text-gray-400 hover:text-gray-600 transition-colors py-1"
                  >
                    Je ne sais pas
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3 w-full">
              <div className="grid grid-cols-2 gap-3">
                {exercise.choices.map(choice => {
                  let cls = "border-gray-200 bg-white text-gray-700 hover:border-violet-300 hover:bg-violet-50";
                  if (isAnswered) {
                    if (choice === exercise.correct)   cls = "border-emerald-400 bg-emerald-50 text-emerald-700";
                    else if (choice === selected)       cls = "border-red-400 bg-red-50 text-red-700";
                    else                               cls = "border-gray-100 bg-gray-50 text-gray-300";
                  }
                  return (
                    <button
                      key={choice}
                      onClick={() => handleAnswer(choice)}
                      disabled={isAnswered}
                      className={`rounded-xl border-2 px-4 py-4 text-sm font-semibold transition-all text-left ${cls}`}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>
              {!isAnswered && (
                <div className="flex justify-center">
                  <button
                    onClick={() => handleAnswer("__skip__")}
                    className="text-[12px] text-gray-400 hover:text-gray-600 transition-colors py-1"
                  >
                    Je ne sais pas
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Feedback bar */}
        {isAnswered && (
          <div
            className={`shrink-0 flex items-center justify-between px-8 py-5 border-t ${
              isCorrect ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{isCorrect ? "✓" : "✗"}</span>
              <div>
                <p className={`text-sm font-bold ${isCorrect ? "text-emerald-700" : "text-red-700"}`}>
                  {isCorrect ? "Correct !" : "Pas tout à fait..."}
                </p>
                {!isCorrect && exercise.type === "WRITE_JP" ? (
                  <p className="text-[11px] text-red-500 mt-0.5">
                    Réponses acceptées :{" "}
                    <span className="font-bold">{exercise.word.jp}</span>
                    {exercise.word.kana !== exercise.word.jp && (
                      <span> · <span className="font-bold">{exercise.word.kana}</span></span>
                    )}
                    {exercise.word.romaji && (
                      <span> · <span className="font-bold">{exercise.word.romaji}</span></span>
                    )}
                  </p>
                ) : !isCorrect ? (
                  <p className="text-[11px] text-red-500 mt-0.5">
                    Réponse : <span className="font-bold">{exercise.correct}</span>
                  </p>
                ) : null}
              </div>
            </div>
            <button
              onClick={handleNext}
              disabled={saving}
              className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-all ${
                isCorrect ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"
              }`}
            >
              {saving
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : exIndex < exercises.length - 1 ? "Continuer →" : "Terminer →"
              }
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Summary ──────────────────────────────────────────────────────────────────

  const correctCount = results.filter(r => r.correct).length;
  const scorePercent = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;
  const wrongWords   = results.filter(r => !r.correct);

  return (
    <div className="pointer-events-auto fixed inset-0 z-[2000] flex flex-col items-center justify-center overflow-y-auto bg-white px-8 py-12">
      <div className="w-full max-w-lg text-center">
        <div className="flex justify-center mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-violet-100">
            <Trophy className="h-10 w-10 text-violet-600" />
          </div>
        </div>

        <h2 className="text-3xl font-black text-gray-900 mb-2">Session terminée !</h2>
        <p className="text-gray-500 mb-6">
          {correctCount} / {results.length} bonnes réponses
        </p>

        <div
          className="text-6xl font-black mb-1 leading-none"
          style={{ color: scorePercent >= 80 ? "#16a34a" : scorePercent >= 60 ? "#d97706" : "#dc2626" }}
        >
          {scorePercent}%
        </div>
        <p className="text-[11px] uppercase tracking-widest text-gray-400 mb-10">Score de la session</p>

        {wrongWords.length > 0 && (
          <div className="mb-8 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-left">
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-3">À retravailler</p>
            <div className="flex flex-col divide-y divide-red-100">
              {wrongWords.map((r, i) => (
                <div key={i} className="flex items-center justify-between py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{r.word.jp}</span>
                    {r.word.kana !== r.word.jp && (
                      <span className="text-[11px] text-gray-400">{r.word.kana}</span>
                    )}
                  </div>
                  <span className="text-gray-500">{r.word.fr}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => startSession()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Refaire
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-500 transition-colors"
          >
            Terminer
          </button>
        </div>
      </div>
    </div>
  );
}
