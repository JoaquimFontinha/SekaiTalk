"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Pause, Play } from "lucide-react";

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
  tasks: QuestTask[];
  userProgress: { id: string; status: string; taskProgress: { taskId: string; status: string }[] }[];
};

type ActiveQuest = {
  questId: string;
  questProgressId: string | null;
  questTitle: string;
  tasks: QuestTask[];
  currentTaskIndex: number;
};

// ── Types affichage ───────────────────────────────────────────────────────────

type DisplayMode = "full" | "kanji" | "romaji";

const DISPLAY_MODES: DisplayMode[] = ["full", "kanji", "romaji"];
const MODE_CONFIG: Record<DisplayMode, { char: string; color: string; label: string }> = {
  full:   { char: "全",   color: "bg-white/60",   label: "Complet" },
  kanji:  { char: "漢",   color: "bg-yellow-400", label: "Kanji"   },
  romaji: { char: "abc",  color: "bg-violet-400", label: "Romaji"  },
};

// ── Constants ─────────────────────────────────────────────────────────────────

const WORD_COLORS = [
  "text-pink-400", "text-cyan-400", "text-violet-400", "text-yellow-400",
  "text-emerald-400", "text-orange-400", "text-blue-400", "text-rose-400",
];

const VAD_THRESHOLD  = 0.025; // RMS volume to start recording
const SILENCE_DELAY  = 1200;  // ms of silence before sending
const MIN_RECORD_MS  = 400;   // discard recordings shorter than this (background noise)

// ── WordRow ───────────────────────────────────────────────────────────────────

function WordRow({ words, mode }: { words: Word[]; mode: DisplayMode }) {
  if (mode === "kanji") {
    return (
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
        {words.map((w, i) => (
          <div key={i} className="flex flex-col items-center gap-[2px]">
            <span className="text-[11px] font-medium text-white/60 min-h-[14px]">{w.furigana}</span>
            <span className="text-[26px] font-bold text-white leading-none tracking-wide">{w.jp}</span>
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
              <span className="text-[24px] font-bold leading-none text-white tracking-wide">{w.jp}</span>
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
            <span className="text-[24px] font-bold leading-none text-white tracking-wide">{w.jp}</span>
            <span className={`text-[11px] font-semibold underline underline-offset-2 decoration-dotted ${color}`}>{w.romaji}</span>
            <span className="text-[10px] text-white/45 mt-0.5">{w.fr}</span>
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

  // ── State ──
  const [character, setCharacter]       = useState<Character | null>(null);
  const [notFound, setNotFound]         = useState(false);
  const [activeQuest, setActiveQuest]   = useState<ActiveQuest | null>(null);
  const [showQuiz, setShowQuiz]         = useState(false);
  const [choiceResult, setChoiceResult] = useState<{ id: string; correct: boolean } | null>(null);
  const [questReward, setQuestReward]   = useState<{ xpGained: number; yensGained: number; leveledUp: boolean; newLevel: number; isReplay: boolean } | null>(null);

  const [messages, setMessages]           = useState<Message[]>([]);
  const [currentReply, setCurrentReply]   = useState<AIReply | null>(null);
  const [lastUserMsg, setLastUserMsg]     = useState("");
  const [isLoading, setIsLoading]         = useState(false);
  const [isSpeaking, setIsSpeaking]       = useState(false);
  const [showTip, setShowTip]             = useState(true);
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

  // ── Refs ──
  const messagesRef     = useRef<Message[]>([]);
  const systemRef       = useRef("");
  const characterIdRef  = useRef<string | null>(null);
  const activeQuestRef  = useRef<ActiveQuest | null>(null);
  const recorderRef     = useRef<MediaRecorder | null>(null);
  const chunksRef       = useRef<Blob[]>([]);
  const streamRef       = useRef<MediaStream | null>(null);
  const audioRef        = useRef<HTMLAudioElement | null>(null);
  const ambientRef      = useRef<HTMLAudioElement | null>(null);
  const voiceIdRef      = useRef<string | null>(null);
  const audioCtxRef     = useRef<AudioContext | null>(null);
  const silenceTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingStartRef  = useRef<number>(0);
  const speakAbortRef      = useRef<AbortController | null>(null);
  const chatAbortRef       = useRef<AbortController | null>(null);
  const isRecordingRef     = useRef(false);
  const mountedRef         = useRef(true);
  const shouldListenRef    = useRef(false);
  const lastAudioBlobRef   = useRef<Blob | null>(null);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { activeQuestRef.current = activeQuest; }, [activeQuest]);

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
    const canListen = !isPaused && !isSpeaking && !isLoading && !isTranscribing && !showSuggestions && !sessionExpired;
    shouldListenRef.current = canListen;
    // If we can no longer listen, abort any in-flight recording
    if (!canListen && isRecordingRef.current) {
      if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      isRecordingRef.current = false;
      setIsRecording(false);
    }
  }, [isPaused, isSpeaking, isLoading, isTranscribing, showSuggestions, sessionExpired]);

  // ── TTS ──
  const speak = useCallback(async (text: string) => {
    // Annule tout speak précédent (fixes double-speak en StrictMode)
    speakAbortRef.current?.abort();
    const controller = new AbortController();
    speakAbortRef.current = controller;

    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    window.speechSynthesis.cancel();

    const vId = voiceIdRef.current;

    if (!vId) {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "ja-JP"; utter.rate = 0.85;
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
    setCurrentReply(null);

    const aq = activeQuestRef.current;
    let sysPrompt = systemRef.current;
    if (aq) {
      const task = aq.tasks[aq.currentTaskIndex];
      if (task?.aiContext) {
        sysPrompt += `\n\n[TÂCHE EN COURS ${aq.currentTaskIndex + 1}/${aq.tasks.length}]\n${task.aiContext}`;
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
      const d: AIReply = await r.json();
      if (!mountedRef.current) return;
      setMessages(p => [...p, { role: "assistant", content: d.reply }]);
      setCurrentReply(d);
      speak(d.reply);
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      if (mountedRef.current) setCurrentReply({ reply: "Erreur…", translation: "", words: [], suggestions: [] });
    } finally { if (mountedRef.current) setIsLoading(false); }
  }, [speak]);

  // ── Transcription ──
  const transcribe = useCallback(async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const f = new FormData(); f.append("audio", blob, "audio.webm");
      const r = await fetch("/api/transcribe", { method: "POST", body: f });
      const d = await r.json();
      if (d.text?.trim()) await sendMessage(d.text);
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

      const data = new Float32Array(analyser.fftSize);
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus" : "audio/webm";

      const tick = () => {
        if (!audioCtxRef.current) return; // component unmounted
        analyser.getFloatTimeDomainData(data);
        const rms = Math.sqrt(data.reduce((s, v) => s + v * v, 0) / data.length);

        if (shouldListenRef.current && rms > VAD_THRESHOLD) {
          if (!isRecordingRef.current) {
            // Start a fresh recording for this utterance
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
          // Reset silence countdown
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (isRecordingRef.current && recorderRef.current?.state === "recording") {
              recorderRef.current.stop();
              isRecordingRef.current = false;
              setIsRecording(false);
            }
          }, SILENCE_DELAY);
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
            setActiveQuest(null);
            activeQuestRef.current = null;
            setQuestReward({ xpGained: data.xpGained, yensGained: data.yensGained, leveledUp: data.leveledUp, newLevel: data.newLevel, isReplay: data.isReplay });
            setTimeout(() => setQuestReward(null), 5000);
            return;
          }
        }
      } catch { /* silent */ }
    }

    if (isLast) {
      setActiveQuest(null);
      activeQuestRef.current = null;
      setQuestReward({ xpGained: 0, yensGained: 0, leveledUp: false, newLevel: 1, isReplay: false });
      setTimeout(() => setQuestReward(null), 5000);
    } else {
      const updated: ActiveQuest = { ...aq, currentTaskIndex: aq.currentTaskIndex + 1 };
      setActiveQuest(updated);
      activeQuestRef.current = updated;
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
      // Re-activate AudioContext if the browser suspended it
      audioCtxRef.current?.resume().catch(() => {});
    }
  }, [isPaused]);

  const togglePause = useCallback(() => setIsPaused(prev => !prev), []);

  // ── Load character + quests ──
  useEffect(() => {
    let cancelled = false;

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

        // ── Sounds ──
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

        // ── Start VAD ──
        startVAD();

        // ── Init quest ──
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

            initQuest = {
              questId: quest.id,
              questProgressId: existing?.id ?? null,
              questTitle: quest.title,
              tasks: quest.tasks,
              currentTaskIndex,
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

        const suggestions = initQuest
          ? ["Bonjour !", "Excusez-moi…", "Pouvez-vous m'aider ?"]
          : ["Bonjour !", "Comment ça va ?", "Qu'est-ce que vous recommandes ?"];

        // Affichage immédiat avec breakdown stocké en DB (aucun appel API)
        setCurrentReply({
          reply: c.greetingMessage,
          translation: c.greetingTranslation ?? "",
          words: c.greetingWords ?? [],
          suggestions,
        });
        speak(c.greetingMessage);
      })
      .catch(() => setNotFound(true));

    return () => {
      cancelled = true;
      mountedRef.current = false;
      shouldListenRef.current = false;
      isRecordingRef.current = false;
      // Abort in-flight API calls
      speakAbortRef.current?.abort();
      chatAbortRef.current?.abort();
      // Stop audio
      audioRef.current?.pause();
      ambientRef.current?.pause();
      window.speechSynthesis.cancel();
      // Stop recorder without triggering transcription
      if (recorderRef.current) {
        recorderRef.current.onstop = null;
        if (recorderRef.current.state === "recording") recorderRef.current.stop();
        recorderRef.current = null;
      }
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      // Close AudioContext — stops the VAD RAF loop
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poiId, questId]);

  const isBusy = isLoading || isTranscribing;

  // ── Guards ──
  if (notFound) return <div className="flex h-screen items-center justify-center text-gray-400">Personnage introuvable.</div>;
  if (!character) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-violet-400" /></div>;

  const bgSrc = character.scene?.backgroundImage || "/background_placeholder.png";

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="relative h-screen w-screen overflow-hidden select-none">

      {/* Background */}
      <div className="absolute inset-0 bg-black">
        <img
          src={bgSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={e => { (e.currentTarget as HTMLImageElement).src = "/background_placeholder.png"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
      </div>

      {/* Character sprite */}
      <div className="absolute bottom-0 right-0 z-10 h-full flex items-end pointer-events-none" style={{ width: "52%" }}>
        <img src={character.image || "/character_placeholder.png"} alt={character.name}
          onError={e => { (e.currentTarget as HTMLImageElement).src = "/character_placeholder.png"; }}
          className="h-[92%] w-auto object-contain object-bottom"
          style={{ filter: isSpeaking ? "drop-shadow(0 0 32px rgba(124,58,237,1))" : "drop-shadow(0 0 0px transparent)", transition: "filter .3s" }}
          draggable={false} />
      </div>

      {/* Top bar — left | center pause | right */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-start justify-between px-5 pt-4">

        {/* Left: quest info or free conversation */}
        {activeQuest ? (
          <div className="flex items-start gap-2 rounded-xl bg-black/65 px-3 py-2.5 backdrop-blur-sm border border-yellow-400/20" style={{ maxWidth: 260 }}>
            <span className="mt-0.5 shrink-0">🎯</span>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-yellow-400/60">
                {activeQuest.questTitle} — {activeQuest.currentTaskIndex + 1}/{activeQuest.tasks.length}
              </p>
              <p className="text-[12px] font-semibold text-white/85 leading-snug mt-0.5">
                {activeQuest.tasks[activeQuest.currentTaskIndex]?.instruction}
              </p>
              <div className="mt-1.5 flex gap-1">
                {activeQuest.tasks.map((_, i) => (
                  <div key={i} className={`h-1 rounded-full transition-all duration-500 ${
                    i < activeQuest.currentTaskIndex ? "w-5 bg-emerald-400"
                    : i === activeQuest.currentTaskIndex ? "w-5 bg-yellow-400"
                    : "w-3 bg-white/20"
                  }`} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-black/60 px-3 py-2.5 backdrop-blur-sm">
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">Conversation libre</p>
            <p className="text-[11px] text-white/50 mt-0.5">{character.name}</p>
          </div>
        )}

        {/* Center: pause button + timer */}
        <div className="flex items-center gap-2">
          <button
            onClick={togglePause}
            className="flex flex-col items-center gap-0.5 rounded-xl bg-black/60 px-5 py-2.5 backdrop-blur-sm hover:bg-black/80 transition-colors"
          >
            {isPaused
              ? <Play  className="h-5 w-5 text-white/80" />
              : <Pause className="h-5 w-5 text-white/80" />
            }
            <span className="text-[9px] font-bold uppercase tracking-wider text-white/35">
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
              <div className={`rounded-xl bg-black/60 px-3 py-2.5 backdrop-blur-sm text-center min-w-[56px] ${isCrit ? "animate-pulse" : ""}`}>
                <p className={`text-base font-black tabular-nums leading-none ${
                  isCrit ? "text-red-400" : isWarn ? "text-orange-400" : "text-white/70"
                }`}>{display}</p>
                <p className="text-[8px] font-bold uppercase tracking-widest text-white/25 mt-0.5">Session</p>
              </div>
            );
          })()}
        </div>

        {/* Right: back to map */}
        <button
          onClick={() => { window.speechSynthesis.cancel(); router.push(`/home/${citySlug}`); }}
          className="flex items-center gap-2 rounded-xl bg-black/60 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white/70 backdrop-blur-sm hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Carte
        </button>
      </div>

      {/* Pause overlay — cliquable pour reprendre */}
      {isPaused && (
        <div
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/55 backdrop-blur-sm cursor-pointer"
          onClick={togglePause}
        >
          <div className="flex flex-col items-center gap-3 text-white/60">
            <Play className="h-10 w-10" />
            <p className="text-sm font-bold uppercase tracking-widest">Appuyer pour reprendre</p>
          </div>
        </div>
      )}

      {/* Session expired overlay */}
      {sessionExpired && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md">
          <div className="flex flex-col items-center gap-5 rounded-2xl border border-white/10 bg-gray-950/95 px-10 py-8 shadow-2xl">
            <p className="text-4xl">⏱</p>
            <div className="text-center">
              <p className="text-xl font-black text-white">Fin de session</p>
              <p className="text-sm text-white/40 mt-1.5">Ton temps de quête est écoulé.</p>
            </div>
            <button
              onClick={() => { window.speechSynthesis.cancel(); router.push(`/home/${citySlug}`); }}
              className="rounded-full bg-white/10 border border-white/20 px-8 py-3 text-sm font-bold text-white hover:bg-white/20 transition-colors"
            >
              Terminé
            </button>
          </div>
        </div>
      )}

      {/* Quest complete reward toast */}
      {questReward && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1.5 rounded-2xl bg-gray-950/95 border border-white/10 px-6 py-4 shadow-2xl backdrop-blur-md"
          style={{ minWidth: 260 }}>
          <p className="text-base font-black text-white">
            {questReward.isReplay ? "🔄 Quête refaite !" : "🎉 Quête terminée !"}
          </p>
          {!questReward.isReplay && (questReward.xpGained > 0 || questReward.yensGained > 0) && (
            <div className="flex items-center gap-3 mt-0.5">
              {questReward.xpGained > 0 && (
                <span className="rounded-full bg-violet-500/25 border border-violet-500/50 px-3 py-0.5 text-xs font-bold text-violet-300">
                  +{questReward.xpGained} XP
                </span>
              )}
              {questReward.yensGained > 0 && (
                <span className="rounded-full bg-yellow-500/20 border border-yellow-500/40 px-3 py-0.5 text-xs font-bold text-yellow-300">
                  +¥{questReward.yensGained}
                </span>
              )}
            </div>
          )}
          {questReward.leveledUp && (
            <p className="text-xs font-bold text-violet-400 mt-0.5">✨ Niveau {questReward.newLevel} atteint !</p>
          )}
          {questReward.isReplay && (
            <p className="text-[11px] text-white/40 mt-0.5">Aucune récompense pour la reprise</p>
          )}
        </div>
      )}

      {/* Dialogue panel */}
      <div className="absolute bottom-[72px] left-1/2 -translate-x-1/2 z-20 flex flex-col gap-2.5" style={{ width: "54%" }}>

        {showTip && (
          <div className="flex items-center justify-between rounded-lg bg-black/50 px-3 py-2 backdrop-blur-sm border border-white/8">
            <p className="text-[10px] text-white/60">
              💡 Parle en <span className="text-blue-400 font-semibold">français</span> pour obtenir des réponses en <span className="text-yellow-400 font-semibold">japonais</span>
            </p>
            <button onClick={() => setShowTip(false)} className="ml-3 text-[11px] text-white/30 hover:text-white/70 shrink-0">✕</button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {character.name[0]}
          </div>
          <span className="text-sm font-bold text-white">{character.name}</span>
          <span className="text-[11px] text-white/35 font-medium">{character.nameJp}</span>

          {/* Bouton cycle mode d'affichage */}
          {currentReply && currentReply.words.length > 0 && (
            <button
              onClick={() => {
                const idx = DISPLAY_MODES.indexOf(displayMode);
                setDisplayMode(DISPLAY_MODES[(idx + 1) % DISPLAY_MODES.length]);
              }}
              title={MODE_CONFIG[displayMode].label}
              className="flex flex-col items-center justify-center gap-[3px] h-8 w-8 rounded-full bg-black/75 border border-white/15 backdrop-blur-sm hover:border-white/35 active:scale-95 transition-all"
            >
              <span className="text-[11px] font-bold text-white leading-none">
                {MODE_CONFIG[displayMode].char}
              </span>
              <span className={`h-[2px] w-3.5 rounded-full ${MODE_CONFIG[displayMode].color}`} />
            </button>
          )}

          {/* VAD status indicator */}
          {micReady && !isPaused && (
            <span className={`ml-auto flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider ${
              isRecording ? "text-red-400" : isSpeaking || isBusy ? "text-white/25" : "text-emerald-400/80"
            }`}>
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                isRecording    ? "bg-red-400 animate-pulse"
                : isBusy      ? "bg-white/20"
                : isSpeaking  ? "bg-violet-400/40"
                : "bg-emerald-400/80 animate-pulse"
              }`} />
              {isRecording ? "Écoute" : isTranscribing ? "…" : isLoading ? "…" : isSpeaking ? "Parle" : "Prêt"}
            </span>
          )}
          {!micReady && !micError && !isPaused && (
            <span className="ml-auto text-[9px] text-white/20">micro…</span>
          )}
        </div>

        {lastUserMsg && <p className="text-xs text-white/40 italic pl-1">&gt; {lastUserMsg}</p>}

        <div className="relative rounded-2xl bg-black/65 p-5 backdrop-blur-md border border-white/8 shadow-2xl">
          {hasAudio && !isBusy && (
            <div className="absolute top-3 right-3 flex items-center rounded-full bg-white/10 backdrop-blur-md border border-white/15 overflow-hidden">
              <button
                onClick={() => replay(replaySpeed)}
                className="flex items-center justify-center px-3 py-1.5 hover:bg-white/10 transition-colors"
                title="Rejouer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white/80">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              </button>
              <div className="w-px h-4 bg-white/20" />
              <button
                onClick={() => setReplaySpeed(s => s === 1 ? 0.7 : 1)}
                className="px-2.5 py-1.5 text-[11px] font-bold text-white/70 hover:text-white hover:bg-white/10 transition-colors tabular-nums"
              >
                {replaySpeed === 1 ? "x1" : ".7x"}
              </button>
            </div>
          )}
          {isBusy ? (
            <div className="flex items-center gap-3 text-white/40 py-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">{isTranscribing ? "Transcription…" : "Réflexion…"}</span>
            </div>
          ) : currentReply ? (
            <div className="flex flex-col gap-4">
              {currentReply.words.length > 0 ? (
                <>
                  <WordRow words={currentReply.words} mode={displayMode} />
                  {currentReply.translation && displayMode !== "romaji" && (
                    <p className="text-xs text-white/40 border-t border-white/10 pt-3 mt-1 italic">
                      {currentReply.translation}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xl font-bold text-white leading-relaxed">{currentReply.reply}</p>
                  {currentReply.translation && (
                    <p className="text-xs text-white/40 border-t border-white/10 pt-3 italic">{currentReply.translation}</p>
                  )}
                </>
              )}
            </div>
          ) : null}
        </div>

        {micError && <p className="text-[10px] text-red-400 pl-1">{micError}</p>}
      </div>

      {/* Bottom: suggestions button + quest verify */}
      <div className="absolute bottom-5 left-0 right-0 z-30 flex justify-center items-center gap-2 px-4">
        {activeQuest && (activeQuest.tasks[activeQuest.currentTaskIndex]?.suggestions?.length ?? 0) > 0 && (
          <button
            onClick={() => setShowSuggestions(true)}
            className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-4 py-2.5 text-xs font-bold text-white/60 backdrop-blur-md transition-all hover:border-violet-500/40 hover:bg-violet-900/30 hover:text-white"
          >
            💬 Suggestions
          </button>
        )}
        {activeQuest && currentReply && !isBusy && (
          <button
            onClick={() => setShowQuiz(true)}
            className="flex items-center gap-1.5 rounded-full border border-yellow-400/50 bg-yellow-400/10 px-4 py-2.5 text-xs font-bold text-yellow-400 backdrop-blur-md hover:bg-yellow-400/20 transition-all shrink-0"
          >
            🎯 Vérifier
          </button>
        )}
      </div>

      {/* Suggestions modal — pauses mic while open */}
      {showSuggestions && activeQuest && (() => {
        const task = activeQuest.tasks[activeQuest.currentTaskIndex];
        const suggestions = task?.suggestions ?? [];
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
            onClick={() => setShowSuggestions(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-white/10 bg-gray-950/95 shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400/70">
                    💬 Phrases utiles — Tâche {activeQuest.currentTaskIndex + 1}
                  </p>
                  <p className="text-sm font-semibold text-white mt-0.5">{task?.instruction}</p>
                </div>
                <button
                  onClick={() => setShowSuggestions(false)}
                  className="ml-3 shrink-0 rounded-full p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Phrase list */}
              <div className="flex flex-col divide-y divide-white/6 max-h-[60vh] overflow-y-auto">
                {suggestions.map((s, i) => (
                  <div key={i} className="px-5 py-4 flex flex-col gap-1">
                    <p className="text-[11px] font-medium text-white/40 uppercase tracking-wide">{s.fr}</p>
                    <p className="text-2xl font-bold text-white leading-snug">{s.jp}</p>
                    <p className="text-xs text-violet-300/70 italic">{s.romaji}</p>
                  </div>
                ))}
              </div>

              {/* Footer hint */}
              <div className="px-5 py-3 border-t border-white/8 bg-white/3">
                <p className="text-[10px] text-white/30 text-center">
                  Mémorise les phrases, puis dis-les à voix haute 🎤
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Quiz modal ── */}
      {showQuiz && activeQuest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
          onClick={e => { if (e.target === e.currentTarget) { setShowQuiz(false); setChoiceResult(null); } }}
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-950/95 p-6 shadow-2xl">
            <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-400/70 mb-1">
              🎯 Tâche {activeQuest.currentTaskIndex + 1}/{activeQuest.tasks.length}
            </p>
            <h3 className="text-base font-bold text-white mb-1">
              {activeQuest.tasks[activeQuest.currentTaskIndex]?.instruction}
            </h3>
            <p className="text-xs text-white/40 mb-5">Que t&apos;a dit {character.name} ?</p>

            <div className="flex flex-col gap-2.5">
              {activeQuest.tasks[activeQuest.currentTaskIndex]?.choices.map(choice => {
                const isSelected  = choiceResult?.id === choice.id;
                const showCorrect = !!choiceResult && choiceResult.correct && choice.isCorrect;

                const style = !choiceResult
                  ? "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/25 cursor-pointer"
                  : isSelected && choiceResult.correct
                  ? "border-emerald-500 bg-emerald-500/20"
                  : isSelected && !choiceResult.correct
                  ? "border-red-500 bg-red-500/15"
                  : showCorrect
                  ? "border-emerald-500/50 bg-emerald-500/10"
                  : "border-white/5 bg-white/3 opacity-40";

                return (
                  <button key={choice.id} disabled={!!choiceResult}
                    onClick={() => {
                      if (choiceResult) return;
                      const correct = choice.isCorrect;
                      setChoiceResult({ id: choice.id, correct });
                      if (correct) {
                        setTimeout(() => { setShowQuiz(false); setChoiceResult(null); handleCompleteTask(); }, 1400);
                      } else {
                        setTimeout(() => setChoiceResult(null), 1200);
                      }
                    }}
                    className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium text-white transition-all ${style}`}
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
    </div>
  );
}
