"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, Loader2, ArrowLeft } from "lucide-react";
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
  greetingMessage: string; isFriendable: boolean; voiceId: string | null;
  locationContext: string | null;
  scene: Scene | null;
};

type TaskChoice = { id: string; text: string; isCorrect: boolean; order: number };
type QuestTask  = { id: string; order: number; instruction: string; aiContext: string | null; choices: TaskChoice[] };
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

// ── Constants ─────────────────────────────────────────────────────────────────

const WORD_COLORS = [
  "text-pink-400", "text-cyan-400", "text-violet-400", "text-yellow-400",
  "text-emerald-400", "text-orange-400", "text-blue-400", "text-rose-400",
];

// ── WordRow ───────────────────────────────────────────────────────────────────

function WordRow({ words }: { words: Word[] }) {
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
  const [character, setCharacter]     = useState<Character | null>(null);
  const [notFound, setNotFound]       = useState(false);
  const [activeQuest, setActiveQuest] = useState<ActiveQuest | null>(null);
  const [showQuiz, setShowQuiz]       = useState(false);
  const [choiceResult, setChoiceResult] = useState<{ id: string; correct: boolean } | null>(null);
  const [questReward, setQuestReward] = useState<{ xpGained: number; yensGained: number; leveledUp: boolean; newLevel: number; isReplay: boolean } | null>(null);

  const [messages, setMessages]         = useState<Message[]>([]);
  const [currentReply, setCurrentReply] = useState<AIReply | null>(null);
  const [lastUserMsg, setLastUserMsg]   = useState("");
  const [isLoading, setIsLoading]       = useState(false);
  const [isSpeaking, setIsSpeaking]     = useState(false);
  const [showTip, setShowTip]           = useState(true);

  const [isRecording, setIsRecording]       = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [micError, setMicError]             = useState<string | null>(null);
  const [devices, setDevices]               = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");

  // ── Refs ──
  const messagesRef    = useRef<Message[]>([]);
  const systemRef      = useRef("");
  const characterIdRef = useRef<string | null>(null);
  const activeQuestRef = useRef<ActiveQuest | null>(null);
  const recorderRef    = useRef<MediaRecorder | null>(null);
  const chunksRef      = useRef<Blob[]>([]);
  const streamRef      = useRef<MediaStream | null>(null);
  const audioRef       = useRef<HTMLAudioElement | null>(null);
  const ambientRef     = useRef<HTMLAudioElement | null>(null);
  const voiceIdRef     = useRef<string | null>(null);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { activeQuestRef.current = activeQuest; }, [activeQuest]);

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

        // Build system prompt — inject location context for multi-POI appearances
        let sysPrompt = c.systemPrompt;
        if (c.locationContext) {
          sysPrompt += `\n\n[CONTEXTE DU LIEU]\n${c.locationContext}`;
        }
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

        // Mic setup (navigator.mediaDevices is undefined on mobile HTTP)
        if (navigator.mediaDevices) {
          navigator.mediaDevices.getUserMedia({ audio: true })
            .then(s => { s.getTracks().forEach(t => t.stop()); return navigator.mediaDevices.enumerateDevices(); })
            .then(devs => {
              const mics = devs.filter(d => d.kind === "audioinput");
              setDevices(mics);
              if (mics.length) setSelectedDevice(mics[0].deviceId);
            }).catch(() => {});
        }

        // Init quest if questId provided
        let initQuest: ActiveQuest | null = null;
        if (questId) {
          const quest = q.find((qd: QuestData) => qd.id === questId);
          if (quest) {
            const existing = quest.userProgress?.[0];
            const isCompleted  = existing?.status === "COMPLETED";
            const isInProgress = existing?.status === "IN_PROGRESS";

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

        // Show greeting
        setCurrentReply({
          reply: c.greetingMessage,
          translation: "", words: [],
          suggestions: initQuest
            ? ["Bonjour !", "Excusez-moi…", "Pouvez-vous m'aider ?"]
            : ["Bonjour !", "Comment ça va ?", "Qu'est-ce que vous recommandez ?"],
        });
        speak(c.greetingMessage);
      })
      .catch(() => setNotFound(true));

    return () => {
      cancelled = true;
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      if (ambientRef.current) { ambientRef.current.pause(); ambientRef.current = null; }
      window.speechSynthesis.cancel();
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poiId, questId]);

  // ── TTS ──
  const speak = useCallback(async (text: string) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    window.speechSynthesis.cancel();

    const vId = voiceIdRef.current;

    if (!vId) {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "ja-JP"; utter.rate = 0.85;
      const go = () => {
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
      });
      if (!r.ok) throw new Error("TTS failed");
      const blob = await r.blob();
      const url  = URL.createObjectURL(blob);
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
      setIsSpeaking(false);
    }
  }, []);

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

    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next,
          systemPrompt: sysPrompt,
          characterId: characterIdRef.current,
        }),
      });
      const d: AIReply = await r.json();
      setMessages(p => [...p, { role: "assistant", content: d.reply }]);
      setCurrentReply(d);
      speak(d.reply);
    } catch {
      setCurrentReply({ reply: "Erreur…", translation: "", words: [], suggestions: [] });
    } finally { setIsLoading(false); }
  }, [speak]);

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

  // ── Transcription ──
  const transcribe = useCallback(async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const f = new FormData(); f.append("audio", blob, "audio.webm");
      const r = await fetch("/api/transcribe", { method: "POST", body: f });
      const d = await r.json();
      if (d.text?.trim()) await sendMessage(d.text);
      else setMicError("Rien capté — réessaie.");
    } catch { setMicError("Erreur transcription."); }
    finally { setIsTranscribing(false); }
  }, [sendMessage]);

  // ── Mic ──
  const toggleMic = useCallback(async () => {
    setMicError(null);
    if (isRecording) {
      recorderRef.current?.stop();
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedDevice ? { deviceId: { exact: selectedDevice } } : true,
      });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const rec  = new MediaRecorder(stream, { mimeType: mime });
      recorderRef.current = rec; chunksRef.current = [];
      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => { transcribe(new Blob(chunksRef.current, { type: mime })); chunksRef.current = []; };
      rec.start(100); setIsRecording(true);
    } catch (e: unknown) {
      const err = e as { name?: string };
      setMicError(err.name === "NotAllowedError" ? "Micro refusé." : "Micro inaccessible.");
    }
  }, [isRecording, selectedDevice, transcribe]);

  const isBusy = isLoading || isTranscribing;

  // ── Guards ──
  if (notFound) return <div className="flex h-screen items-center justify-center text-gray-400">Personnage introuvable.</div>;
  if (!character) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-violet-400" /></div>;

  const backgroundImage = character.scene?.backgroundImage ?? "/backgrounds/konbini.jpg";

  // ════════════════════════════════════════════════════════════════════════════
  // CONVERSATION
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="relative h-screen w-screen overflow-hidden select-none">

      {/* Background */}
      <div className="absolute inset-0 bg-black">
        <div className="absolute inset-0"
          style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
      </div>

      {/* Character sprite */}
      <div className="absolute bottom-0 right-0 z-10 h-full flex items-end pointer-events-none" style={{ width: "52%" }}>
        <img src={character.image} alt={character.name}
          className="h-[92%] w-auto object-contain object-bottom"
          style={{ filter: isSpeaking ? "drop-shadow(0 0 32px rgba(124,58,237,1))" : "drop-shadow(0 0 0px transparent)", transition: "filter .3s" }}
          draggable={false} />
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-start justify-between px-5 pt-4">

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

        <button
          onClick={() => { window.speechSynthesis.cancel(); router.push(`/home/${citySlug}`); }}
          className="flex items-center gap-2 rounded-xl bg-black/60 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white/70 backdrop-blur-sm hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Carte
        </button>
      </div>

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
            <p className="text-xs font-bold text-violet-400 mt-0.5">
              ✨ Niveau {questReward.newLevel} atteint !
            </p>
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
        </div>

        {lastUserMsg && <p className="text-xs text-white/40 italic pl-1">&gt; {lastUserMsg}</p>}

        <div className="rounded-2xl bg-black/65 p-5 backdrop-blur-md border border-white/8 shadow-2xl">
          {isBusy ? (
            <div className="flex items-center gap-3 text-white/40 py-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">{isTranscribing ? "Transcription…" : "Réflexion…"}</span>
            </div>
          ) : currentReply ? (
            <div className="flex flex-col gap-4">
              {currentReply.words.length > 0 ? (
                <>
                  <WordRow words={currentReply.words} />
                  {currentReply.translation && (
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

        {devices.length > 1 && (
          <select value={selectedDevice} onChange={e => setSelectedDevice(e.target.value)} disabled={isRecording}
            className="w-full rounded-lg bg-black/50 border border-white/10 px-3 py-1.5 text-[11px] text-white/50 outline-none backdrop-blur-sm">
            {devices.map(d => (
              <option key={d.deviceId} value={d.deviceId}>{d.label || `Micro ${d.deviceId.slice(0, 8)}`}</option>
            ))}
          </select>
        )}
      </div>

      {/* Suggestions + quest verify */}
      <div className="absolute bottom-5 left-0 right-0 z-30 flex justify-center items-center gap-2 px-4">
        {activeQuest && currentReply && !isBusy && (
          <button
            onClick={() => setShowQuiz(true)}
            className="flex items-center gap-1.5 rounded-full border border-yellow-400/50 bg-yellow-400/10 px-4 py-2.5 text-xs font-bold text-yellow-400 backdrop-blur-md hover:bg-yellow-400/20 transition-all shrink-0"
          >
            🎯 Vérifier
          </button>
        )}
        {currentReply?.suggestions?.map((s, i) => (
          <button key={i} onClick={() => !isBusy && sendMessage(s)} disabled={isBusy}
            className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-4 py-2.5 text-xs font-medium text-white/80 backdrop-blur-md transition-all hover:border-violet-500/60 hover:bg-violet-900/50 hover:text-white active:scale-95 disabled:opacity-40">
            {s}
            <span className="text-[9px] text-white/25">{i + 1}</span>
          </button>
        ))}
      </div>

      {/* Mic */}
      <div className="absolute bottom-5 right-6 z-30 flex flex-col items-center gap-1.5">
        <button onClick={toggleMic} disabled={isBusy}
          className={`flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all active:scale-95 disabled:opacity-40 ${
            isRecording
              ? "animate-pulse bg-red-500 shadow-red-500/40 border border-red-400"
              : "border border-white/20 bg-white/10 backdrop-blur-md hover:bg-violet-600/80"
          }`}>
          {isRecording ? <MicOff className="h-6 w-6 text-white" /> : <Mic className="h-6 w-6 text-white" />}
        </button>
        <p className="text-[9px] font-medium text-white/35">{isRecording ? "Stop" : "Micro"}</p>
      </div>

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
