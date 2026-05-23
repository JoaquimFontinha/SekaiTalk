"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import type {
  LessonWithProgress,
  LessonStepFull,
  IntroStepData,
  TrueFalseStepData,
  ChooseAnswerStepData,
  CompleteWordStepData,
  MatchPairsStepData,
  CultureNoteStepData,
  PronunciationStepData,
  StepType,
} from "@/lib/lesson";
import { SCORED_TYPES } from "@/lib/lesson";
import cities from "@/lib/cities";

// ── Web Audio chime (free, no files needed) ───────────────────────────────────

function playSuccessChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    ([523, 659, 784, 1047] as const).forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.11;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.28, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.start(t);
      osc.stop(t + 0.45);
    });
  } catch { /* ignore if AudioContext unavailable */ }
}

// ── Web Speech API helpers ────────────────────────────────────────────────────

function getJpVoice(): SpeechSynthesisVoice | null {
  return window.speechSynthesis.getVoices().find(v => v.lang.startsWith("ja")) ?? null;
}

function speakJapanese(text: string, rate = 1): SpeechSynthesisUtterance {
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "ja-JP";
  utter.rate = rate * 0.85;
  const voice = getJpVoice();
  if (voice) utter.voice = voice;
  window.speechSynthesis.speak(utter);
  return utter;
}

// Inline mini speaker button
function SpeakButton({ text, size = 14 }: { text: string; size?: number }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); speakJapanese(text); }}
      className="flex shrink-0 items-center justify-center rounded-full p-1.5 text-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
      title="Écouter"
      type="button"
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
      </svg>
    </button>
  );
}

// Busuu-style audio player bar (for INTRO step card)
function AudioPlayer({ word }: { word: string }) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed]     = useState<1 | 0.7>(1);
  const uttRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => () => { window.speechSynthesis.cancel(); }, []);

  const toggle = () => {
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    const utter = speakJapanese(word, speed);
    utter.onend   = () => setPlaying(false);
    utter.onerror = () => setPlaying(false);
    uttRef.current = utter;
  };

  return (
    <div className="flex items-center gap-3 rounded-xl bg-blue-500 px-4 py-2.5 mx-4 mb-3">
      <button
        onClick={toggle}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-blue-500 hover:bg-blue-50 transition-colors"
        type="button"
      >
        {playing ? (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
        ) : (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </button>

      {/* Waveform / progress bar */}
      <div className="flex flex-1 items-center gap-0.5 h-5 overflow-hidden">
        {playing ? (
          Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              className="flex-1 rounded-full bg-white/70"
              style={{
                height: `${30 + Math.sin(i * 0.8) * 55}%`,
                animationName: "audioWave",
                animationDuration: `${0.5 + (i % 4) * 0.12}s`,
                animationDelay: `${i * 0.04}s`,
                animationTimingFunction: "ease-in-out",
                animationIterationCount: "infinite",
                animationDirection: "alternate",
              }}
            />
          ))
        ) : (
          <div className="h-0.5 w-full rounded-full bg-white/40" />
        )}
      </div>

      <button
        onClick={() => {
          const next = speed === 1 ? 0.7 : 1;
          setSpeed(next);
          if (playing) {
            window.speechSynthesis.cancel();
            setPlaying(false);
          }
        }}
        className="shrink-0 w-8 text-center text-xs font-bold text-white/80 hover:text-white transition-colors"
        type="button"
      >
        {speed === 1 ? "1x" : ".7x"}
      </button>

      <style>{`
        @keyframes audioWave {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1.2); }
        }
      `}</style>
    </div>
  );
}

// ── Confetti ──────────────────────────────────────────────────────────────────

function Confetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    color: ["#22c55e", "#16a34a", "#4ade80", "#fbbf24", "#a78bfa", "#38bdf8", "#f472b6"][i % 7],
    left:  `${5 + (i * 3.4) % 90}%`,
    delay: `${(i * 0.07) % 0.6}s`,
    dur:   `${0.7 + (i % 3) * 0.2}s`,
    size:  `${6 + (i % 4) * 2}px`,
    shape: i % 3 === 0 ? "50%" : i % 3 === 1 ? "0" : "2px",
  }));

  return (
    <div className="pointer-events-none fixed inset-0 z-[800] overflow-hidden">
      {pieces.map(p => (
        <div key={p.id} style={{
          position: "absolute", left: p.left, top: "-10px",
          width: p.size, height: p.size, background: p.color, borderRadius: p.shape,
          animationName: "confettiFall", animationDuration: p.dur,
          animationDelay: p.delay, animationTimingFunction: "ease-in", animationFillMode: "both",
        }} />
      ))}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg);     opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ── Feedback bar ─────────────────────────────────────────────────────────────

function FeedbackBar({ correct, explanation, onContinue }: {
  correct: boolean; explanation: string; onContinue: () => void;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[600] px-4 py-5"
      style={{ background: correct ? "#dcfce7" : "#fee2e2" }}>
      <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl">{correct ? "✓" : "✗"}</span>
          <div className="min-w-0">
            <p className={`text-xs font-bold uppercase tracking-wider ${correct ? "text-green-700" : "text-red-700"}`}>
              {correct ? "Bravo !" : "Presque !"}
            </p>
            <p className="mt-0.5 text-sm text-gray-700 leading-snug">{explanation}</p>
          </div>
        </div>
        <button
          onClick={onContinue}
          className={`shrink-0 rounded-2xl px-8 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity ${correct ? "bg-green-500" : "bg-red-400"}`}
        >
          Continuer
        </button>
      </div>
    </div>
  );
}

// ── INTRO step ────────────────────────────────────────────────────────────────

function IntroStep({ data, onNext }: { data: IntroStepData; onNext: () => void }) {
  return (
    <div className="flex flex-col items-center gap-8">
      <p className="text-base font-semibold text-gray-500 tracking-wide">Nouveautés !</p>

      <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
        {/* Colored area */}
        <div className="relative flex items-center justify-center"
          style={{ height: 200, background: "linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%)" }}>
          <span className="text-[72px] select-none">🏪</span>
        </div>

        {/* Audio player bar — sits just below the image */}
        <AudioPlayer word={data.word} />

        {/* Word info */}
        <div className="px-5 pb-5 text-center">
          <p className="text-xl font-bold text-gray-900">
            {data.romaji} / <span className="text-violet-600">{data.word}</span>
          </p>
          <p className="mt-1 text-sm text-gray-500">{data.translation}</p>
          {data.example && (
            <p className="mt-2 text-xs italic text-gray-400 leading-snug">{data.example}</p>
          )}
        </div>
      </div>

      <button onClick={onNext}
        className="w-full max-w-sm rounded-2xl bg-blue-500 py-4 text-base font-bold text-white hover:bg-blue-600 transition-colors">
        Continuer
      </button>
    </div>
  );
}

// ── TRUE/FALSE step ───────────────────────────────────────────────────────────

function TrueFalseStep({ data, onAnswer }: {
  data: TrueFalseStepData; onAnswer: (correct: boolean) => void;
}) {
  const [chosen, setChosen] = useState<boolean | null>(null);

  const handleChoice = (choice: boolean) => {
    if (chosen !== null) return;
    setChosen(choice);
    onAnswer(choice === data.isTrue);
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <p className="text-base font-semibold text-gray-500 tracking-wide">Vrai ou faux ?</p>

      <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
        <div className="relative flex items-center justify-center"
          style={{ height: 200, background: "linear-gradient(135deg, #0ea5e9 0%, #6d28d9 100%)" }}>
          <span className="text-[72px]">🧠</span>
        </div>

        {/* Audio + word */}
        <div className="flex items-center justify-center gap-2 px-5 py-4 bg-gray-50">
          {data.word && (
            <>
              <SpeakButton text={data.word} size={16} />
              <p className="text-lg font-bold text-gray-900">{data.word}</p>
            </>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-600 text-center max-w-sm">{data.statement}</p>

      <div className="flex w-full max-w-sm gap-3">
        {[true, false].map(v => (
          <button key={String(v)} onClick={() => handleChoice(v)} disabled={chosen !== null}
            className={`flex-1 rounded-2xl border-2 py-4 text-base font-bold transition-all ${
              chosen === null
                ? "border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                : chosen === v
                  ? v === data.isTrue ? "border-green-400 bg-green-50 text-green-700" : "border-red-400 bg-red-50 text-red-700"
                  : "border-gray-100 text-gray-300"
            }`}>
            {v ? "Vrai" : "Faux"}
            <span className="ml-2 text-xs text-gray-400">{v ? "1" : "2"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── CHOOSE ANSWER step ────────────────────────────────────────────────────────

function ChooseAnswerStep({ data, onAnswer }: {
  data: ChooseAnswerStepData; onAnswer: (correct: boolean) => void;
}) {
  const [chosen, setChosen] = useState<number | null>(null);

  const handleChoice = (i: number) => {
    if (chosen !== null) return;
    setChosen(i);
    onAnswer(data.choices[i].isCorrect);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-base font-semibold text-gray-500 tracking-wide text-center">{data.question}</p>

      <div className="w-full max-w-sm rounded-2xl flex items-center justify-center"
        style={{ height: 160, background: "linear-gradient(135deg, #f97316 0%, #ec4899 100%)" }}>
        <span className="text-[64px]">💬</span>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-2.5">
        {data.choices.map((c, i) => (
          <button key={i} onClick={() => handleChoice(i)} disabled={chosen !== null}
            className={`flex items-center justify-between rounded-2xl border-2 px-4 py-3.5 text-left transition-all ${
              chosen === null
                ? "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                : chosen === i
                  ? c.isCorrect ? "border-green-400 bg-green-50" : "border-red-400 bg-red-50"
                  : c.isCorrect ? "border-green-400 bg-green-50" : "border-gray-100"
            }`}>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-800">{c.text}</p>
              {c.subtext && <p className="text-xs text-gray-400 mt-0.5">{c.subtext}</p>}
            </div>
            <SpeakButton text={c.text} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── COMPLETE WORD step ────────────────────────────────────────────────────────

function CompleteWordStep({ data, onAnswer }: {
  data: CompleteWordStepData; onAnswer: (correct: boolean) => void;
}) {
  const [chosen, setChosen] = useState<string | null>(null);

  const handleChoice = (ch: string) => {
    if (chosen !== null) return;
    setChosen(ch);
    const correct = ch === data.answer;
    onAnswer(correct);
    if (correct) setTimeout(() => speakJapanese((data.prefix ?? "") + data.answer + (data.suffix ?? "")), 300);
  };

  const fullWord = (data.prefix ?? "") + data.answer + (data.suffix ?? "");

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-base font-semibold text-gray-500 tracking-wide">{data.question}</p>

      <div className="w-full max-w-sm rounded-2xl flex items-center justify-center"
        style={{ height: 160, background: "linear-gradient(135deg, #22c55e 0%, #0ea5e9 100%)" }}>
        <span className="text-[64px]">✏️</span>
      </div>

      {/* Word with blank + optional speaker once answered */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-3xl font-black">
          {data.prefix && <span className="text-gray-800">{data.prefix}</span>}
          <span className={`min-w-[80px] rounded-xl border-b-4 px-3 py-1 text-center transition-colors ${
            chosen === null ? "border-gray-300 text-gray-300"
              : chosen === data.answer ? "border-green-400 text-green-600"
              : "border-red-400 text-red-500"
          }`}>
            {chosen ?? "___"}
          </span>
          {data.suffix && <span className="text-gray-800">{data.suffix}</span>}
        </div>
        {chosen !== null && <SpeakButton text={fullWord} size={18} />}
      </div>

      <p className="text-sm text-gray-400 italic">{data.translation}</p>

      <div className="flex w-full max-w-sm gap-3 justify-center">
        {data.choices.map((ch, i) => (
          <button key={i} onClick={() => handleChoice(ch)} disabled={chosen !== null}
            className={`rounded-2xl border-2 px-6 py-3 text-lg font-bold transition-all ${
              chosen === null
                ? "border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                : chosen === ch
                  ? ch === data.answer ? "border-green-400 bg-green-50 text-green-700" : "border-red-400 bg-red-50 text-red-600"
                  : ch === data.answer ? "border-green-400 bg-green-50 text-green-700" : "border-gray-100 text-gray-300"
            }`}>
            {ch}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── MATCH PAIRS step ──────────────────────────────────────────────────────────

function MatchPairsStep({ data, onAnswer }: {
  data: MatchPairsStepData; onAnswer: (correct: boolean) => void;
}) {
  const rights   = useRef(data.pairs.map(p => p.right).sort(() => Math.random() - 0.5));
  const [leftSel, setLeftSel]   = useState<number | null>(null);
  const [rightSel, setRightSel] = useState<number | null>(null);
  const [matched, setMatched]   = useState<{ l: number; r: number }[]>([]);
  const [wrong, setWrong]       = useState<{ l: number; r: number } | null>(null);
  const answered = useRef(false);

  const isMatchedLeft  = (i: number) => matched.some(m => m.l === i);
  const isMatchedRight = (i: number) => matched.some(m => m.r === i);

  const handleLeft = (i: number) => {
    if (isMatchedLeft(i)) return;
    setLeftSel(i);
    if (rightSel !== null) attempt(i, rightSel);
  };
  const handleRight = (i: number) => {
    if (isMatchedRight(i)) return;
    setRightSel(i);
    if (leftSel !== null) attempt(leftSel, i);
  };

  const attempt = (l: number, r: number) => {
    if (rights.current[r] === data.pairs[l].right) {
      const next = [...matched, { l, r }];
      setMatched(next);
      setLeftSel(null); setRightSel(null);
      if (next.length === data.pairs.length && !answered.current) {
        answered.current = true;
        setTimeout(() => onAnswer(true), 400);
      }
    } else {
      setWrong({ l, r });
      setTimeout(() => { setWrong(null); setLeftSel(null); setRightSel(null); }, 700);
    }
  };

  const btnClass = (isMatched: boolean, isSelected: boolean, isWrong: boolean) =>
    `w-full rounded-2xl border-2 px-3 py-3 text-sm font-bold text-left transition-all ${
      isMatched  ? "border-green-400 bg-green-50 text-green-700" :
      isWrong    ? "border-red-400 bg-red-50 text-red-600 animate-pulse" :
      isSelected ? "border-blue-400 bg-blue-50 text-blue-700" :
                   "border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
    }`;

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-base font-semibold text-gray-500 tracking-wide">Relie les paires.</p>

      <div className="w-full max-w-sm grid grid-cols-2 gap-3">
        {/* Left column — Japanese (with speak button) */}
        <div className="flex flex-col gap-2">
          {data.pairs.map((p, i) => (
            <button key={i} onClick={() => handleLeft(i)} disabled={isMatchedLeft(i)}
              className={btnClass(isMatchedLeft(i), leftSel === i, wrong?.l === i)}>
              <div className="flex items-center justify-between gap-1">
                <span>{p.left}</span>
                <span onClick={e => { e.stopPropagation(); speakJapanese(p.left); }}
                  className="shrink-0 text-blue-400 hover:text-blue-600 p-0.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                  </svg>
                </span>
              </div>
            </button>
          ))}
        </div>
        {/* Right column — French */}
        <div className="flex flex-col gap-2">
          {rights.current.map((r, i) => (
            <button key={i} onClick={() => handleRight(i)} disabled={isMatchedRight(i)}
              className={btnClass(isMatchedRight(i), rightSel === i, wrong?.r === i)}>
              {r}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── CULTURE NOTE step ─────────────────────────────────────────────────────────

function CultureNoteStep({ data, onNext }: { data: CultureNoteStepData; onNext: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-base font-semibold text-gray-500 tracking-wide text-center">{data.title}</p>

      <div className="w-full max-w-sm rounded-2xl bg-gray-50 p-5">
        <p className="text-sm leading-relaxed text-gray-700">{data.text}</p>

        {data.vocab && data.vocab.length > 0 && (
          <div className="mt-4 rounded-xl border border-gray-200 bg-white overflow-hidden">
            {data.vocab.map((v, i) => (
              <div key={i} className={`flex items-center gap-2 px-4 py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}>
                <SpeakButton text={v.kana ?? v.word} />
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-bold text-gray-800">{v.word}</span>
                  {v.kana && <span className="ml-1 text-xs text-gray-400">({v.kana})</span>}
                </div>
                <span className="shrink-0 text-sm text-gray-500">{v.translation}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={onNext}
        className="w-full max-w-sm rounded-2xl bg-blue-500 py-4 text-base font-bold text-white hover:bg-blue-600 transition-colors">
        Continuer
      </button>
    </div>
  );
}

// ── PRONUNCIATION step ────────────────────────────────────────────────────────

type PronunciationPhase = "idle" | "recording" | "processing" | "success" | "fail";
const MAX_PRONUNCIATION_ATTEMPTS = 3;

function PronunciationStep({ data, onAnswer }: {
  data: PronunciationStepData; onAnswer: (correct: boolean) => void;
}) {
  const [phase, setPhase]                   = useState<PronunciationPhase>("idle");
  const [heard, setHeard]                   = useState("");
  const [attemptsLeft, setAttemptsLeft]     = useState(MAX_PRONUNCIATION_ATTEMPTS);
  const [showLocalConfetti, setShowLocalConfetti] = useState(false);
  const recorderRef  = useRef<MediaRecorder | null>(null);
  const chunksRef    = useRef<Blob[]>([]);
  const answered     = useRef(false);
  const attemptsRef  = useRef(MAX_PRONUNCIATION_ATTEMPTS);

  const processAudio = async () => {
    setPhase("processing");
    try {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      if (blob.size < 500) { setPhase("idle"); return; }
      const fd = new FormData();
      fd.append("audio", blob, "audio.webm");
      const res  = await fetch("/api/transcribe", { method: "POST", body: fd });
      const { text } = await res.json() as { text: string };
      const norm       = (text ?? "").replace(/[\s·\-]/g, "").toLowerCase();
      const normRomaji = data.romaji.replace(/[\s·\-]/g, "").toLowerCase();
      const ok   = norm.includes(data.word) || norm.includes(data.kana) || norm.includes(normRomaji);
      setHeard(text || "…");
      if (ok) {
        playSuccessChime();
        setShowLocalConfetti(true);
        setPhase("success");
        if (!answered.current) {
          answered.current = true;
          setTimeout(() => onAnswer(true), 2200);
        }
      } else {
        attemptsRef.current -= 1;
        setAttemptsLeft(attemptsRef.current);
        setPhase("fail");
        if (attemptsRef.current <= 0 && !answered.current) {
          answered.current = true;
          setTimeout(() => onAnswer(false), 1600);
        }
      }
    } catch {
      setPhase("idle");
    }
  };

  const toggleRecording = async () => {
    if (answered.current) return;
    if (phase === "recording") {
      recorderRef.current?.stop();
      return;
    }
    if (phase !== "idle" && phase !== "fail") return;
    setHeard("");
    try {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        await processAudio();
      };
      recorderRef.current = recorder;
      recorder.start();
      setPhase("recording");
      // auto-stop after 5s
      setTimeout(() => { if (recorderRef.current?.state === "recording") recorderRef.current.stop(); }, 5000);
    } catch {
      setPhase("idle");
    }
  };

  return (
    <div className="flex flex-col items-center gap-7">
      {showLocalConfetti && <Confetti />}

      <p className="text-base font-semibold text-gray-500 tracking-wide">Prononce le mot !</p>

      {/* Target word card */}
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-center"
          style={{ height: 140, background: "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)" }}>
          <span className="text-[60px]">🎤</span>
        </div>
        <div className="px-5 py-4 text-center">
          <p className="text-3xl font-black text-gray-900">{data.word}</p>
          {data.kana !== data.word && (
            <p className="mt-0.5 text-base text-violet-500">{data.kana}</p>
          )}
          <p className="mt-0.5 text-sm font-medium text-gray-400">{data.romaji}</p>
          <p className="mt-1.5 text-sm text-gray-500">{data.translation}</p>
          {data.hint && <p className="mt-1.5 text-xs italic text-gray-400">{data.hint}</p>}
        </div>
      </div>

      {/* Mic / result area */}
      <div className="flex flex-col items-center gap-4 min-h-[140px] justify-center">

        {(phase === "idle" || phase === "fail") && (
          <>
            <button onClick={toggleRecording}
              className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full bg-red-500 shadow-lg hover:bg-red-600 active:scale-95 transition-all">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            </button>
            {phase === "fail" ? (
              <div className="text-center space-y-1">
                <p className="text-sm text-red-400 font-semibold">
                  J'ai entendu : <span className="italic">"{heard}"</span>
                </p>
                <p className="text-xs text-gray-400">
                  {attemptsLeft > 0
                    ? `${attemptsLeft} essai${attemptsLeft > 1 ? "s" : ""} restant${attemptsLeft > 1 ? "s" : ""} — réessaie !`
                    : "Plus d'essais…"}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Appuie et parle</p>
            )}
          </>
        )}

        {phase === "recording" && (
          <>
            <button onClick={toggleRecording}
              className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full bg-red-500 shadow-lg">
              <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-60" />
              <div className="relative h-5 w-5 rounded-sm bg-white" />
            </button>
            <p className="text-sm font-semibold text-red-400 animate-pulse">● Écoute en cours… (appuie pour arrêter)</p>
          </>
        )}

        {phase === "processing" && (
          <>
            <div className="h-[72px] w-[72px] rounded-full border-4 border-gray-200 border-t-violet-500 animate-spin" />
            <p className="text-sm text-gray-400">Analyse de ta prononciation…</p>
          </>
        )}

        {phase === "success" && (
          <div className="flex flex-col items-center gap-3">
            <div style={{ animation: "successPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both" }}>
              <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-green-500 shadow-xl">
                <svg width="36" height="36" viewBox="0 0 52 52" fill="none"
                  stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 27 L22 35 L38 19"
                    style={{ strokeDasharray: 34, strokeDashoffset: 34,
                      animation: "checkDraw 0.4s 0.2s ease-out forwards" }} />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-black text-green-500"
              style={{ animation: "fadeUpIn 0.4s 0.35s ease-out both" }}>
              よし！🎉
            </p>
          </div>
        )}
      </div>

      {/* Hear the word */}
      <div className="flex items-center gap-2">
        <SpeakButton text={data.kana || data.word} size={16} />
        <span className="text-xs text-gray-400">Écoute la prononciation</span>
      </div>

      <style>{`
        @keyframes successPop {
          0%   { transform: scale(0);    opacity: 0; }
          70%  { transform: scale(1.18); opacity: 1; }
          100% { transform: scale(1);    opacity: 1; }
        }
        @keyframes checkDraw  { to { stroke-dashoffset: 0; } }
        @keyframes fadeUpIn {
          from { transform: translateY(10px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── Completion screen ─────────────────────────────────────────────────────────

function CompletionScreen({ score, validated, firstName, onExit }: {
  score: number; validated: boolean; firstName: string;
  lesson: LessonWithProgress; onExit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[700] flex flex-col items-center justify-center bg-white px-6">
      <div className="flex flex-col items-center gap-6 max-w-sm w-full">
        <span className="text-[80px]">🏯</span>
        <div className="text-center">
          <h2 className="text-2xl font-black text-gray-900">
            {validated ? `Bravo ${firstName} !` : `Presque ${firstName} !`}
          </h2>
          <p className="mt-1.5 text-sm text-gray-500">
            {validated ? "Leçon validée avec succès !" : "Il faut 80 % pour valider. Réessaie !"}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 w-full">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Note</p>
            <p className="mt-1 text-2xl font-black text-gray-900">
              {score} % <span className="text-lg">{validated ? "🌟" : "📈"}</span>
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Statut</p>
            <p className={`mt-1 text-lg font-black ${validated ? "text-green-500" : "text-orange-400"}`}>
              {validated ? "Validée ✓" : "< 80 %"}
            </p>
          </div>
        </div>
        <button onClick={onExit}
          className="w-full rounded-2xl bg-blue-500 py-4 text-base font-bold text-white hover:bg-blue-600 transition-colors">
          Continuer
        </button>
      </div>
    </div>
  );
}

// ── Main LessonClient ─────────────────────────────────────────────────────────

export default function LessonClient({ citySlug, poiId }: { citySlug: string; poiId: string }) {
  const router = useRouter();
  const city   = cities[citySlug];
  const poi    = city?.pois.find(p => p.id === poiId);

  const [lesson, setLesson]             = useState<LessonWithProgress | null>(null);
  const [loading, setLoading]           = useState(true);
  const [stepIndex, setStepIndex]       = useState(0);
  const [feedback, setFeedback]         = useState<{ correct: boolean; explanation: string } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [done, setDone]                 = useState(false);
  const [finalScore, setFinalScore]     = useState(0);
  const [validated, setValidated]       = useState(false);
  const [firstName, setFirstName]       = useState("toi");

  const correctRef   = useRef(0);
  const scoredRef    = useRef(0);
  const startTimeRef = useRef(Date.now());

  // Ensure voices are loaded (browsers may delay this)
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    return () => { window.speechSynthesis.cancel(); };
  }, []);

  useEffect(() => {
    fetch(`/api/lessons/poi/${poiId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setLesson(data); setLoading(false); })
      .catch(() => setLoading(false));
    fetch("/api/user/stats")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.firstName) setFirstName(data.firstName); })
      .catch(() => {});
  }, [poiId]);

  const handleBack = useCallback(() => {
    window.speechSynthesis.cancel();
    router.push(`/home/${citySlug}?poi=${poiId}`);
  }, [router, citySlug, poiId]);

  const advance = useCallback(() => {
    if (!lesson) return;
    setFeedback(null);
    setShowConfetti(false);
    if (stepIndex + 1 >= lesson.steps.length) {
      const scored = scoredRef.current;
      const score  = scored === 0 ? 100 : Math.round((correctRef.current / scored) * 100);
      setFinalScore(score);
      fetch(`/api/lessons/${lesson.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, durationSeconds: Math.round((Date.now() - startTimeRef.current) / 1000) }),
      })
        .then(r => r.ok ? r.json() : { validated: score >= 80 })
        .then(d => setValidated(d.validated))
        .catch(() => setValidated(score >= 80))
        .finally(() => setDone(true));
    } else {
      setStepIndex(i => i + 1);
    }
  }, [lesson, stepIndex]);

  const handleAnswer = useCallback((correct: boolean, explanation: string) => {
    scoredRef.current++;
    if (correct) correctRef.current++;
    if (correct) { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 1500); }
    setFeedback({ correct, explanation });
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[900] flex items-center justify-center bg-white">
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-2 w-2 rounded-full bg-gray-300"
              style={{ animation: `dot-pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="fixed inset-0 z-[900] flex flex-col items-center justify-center gap-4 bg-white">
        <p className="text-gray-500">Aucune leçon disponible pour ce lieu.</p>
        <button onClick={handleBack} className="rounded-xl bg-gray-100 px-6 py-2.5 text-sm font-semibold text-gray-700">
          ← Retour
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <>
        {validated && <Confetti />}
        <CompletionScreen
          score={finalScore} validated={validated} firstName={firstName}
          lesson={lesson} onExit={handleBack}
        />
      </>
    );
  }

  const step     = lesson.steps[stepIndex] as LessonStepFull;
  const progress = (stepIndex / lesson.steps.length) * 100;
  const isScored = SCORED_TYPES.includes(step.type as StepType);

  const renderStep = () => {
    switch (step.type as StepType) {
      case "INTRO":
        return <IntroStep data={step.data as IntroStepData} onNext={advance} />;
      case "TRUE_FALSE":
        return <TrueFalseStep data={step.data as TrueFalseStepData}
          onAnswer={c => handleAnswer(c, (step.data as TrueFalseStepData).explanation)} />;
      case "CHOOSE_ANSWER":
        return <ChooseAnswerStep data={step.data as ChooseAnswerStepData}
          onAnswer={c => handleAnswer(c, (step.data as ChooseAnswerStepData).explanation)} />;
      case "COMPLETE_WORD":
        return <CompleteWordStep data={step.data as CompleteWordStepData}
          onAnswer={c => handleAnswer(c, (step.data as CompleteWordStepData).explanation)} />;
      case "MATCH_PAIRS":
        return <MatchPairsStep data={step.data as MatchPairsStepData}
          onAnswer={c => handleAnswer(c, c ? "Toutes les paires sont correctes !" : "Essaie encore !")} />;
      case "CULTURE_NOTE":
        return <CultureNoteStep data={step.data as CultureNoteStepData} onNext={advance} />;
      case "PRONUNCIATION":
        return <PronunciationStep data={step.data as PronunciationStepData}
          onAnswer={c => handleAnswer(c, c ? "Parfaite prononciation !" : `Le mot était : ${(step.data as PronunciationStepData).romaji}`)} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[900] flex flex-col bg-white">
      {showConfetti && <Confetti />}

      {/* Top bar */}
      <div className="flex shrink-0 items-center gap-4 px-4 pt-4 pb-2">
        <button onClick={handleBack}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
          <X className="h-5 w-5" />
        </button>
        <div className="flex-1 h-3.5 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full bg-green-400 transition-all duration-500"
            style={{ width: `${progress}%` }} />
        </div>
        <span className="shrink-0 text-xs font-bold text-gray-400">
          {stepIndex + 1}/{lesson.steps.length}
        </span>
      </div>

      {/* Step content */}
      <div className={`flex-1 overflow-y-auto px-5 py-6 ${feedback && isScored ? "pb-36" : ""}`}>
        <div className="mx-auto max-w-sm">
          {renderStep()}
        </div>
      </div>

      {/* Feedback bar */}
      {feedback && isScored && (
        <FeedbackBar correct={feedback.correct} explanation={feedback.explanation} onContinue={advance} />
      )}
    </div>
  );
}
