"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";

const RevisionOverlay = dynamic(() => import("@/components/RevisionOverlay"), { ssr: false });

type UserStats = { xp: number; level: number; xpInLevel: number; xpNeeded: number; percent: number };
type VocabStats = { toWork: number; toReview: number; acquired: number };

type Tab = "dashboard" | "basiques" | "grammaire" | "pratique" | "flashcards" | "examen";

const TABS: { id: Tab; label: string; locked: boolean }[] = [
  { id: "dashboard",  label: "Dashboard",  locked: false },
  { id: "basiques",   label: "Basiques",   locked: false },
  { id: "grammaire",  label: "Grammaire",  locked: true  },
  { id: "pratique",   label: "Pratique",   locked: false },
  { id: "flashcards", label: "Flashcards", locked: true  },
  { id: "examen",     label: "Examen",     locked: true  },
];

const ACCENT = "#7c3aed";

function LockIcon({ size = 18, color = "#9ca3af" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function XpBar({ percent }: { percent: number }) {
  return (
    <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
        style={{ width: `${percent}%`, background: `linear-gradient(90deg, ${ACCENT}, #c026d3)` }}
      />
    </div>
  );
}

function ProgressCard({
  title, count, total, unit, locked, accent, icon,
}: {
  title: string; count: number; total: number; unit?: string;
  locked?: boolean; accent: string; icon: React.ReactNode;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      {locked && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl bg-gray-50/80 backdrop-blur-[2px]">
          <LockIcon size={22} color="#d1d5db" />
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: accent }}>
            Complète les Basiques pour débloquer
          </p>
        </div>
      )}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
        <span className="text-gray-300">{icon}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-4xl font-black text-gray-800">{count}</span>
        <span className="text-sm text-gray-400">/ {total}{unit ? ` ${unit}` : ""}</span>
        {!locked && (
          <span className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${accent}15`, color: accent }}>
            N5
          </span>
        )}
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct}%`, background: accent }} />
      </div>
      <p className="text-[11px] text-gray-400">{pct}% {locked ? "de sections" : "maîtrisé"}</p>
    </div>
  );
}

function LockedSection({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-24 text-center">
      <LockIcon size={28} color="#d1d5db" />
      <div>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{label} — à venir</p>
        <p className="mt-1 max-w-xs text-xs text-gray-300 mx-auto">
          Cette section sera disponible prochainement.
        </p>
      </div>
    </div>
  );
}

// ── Basiques data ──────────────────────────────────────────────────────────────

type Lesson = {
  id: number; title: string; subtitle: string;
  chars?: { kana: string; romaji: string }[];
  cards: number; xp: number; locked: boolean;
};

const CHAPTER1_LESSONS: Lesson[] = [
  { id: 1, title: "Les voyelles",  subtitle: "あいうえお", locked: false, cards: 5, xp: 20,
    chars: [{ kana:"あ",romaji:"a" },{ kana:"い",romaji:"i" },{ kana:"う",romaji:"u" },{ kana:"え",romaji:"e" },{ kana:"お",romaji:"o" }] },
  { id: 2, title: "Premiers mots", subtitle: "Applique, ne mémorise pas",      locked: true,  cards: 6, xp: 20 },
  { id: 3, title: "K — か行",      subtitle: "かきくけこ", locked: true,  cards: 5, xp: 20,
    chars: [{ kana:"か",romaji:"ka" },{ kana:"き",romaji:"ki" },{ kana:"く",romaji:"ku" },{ kana:"け",romaji:"ke" },{ kana:"こ",romaji:"ko" }] },
  { id: 4, title: "Mots en K",     subtitle: "Premiers mots avec か–こ",        locked: true,  cards: 6, xp: 20 },
  { id: 5, title: "S — さ行",      subtitle: "さしすせそ", locked: true,  cards: 5, xp: 20,
    chars: [{ kana:"さ",romaji:"sa" },{ kana:"し",romaji:"shi" },{ kana:"す",romaji:"su" },{ kana:"せ",romaji:"se" },{ kana:"そ",romaji:"so" }] },
  { id: 6, title: "Mots en S",     subtitle: "Premiers mots avec さ–そ",        locked: true,  cards: 6, xp: 20 },
];

const CHAPTERS_META = [
  { id: 1, title: "Hiragana",       description: "Maîtrise les 46 hiragana, la base de toute lecture.", lessonCount: 12 },
  { id: 2, title: "Katakana",       description: "Apprends les katakana pour lire les mots étrangers.", lessonCount: 12 },
  { id: 3, title: "Vocabulaire N5", description: "Les 100 mots essentiels du JLPT N5.",                  lessonCount: 8  },
];

function BasiquesView({ accent }: { accent: string }) {
  const totalLessons = CHAPTERS_META.reduce((s, c) => s + c.lessonCount, 0);
  const pct = 0;
  const accentDark = "#9333ea";
  const accentGlow = "rgba(124,58,237,0.25)";

  return (
    <div className="relative flex flex-col items-center px-2 pb-24">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="animate-fadeIn mb-10 w-full max-w-2xl text-center">
        <h1 className="text-4xl font-bold" style={{
          background: `linear-gradient(90deg, ${accent}, ${accentDark})`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>Basiques</h1>
        <p className="mt-2 text-sm" style={{ color: "rgba(0,0,0,0.4)" }}>Les fondamentaux du japonais</p>
        <div className="mx-auto mt-4 flex max-w-md items-center gap-3">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(0,0,0,0.06)" }}>
            <div className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${accent}, ${accentDark})` }} />
          </div>
          <span className="text-sm font-bold" style={{ color: "rgba(0,0,0,0.5)" }}>{pct}%</span>
        </div>
      </div>

      {/* ── Chapter 1 card ──────────────────────────────────────── */}
      <div className="animate-fadeIn mb-5 w-full max-w-2xl" style={{ animationDelay: "100ms" }}>
        <div className="relative overflow-hidden rounded-3xl py-5 pl-7 pr-6 sm:pl-9 sm:pr-8 sm:py-7"
          style={{ background: "linear-gradient(135deg,rgba(255,255,255,0.7),rgba(255,255,255,0.45))", backdropFilter: "blur(12px)" }}>
          <div className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(at 15% 0%,rgba(124,58,237,0.05) 0%,transparent 55%)" }} />
          {/* Left accent bar */}
          <div className="absolute bottom-5 left-3 top-5 w-1 rounded-full sm:bottom-7 sm:top-7"
            style={{ background: `linear-gradient(180deg, ${accent}, ${accentDark})`, boxShadow: `0 0 12px ${accentGlow}` }} />
          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: accent }}>Chapitre 1</p>
              <span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                style={{ background: "rgba(0,0,0,0.03)", color: "rgba(0,0,0,0.5)", border: "1px solid rgba(0,0,0,0.05)" }}>
                {CHAPTERS_META[0].lessonCount} leçons
              </span>
            </div>
            <h2 className="mt-2 text-xl font-bold" style={{ color: "rgba(0,0,0,0.9)" }}>{CHAPTERS_META[0].title}</h2>
            <p className="mt-1 text-sm" style={{ color: "rgba(0,0,0,0.45)" }}>{CHAPTERS_META[0].description}</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(0,0,0,0.05)" }}>
                <div className="h-full rounded-full" style={{ width: "0%", background: `linear-gradient(90deg,${accent},${accentDark})` }} />
              </div>
              <span className="text-xs font-semibold tabular-nums" style={{ color: "rgba(0,0,0,0.45)" }}>0/{CHAPTERS_META[0].lessonCount}</span>
            </div>
            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3">
              <button className="inline-flex items-center gap-1.5 text-[11px] font-medium opacity-85 transition-opacity hover:opacity-100"
                style={{ color: "rgba(0,0,0,0.5)" }}>
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                Revoir l&apos;intro
              </button>
              <button className="text-[11px] font-medium underline decoration-dotted underline-offset-[3px] opacity-90 transition-opacity hover:opacity-100"
                style={{ color: "rgba(0,0,0,0.4)" }}>
                Déjà familier ? Passer les leçons
              </button>
            </div>
          </div>
        </div>

        {/* START HERE */}
        <div className="mt-5 flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: accent }}>Commencer ici</span>
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            style={{ color: accent, animation: "1.6s ease-in-out 0s infinite normal none running startHereBob" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      {/* ── Lesson path ─────────────────────────────────────────── */}
      <div className="flex w-full max-w-2xl flex-col items-center">
        {CHAPTER1_LESSONS.map((lesson, i) => {
          const isLeft = i % 2 === 0;
          const isFirst = i === 0;
          const prevActive = i > 0 && !CHAPTER1_LESSONS[i - 1].locked;
          const connectorColor = prevActive ? accent : "rgba(0,0,0,0.08)";
          const connectorGlow = prevActive ? accentGlow : "none";

          // SVG path: even→odd goes left→right, odd→even goes right→left
          const svgPath = isLeft
            ? "M 230 0 C 230 24, 70 24, 70 48"   // right → left
            : "M 70 0 C 70 24, 230 24, 230 48";  // left → right

          return (
            <div key={lesson.id} className="flex w-full flex-col">
              {/* Connector SVG */}
              {!isFirst && (
                <div className="flex w-full justify-center" style={{ height: 48, marginTop: -4, marginBottom: -4 }}>
                  <svg width="300" height="48" viewBox="0 0 300 48" fill="none" className="overflow-visible">
                    <path d={svgPath} stroke={connectorColor} strokeWidth="1.5" strokeDasharray="6 4"
                      fill="none" strokeLinecap="round"
                      style={{ filter: prevActive ? `drop-shadow(0 0 3px ${connectorGlow})` : "none" }} />
                  </svg>
                </div>
              )}

              {/* Lesson row */}
              <div className={`flex w-full items-center gap-3 sm:gap-5 ${isLeft ? "justify-start" : "justify-end"}`}>
                {/* Lesson number — left side for right-aligned cards */}
                {!isLeft && (
                  <div className="hidden shrink-0 select-none flex-col items-center justify-center px-1 sm:flex">
                    <span className="text-[10px] font-semibold uppercase leading-none tracking-[0.2em]"
                      style={{ color: lesson.locked ? "rgba(0,0,0,0.18)" : accent, opacity: 0.8 }}>Leçon</span>
                    <span className="mt-1 text-2xl font-black leading-none tabular-nums"
                      style={{ color: lesson.locked ? "rgba(0,0,0,0.18)" : accent }}>{lesson.id}</span>
                  </div>
                )}

                {/* Card */}
                {lesson.locked ? (
                  <button disabled className="group w-[360px] cursor-not-allowed overflow-hidden rounded-3xl p-6 opacity-50 sm:w-[460px] sm:p-7"
                    style={{ background: "rgba(0,0,0,0.02)", border: "1.5px solid rgba(0,0,0,0.04)" }}>
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl"
                        style={{ background: "rgba(0,0,0,0.04)" }}>
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          style={{ color: "rgba(0,0,0,0.15)" }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <h3 className="mt-3 text-center text-base font-bold leading-tight sm:text-lg"
                        style={{ color: "rgba(0,0,0,0.2)" }}>{lesson.subtitle}</h3>
                      <p className="mt-1.5 max-w-[28ch] text-center text-[13px] leading-snug sm:text-sm"
                        style={{ color: "rgba(0,0,0,0.1)" }}>{lesson.title}</p>
                    </div>
                    <div className="relative z-10 mt-4 flex items-center justify-center gap-4 sm:mt-5">
                      <span className="text-[11px] font-medium" style={{ color: "rgba(0,0,0,0.12)" }}>
                        📄 {lesson.cards}
                      </span>
                      <span className="text-[11px] font-bold" style={{ color: "rgba(0,0,0,0.12)" }}>✦ {lesson.xp} XP</span>
                    </div>
                    <div className="relative z-10 mt-3 flex items-center justify-center">
                      <div className="flex items-end gap-0.5">
                        {[0.65, 1, 0.65].map((s, si) => (
                          <span key={si} className="leading-none" style={{
                            fontSize: `${s * 1.6}rem`, color: "rgba(0,0,0,0.1)",
                            transform: `scale(0.92)`, marginBottom: si === 1 ? 2 : 0,
                          }}>★</span>
                        ))}
                      </div>
                    </div>
                  </button>
                ) : (
                  <button className="group relative w-[360px] cursor-pointer overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] active:scale-[0.98] sm:w-[460px] sm:p-7"
                    style={{
                      background: "linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,255,255,0.8))",
                      border: "1.5px solid rgba(0,0,0,0.06)",
                      boxShadow: "rgba(0,0,0,0.08) 0px 8px 32px, rgba(0,0,0,0.04) 0px 2px 8px, rgba(255,255,255,0.9) 0px 1px 0px inset",
                      backdropFilter: "blur(20px)",
                    }}>
                    <div className="pointer-events-none absolute inset-0"
                      style={{ background: "radial-gradient(at 30% 20%,rgba(124,58,237,0.06) 0%,transparent 60%)" }} />
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl transition-all duration-300"
                        style={{
                          background: `linear-gradient(135deg, ${accent}, ${accentDark})`,
                          boxShadow: `0 4px 20px ${accentGlow}, 0 0 40px ${accentGlow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
                        }}>
                        <span className="drop-shadow-md">🌸</span>
                      </div>
                      <h3 className="mt-3 text-center text-base font-bold leading-tight sm:text-lg"
                        style={{ color: "rgba(0,0,0,0.9)" }}>{lesson.subtitle}</h3>
                      <p className="mt-1.5 max-w-[28ch] text-center text-[13px] leading-snug sm:text-sm"
                        style={{ color: "rgba(0,0,0,0.5)" }}>{lesson.title}</p>
                    </div>
                    {lesson.chars && (
                      <div className="relative z-10 mt-4 flex flex-wrap items-center justify-center gap-2 sm:mt-5">
                        {lesson.chars.map(c => (
                          <div key={c.kana} className="flex min-w-[42px] flex-col items-center rounded-xl px-3 py-2"
                            style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.04)" }}>
                            <span className="text-lg font-medium" style={{ color: "rgba(0,0,0,0.75)" }}>{c.kana}</span>
                            <span className="mt-0.5 text-[9px]" style={{ color: "rgba(0,0,0,0.3)" }}>{c.romaji}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="relative z-10 mt-4 flex items-center justify-center gap-4 sm:mt-5">
                      <div className="flex items-center gap-1" style={{ color: "rgba(0,0,0,0.55)" }}>
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span className="text-[11px] font-medium">{lesson.cards}</span>
                      </div>
                      <div className="flex items-center gap-1" style={{ color: "rgba(0,0,0,0.55)" }}>
                        <span className="text-[11px] font-bold">✦</span>
                        <span className="text-[11px] font-medium">{lesson.xp} XP</span>
                      </div>
                    </div>
                    <div className="relative z-10 mt-3 flex items-center justify-center">
                      <div className="flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold text-white transition-all group-hover:scale-105"
                        style={{ background: `linear-gradient(135deg, ${accent}, ${accentDark})`, boxShadow: `0 4px 12px ${accentGlow}` }}>
                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                        Commencer
                      </div>
                    </div>
                  </button>
                )}

                {/* Lesson number — right side for left-aligned cards */}
                {isLeft && (
                  <div className="hidden shrink-0 select-none flex-col items-center justify-center px-1 sm:flex">
                    <span className="text-[10px] font-semibold uppercase leading-none tracking-[0.2em]"
                      style={{ color: lesson.locked ? "rgba(0,0,0,0.18)" : accent, opacity: 0.8 }}>Leçon</span>
                    <span className="mt-1 text-2xl font-black leading-none tabular-nums"
                      style={{ color: lesson.locked ? "rgba(0,0,0,0.18)" : accent }}>{lesson.id}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Chapters 2 & 3 (locked) ─────────────────────────────── */}
      <div className="mt-12 w-full max-w-2xl space-y-4">
        {CHAPTERS_META.slice(1).map(ch => (
          <div key={ch.id} className="relative overflow-hidden rounded-3xl py-5 pl-7 pr-6 sm:pl-9 sm:py-7"
            style={{ background: "rgba(0,0,0,0.02)", border: "1.5px solid rgba(0,0,0,0.04)" }}>
            <div className="absolute bottom-5 left-3 top-5 w-1 rounded-full sm:bottom-7 sm:top-7 bg-gray-200" />
            <div className="relative z-10 opacity-50">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-gray-400">Chapitre {ch.id}</p>
                <span className="shrink-0 rounded-full border border-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-400">
                  {ch.lessonCount} leçons
                </span>
              </div>
              <h2 className="mt-2 text-xl font-bold text-gray-300">{ch.title}</h2>
              <p className="mt-1 text-sm text-gray-300">{ch.description}</p>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-300">
                <LockIcon size={11} color="#d1d5db" />
                Disponible après le Chapitre {ch.id - 1}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SchoolClient({ citySlug, cityName }: { citySlug: string; cityName: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const backUrl = searchParams.get("from") === "home" ? "/home" : `/home/${citySlug}`;
  const { data: session } = useSession();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [vocabStats, setVocabStats] = useState<VocabStats | null>(null);
  const [tab, setTab] = useState<Tab>("dashboard");

  useEffect(() => {
    fetch("/api/user/stats")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats(d); })
      .catch(() => {});
    fetch("/api/revision/vocab")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.stats) setVocabStats(d.stats); })
      .catch(() => {});
  }, []);

  const userName = (session?.user as any)?.pseudo
    ?? (session?.user as any)?.firstName
    ?? session?.user?.name
    ?? "Apprenant";

  const vocabAcquired = vocabStats ? vocabStats.acquired + vocabStats.toReview : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top nav ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 flex h-14 items-center border-b border-gray-100 bg-white/95 px-6 backdrop-blur-md">
        {/* Left */}
        <div className="flex flex-1 items-center gap-3">
          <button
            onClick={() => router.push(backUrl)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {searchParams.get("from") === "home" ? "Accueil" : cityName}
          </button>
          <span className="text-gray-200">|</span>
          <button
            onClick={() => router.push("/home")}
            className="text-base font-black tracking-tight transition-opacity hover:opacity-70"
            style={{ color: ACCENT }}
          >
            SekaiTalk
          </button>
        </div>

        {/* Centre — tabs */}
        <div className="flex h-full items-center gap-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => !t.locked && setTab(t.id)}
              className="relative flex h-full items-center gap-1.5 px-3 text-sm transition-colors"
              style={
                tab === t.id
                  ? { color: "#111827", fontWeight: 700, cursor: "default" }
                  : t.locked
                  ? { color: "#d1d5db", cursor: "default" }
                  : { color: "#6b7280", fontWeight: 500 }
              }
            >
              {t.locked && <LockIcon size={11} color="#d1d5db" />}
              {t.label}
              {tab === t.id && (
                <span
                  className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
                  style={{ background: ACCENT }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Right */}
        <div className="flex flex-1 items-center justify-end gap-3">
          {stats && (
            <div
              className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold"
              style={{ borderColor: `${ACCENT}40`, color: ACCENT, background: `${ACCENT}0d` }}
            >
              N5
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
            </div>
          )}
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-white"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, #c026d3)` }}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-4 py-8">

        {/* ── Dashboard ────────────────────────────────────────── */}
        {tab === "dashboard" && (
          <>
            {/* Profile card */}
            <div className="mb-6 overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-5">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-xl font-black text-white shadow-md"
                  style={{ background: `linear-gradient(135deg, ${ACCENT}, #c026d3)` }}
                >
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-lg font-black text-gray-800">{userName}</h2>
                    {stats && (
                      <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: `${ACCENT}15`, color: ACCENT }}>
                        Nv {stats.level}
                      </span>
                    )}
                  </div>
                  {stats ? (
                    <>
                      <p className="mb-1.5 text-xs font-semibold text-gray-400">{stats.xpInLevel} / {stats.xpNeeded} XP</p>
                      <XpBar percent={stats.percent} />
                      <p className="mt-1 text-[10px] text-gray-300">Prochain niveau : Nv {stats.level + 1}</p>
                    </>
                  ) : (
                    <div className="mt-2 h-2.5 w-48 animate-pulse rounded-full bg-gray-100" />
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-center gap-0.5 border-l border-gray-100 pl-5">
                  <span className="text-xl">🔥</span>
                  <span className="text-lg font-black text-gray-700">0</span>
                  <span className="text-[9px] font-semibold uppercase tracking-widest text-gray-400">Série</span>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
                <span className="shrink-0 text-base font-bold text-gray-700">一期一会</span>
                <p className="text-xs italic text-gray-400">"Chaque rencontre est unique et ne se répètera jamais."</p>
              </div>
            </div>

            {/* Progress cards */}
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Progression</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <ProgressCard
                title="Vocabulaire" count={vocabStats ? vocabAcquired : 0} total={708} accent={ACCENT}
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>}
              />
              <ProgressCard
                title="Grammaire" count={0} total={68} unit="sections" accent="#ec4899" locked
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>}
              />
              <ProgressCard
                title="Kanji" count={0} total={80} accent="#f59e0b" locked
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" /></svg>}
              />
            </div>
          </>
        )}

        {/* ── Basiques ─────────────────────────────────────────── */}
        {tab === "basiques" && <BasiquesView accent={ACCENT} />}

        {tab === "grammaire"  && <LockedSection label="Grammaire" />}
        {tab === "pratique"   && (
          <RevisionOverlay inline onClose={() => setTab("dashboard")} />
        )}
        {tab === "flashcards" && <LockedSection label="Flashcards" />}
        {tab === "examen"     && <LockedSection label="Examen" />}
      </div>
    </div>
  );
}
