"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, Loader2, Pause, Menu, Star } from "lucide-react";
import cities from "@/lib/cities";

type Message   = { role: "user" | "assistant"; content: string };
type Word      = { furigana: string; jp: string; romaji: string; fr: string };
type AIReply   = { reply: string; translation: string; romaji: string; words: Word[]; suggestions: string[] };
type Character = {
  id: string; poiId: string; name: string; nameJp: string; role: string;
  image: string; backgroundImage: string; systemPrompt: string;
  greetingMessage: string; isFriendable: boolean;
};

const MEMORY_GOAL = 10;

const WORD_COLORS = [
  "text-pink-400",
  "text-cyan-400",
  "text-violet-400",
  "text-yellow-400",
  "text-emerald-400",
  "text-orange-400",
  "text-blue-400",
  "text-rose-400",
];

function WordRow({ words }: { words: Word[] }) {
  return (
    <div className="flex flex-wrap items-end gap-x-5 gap-y-4">
      {words.map((w, i) => {
        const color = WORD_COLORS[i % WORD_COLORS.length];
        return (
          <div key={i} className="flex flex-col items-center gap-[3px]">
            {/* Furigana */}
            <span className={`text-[11px] font-medium min-h-[16px] ${color} opacity-80`}>
              {w.furigana}
            </span>
            {/* Kanji */}
            <span className="text-[24px] font-bold leading-none text-white tracking-wide">
              {w.jp}
            </span>
            {/* Romaji */}
            <span className={`text-[11px] font-semibold underline underline-offset-2 decoration-dotted ${color}`}>
              {w.romaji}
            </span>
            {/* Traduction */}
            <span className="text-[10px] text-white/45 mt-0.5">
              {w.fr}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function POIClient({ citySlug, poiId }: { citySlug: string; poiId: string }) {
  const router = useRouter();
  const city   = cities[citySlug];
  const poi    = city?.pois.find(p => p.id === poiId);

  const [character, setCharacter]       = useState<Character | null>(null);
  const [notFound, setNotFound]         = useState(false);
  const [messages, setMessages]         = useState<Message[]>([]);
  const [currentReply, setCurrentReply] = useState<AIReply | null>(null);
  const [lastUserMsg, setLastUserMsg]   = useState("");
  const [memories, setMemories]         = useState(0);
  const [isRecording, setIsRecording]   = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [isSpeaking, setIsSpeaking]     = useState(false);
  const [micError, setMicError]         = useState<string | null>(null);
  const [devices, setDevices]           = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [showTip, setShowTip]           = useState(true);

  const messagesRef = useRef<Message[]>([]);
  const systemRef   = useRef("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const streamRef   = useRef<MediaStream | null>(null);

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  useEffect(() => {
    fetch(`/api/characters/${poiId}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((c: Character) => {
        setCharacter(c);
        systemRef.current = c.systemPrompt;
        setCurrentReply({
          reply: c.greetingMessage, translation: "", romaji: "", words: [],
          suggestions: ["Bonjour !", "Comment ça va ?", "Qu'est-ce que vous recommandez ?"],
        });
        speak(c.greetingMessage);
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(s => { s.getTracks().forEach(t => t.stop()); return navigator.mediaDevices.enumerateDevices(); })
          .then(devs => {
            const mics = devs.filter(d => d.kind === "audioinput");
            setDevices(mics);
            if (mics.length) setSelectedDevice(mics[0].deviceId);
          }).catch(() => {});
      })
      .catch(() => setNotFound(true));
    return () => { window.speechSynthesis.cancel(); streamRef.current?.getTracks().forEach(t => t.stop()); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poiId]);

  const speak = useCallback((text: string) => {
    window.speechSynthesis.cancel();
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
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const t = text.trim(); if (!t) return;
    setLastUserMsg(t);
    const next: Message[] = [...messagesRef.current, { role: "user", content: t }];
    setMessages(next);
    setIsLoading(true);
    setCurrentReply(null);
    try {
      const r = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, systemPrompt: systemRef.current }),
      });
      const d: AIReply = await r.json();
      setMessages(p => [...p, { role: "assistant", content: d.reply }]);
      setCurrentReply(d);
      setMemories(m => Math.min(m + 1, MEMORY_GOAL));
      speak(d.reply);
    } catch {
      setCurrentReply({ reply: "Erreur…", translation: "", romaji: "", words: [], suggestions: [] });
    } finally { setIsLoading(false); }
  }, [speak]);

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

  if (notFound) return <div className="flex h-screen items-center justify-center text-gray-400">Personnage introuvable.</div>;
  if (!character) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-violet-400" /></div>;

  return (
    <div className="relative h-screen w-screen overflow-hidden select-none">

      {/* ── Fond ── */}
      <div className="absolute inset-0 bg-black">
        <div className="absolute inset-0"
          style={{ backgroundImage: `url(${character.backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
      </div>

      {/* ── Personnage (droite, collé en bas) ── */}
      <div className="absolute bottom-0 right-0 z-10 h-full flex items-end pointer-events-none"
        style={{ width: "52%" }}>
        <img src={character.image} alt={character.name}
          className="h-[92%] w-auto object-contain object-bottom"
          style={{ filter: isSpeaking ? "drop-shadow(0 0 32px rgba(124,58,237,1))" : "drop-shadow(0 0 0px transparent)", transition: "filter .3s" }}
          draggable={false} />
      </div>

      {/* ── Top bar ── */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-start justify-between px-5 pt-4">

        {/* Quête */}
        <div className="flex items-start gap-2 rounded-xl bg-black/60 px-3 py-2.5 backdrop-blur-sm" style={{ maxWidth: 200 }}>
          <Star className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-400" />
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">Objectif</p>
            <p className="text-[11px] font-medium text-white/80 leading-snug mt-0.5">
              Débloque {MEMORY_GOAL} souvenirs avec ce personnage
            </p>
            <p className="mt-1 text-[10px] font-bold text-yellow-400">{memories}/{MEMORY_GOAL}</p>
          </div>
        </div>

        {/* Pause */}
        <button className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-900/40">
          <Pause className="h-3 w-3" /> Pause
        </button>

        {/* Menu */}
        <button onClick={() => router.push(`/home/${citySlug}`)}
          className="flex items-center gap-2 rounded-xl bg-black/60 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white/70 backdrop-blur-sm hover:text-white">
          <Menu className="h-4 w-4" /> Menu
        </button>
      </div>

      {/* ── Panneau dialogue (bas, centré) ── */}
      <div className="absolute bottom-[72px] left-1/2 -translate-x-1/2 z-20 flex flex-col gap-2.5"
        style={{ width: "54%" }}>

        {/* Barre souvenirs */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Souvenirs</span>
          <div className="flex-1 h-1 rounded-full bg-white/15 overflow-hidden">
            <div className="h-full rounded-full bg-emerald-400 transition-all duration-700"
              style={{ width: `${(memories / MEMORY_GOAL) * 100}%` }} />
          </div>
          <span className="text-[9px] font-bold text-white/40">{memories}/{MEMORY_GOAL}</span>
        </div>

        {/* Tip */}
        {showTip && (
          <div className="flex items-center justify-between rounded-lg bg-black/50 px-3 py-2 backdrop-blur-sm border border-white/8">
            <p className="text-[10px] text-white/60">
              💡 Parle en <span className="text-blue-400 font-semibold">français</span> pour obtenir des réponses en <span className="text-yellow-400 font-semibold">japonais</span>
            </p>
            <button onClick={() => setShowTip(false)} className="ml-3 text-[11px] text-white/30 hover:text-white/70 shrink-0">✕</button>
          </div>
        )}

        {/* Nom du personnage */}
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {character.name[0]}
          </div>
          <span className="text-sm font-bold text-white">{character.name}</span>
          <span className="text-[11px] text-white/35 font-medium">{character.nameJp}</span>
        </div>

        {/* Message utilisateur */}
        {lastUserMsg && (
          <p className="text-xs text-white/40 italic pl-1">&gt; {lastUserMsg}</p>
        )}

        {/* Bulle de réponse */}
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
                    <p className="text-xs text-white/40 border-t border-white/10 pt-3 italic">
                      {currentReply.translation}
                    </p>
                  )}
                </>
              )}
            </div>
          ) : null}
        </div>

        {/* Erreur mic */}
        {micError && <p className="text-[10px] text-red-400 pl-1">{micError}</p>}

        {/* Sélecteur micro (si plusieurs) */}
        {devices.length > 1 && (
          <select value={selectedDevice} onChange={e => setSelectedDevice(e.target.value)}
            disabled={isRecording}
            className="w-full rounded-lg bg-black/50 border border-white/10 px-3 py-1.5 text-[11px] text-white/50 outline-none backdrop-blur-sm">
            {devices.map(d => (
              <option key={d.deviceId} value={d.deviceId}>{d.label || `Micro ${d.deviceId.slice(0, 8)}`}</option>
            ))}
          </select>
        )}
      </div>

      {/* ── Suggestions (bas centre) ── */}
      <div className="absolute bottom-5 left-0 right-0 z-30 flex justify-center gap-2 px-4">
        {currentReply?.suggestions?.map((s, i) => (
          <button key={i} onClick={() => !isBusy && sendMessage(s)} disabled={isBusy}
            className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-4 py-2.5 text-xs font-medium text-white/80 backdrop-blur-md transition-all hover:border-violet-500/60 hover:bg-violet-900/50 hover:text-white active:scale-95 disabled:opacity-40">
            {s}
            <span className="text-[9px] text-white/25">{i + 1}</span>
          </button>
        ))}
      </div>

      {/* ── Micro (bas droite) ── */}
      <div className="absolute bottom-5 right-6 z-30 flex flex-col items-center gap-1.5">
        <button onClick={toggleMic} disabled={isBusy}
          className={`flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all active:scale-95 disabled:opacity-40 ${
            isRecording
              ? "animate-pulse bg-red-500 shadow-red-500/40 border border-red-400"
              : "border border-white/20 bg-white/10 backdrop-blur-md hover:bg-violet-600/80"
          }`}>
          {isRecording ? <MicOff className="h-6 w-6 text-white" /> : <Mic className="h-6 w-6 text-white" />}
        </button>
        <p className="text-[9px] font-medium text-white/35 text-center">
          {isRecording ? "Stop" : "Micro"}
        </p>
      </div>
    </div>
  );
}
