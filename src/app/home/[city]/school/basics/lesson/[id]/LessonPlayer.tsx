"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  buildLessonExercises,
  ALL_LESSONS,
  type BasicsLesson,
  type Exercise,
  type KanaSlide,
  type VocabSlide,
} from "@/lib/basics-lessons";
import { KanaStrokeOrder } from "@/components/KanaStrokeOrder";

const V = "#3b82f6";
const VD = "#4f46e5";

// ── Speak helper (Web Speech API) ─────────────────────────────────────────────
function speakJapanese(text: string, rate = 1) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ja-JP";
  u.rate = rate * 0.85;
  const voices = window.speechSynthesis.getVoices();
  const jp = voices.find((v) => v.lang.startsWith("ja"));
  if (jp) u.voice = jp;
  window.speechSynthesis.speak(u);
}

// ── Progress dots ─────────────────────────────────────────────────────────────
function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? 20 : 8,
            height: 8,
            borderRadius: 4,
            background: i <= current ? V : "#e5e7eb",
            transition: "all 0.2s",
          }}
        />
      ))}
    </div>
  );
}


// ── Kana intro slide ──────────────────────────────────────────────────────────
function KanaSlideView({
  slide,
  onSpeakClick,
}: {
  slide: KanaSlide;
  onSpeakClick: () => void;
}) {
  return (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flex: 1 }}>
      {/* Left: kana + info */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: "0 0 240px" }}>
        {/* HIRAGANA badge */}
        <span
          style={{
            display: "inline-block",
            background: "#eff6ff",
            color: V,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1.2,
            padding: "4px 10px",
            borderRadius: 6,
            width: "fit-content",
          }}
        >
          HIRAGANA
        </span>

        <KanaStrokeOrder char={slide.char} size={220} />

        {/* Speaker + romaji */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={onSpeakClick}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: V,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
            </svg>
          </button>
          <span style={{ fontSize: 22, fontWeight: 600, color: "#374151" }}>{slide.romaji}</span>
        </div>

        {/* Description */}
        <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5, margin: 0 }}>
          {slide.description}
        </p>
      </div>

      {/* Right: Memory hook */}
      <div
        style={{
          flex: 1,
          background: "#f0f7ff",
          borderRadius: 16,
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span
            style={{
              background: "#dbeafe",
              color: V,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1.2,
              padding: "4px 10px",
              borderRadius: 6,
            }}
          >
            MEMORY HOOK
          </span>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>Looks like…</span>
        </div>

        {/* Illustration */}
        {slide.image && (
          <div
            style={{
              borderRadius: 12,
              overflow: "hidden",
              background: "#fff",
              position: "relative",
              height: 260,
              flexShrink: 0,
            }}
          >
            <Image
              src={slide.image}
              alt={`Memory hook for ${slide.char}`}
              fill
              style={{ objectFit: "contain" }}
              onError={() => {}}
            />
          </div>
        )}

        {/* Mnemonic text */}
        <p
          style={{
            fontSize: 13,
            color: "#374151",
            lineHeight: 1.6,
            margin: 0,
            fontStyle: "italic",
          }}
        >
          {slide.mnemonic}
        </p>
      </div>
    </div>
  );
}

// ── Vocab intro slide ─────────────────────────────────────────────────────────
function VocabSlideView({
  slide,
  onSpeakClick,
}: {
  slide: VocabSlide;
  onSpeakClick: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1, alignItems: "center" }}>
      {/* NEW WORD badge */}
      <span
        style={{
          background: "#eff6ff",
          color: V,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1.2,
          padding: "4px 12px",
          borderRadius: 6,
          alignSelf: "flex-start",
        }}
      >
        NEW WORD
      </span>

      {/* Illustration (les mots/phrases N5 n'en ont pas) */}
      {slide.image && (
        <div
          style={{
            width: "100%",
            flex: 1,
            borderRadius: 16,
            overflow: "hidden",
            background: "#f0f7ff",
            position: "relative",
            minHeight: 160,
          }}
        >
          <Image
            src={slide.image}
            alt={slide.word}
            fill
            style={{ objectFit: "cover" }}
            onError={() => {}}
          />
        </div>
      )}

      {/* Word + romaji + meaning */}
      <div style={{ textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <span
            style={{
              fontSize: 64,
              fontFamily: '"Noto Serif JP", serif',
              color: "#1f2937",
              lineHeight: 1,
            }}
          >
            {slide.word}
          </span>
          <button
            onClick={onSpeakClick}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: V,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
            </svg>
          </button>
        </div>
        <div style={{ fontSize: 18, color: "#6b7280", marginTop: 4 }}>{slide.romaji}</div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "#1f2937",
            marginTop: 8,
            background: `linear-gradient(135deg, ${V}, ${VD})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {slide.meaningFr}
        </div>
      </div>
    </div>
  );
}

// ── Exercise screen ───────────────────────────────────────────────────────────
function ExerciseScreen({
  exercise,
  exIndex,
  exTotal,
  onAnswer,
}: {
  exercise: Exercise;
  exIndex: number;
  exTotal: number;
  onAnswer: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  const [input, setInput] = useState("");

  const isWrite = exercise.type === "write_romaji" || exercise.type === "write_jp";
  const isKana = exercise.type === "kana_to_romaji" || exercise.type === "romaji_to_kana";
  const promptIsKana = exercise.type === "kana_to_romaji";
  const answerIsKana = exercise.type === "romaji_to_kana";
  // Côté japonais : prompt pour kana_to_romaji / word_to_meaning / write_romaji,
  // réponse pour romaji_to_kana / meaning_to_word / write_jp.
  const answerIsJapanese =
    exercise.type === "romaji_to_kana" || exercise.type === "meaning_to_word" || exercise.type === "write_jp";

  const norm = (s: string) => s.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, "");

  const handleChoice = useCallback(
    (choice: string) => {
      if (selected) return;
      setSelected(choice);
      const correct = choice === exercise.answer;
      setFeedback(correct ? "correct" : "wrong");
      if (correct) {
        speakJapanese(answerIsJapanese ? choice : exercise.prompt);
        setTimeout(() => onAnswer(true), 850);
      }
    },
    [selected, exercise, onAnswer, answerIsJapanese]
  );

  const handleWriteSubmit = useCallback(() => {
    if (selected || !input.trim()) return;
    const accepted = (exercise.accept ?? [exercise.answer]).map(norm);
    const correct = accepted.includes(norm(input));
    setSelected(input);
    setFeedback(correct ? "correct" : "wrong");
    if (correct) {
      speakJapanese(answerIsJapanese ? exercise.answer : exercise.prompt);
      setTimeout(() => onAnswer(true), 850);
    }
  }, [selected, input, exercise, onAnswer, answerIsJapanese]);

  useEffect(() => {
    if (isWrite) return; // saisie libre : pas de raccourcis 1–4
    const handler = (e: KeyboardEvent) => {
      const idx = ["1", "2", "3", "4"].indexOf(e.key);
      if (idx !== -1 && exercise.choices[idx]) handleChoice(exercise.choices[idx]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleChoice, exercise.choices, isWrite]);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 0 }}>
      {/* Prompt */}
      <div
        style={{
          background: "#f9fafb",
          borderRadius: 20,
          padding: "32px 24px",
          textAlign: "center",
          marginBottom: 24,
          border: "1.5px solid #e5e7eb",
        }}
      >
        <div
          style={{
            fontSize: isKana && promptIsKana ? 96 : 40,
            fontFamily: promptIsKana ? '"Noto Serif JP", serif' : "inherit",
            fontWeight: promptIsKana ? 400 : 700,
            color: "#1f2937",
            lineHeight: 1.1,
          }}
        >
          {exercise.prompt}
        </div>
        {exercise.promptSub && (
          <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 12 }}>{exercise.promptSub}</div>
        )}
      </div>

      {/* Saisie libre (write_romaji / write_jp) */}
      {isWrite ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleWriteSubmit(); }}
            disabled={!!selected}
            autoFocus
            placeholder={exercise.type === "write_romaji" ? "rōmaji…" : "kana ou rōmaji…"}
            lang={exercise.type === "write_jp" ? "ja" : undefined}
            style={{
              width: "100%",
              padding: "18px 20px",
              borderRadius: 14,
              border: `1.5px solid ${feedback === "correct" ? "#16a34a" : feedback === "wrong" ? "#dc2626" : "#e5e7eb"}`,
              background: feedback === "correct" ? "#dcfce7" : feedback === "wrong" ? "#fee2e2" : "#fff",
              color: "#1f2937",
              fontSize: exercise.type === "write_jp" ? 28 : 22,
              fontFamily: exercise.type === "write_jp" ? '"Noto Serif JP", serif' : "inherit",
              fontWeight: 600,
              textAlign: "center",
              outline: "none",
            }}
          />
          {!selected && (
            <button
              onClick={handleWriteSubmit}
              disabled={!input.trim()}
              style={{
                padding: "14px",
                borderRadius: 14,
                border: "none",
                background: input.trim() ? `linear-gradient(135deg, ${V}, ${VD})` : "#e5e7eb",
                color: "#fff",
                fontSize: 15,
                fontWeight: 700,
                cursor: input.trim() ? "pointer" : "default",
              }}
            >
              Vérifier
            </button>
          )}
        </div>
      ) : (
      /* Choices grid 2×2 */
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, flex: 1 }}>
        {exercise.choices.map((choice, i) => {
          const isSelected = selected === choice;
          const isCorrect = choice === exercise.answer;
          let bg = "#fff";
          let border = "1.5px solid #e5e7eb";
          let color = "#374151";
          if (isSelected && feedback === "correct") { bg = "#dcfce7"; border = `1.5px solid #16a34a`; color = "#15803d"; }
          else if (isSelected && feedback === "wrong") { bg = "#fee2e2"; border = `1.5px solid #dc2626`; color = "#b91c1c"; }
          else if (feedback && isCorrect) { bg = "#dcfce7"; border = `1.5px solid #16a34a`; color = "#15803d"; }

          return (
            <button
              key={`${choice}-${i}`}
              onClick={() => handleChoice(choice)}
              style={{
                padding: "16px 12px",
                borderRadius: 14,
                border,
                background: bg,
                color,
                fontSize: answerIsKana ? 40 : 18,
                fontFamily: answerIsKana ? '"Noto Serif JP", serif' : "inherit",
                fontWeight: 600,
                cursor: selected ? "default" : "pointer",
                transition: "all 0.15s",
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              {choice}
            </button>
          );
        })}
      </div>
      )}

      {/* Wrong answer: show correct + continue */}
      {feedback === "wrong" && (
        <div
          style={{
            marginTop: 16,
            padding: "14px 20px",
            background: "#fee2e2",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 14, color: "#b91c1c" }}>
            Bonne réponse :{" "}
            <strong
              style={{
                fontFamily: answerIsJapanese ? '"Noto Serif JP", serif' : "inherit",
                fontSize: answerIsJapanese ? 20 : 14,
              }}
            >
              {exercise.type === "write_jp" && exercise.accept
                ? exercise.accept.join(" · ")
                : exercise.answer}
            </strong>
          </span>
          <button
            onClick={() => onAnswer(false)}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              background: "#dc2626",
              color: "#fff",
              border: "none",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Continuer →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Result screen ─────────────────────────────────────────────────────────────
function ResultScreen({
  score,
  total,
  xp,
  nextLessonId,
  citySlug,
  onBack,
}: {
  score: number;
  total: number;
  xp: number;
  nextLessonId: number | null;
  citySlug: string;
  onBack: () => void;
}) {
  const pct = Math.round((score / total) * 100);
  const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : 1;
  const router = useRouter();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, flex: 1, justifyContent: "center" }}>
      <div style={{ fontSize: 56 }}>{pct >= 90 ? "🎉" : pct >= 70 ? "😊" : "💪"}</div>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: "#1f2937", margin: 0 }}>
        {pct >= 90 ? "Excellent !" : pct >= 70 ? "Bien joué !" : "Continue !"}
      </h2>
      <div style={{ fontSize: 15, color: "#6b7280" }}>
        {score} / {total} bonnes réponses
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {[1, 2, 3].map((s) => (
          <span key={s} style={{ fontSize: 28, opacity: s <= stars ? 1 : 0.2 }}>⭐</span>
        ))}
      </div>
      <div
        style={{
          background: "#eff6ff",
          border: `1.5px solid ${V}`,
          borderRadius: 12,
          padding: "12px 24px",
          fontSize: 18,
          fontWeight: 700,
          color: V,
        }}
      >
        +{xp} XP
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <button
          onClick={onBack}
          style={{
            padding: "12px 24px",
            borderRadius: 12,
            border: "1.5px solid #e5e7eb",
            background: "#fff",
            color: "#6b7280",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Retour aux leçons
        </button>
        {nextLessonId && (
          <button
            onClick={() => router.push(`/home/${citySlug}/school/basics/lesson/${nextLessonId}`)}
            style={{
              padding: "12px 24px",
              borderRadius: 12,
              border: "none",
              background: `linear-gradient(135deg, ${V}, ${VD})`,
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Leçon suivante →
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main player ───────────────────────────────────────────────────────────────
type Phase = "slides" | "exercise-start" | "exercises" | "result";

export default function LessonPlayer({
  lesson,
  citySlug,
}: {
  lesson: BasicsLesson;
  citySlug: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>(lesson.drill ? "exercises" : "slides");
  const [slideIdx, setSlideIdx] = useState(0);
  const [exercises] = useState<Exercise[]>(() => buildLessonExercises(lesson, ALL_LESSONS));
  const [exIdx, setExIdx] = useState(0);
  const [score, setScore] = useState(0);

  const currentSlide = lesson.slides[slideIdx];
  const isLastSlide = slideIdx === lesson.slides.length - 1;

  // Keyboard: → / Space = Next slide
  useEffect(() => {
    if (phase !== "slides") return;
    const handler = (e: KeyboardEvent) => {
      if (["ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
        if (!isLastSlide) setSlideIdx((i) => i + 1);
      }
      if (e.key === "ArrowLeft" && slideIdx > 0) setSlideIdx((i) => i - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, isLastSlide, slideIdx]);

  // Preload voices
  useEffect(() => {
    window.speechSynthesis?.getVoices();
    window.speechSynthesis?.addEventListener?.("voiceschanged", () =>
      window.speechSynthesis.getVoices()
    );
  }, []);

  const handleSpeakSlide = () => {
    if (currentSlide.type === "kana") speakJapanese(currentSlide.char);
    else speakJapanese(currentSlide.word);
  };

  const handleAnswer = (correct: boolean) => {
    if (correct) setScore((s) => s + 1);
    if (exIdx + 1 >= exercises.length) {
      setPhase("result");
    } else {
      setExIdx((i) => i + 1);
    }
  };

  const handleBack = () => {
    router.push(`/home/${citySlug}/school`);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          height: 56,
          borderBottom: "1px solid #f3f4f6",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: 16,
          background: "#fff",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <button
          onClick={handleBack}
          style={{
            padding: "6px 14px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            background: "#fff",
            color: "#6b7280",
            fontSize: 13,
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          ← Retour
        </button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1f2937" }}>
            Leçon {lesson.id} — {lesson.subtitle}
          </span>
        </div>
        <span style={{ fontSize: 13, color: "#9ca3af", minWidth: 60, textAlign: "right" }}>
          +{lesson.xp} XP
        </span>
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "24px 24px 0",
          maxWidth: 760,
          width: "100%",
          margin: "0 auto",
          gap: 0,
        }}
      >
        {/* ── SLIDE PHASE ─────────────────────────────────────────────────── */}
        {phase === "slides" && (
          <>
            {/* Lesson badge + progress */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <span
                style={{
                  background: "#eff6ff",
                  color: V,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.8,
                  padding: "5px 12px",
                  borderRadius: 8,
                }}
              >
                LEÇON {lesson.id}
              </span>
              <ProgressDots total={lesson.slides.length} current={slideIdx} />
              <span style={{ fontSize: 12, color: "#9ca3af" }}>
                {slideIdx + 1} / {lesson.slides.length}
              </span>
            </div>

            {/* Slide content */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {currentSlide.type === "kana" ? (
                <KanaSlideView slide={currentSlide as KanaSlide} onSpeakClick={handleSpeakSlide} />
              ) : (
                <VocabSlideView slide={currentSlide as VocabSlide} onSpeakClick={handleSpeakSlide} />
              )}
            </div>

            {/* Bottom navigation */}
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 0 24px",
              }}
            >
              {slideIdx > 0 ? (
                <button
                  onClick={() => setSlideIdx((i) => i - 1)}
                  style={{
                    padding: "14px 24px",
                    borderRadius: 14,
                    border: "1.5px solid #e5e7eb",
                    background: "#fff",
                    color: "#6b7280",
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  ← Retour
                </button>
              ) : (
                <div />
              )}
              {isLastSlide ? (
                <button
                  onClick={() => setPhase("exercise-start")}
                  style={{
                    flex: 1,
                    padding: "16px 24px",
                    borderRadius: 14,
                    border: "none",
                    background: `linear-gradient(135deg, ${V}, ${VD})`,
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: "pointer",
                    letterSpacing: 0.3,
                  }}
                >
                  Commencer les exercices →
                </button>
              ) : (
                <button
                  onClick={() => setSlideIdx((i) => i + 1)}
                  style={{
                    flex: 1,
                    padding: "16px 24px",
                    borderRadius: 14,
                    border: "none",
                    background: `linear-gradient(135deg, ${V}, ${VD})`,
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Suivant
                </button>
              )}
            </div>
          </>
        )}

      </div>

      {/* ── EXERCISE START — fullscreen centré ──────────────────────────── */}
      {phase === "exercise-start" && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#fff",
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 32,
            padding: "24px",
          }}
        >
          {/* Kana recap */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            {lesson.slides.filter((s) => s.type === "kana").map((s) => {
              const k = s as KanaSlide;
              return (
                <div
                  key={k.char}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 16,
                    background: "#f9fafb",
                    border: "1.5px solid #e5e7eb",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                  }}
                >
                  <span style={{ fontSize: 30, fontFamily: '"Noto Serif JP", serif', lineHeight: 1 }}>{k.char}</span>
                  <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>{k.romaji}</span>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#1f2937", marginBottom: 8 }}>
              À toi de jouer !
            </div>
            <div style={{ fontSize: 14, color: "#6b7280" }}>
              {exercises.length} exercices pour consolider ce que tu viens d&apos;apprendre.
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 400 }}>
            <button
              onClick={() => setPhase("exercises")}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: 14,
                border: "none",
                background: `linear-gradient(135deg, ${V}, ${VD})`,
                color: "#fff",
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Commencer les exercices →
            </button>
            <button
              onClick={() => setPhase("slides")}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 14,
                border: "1.5px solid #e5e7eb",
                background: "#fff",
                color: "#6b7280",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ← Revoir les kana
            </button>
          </div>
        </div>
      )}

      {/* ── EXERCISE PHASE — fullscreen overlay ─────────────────────────── */}
      {phase === "exercises" && exercises.length > 0 && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#fff",
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Top progress bar */}
          <div style={{ height: 6, background: "#e5e7eb", flexShrink: 0 }}>
            <div
              style={{
                height: "100%",
                background: `linear-gradient(90deg, ${V}, ${VD})`,
                width: `${(exIdx / exercises.length) * 100}%`,
                transition: "width 0.3s",
              }}
            />
          </div>

          {/* Header */}
          <div
            style={{
              height: 52,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 20px",
              borderBottom: "1px solid #f3f4f6",
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => (lesson.drill ? handleBack() : setPhase("slides"))}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: "#fff",
                color: "#6b7280",
                fontSize: 13,
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              {lesson.drill ? "← Retour" : "← Revoir"}
            </button>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
              Exercices — Leçon {lesson.id}
            </span>
            <span style={{ fontSize: 12, color: "#9ca3af", minWidth: 48, textAlign: "right" }}>
              {exIdx + 1} / {exercises.length}
            </span>
          </div>

          {/* Exercise content */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              maxWidth: 600,
              width: "100%",
              margin: "0 auto",
              padding: "28px 20px 24px",
            }}
          >
            <ExerciseScreen
              key={exercises[exIdx].id}
              exercise={exercises[exIdx]}
              exIndex={exIdx}
              exTotal={exercises.length}
              onAnswer={handleAnswer}
            />
          </div>
        </div>
      )}

      {/* ── RESULT PHASE — fullscreen overlay ──────────────────────────── */}
      {phase === "result" && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#fff",
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ResultScreen
            score={score}
            total={exercises.length}
            xp={lesson.xp}
            nextLessonId={lesson.id < ALL_LESSONS.length ? lesson.id + 1 : null}
            citySlug={citySlug}
            onBack={handleBack}
          />
        </div>
      )}
    </div>
  );
}
