"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pause, Play, Eye, EyeOff, Mic, MicOff, ChevronLeft, ChevronRight } from "lucide-react";
import cities from "@/lib/cities";
import { type VocabEntry, type MasteryLevel, MASTERY_CONFIG, JLPT_COLORS, computeMastery } from "@/lib/mastery";

// ── Types ─────────────────────────────────────────────────────────────────────

type Message  = { role: "user" | "assistant"; content: string };
type Word     = { furigana: string; jp: string; romaji: string; fr: string };
type AIReply  = { reply: string; translation: string; words: Word[]; suggestions: string[] };

type Scene = {
  backgroundImage: string | null;
  entrySound: string | null;
  ambientSound: string | null;
};

type Character = {
  id: string; name: string; nameJp: string; role: string;
  image: string; systemPrompt: string;
  greetingMessage: string; greetingTranslation: string | null; greetingWords: Word[];
  isFriendable: boolean; voiceId: string | null;
  locationContext: string | null;
  scene: Scene | null;
};

type TaskChoice  = { id: string; text: string; isCorrect: boolean; order: number };
type Suggestion  = { fr: string; jp: string; romaji: string };
type QuestTask   = { id: string; order: number; instruction: string; aiContext: string | null; suggestions: Suggestion[]; choices: TaskChoice[] };
type QuestData  = {
  id: string; title: string; description: string | null;
  xpReward: number;
  vocab: VocabEntry[];
  tasks: QuestTask[];
  userProgress: { id: string; status: string; taskProgress: { taskId: string; status: string }[] }[];
};

type ActiveQuest = {
  questId: string;
  questProgressId: string | null;
  questTitle: string;
  tasks: QuestTask[];
  currentTaskIndex: number;
  vocab: VocabEntry[];
  xpReward: number;
};

type CompletedQuestInfo = {
  xpGained: number; leveledUp: boolean; newLevel: number;
  isReplay: boolean; questId: string; vocab: VocabEntry[];
};

type VocabWithMastery = VocabEntry & {
  mastery: MasteryLevel; encounters: number; correctCount: number; errorCount: number; practiced: boolean;
};

// ── Types affichage ───────────────────────────────────────────────────────────

type DisplayMode = "full" | "kanji" | "romaji";

const DISPLAY_MODES: DisplayMode[] = ["full", "kanji", "romaji"];
const MODE_CONFIG: Record<DisplayMode, { char: string; color: string; label: string }> = {
  full:   { char: "全",   color: "bg-gray-300",   label: "Complet" },
  kanji:  { char: "漢",   color: "bg-yellow-400", label: "Kanji"   },
  romaji: { char: "abc",  color: "bg-indigo-400", label: "Romaji"  },
};

// ── Constants ─────────────────────────────────────────────────────────────────

const WORD_COLORS = [
  "text-pink-600", "text-cyan-600", "text-indigo-600", "text-yellow-600",
  "text-emerald-600", "text-orange-600", "text-blue-600", "text-rose-600",
];

const VAD_THRESHOLD     = 0.042;  // RMS min pour considérer qu'il y a de la voix
const VAD_TRIGGER_FRAMES = 5;     // frames consécutives au-dessus du seuil avant de lancer l'enregistrement
const SILENCE_DELAY     = 1400;   // ms de silence avant d'arrêter l'enregistrement
const MIN_RECORD_MS     = 600;    // durée minimale d'un enregistrement valide

// ── SuggestionPlayButton ──────────────────────────────────────────────────────

function SuggestionPlayButton({ text }: { text: string }) {
  const [speed, setSpeed] = useState<1 | 0.7>(1);

  const play = () => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "ja-JP";
    utter.rate = speed * 0.85;
    const jp = window.speechSynthesis.getVoices().find(v => v.lang.startsWith("ja"));
    if (jp) utter.voice = jp;
    window.speechSynthesis.speak(utter);
  };

  return (
    <div className="flex items-center rounded-full bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
      <button
        onClick={play}
        className="flex items-center justify-center px-3 py-1.5 hover:bg-gray-200 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-600">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      </button>
      <div className="w-px h-4 bg-gray-200" />
      <button
        onClick={() => setSpeed(s => s === 1 ? 0.7 : 1)}
        className="px-2.5 py-1.5 text-[11px] font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-colors tabular-nums"
      >
        {speed === 1 ? "x1" : ".7x"}
      </button>
    </div>
  );
}

// ── AudioWave ─────────────────────────────────────────────────────────────────

// Base heights ratio (0–1), scaled to maxH
const WAVE_RATIOS = [0.18, 0.44, 0.88, 0.44, 0.18, 0.44, 0.88, 0.44, 0.18];

function AudioWave({ analyserRef, isRecording, isSpeaking, isBusy, maxH = 20 }: {
  analyserRef: React.RefObject<AnalyserNode | null>;
  isRecording: boolean;
  isSpeaking: boolean;
  isBusy: boolean;
  maxH?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef       = useRef<number>(0);
  const freqBufRef   = useRef<Uint8Array | null>(null);
  const baseH        = WAVE_RATIOS.map(r => Math.max(2, r * maxH));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const bars = Array.from(container.children) as HTMLDivElement[];

    const tick = () => {
      const analyser = analyserRef.current;
      const t = performance.now() / 1000;

      if (analyser && isRecording) {
        if (!freqBufRef.current || freqBufRef.current.length !== analyser.frequencyBinCount) {
          freqBufRef.current = new Uint8Array(analyser.frequencyBinCount);
        }
        analyser.getByteFrequencyData(freqBufRef.current);
        const data = freqBufRef.current;
        const step = Math.floor(data.length / 9);
        bars.forEach((bar, i) => {
          let sum = 0;
          for (let j = i * step; j < Math.min((i + 1) * step, data.length); j++) sum += data[j];
          const amp = (sum / step) / 255;
          const h = Math.min(maxH, baseH[i] + amp * maxH * 2.2);
          bar.style.height          = `${Math.max(2, h)}px`;
          bar.style.backgroundColor = "#94a3b8";
        });
      } else {
        const speed     = isSpeaking ? 4.0 : isBusy ? 3.0 : 1.8;
        const ampFactor = isSpeaking ? 0.5  : isBusy ? 0.35 : 0.22;
        const color     = isSpeaking ? "#6366f1" : "#cbd5e1";
        bars.forEach((bar, i) => {
          const h = baseH[i] * (1 + Math.sin(t * speed + i * 0.5) * ampFactor);
          bar.style.height          = `${Math.max(2, h)}px`;
          bar.style.backgroundColor = color;
        });
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [analyserRef, isRecording, isSpeaking, isBusy, maxH]);

  return (
    <div ref={containerRef} style={{ display: "flex", alignItems: "center", gap: "3px", height: `${maxH}px` }}>
      {baseH.map((h, i) => (
        <div key={i} style={{ width: "3px", borderRadius: "2px", height: `${h}px`, backgroundColor: "#cbd5e1" }} />
      ))}
    </div>
  );
}

// ── WordRow ───────────────────────────────────────────────────────────────────

function WordRow({ words, mode }: { words: Word[]; mode: DisplayMode }) {
  if (mode === "kanji") {
    return (
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
        {words.map((w, i) => (
          <div key={i} className="flex flex-col items-center gap-[2px]">
            <span className="text-[11px] font-medium text-gray-400 min-h-[14px]">{w.furigana}</span>
            <span className="text-[26px] font-bold text-gray-900 leading-none tracking-wide">{w.jp}</span>
          </div>
        ))}
      </div>
    );
  }

  if (mode === "romaji") {
    return (
      <div className="flex flex-wrap items-end gap-x-5 gap-y-4">
        {words.map((w, i) => {
          const color = WORD_COLORS[i % WORD_COLORS.length];
          return (
            <div key={i} className="flex flex-col items-center gap-[3px]">
              <span className={`text-[11px] font-medium min-h-[16px] ${color} opacity-80`}>{w.furigana}</span>
              <span className="text-[24px] font-bold leading-none text-gray-900 tracking-wide">{w.jp}</span>
              <span className={`text-[11px] font-semibold underline underline-offset-2 decoration-dotted ${color}`}>{w.romaji}</span>
            </div>
          );
        })}
      </div>
    );
  }

  // mode === "full"
  return (
    <div className="flex flex-wrap items-end gap-x-5 gap-y-4">
      {words.map((w, i) => {
        const color = WORD_COLORS[i % WORD_COLORS.length];
        return (
          <div key={i} className="flex flex-col items-center gap-[3px]">
            <span className={`text-[11px] font-medium min-h-[16px] ${color} opacity-80`}>{w.furigana}</span>
            <span className="text-[24px] font-bold leading-none text-gray-900 tracking-wide">{w.jp}</span>
            <span className={`text-[11px] font-semibold underline underline-offset-2 decoration-dotted ${color}`}>{w.romaji}</span>
            <span className="text-[10px] text-gray-500 mt-0.5">{w.fr}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function POIClient({
  citySlug, poiId, questId,
}: {
  citySlug: string; poiId: string; questId?: string;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!questId) router.replace(`/home/${citySlug}`);
  }, [questId, citySlug, router]);

  // ── State ──
  const [character, setCharacter]       = useState<Character | null>(null);
  const [notFound, setNotFound]         = useState(false);
  const [activeQuest, setActiveQuest]         = useState<ActiveQuest | null>(null);
  const [showQuiz, setShowQuiz]               = useState(false);
  const [choiceResult, setChoiceResult]       = useState<{ id: string; correct: boolean } | null>(null);
  const [questReward, setQuestReward]         = useState<{ xpGained: number; leveledUp: boolean; newLevel: number; isReplay: boolean } | null>(null);
  const [completedQuestInfo, setCompletedQuestInfo] = useState<CompletedQuestInfo | null>(null);
  const [showQuestComplete, setShowQuestComplete]   = useState(false);
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [summaryVocabProgress, setSummaryVocabProgress] = useState<VocabWithMastery[]>([]);
  const [sessionErrors, setSessionErrors]           = useState(0);
  const [sessionSuggestionsUsed, setSessionSuggestionsUsed] = useState(0);
  const [sessionPracticedVocab, setSessionPracticedVocab]   = useState<Set<string>>(new Set());
  const [sessionAllDetectedVocab, setSessionAllDetectedVocab] = useState<Set<string>>(new Set());
  const [taskBanner, setTaskBanner] = useState<{ index: number; total: number; instruction: string } | null>(null);
  const taskBannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [messages, setMessages]           = useState<Message[]>([]);
  const [currentReply, setCurrentReply]   = useState<AIReply | null>(null);
  const [lastUserMsg, setLastUserMsg]     = useState("");
  const [isLoading, setIsLoading]         = useState(false);
  const [isSpeaking, setIsSpeaking]       = useState(false);

  const [isPaused, setIsPaused]           = useState(false);
  const [isRecording, setIsRecording]     = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [micError, setMicError]           = useState<string | null>(null);
  const [micReady, setMicReady]           = useState(false);
  const [displayMode, setDisplayMode]     = useState<DisplayMode>("full");
  const [replaySpeed, setReplaySpeed]     = useState<1 | 0.7>(1);
  const [hasAudio, setHasAudio]           = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [questTimeLeft, setQuestTimeLeft]     = useState<number | null>(null);
  const [sessionExpired, setSessionExpired]   = useState(false);
  const [leaving, setLeaving]                 = useState(false);
  const [hideDialogue, setHideDialogue]       = useState(false);
  const [micMuted, setMicMuted]               = useState(false);
  const [speakKey, setSpeakKey]               = useState(0);
  const [showMenu, setShowMenu]               = useState(false);
  const [voiceVolume, setVoiceVolume]         = useState(80);
  const voiceVolumeRef = useRef(80);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [historyIndex, setHistoryIndex]       = useState(0);
  const [poiTutoHint, setPoiTutoHint]         = useState<0 | 1 | 2>(poiId === "tutorial-douane" ? 1 : 0);

  // ── Refs ──
  const messagesRef     = useRef<Message[]>([]);
  const systemRef       = useRef("");
  const characterIdRef  = useRef<string | null>(null);
  const activeQuestRef  = useRef<ActiveQuest | null>(null);

  const triggerTaskBanner = useCallback((index: number, total: number, instruction: string) => {
    if (taskBannerTimerRef.current) clearTimeout(taskBannerTimerRef.current);
    setTaskBanner({ index, total, instruction });
    taskBannerTimerRef.current = setTimeout(() => setTaskBanner(null), 3500);
  }, []);
  const recorderRef     = useRef<MediaRecorder | null>(null);
  const chunksRef       = useRef<Blob[]>([]);
  const streamRef       = useRef<MediaStream | null>(null);
  const audioRef        = useRef<HTMLAudioElement | null>(null);
  const ambientRef      = useRef<HTMLAudioElement | null>(null);
  const voiceIdRef      = useRef<string | null>(null);
  const audioCtxRef     = useRef<AudioContext | null>(null);
  const analyserRef     = useRef<AnalyserNode | null>(null);
  const silenceTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingStartRef  = useRef<number>(0);
  const speakAbortRef      = useRef<AbortController | null>(null);
  const chatAbortRef       = useRef<AbortController | null>(null);
  const isRecordingRef     = useRef(false);
  const mountedRef         = useRef(true);
  const shouldListenRef    = useRef(false);
  const lastAudioBlobRef   = useRef<Blob | null>(null);
  const replyHistoryRef    = useRef<Array<{ reply: AIReply; userMsg: string }>>([]);
  const sessionStartRef    = useRef<number>(Date.now());
  const allPoiVocabRef     = useRef<VocabEntry[]>([]);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { activeQuestRef.current = activeQuest; }, [activeQuest]);
  useEffect(() => { if (isSpeaking) setSpeakKey(k => k + 1); }, [isSpeaking]);

  // ── Quest timer — 15 min per quest, paused when isPaused ──────────────────
  useEffect(() => {
    if (!activeQuest) { setQuestTimeLeft(null); return; }
    setQuestTimeLeft(15 * 60);
    setSessionExpired(false);
  }, [activeQuest?.questId]);

  useEffect(() => {
    if (questTimeLeft === null || isPaused || sessionExpired) return;
    if (questTimeLeft === 0) { setSessionExpired(true); return; }
    const id = setTimeout(() => setQuestTimeLeft(t => (t !== null ? t - 1 : null)), 1000);
    return () => clearTimeout(id);
  }, [questTimeLeft, isPaused, sessionExpired]);

  // ── Update shouldListen whenever speaking / loading / paused / modal changes ──
  useEffect(() => {
    const canListen = !micMuted && !isPaused && !isSpeaking && !isLoading && !isTranscribing && !showSuggestions && !sessionExpired && !showQuestComplete && !showSessionSummary;
    shouldListenRef.current = canListen;
    if (!canListen && isRecordingRef.current) {
      if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      isRecordingRef.current = false;
      setIsRecording(false);
    }
  }, [micMuted, isPaused, isSpeaking, isLoading, isTranscribing, showSuggestions, sessionExpired, showQuestComplete, showSessionSummary]);

  // ── TTS ──
  const speak = useCallback(async (text: string) => {
    speakAbortRef.current?.abort();
    const controller = new AbortController();
    speakAbortRef.current = controller;

    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    window.speechSynthesis.cancel();

    const vId = voiceIdRef.current;

    if (!vId) {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "ja-JP"; utter.rate = 0.85; utter.volume = voiceVolumeRef.current / 100;
      const go = () => {
        if (controller.signal.aborted) return;
        const jp = window.speechSynthesis.getVoices().find(v => v.lang.startsWith("ja"));
        if (jp) utter.voice = jp;
        utter.onstart = () => setIsSpeaking(true);
        utter.onend = utter.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utter);
      };
      window.speechSynthesis.getVoices().length ? go()
        : window.speechSynthesis.addEventListener("voiceschanged", go, { once: true });
      return;
    }

    setIsSpeaking(true);
    try {
      const r = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceId: vId }),
        signal: controller.signal,
      });
      if (!r.ok) throw new Error("TTS failed");
      const blob  = await r.blob();
      if (controller.signal.aborted) return;
      lastAudioBlobRef.current = blob;
      setHasAudio(true);
      const url   = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.volume = voiceVolumeRef.current / 100;
      audioRef.current = audio;
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
        if (audioRef.current === audio) audioRef.current = null;
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
        if (audioRef.current === audio) audioRef.current = null;
      };
      await audio.play();
    } catch {
      if (!controller.signal.aborted) setIsSpeaking(false);
    }
  }, []);

  // ── Replay ──
  const replay = useCallback((speed: 1 | 0.7) => {
    if (!lastAudioBlobRef.current || isSpeaking) return;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    const url   = URL.createObjectURL(lastAudioBlobRef.current);
    const audio = new Audio(url);
    audio.playbackRate = speed;
    audioRef.current = audio;
    setIsSpeaking(true);
    audio.onended = () => {
      setIsSpeaking(false);
      URL.revokeObjectURL(url);
      if (audioRef.current === audio) audioRef.current = null;
    };
    audio.onerror = () => {
      setIsSpeaking(false);
      URL.revokeObjectURL(url);
      if (audioRef.current === audio) audioRef.current = null;
    };
    audio.play();
  }, [isSpeaking]);

  // ── Send message ──
  const sendMessage = useCallback(async (text: string) => {
    const t = text.trim(); if (!t) return;
    setLastUserMsg(t);
    const next: Message[] = [...messagesRef.current, { role: "user", content: t }];
    setMessages(next);
    setIsLoading(true);
    // Ne pas effacer currentReply ici — isBusy affiche "Réflexion…" par-dessus.
    // Si la requête échoue, l'ancien message reste visible.

    const aq = activeQuestRef.current;
    let sysPrompt = systemRef.current;
    if (aq) {
      const task = aq.tasks[aq.currentTaskIndex];
      if (task?.aiContext) {
        const isFirstMessage = messagesRef.current.length <= 1;
        sysPrompt += `\n\n[CONTEXTE DE LA TÂCHE ${aq.currentTaskIndex + 1}/${aq.tasks.length} — information de fond, ne pas aborder directement${isFirstMessage ? ", répondre d'abord naturellement au message de l'utilisateur" : ""}]\n${task.aiContext}`;
      }
    }

    chatAbortRef.current?.abort();
    const chatCtrl = new AbortController();
    chatAbortRef.current = chatCtrl;

    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: chatCtrl.signal,
        body: JSON.stringify({
          messages: next,
          systemPrompt: sysPrompt,
          characterId: characterIdRef.current,
        }),
      });
      if (!r.ok) throw new Error(`API ${r.status}`);
      const d: AIReply = await r.json();
      if (!mountedRef.current) return;
      setMessages(p => [...p, { role: "assistant", content: d.reply }]);
      setCurrentReply(d);
      replyHistoryRef.current = [...replyHistoryRef.current, { reply: d, userMsg: t }];
      setHistoryIndex(replyHistoryRef.current.length - 1);
      speak(d.reply);
    } catch (err: any) {
      if (err?.name === "AbortError") { /* requête annulée — l'ancien message reste */ }
      else if (mountedRef.current) setCurrentReply({ reply: "Erreur réseau…", translation: "", words: [], suggestions: [] });
    } finally { if (mountedRef.current) setIsLoading(false); }
  }, [speak]);

  // ── Transcription ──
  const transcribe = useCallback(async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const f = new FormData(); f.append("audio", blob, "audio.webm");
      const r = await fetch("/api/transcribe", { method: "POST", body: f });
      const d = await r.json();
      const text: string = d.text?.trim() ?? "";
      if (text) {
        const aq = activeQuestRef.current;
        if (aq?.vocab?.length) {
          setSessionPracticedVocab(prev => {
            const next = new Set(prev);
            aq.vocab.forEach(v => {
              if (text.includes(v.jp) || text.includes(v.kana)) next.add(v.jp);
            });
            return next;
          });
        }
        if (allPoiVocabRef.current.length) {
          setSessionAllDetectedVocab(prev => {
            const next = new Set(prev);
            allPoiVocabRef.current.forEach(v => {
              if (text.includes(v.jp) || text.includes(v.kana)) next.add(v.jp);
            });
            return next;
          });
        }
        await sendMessage(text);
      }
    } catch { /* silent */ }
    finally { setIsTranscribing(false); }
  }, [sendMessage]);

  // ── VAD — voice activity detection ──
  const startVAD = useCallback(async () => {
    if (!navigator.mediaDevices) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      analyserRef.current = analyser;

      const data = new Float32Array(analyser.fftSize);
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus" : "audio/webm";

      let triggerCount = 0;

      const tick = () => {
        if (!audioCtxRef.current) return;
        analyser.getFloatTimeDomainData(data);
        const rms = Math.sqrt(data.reduce((s, v) => s + v * v, 0) / data.length);

        if (shouldListenRef.current && rms > VAD_THRESHOLD) {
          triggerCount++;

          if (!isRecordingRef.current && triggerCount >= VAD_TRIGGER_FRAMES) {
            chunksRef.current = [];
            const rec = new MediaRecorder(stream, { mimeType: mime });
            recorderRef.current = rec;
            rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
            rec.onstop = () => {
              const duration = Date.now() - recordingStartRef.current;
              const recorded = new Blob(chunksRef.current, { type: mime });
              chunksRef.current = [];
              if (recorded.size > 0 && duration >= MIN_RECORD_MS) transcribe(recorded);
            };
            rec.start(100);
            recordingStartRef.current = Date.now();
            isRecordingRef.current = true;
            setIsRecording(true);
          }

          if (isRecordingRef.current) {
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
              if (isRecordingRef.current && recorderRef.current?.state === "recording") {
                recorderRef.current.stop();
                isRecordingRef.current = false;
                setIsRecording(false);
              }
            }, SILENCE_DELAY);
          }
        } else {
          // En dessous du seuil : réinitialise le compteur pré-déclencheur
          triggerCount = 0;
        }

        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      setMicReady(true);
    } catch (e: unknown) {
      const err = e as { name?: string };
      setMicError(err.name === "NotAllowedError" ? "Micro refusé." : "Micro inaccessible.");
    }
  }, [transcribe]);

  // ── End session — POST to API, show summary ──
  const handleEndSession = useCallback(async (info: CompletedQuestInfo, practiced: Set<string>, errors: number, suggestions: number) => {
    const duration = Math.round((Date.now() - sessionStartRef.current) / 1000);
    const practicedArr = Array.from(practiced);
    try {
      const r = await fetch("/api/session/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questId: info.questId,
          durationSeconds: duration,
          errorCount: errors,
          suggestionsUsed: suggestions,
          practicedWords: practicedArr,
        }),
      });
      if (r.ok) {
        const data = await r.json();
        setSummaryVocabProgress(data.vocabWithMastery ?? []);
      } else {
        setSummaryVocabProgress(info.vocab.map(v => ({
          ...v,
          mastery: computeMastery(practicedArr.includes(v.jp) ? 1 : 0, practicedArr.includes(v.jp) ? 1 : 0, 0),
          encounters: practicedArr.includes(v.jp) ? 1 : 0,
          correctCount: practicedArr.includes(v.jp) ? 1 : 0,
          errorCount: 0,
          practiced: practicedArr.includes(v.jp),
        })));
      }
    } catch {
      setSummaryVocabProgress(info.vocab.map(v => ({
        ...v,
        mastery: "never" as MasteryLevel,
        encounters: 0, correctCount: 0, errorCount: 0,
        practiced: practicedArr.includes(v.jp),
      })));
    }
    setShowQuestComplete(false);
    setShowSessionSummary(true);
  }, []);

  // ── Complete task ──
  const handleCompleteTask = useCallback(async () => {
    const aq = activeQuestRef.current;
    if (!aq) return;

    const task   = aq.tasks[aq.currentTaskIndex];
    const isLast = aq.currentTaskIndex + 1 >= aq.tasks.length;

    if (aq.questProgressId) {
      try {
        const r = await fetch(`/api/quests/tasks/${task.id}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questProgressId: aq.questProgressId }),
        });
        if (isLast && r.ok) {
          const data = await r.json();
          if (data.questCompleted) {
            const info: CompletedQuestInfo = {
              xpGained: data.xpGained,
              leveledUp: data.leveledUp, newLevel: data.newLevel,
              isReplay: data.isReplay, questId: aq.questId, vocab: aq.vocab,
            };
            setActiveQuest(null);
            activeQuestRef.current = null;
            setCompletedQuestInfo(info);
            setShowQuestComplete(true);
            return;
          }
        }
      } catch { /* silent */ }
    }

    if (isLast) {
      const info: CompletedQuestInfo = {
        xpGained: 0, leveledUp: false, newLevel: 1,
        isReplay: false, questId: aq.questId, vocab: aq.vocab,
      };
      setActiveQuest(null);
      activeQuestRef.current = null;
      setCompletedQuestInfo(info);
      setShowQuestComplete(true);
    } else {
      const updated: ActiveQuest = { ...aq, currentTaskIndex: aq.currentTaskIndex + 1 };
      setActiveQuest(updated);
      activeQuestRef.current = updated;
      const nextTask = updated.tasks[updated.currentTaskIndex];
      if (nextTask) triggerTaskBanner(updated.currentTaskIndex + 1, updated.tasks.length, nextTask.instruction);
    }
  }, []);

  // ── Pause / Resume side effects ──
  useEffect(() => {
    if (isPaused) {
      ambientRef.current?.pause();
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      ambientRef.current?.play().catch(() => {});
      audioCtxRef.current?.resume().catch(() => {});
    }
  }, [isPaused]);

  const togglePause = useCallback(() => setIsPaused(prev => !prev), []);

  // ── Load character + quests ──
  useEffect(() => {
    let cancelled = false;
    mountedRef.current = true;

    Promise.all([
      fetch(`/api/characters/${poiId}`).then(r => r.ok ? r.json() : Promise.reject()),
      fetch(`/api/quests/poi/${poiId}`).then(r => r.ok ? r.json() : []),
    ])
      .then(([c, q]: [Character, QuestData[]]) => {
        if (cancelled) return;
        setCharacter(c);

        let sysPrompt = c.systemPrompt;
        if (c.locationContext) sysPrompt += `\n\n[CONTEXTE DU LIEU]\n${c.locationContext}`;
        systemRef.current = sysPrompt;
        voiceIdRef.current = c.voiceId ?? null;
        characterIdRef.current = c.id;

        if (c.scene?.entrySound) {
          const entry = new Audio(c.scene.entrySound);
          entry.volume = 0.7;
          entry.play().catch(() => {});
        }
        if (c.scene?.ambientSound) {
          const ambient = new Audio(c.scene.ambientSound);
          ambient.loop = true;
          ambient.volume = 0.25;
          ambientRef.current = ambient;
          ambient.play().catch(() => {});
        }

        startVAD();

        const allVocabMap = new Map<string, VocabEntry>();
        q.forEach((qd: QuestData) => {
          ((qd.vocab ?? []) as VocabEntry[]).forEach(v => {
            if (!allVocabMap.has(v.jp)) allVocabMap.set(v.jp, v);
          });
        });
        allPoiVocabRef.current = Array.from(allVocabMap.values());

        let initQuest: ActiveQuest | null = null;
        if (questId) {
          const quest = q.find((qd: QuestData) => qd.id === questId);
          if (quest) {
            const existing        = quest.userProgress?.[0];
            const isCompleted     = existing?.status === "COMPLETED";
            const isInProgress    = existing?.status === "IN_PROGRESS";
            const currentTaskIndex = isInProgress
              ? (existing?.taskProgress?.filter((tp: { status: string }) => tp.status === "COMPLETED").length ?? 0)
              : 0;

            sessionStartRef.current = Date.now();
            setSessionErrors(0);
            setSessionSuggestionsUsed(0);
            setSessionPracticedVocab(new Set());
            setSessionAllDetectedVocab(new Set());

            initQuest = {
              questId: quest.id,
              questProgressId: existing?.id ?? null,
              questTitle: quest.title,
              tasks: quest.tasks,
              currentTaskIndex,
              vocab: (quest.vocab ?? []) as VocabEntry[],
              xpReward: quest.xpReward ?? 0,
            };

            if (!existing || isCompleted) {
              fetch(`/api/quests/${quest.id}/start`, { method: "POST" })
                .then(r => r.ok ? r.json() : null)
                .then(progress => {
                  if (progress) {
                    setActiveQuest(prev => prev ? { ...prev, questProgressId: progress.id } : null);
                    activeQuestRef.current = activeQuestRef.current
                      ? { ...activeQuestRef.current, questProgressId: progress.id }
                      : null;
                  }
                })
                .catch(() => {});
            }
          }
        }

        setActiveQuest(initQuest);
        activeQuestRef.current = initQuest;
        if (initQuest) {
          const firstTask = initQuest.tasks[initQuest.currentTaskIndex];
          if (firstTask) triggerTaskBanner(initQuest.currentTaskIndex + 1, initQuest.tasks.length, firstTask.instruction);
        }

        const suggestions = initQuest
          ? ["Bonjour !", "Excusez-moi…", "Pouvez-vous m'aider ?"]
          : ["Bonjour !", "Comment ça va ?", "Qu'est-ce que vous recommandes ?"];

        setMessages([]);
        messagesRef.current = [];

        const greetingReply: AIReply = {
          reply: c.greetingMessage,
          translation: c.greetingTranslation ?? "",
          words: c.greetingWords ?? [],
          suggestions,
        };
        replyHistoryRef.current = [{ reply: greetingReply, userMsg: "" }];
        setHistoryIndex(0);
        setCurrentReply(greetingReply);
        speak(c.greetingMessage);
      })
      .catch(() => setNotFound(true));

    return () => {
      cancelled = true;
      mountedRef.current = false;
      shouldListenRef.current = false;
      isRecordingRef.current = false;
      speakAbortRef.current?.abort();
      chatAbortRef.current?.abort();
      audioRef.current?.pause();
      ambientRef.current?.pause();
      window.speechSynthesis.cancel();
      if (recorderRef.current) {
        recorderRef.current.onstop = null;
        if (recorderRef.current.state === "recording") recorderRef.current.stop();
        recorderRef.current = null;
      }
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
      analyserRef.current = null;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poiId, questId]);

  const isBusy = isLoading || isTranscribing;

  // ── History navigation ──
  const histEntry       = replyHistoryRef.current[historyIndex];
  const displayedReply  = histEntry?.reply ?? currentReply;
  const displayedUserMsg = histEntry?.userMsg ?? lastUserMsg;
  const isViewingHistory = historyIndex < replyHistoryRef.current.length - 1;
  const canGoBack       = historyIndex > 0;
  const canGoForward    = isViewingHistory;

  const handleBack = useCallback(() => {
    window.speechSynthesis.cancel();
    speakAbortRef.current?.abort();
    chatAbortRef.current?.abort();
    setLeaving(true);
    setTimeout(() => router.push(`/home/${citySlug}?poi=${poiId}`), 450);
  }, [router, citySlug, poiId]);

  // ── Guards ──
  if (notFound) return <div className="flex h-screen items-center justify-center text-gray-400">Personnage introuvable.</div>;

  if (!character) {
    const poi = cities[citySlug]?.pois.find(p => p.id === poiId);
    const cityName = cities[citySlug]?.name ?? "";
    return (
      <div
        className="flex h-screen w-screen flex-col items-center justify-center select-none"
        style={{ background: "white", animation: "screen-fadein 0.3s ease-out" }}
      >
        <div className="text-center">
          <p className="mb-4 text-[9px] font-bold tracking-[0.5em] uppercase text-gray-300">{cityName}</p>
          <h1 className="text-2xl font-bold text-gray-900">{poi?.name ?? "Chargement..."}</h1>
          <div className="mt-7 flex items-center justify-center gap-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-1.5 w-1.5 rounded-full bg-gray-300"
                   style={{ animation: `dot-pulse 1.3s ${i * 0.18}s ease-in-out infinite` }} />
            ))}
          </div>
        </div>
        <p className="absolute bottom-8 text-[9px] font-medium tracking-[0.35em] text-gray-300">読み込み中</p>
      </div>
    );
  }

  const bgSrc = character.scene?.backgroundImage || "/background_placeholder.png";

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="relative h-screen w-screen overflow-hidden select-none" style={{ animation: "screen-fadein 0.4s ease-out" }}>

      {/* Leaving fade overlay */}
      {leaving && (
        <div className="fixed inset-0 z-[2000] bg-white pointer-events-none"
             style={{ animation: "leaving-in 450ms ease-out forwards" }} />
      )}

      {/* Background */}
      <div className="absolute inset-0 bg-gray-100">
        <img
          src={bgSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={e => { (e.currentTarget as HTMLImageElement).src = "/background_placeholder.png"; }}
        />
      </div>

      {/* Character sprite */}
      <div className="absolute bottom-0 right-0 z-10 h-full flex items-end pointer-events-none" style={{ width: "52%" }}>
        <img
          key={speakKey}
          src={character.image || "/character_placeholder.png"} alt={character.name}
          onError={e => { (e.currentTarget as HTMLImageElement).src = "/character_placeholder.png"; }}
          className={`h-[92%] w-auto object-contain object-bottom${speakKey > 0 ? " char-bounce" : ""}`}
          draggable={false}
        />
      </div>


      {/* Top bar — left | center pause | right */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-start justify-between px-5 pt-4">

        {/* Left: quest info */}
        {activeQuest ? (
          <div className="flex items-start gap-2 rounded-xl bg-white/95 px-4 py-3 shadow-sm border border-yellow-400/30 backdrop-blur-sm" style={{ maxWidth: 420 }}>
            <span className="mt-0.5 shrink-0">🎯</span>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-widest text-yellow-600">
                {activeQuest.questTitle} — {activeQuest.currentTaskIndex + 1}/{activeQuest.tasks.length}
              </p>
              <p className="text-[12px] font-semibold text-gray-800 leading-snug mt-0.5">
                {activeQuest.tasks[activeQuest.currentTaskIndex]?.instruction}
              </p>
              <div className="mt-1.5 flex gap-1">
                {activeQuest.tasks.map((_, i) => (
                  <div key={i} className={`h-1 rounded-full transition-all duration-500 ${
                    i < activeQuest.currentTaskIndex ? "w-5 bg-emerald-400"
                    : i === activeQuest.currentTaskIndex ? "w-5 bg-yellow-400"
                    : "w-3 bg-gray-200"
                  }`} />
                ))}
              </div>
              {currentReply && !isBusy && !isPaused && (
                <button
                  onClick={() => setShowQuiz(true)}
                  className="mt-2.5 w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition-all py-1.5 text-[11px] font-bold text-white tracking-wide"
                >
                  J&apos;ai compris ✓
                </button>
              )}
            </div>
          </div>
        ) : (
          <div />
        )}

        {/* Center: pause button + timer */}
        <div className="flex items-center gap-2">
          <button
            onClick={togglePause}
            className="flex flex-col items-center gap-0.5 rounded-xl bg-white/95 px-5 py-2.5 shadow-sm backdrop-blur-sm hover:bg-white transition-colors"
          >
            {isPaused
              ? <Play  className="h-5 w-5 text-gray-700" />
              : <Pause className="h-5 w-5 text-gray-700" />
            }
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
              {isPaused ? "Reprendre" : "Pause"}
            </span>
          </button>
          {questTimeLeft !== null && (() => {
            const m = Math.floor(questTimeLeft / 60);
            const s = questTimeLeft % 60;
            const display = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
            const isWarn  = questTimeLeft <= 5 * 60;
            const isCrit  = questTimeLeft <= 60;
            return (
              <div className={`rounded-xl bg-white/95 px-3 py-2.5 shadow-sm backdrop-blur-sm text-center min-w-[56px] ${isCrit ? "animate-pulse" : ""}`}>
                <p className={`text-base font-black tabular-nums leading-none ${
                  isCrit ? "text-red-500" : isWarn ? "text-orange-500" : "text-gray-700"
                }`}>{display}</p>
                <p className="text-[8px] font-bold uppercase tracking-widest text-gray-300 mt-0.5">Session</p>
              </div>
            );
          })()}
        </div>

        {/* Right: menu button */}
        <button
          onClick={() => setShowMenu(true)}
          className="flex flex-col items-center justify-center gap-[5px] rounded-xl bg-white/95 px-4 py-2.5 shadow-sm backdrop-blur-sm hover:bg-white transition-colors"
        >
          <span className="block w-5 h-[2px] rounded-full bg-gray-600" />
          <span className="block w-5 h-[2px] rounded-full bg-gray-600" />
          <span className="block w-5 h-[2px] rounded-full bg-gray-600" />
        </button>
      </div>

      {/* Pause overlay */}
      {isPaused && (
        <div
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/55 backdrop-blur-sm cursor-pointer"
          onClick={togglePause}
        >
          <div className="flex flex-col items-center gap-3 text-white/80">
            <Play className="h-10 w-10" />
            <p className="text-sm font-bold uppercase tracking-widest">Appuyer pour reprendre</p>
          </div>
        </div>
      )}

      {/* Session expired overlay */}
      {sessionExpired && !showSessionSummary && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="flex flex-col items-center gap-5 rounded-2xl border border-gray-200 bg-white px-10 py-8 shadow-2xl">
            <p className="text-4xl">⏱</p>
            <div className="text-center">
              <p className="text-xl font-black text-gray-900">Temps écoulé !</p>
              <p className="text-sm text-gray-500 mt-1.5">La session de 15 minutes est terminée.</p>
            </div>
            <div className="flex gap-3">
              {completedQuestInfo && (
                <button
                  onClick={() => handleEndSession(completedQuestInfo, sessionPracticedVocab, sessionErrors, sessionSuggestionsUsed)}
                  className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-500 transition-colors"
                >
                  Voir le résumé
                </button>
              )}
              <button
                onClick={handleBack}
                className="rounded-full bg-gray-100 border border-gray-200 px-6 py-3 text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Quitter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quest complete reward toast */}
      {questReward && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1.5 rounded-2xl bg-white border border-gray-200 px-6 py-4 shadow-xl"
          style={{ minWidth: 260 }}>
          <p className="text-base font-black text-gray-900">
            {questReward.isReplay ? "🔄 Quête refaite !" : "🎉 Quête terminée !"}
          </p>
          {!questReward.isReplay && questReward.xpGained > 0 && (
            <div className="flex items-center gap-3 mt-0.5">
              <span className="rounded-full bg-indigo-500/25 border border-indigo-500/50 px-3 py-0.5 text-xs font-bold text-indigo-700">
                +{questReward.xpGained} XP
              </span>
            </div>
          )}
          {questReward.leveledUp && (
            <p className="text-xs font-bold text-indigo-600 mt-0.5">✨ Niveau {questReward.newLevel} atteint !</p>
          )}
          {questReward.isReplay && (
            <p className="text-[11px] text-gray-400 mt-0.5">Aucune récompense pour la reprise</p>
          )}
        </div>
      )}

      {/* Dialogue panel */}
      {!hideDialogue && (
      <div className="absolute bottom-[72px] left-1/2 -translate-x-1/2 z-20 flex flex-col gap-2.5" style={{ width: "54%" }}>

        <div className="flex items-center gap-2">
          <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0 bg-indigo-100">
            <img
              src={character.image || "/character_placeholder.png"}
              alt={character.name}
              className="h-full w-full object-cover object-top"
              onError={e => { (e.currentTarget as HTMLImageElement).src = "/character_placeholder.png"; }}
            />
          </div>
          <span className="text-sm font-bold text-white drop-shadow-sm">{character.name}</span>
          <span className="text-[11px] text-white/70 font-medium drop-shadow-sm">{character.nameJp}</span>

          {displayedUserMsg && (
            <span className="ml-auto text-[11px] text-white/80 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1 italic max-w-[45%] text-right leading-snug drop-shadow-sm truncate">
              {displayedUserMsg}
            </span>
          )}
        </div>

        <div className="relative rounded-2xl bg-white/95 p-5 backdrop-blur-md border border-gray-200 shadow-lg">
          <div className="absolute top-3 right-3 flex items-center gap-2">
            {/* Bouton masquer dialogue */}
            <button
              onClick={() => setHideDialogue(true)}
              title="Mode immersion"
              className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 border border-gray-200 hover:border-gray-400 active:scale-95 transition-all"
            >
              <EyeOff className="h-3.5 w-3.5 text-gray-500" />
            </button>
            {/* Bouton cycle mode d'affichage */}
            {displayedReply && (displayedReply.words?.length ?? 0) > 0 && (
              <button
                onClick={() => {
                  const idx = DISPLAY_MODES.indexOf(displayMode);
                  setDisplayMode(DISPLAY_MODES[(idx + 1) % DISPLAY_MODES.length]);
                }}
                title={MODE_CONFIG[displayMode].label}
                className="flex flex-col items-center justify-center gap-[3px] h-8 w-8 rounded-full bg-gray-100 border border-gray-200 hover:border-gray-400 active:scale-95 transition-all"
              >
                <span className="text-[11px] font-bold text-gray-700 leading-none">
                  {MODE_CONFIG[displayMode].char}
                </span>
                <span className={`h-[2px] w-3.5 rounded-full ${MODE_CONFIG[displayMode].color}`} />
              </button>
            )}
            {/* Replay */}
            {hasAudio && !isBusy && (
              <div className="flex items-center rounded-full bg-gray-100 border border-gray-200 overflow-hidden">
                <button
                  onClick={() => replay(replaySpeed)}
                  className="flex items-center justify-center px-3 py-1.5 hover:bg-gray-200 transition-colors"
                  title="Rejouer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-600">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                </button>
                <div className="w-px h-4 bg-gray-200" />
                <button
                  onClick={() => setReplaySpeed(s => s === 1 ? 0.7 : 1)}
                  className="px-2.5 py-1.5 text-[11px] font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-colors tabular-nums"
                >
                  {replaySpeed === 1 ? "x1" : ".7x"}
                </button>
              </div>
            )}
          </div>
          {isBusy ? (
            <div className="flex items-center gap-3 text-gray-400 pb-2">
              <div className="flex gap-1.5">
                {[0,1,2].map(i => (
                  <div key={i} className="h-1.5 w-1.5 rounded-full bg-gray-300"
                       style={{ animation: `dot-pulse 1.3s ${i * 0.18}s ease-in-out infinite` }} />
                ))}
              </div>
              <span className="text-sm">{isTranscribing ? "Transcription…" : "Réflexion…"}</span>
            </div>
          ) : displayedReply ? (
            <div className={`flex flex-col gap-4 pr-36 transition-opacity duration-200 ${isViewingHistory ? "opacity-60" : ""}`}>
              {(displayedReply.words?.length ?? 0) > 0 ? (
                <>
                  <WordRow words={displayedReply.words} mode={displayMode} />
                  {displayedReply.translation && displayMode !== "romaji" && (
                    <p className="text-xs text-gray-400 border-t border-gray-200 pt-3 mt-1 italic">
                      {displayedReply.translation}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xl font-bold text-gray-900 leading-relaxed">{displayedReply.reply}</p>
                  {displayedReply.translation && (
                    <p className="text-xs text-gray-400 border-t border-gray-200 pt-3 italic">{displayedReply.translation}</p>
                  )}
                </>
              )}

              {/* Navigation historique */}
              {replyHistoryRef.current.length > 1 && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setHistoryIndex(i => Math.max(0, i - 1))}
                    disabled={!canGoBack}
                    className={`flex items-center gap-1 text-[10px] font-semibold rounded-full px-2.5 py-1 transition-all ${
                      canGoBack ? "text-gray-500 hover:bg-gray-100 cursor-pointer" : "text-gray-200 cursor-default"
                    }`}
                  >
                    <ChevronLeft className="h-3 w-3" /> Précédent
                  </button>
                  <span className="text-[10px] text-gray-300 tabular-nums">
                    {historyIndex + 1} / {replyHistoryRef.current.length}
                  </span>
                  <button
                    onClick={() => setHistoryIndex(i => Math.min(replyHistoryRef.current.length - 1, i + 1))}
                    disabled={!canGoForward}
                    className={`flex items-center gap-1 text-[10px] font-semibold rounded-full px-2.5 py-1 transition-all ${
                      canGoForward ? "text-gray-500 hover:bg-gray-100 cursor-pointer" : "text-gray-200 cursor-default"
                    }`}
                  >
                    Suivant <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          ) : null}

        </div>

        {micError && <p className="text-[10px] text-red-500 pl-1">{micError}</p>}
      </div>
      )}

      {/* Bottom: suggestions button + mic wave pill */}
      <div className="absolute bottom-5 left-0 right-0 z-30 flex justify-center items-center gap-2 px-4">
        {activeQuest && (activeQuest.tasks[activeQuest.currentTaskIndex]?.suggestions?.length ?? 0) > 0 && (
          <button
            onClick={() => { setShowSuggestions(true); setSessionSuggestionsUsed(p => p + 1); }}
            className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/95 px-4 py-2.5 text-xs font-bold text-gray-600 shadow-sm backdrop-blur-md transition-all hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700"
          >
            💬 Suggestions
          </button>
        )}

        {/* Mic wave pill — always visible, clic pour mute/unmute */}
        <button
          onClick={() => setMicMuted(m => !m)}
          className={`flex items-center gap-2 rounded-full border px-4 py-2.5 shadow-sm backdrop-blur-md transition-colors ${
            micMuted
              ? "border-red-200 bg-red-50 hover:bg-red-100"
              : "border-gray-200 bg-white/95 hover:bg-gray-50"
          }`}
          title={micMuted ? "Réactiver le micro" : "Couper le micro"}
        >
          {micMuted
            ? <MicOff className="h-3.5 w-3.5 shrink-0 text-red-400" />
            : <Mic    className={`h-3.5 w-3.5 shrink-0 transition-colors duration-300 ${isSpeaking ? "text-indigo-500" : "text-gray-400"}`} />
          }
          <AudioWave analyserRef={analyserRef} isRecording={isRecording && !micMuted} isSpeaking={isSpeaking} isBusy={isBusy} />
        </button>

        {hideDialogue && (
          <button
            onClick={() => setHideDialogue(false)}
            className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/95 px-4 py-2.5 text-xs font-bold text-gray-500 shadow-sm backdrop-blur-md hover:text-gray-800 transition-all"
          >
            <Eye className="h-3.5 w-3.5" /> Afficher le texte
          </button>
        )}
      </div>

      {/* Suggestions modal */}
      {showSuggestions && activeQuest && (() => {
        const task = activeQuest.tasks[activeQuest.currentTaskIndex];
        const suggestions = task?.suggestions ?? [];
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={() => setShowSuggestions(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">
                    💬 Phrases utiles — Tâche {activeQuest.currentTaskIndex + 1}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{task?.instruction}</p>
                </div>
                <button
                  onClick={() => setShowSuggestions(false)}
                  className="ml-3 shrink-0 rounded-full p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Phrase list */}
              <div className="flex flex-col divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
                {suggestions.map((s, i) => (
                  <div key={i} className="px-5 py-4 flex flex-col gap-1">
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{s.fr}</p>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-2xl font-bold text-gray-900 leading-snug">{s.jp}</p>
                      <SuggestionPlayButton text={s.jp} />
                    </div>
                    <p className="text-xs text-indigo-600 italic">{s.romaji}</p>
                  </div>
                ))}
              </div>

              {/* Footer hint */}
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
                <p className="text-[10px] text-gray-400 text-center">
                  Mémorise les phrases, puis dis-les à voix haute 🎤
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Quest complete modal ── */}
      {showQuestComplete && completedQuestInfo && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md">
          <div className="flex min-h-full items-center justify-center px-4 py-8">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex flex-col items-center gap-3 px-8 pt-8 pb-6 border-b border-gray-100">
              <p className="text-4xl">{completedQuestInfo.isReplay ? "🔄" : "🎉"}</p>
              <div className="text-center">
                <p className="text-xl font-black text-gray-900">
                  {completedQuestInfo.isReplay ? "Quête refaite !" : "Quête terminée !"}
                </p>
                {!completedQuestInfo.isReplay && completedQuestInfo.xpGained > 0 && (
                  <div className="flex items-center justify-center gap-3 mt-3">
                    <span className="rounded-full bg-indigo-500/25 border border-indigo-500/50 px-3 py-1 text-sm font-bold text-indigo-700">
                      +{completedQuestInfo.xpGained} XP
                    </span>
                  </div>
                )}
                {completedQuestInfo.isReplay && (
                  <p className="text-xs text-gray-400 mt-2">Aucune récompense pour la reprise</p>
                )}
              </div>
            </div>

            {/* Vocab preview */}
            {completedQuestInfo.vocab.length > 0 && (
              <div className="px-6 py-5 border-b border-gray-100">
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                  Vocabulaire de cette quête
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {completedQuestInfo.vocab.slice(0, 6).map(v => (
                    <span key={v.jp}
                      className="rounded-full px-2.5 py-1 text-xs font-bold border bg-white"
                      style={{ borderColor: JLPT_COLORS[v.jlpt] + "40", color: JLPT_COLORS[v.jlpt] }}
                    >
                      {v.jp}
                    </span>
                  ))}
                  {completedQuestInfo.vocab.length > 6 && (
                    <span className="rounded-full px-2.5 py-1 text-xs text-gray-400 border border-gray-200">
                      +{completedQuestInfo.vocab.length - 6}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2.5 px-6 py-5">
              <button
                onClick={() => handleEndSession(completedQuestInfo, sessionPracticedVocab, sessionErrors, sessionSuggestionsUsed)}
                className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-500 transition-colors"
              >
                Terminer la session →
              </button>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* ── Session summary modal ── */}
      {showSessionSummary && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/75 backdrop-blur-sm"
             style={{ animation: "screen-fadein 0.3s ease-out" }}>
          <div className="flex min-h-full items-center justify-center px-4 py-8">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-300">Session terminée</p>
                  <h2 className="text-lg font-black text-gray-900 mt-0.5">Résumé de session</h2>
                </div>
                <button
                  onClick={handleBack}
                  className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-gray-700 transition-colors"
                >
                  Terminer
                </button>
              </div>

              <div className="px-6 py-5 flex flex-col gap-5">

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { label: "Erreurs",        value: sessionErrors,              icon: "❌", color: sessionErrors === 0 ? "text-emerald-600" : sessionErrors < 3 ? "text-orange-500" : "text-red-500" },
                    { label: "Aides",          value: sessionSuggestionsUsed,     icon: "💬", color: "text-indigo-600" },
                    { label: "Mots pratiqués", value: sessionAllDetectedVocab.size, icon: "🗣️", color: "text-blue-600" },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl bg-gray-50 border border-gray-100 p-3.5 flex flex-col items-center gap-1">
                      <p className="text-lg">{s.icon}</p>
                      <p className={`text-xl font-black tabular-nums ${s.color}`}>{s.value}</p>
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400 text-center leading-tight">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Vocab by JLPT level — only practiced words */}
                {([5, 4, 3, 2, 1] as const).map(jlpt => {
                  const words = summaryVocabProgress.filter(v => v.jlpt === jlpt && v.practiced);
                  if (!words.length) return null;
                  const jlptLabel = ({ 5: "N5", 4: "N4", 3: "N3", 2: "N2", 1: "N1" } as Record<number, string>)[jlpt];
                  return (
                    <div key={jlpt}>
                      <div className="flex items-center gap-2 mb-2.5">
                        <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black text-white" style={{ background: JLPT_COLORS[jlpt] }}>
                          {jlptLabel}
                        </span>
                        <p className="text-xs font-semibold text-gray-400">{words.length} mot{words.length > 1 ? "s" : ""}</p>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {words.map(v => {
                          const cfg = MASTERY_CONFIG[v.mastery];
                          return (
                            <div key={v.jp} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 flex items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 flex-wrap">
                                  <span className="text-lg font-bold text-gray-900 leading-none">{v.jp}</span>
                                  {v.kana !== v.jp && <span className="text-xs text-gray-400">{v.kana}</span>}
                                  <span className="text-xs text-gray-300 italic">{v.romaji}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">{v.fr}</p>
                              </div>
                              <div className="flex flex-col items-end gap-0.5 shrink-0">
                                <span className="text-sm leading-none">{cfg.icon}</span>
                                <span className="text-[9px] font-bold whitespace-nowrap" style={{ color: cfg.color }}>{cfg.label}</span>
                                {v.encounters > 0 && (
                                  <span className="text-[9px] text-gray-300">{v.encounters}×</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {summaryVocabProgress.length === 0 && (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <p className="text-3xl">📖</p>
                    <p className="text-sm text-gray-400">Aucun vocabulaire détecté pendant la session.</p>
                  </div>
                )}

                {/* Encouragement */}
                <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-5 py-4 text-center">
                  <p className="text-sm font-semibold text-indigo-700">
                    {sessionErrors === 0
                      ? "Excellent ! Aucune erreur cette session 🌟"
                      : sessionErrors < 3
                      ? "Beau travail ! Continue à pratiquer 💪"
                      : "Ne te décourage pas, chaque erreur est un progrès 🌱"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Quiz modal ── */}
      {showQuiz && activeQuest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={e => { if (e.target === e.currentTarget) { setShowQuiz(false); setChoiceResult(null); } }}
        >
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-600 mb-1">
              🎯 Tâche {activeQuest.currentTaskIndex + 1}/{activeQuest.tasks.length}
            </p>
            <h3 className="text-base font-bold text-gray-900 mb-1">
              {activeQuest.tasks[activeQuest.currentTaskIndex]?.instruction}
            </h3>
            <p className="text-xs text-gray-400 mb-5">Que t&apos;a dit {character.name} ?</p>

            <div className="flex flex-col gap-2.5">
              {activeQuest.tasks[activeQuest.currentTaskIndex]?.choices.map(choice => {
                const isSelected  = choiceResult?.id === choice.id;
                const showCorrect = !!choiceResult && choiceResult.correct && choice.isCorrect;

                const style = !choiceResult
                  ? "border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 cursor-pointer"
                  : isSelected && choiceResult.correct
                  ? "border-emerald-500 bg-emerald-50"
                  : isSelected && !choiceResult.correct
                  ? "border-red-500 bg-red-50"
                  : showCorrect
                  ? "border-emerald-500/50 bg-emerald-50"
                  : "border-gray-100 bg-gray-50/50 opacity-40";

                return (
                  <button key={choice.id} disabled={!!choiceResult}
                    onClick={() => {
                      if (choiceResult) return;
                      const correct = choice.isCorrect;
                      setChoiceResult({ id: choice.id, correct });
                      if (correct) {
                        setTimeout(() => { setShowQuiz(false); setChoiceResult(null); handleCompleteTask(); }, 1400);
                      } else {
                        setSessionErrors(p => p + 1);
                        setTimeout(() => setChoiceResult(null), 1200);
                      }
                    }}
                    className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium text-gray-900 transition-all ${style}`}
                  >
                    <span className="flex items-center gap-2">
                      {isSelected && choiceResult?.correct  && <span>✅</span>}
                      {isSelected && !choiceResult?.correct && <span>❌</span>}
                      {showCorrect && !isSelected           && <span>✅</span>}
                      {choice.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Task banner ── */}
      {taskBanner && (
        <div
          key={`${taskBanner.index}-${taskBanner.instruction}`}
          className="pointer-events-none fixed inset-x-0 top-1/3 z-[60]"
          style={{ animation: "taskBannerIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both, taskBannerOut 0.5s ease 3s both" }}
        >
          <div className="flex flex-col items-center justify-center bg-white px-16 py-10 text-center shadow-lg"
            style={{ borderTop: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }}>
            <p className="mb-2 text-2xl font-black text-gray-900">Objectif {taskBanner.index}</p>
            <p className="text-base text-gray-500">{taskBanner.instruction}</p>
          </div>
        </div>
      )}

      {/* ── Menu modal ── */}
      {showMenu && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={() => setShowMenu(false)}
        >
          <div
            className="w-full max-w-xs rounded-2xl bg-white shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Menu</h3>
              <button
                onClick={() => setShowMenu(false)}
                className="rounded-full p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col p-3 gap-1.5">

              {/* Volume voix */}
              <div className="flex items-center gap-3 rounded-xl px-4 py-3 bg-gray-50 border border-gray-100">
                <span className="text-lg">🔊</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Volume voix</p>
                    <span className="text-[11px] font-semibold text-indigo-500">{voiceVolume}%</span>
                  </div>
                  <input
                    type="range" min={0} max={100} value={voiceVolume}
                    className="w-full accent-indigo-500"
                    onChange={e => {
                      const v = Number(e.target.value);
                      setVoiceVolume(v);
                      voiceVolumeRef.current = v;
                      if (audioRef.current) audioRef.current.volume = v / 100;
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl px-4 py-3 bg-gray-50 border border-gray-100">
                <span className="text-lg">🎵</span>
                <div className="flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Volume ambiance</p>
                  <input
                    type="range" min={0} max={100} defaultValue={30} disabled
                    className="w-full mt-1 accent-indigo-500 opacity-40 cursor-not-allowed"
                  />
                </div>
                <span className="text-[10px] text-gray-300 font-medium">Bientôt</span>
              </div>

              <div className="h-px bg-gray-100 my-1" />

              {/* Retour à la carte */}
              <button
                onClick={() => { setShowMenu(false); setShowBackConfirm(true); }}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-left hover:bg-red-50 hover:border-red-200 border border-transparent transition-all group"
              >
                <ArrowLeft className="h-4 w-4 text-gray-400 group-hover:text-red-500 transition-colors" />
                <div>
                  <p className="text-sm font-semibold text-gray-700 group-hover:text-red-600 transition-colors">Retourner à la carte</p>
                  <p className="text-[10px] text-gray-400">Quitter la session en cours</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tutorial hints (douane quest only) ── */}
      {poiTutoHint > 0 && (
        <div style={{
          position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
          zIndex: 100, display: "flex", alignItems: "flex-end", gap: 14,
          width: "min(600px, 92vw)", animation: "screen-fadein 0.3s ease",
          pointerEvents: "auto",
        }}>
          <div style={{ flexShrink: 0, width: 64 }}>
            <img src="/character_placeholder.png" alt="Guide"
              style={{ width: "100%", objectFit: "contain", filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.4))" }} />
          </div>
          <div style={{
            flex: 1, background: "rgba(12,9,26,0.95)",
            border: "1.5px solid rgba(167,139,250,0.35)",
            borderRadius: "4px 18px 18px 18px",
            padding: "13px 16px 11px",
            backdropFilter: "blur(16px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
            fontFamily: "system-ui, sans-serif",
          }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 7,
              background: "rgba(99,102,241,0.25)", borderRadius: 99, padding: "2px 12px",
              border: "1px solid rgba(99,102,241,0.4)",
            }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#a78bfa", boxShadow: "0 0 6px #a78bfa" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#c4b5fd", letterSpacing: "0.06em" }}>GUIDE</span>
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#f0eeff", lineHeight: 1.6, margin: "0 0 11px", whiteSpace: "pre-line" }}>
              {poiTutoHint === 1
                ? "Tu es à la douane ! 🛂\nL'agent va te poser quelques questions. Réponds-lui en japonais — le micro se déclenche automatiquement quand tu parles."
                : "Ta mission s'affiche en haut à gauche. 📋\nUne fois que tu l'as accomplie, clique sur « ✓ J'ai compris » pour valider et passer à l'étape suivante !"}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setPoiTutoHint(prev => prev === 1 ? 2 : 0)}
                style={{
                  padding: "7px 20px", borderRadius: 99,
                  background: poiTutoHint === 2 ? "linear-gradient(135deg,#6366f1,#4f46e5)" : "rgba(99,102,241,0.35)",
                  border: "1px solid rgba(99,102,241,0.55)",
                  color: "#ddd6fe", fontSize: 13, fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: poiTutoHint === 2 ? "0 4px 16px rgba(99,102,241,0.4)" : "none",
                }}
              >
                {poiTutoHint === 2 ? "C'est parti ! 🎌" : "Suivant →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation retour carte ── */}
      {showBackConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={() => setShowBackConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 pt-7 pb-5 flex flex-col items-center gap-3 text-center">
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-2xl">⚠️</div>
              <div>
                <p className="text-base font-black text-gray-900">Êtes-vous sûr ?</p>
                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                  Votre ticket sera quand même consommé et la progression de la quête ne sera pas sauvegardée.
                </p>
              </div>
            </div>
            <div className="flex gap-2.5 px-6 pb-6">
              <button
                onClick={() => setShowBackConfirm(false)}
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleBack}
                className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-bold text-white hover:bg-red-400 transition-colors"
              >
                Quitter quand même
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
