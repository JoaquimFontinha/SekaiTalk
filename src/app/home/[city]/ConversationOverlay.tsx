"use client";

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { X, Mic, MicOff, Loader2, Send } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };
type Character = {
  id: string; poiId: string; name: string; nameJp: string; role: string;
  image: string; backgroundImage: string; systemPrompt: string;
  greetingMessage: string; isFriendable: boolean;
};
interface Props { character: Character; onClose: () => void; }

export default function ConversationOverlay({ character, onClose }: Props) {
  const [messages, setMessages]           = useState<Message[]>([]);
  const [displayedText, setDisplayedText] = useState(character.greetingMessage);
  const [isRecording, setIsRecording]     = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isLoading, setIsLoading]         = useState(false);
  const [isSpeaking, setIsSpeaking]       = useState(false);
  const [textInput, setTextInput]         = useState("");
  const [micError, setMicError]           = useState<string | null>(null);
  const [devices, setDevices]             = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");

  const messagesRef    = useRef<Message[]>([]);
  const systemRef      = useRef(character.systemPrompt);
  const recorderRef    = useRef<MediaRecorder | null>(null);
  const chunksRef      = useRef<Blob[]>([]);
  const streamRef      = useRef<MediaStream | null>(null);
  const scrollRef      = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // ── TTS ──────────────────────────────────────────────────────
  const speak = useCallback((text: string) => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "ja-JP"; utter.rate = 0.9;
    const go = () => {
      const jp = window.speechSynthesis.getVoices().find(v => v.lang.startsWith("ja"));
      if (jp) utter.voice = jp;
      utter.onstart = () => setIsSpeaking(true);
      utter.onend = utter.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utter);
    };
    window.speechSynthesis.getVoices().length
      ? go()
      : window.speechSynthesis.addEventListener("voiceschanged", go, { once: true });
  }, []);

  useEffect(() => {
    speak(character.greetingMessage);
    // Charge la liste des micros après avoir demandé la permission une première fois
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(s => {
        s.getTracks().forEach(t => t.stop());
        return navigator.mediaDevices.enumerateDevices();
      })
      .then(devs => {
        const mics = devs.filter(d => d.kind === "audioinput");
        setDevices(mics);
        if (mics.length > 0) setSelectedDevice(mics[0].deviceId);
      })
      .catch(() => {});
    return () => {
      window.speechSynthesis.cancel();
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // ── Claude ───────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    const t = text.trim(); if (!t) return;
    const next: Message[] = [...messagesRef.current, { role: "user", content: t }];
    setMessages(next);
    setIsLoading(true); setDisplayedText("…");
    try {
      const r = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, systemPrompt: systemRef.current }),
      });
      const d = await r.json();
      const reply = d.reply ?? "…";
      setMessages(p => [...p, { role: "assistant", content: reply }]);
      setDisplayedText(reply);
      speak(reply);
    } catch { setDisplayedText("Erreur de connexion."); }
    finally { setIsLoading(false); }
  }, [speak]);

  // ── Transcription ─────────────────────────────────────────────
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

  // ── Mic toggle ────────────────────────────────────────────────
  const toggleMic = useCallback(async () => {
    setMicError(null);

    if (isRecording) {
      // Arrêter
      recorderRef.current?.stop();
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setIsRecording(false);
      return;
    }

    // Démarrer
    try {
      const audioConstraints: MediaStreamConstraints = {
        audio: selectedDevice ? { deviceId: { exact: selectedDevice } } : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
      streamRef.current = stream;

      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus" : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      recorderRef.current = rec;
      chunksRef.current = [];

      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        chunksRef.current = [];
        transcribe(blob);
      };

      rec.start(100);
      setIsRecording(true);
    } catch (e: unknown) {
      const err = e as { name?: string };
      setMicError(err.name === "NotAllowedError" ? "Micro refusé dans le navigateur." : "Micro inaccessible.");
    }
  }, [isRecording, transcribe]);

  // ── Text ─────────────────────────────────────────────────────
  const handleSendText = useCallback(() => {
    if (!textInput.trim() || isLoading) return;
    sendMessage(textInput); setTextInput("");
  }, [textInput, isLoading, sendMessage]);

  const handleKey = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSendText();
  }, [handleSendText]);

  const isBusy = isLoading || isTranscribing;

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center">
      <div className="absolute inset-0"
        style={{ backgroundImage: `url(${character.backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" }} />
      <div className="absolute inset-0 bg-black/40" />

      <button onClick={onClose}
        className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/70">
        <X className="h-5 w-5" />
      </button>

      {/* Sprite */}
      <div className="absolute bottom-[230px] left-1/2 -translate-x-1/2 transition-all duration-300"
        style={{ filter: isSpeaking ? "drop-shadow(0 0 22px rgba(99,102,241,0.8))" : "drop-shadow(0 4px 14px rgba(0,0,0,0.45))" }}>
        <img src={character.image} alt={character.name}
          className="h-[340px] w-auto select-none object-contain" draggable={false} />
      </div>

      {/* Dialogue */}
      <div className="relative z-10 w-full max-w-2xl px-4 pb-6">
        <div className="mb-1 inline-flex items-center gap-2 rounded-t-lg bg-indigo-700 px-4 py-1.5">
          <span className="text-xs font-bold uppercase tracking-widest text-white">{character.name}</span>
          <span className="text-[10px] text-indigo-200">{character.nameJp}</span>
        </div>

        <div className="rounded-b-xl rounded-tr-xl bg-white/95 p-4 shadow-2xl backdrop-blur-sm">
          {messages.length > 0 && (
            <div ref={scrollRef} className="mb-3 max-h-24 overflow-y-auto border-b border-gray-100 pb-3">
              {messages.map((m, i) => (
                <p key={i} className={`mb-1 text-xs ${m.role === "user" ? "text-right text-blue-600" : "text-left text-gray-600"}`}>
                  {m.content}
                </p>
              ))}
            </div>
          )}

          <p className="min-h-[2.5rem] text-sm font-medium leading-relaxed text-gray-900">
            {isBusy
              ? <span className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{isTranscribing ? "Transcription…" : "…"}</span>
                </span>
              : displayedText}
          </p>

          {micError && <p className="mt-1 text-[10px] text-red-500">{micError}</p>}

          {/* Sélecteur de micro */}
          {devices.length > 1 && (
            <select
              value={selectedDevice}
              onChange={e => setSelectedDevice(e.target.value)}
              disabled={isRecording}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-[11px] text-gray-600 outline-none focus:border-indigo-400 disabled:opacity-50"
            >
              {devices.map(d => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Micro ${d.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
          )}

          <div className="mt-3 flex items-center gap-2">
            <input type="text" value={textInput}
              onChange={e => setTextInput(e.target.value)} onKeyDown={handleKey}
              disabled={isBusy || isRecording} placeholder="Écris ton message…"
              className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50" />
            <button onClick={handleSendText} disabled={isBusy || isRecording || !textInput.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40">
              <Send className="h-4 w-4" />
            </button>
            <button onClick={toggleMic} disabled={isBusy}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all disabled:opacity-50 ${
                isRecording
                  ? "animate-pulse bg-red-500 text-white shadow-lg shadow-red-300"
                  : "bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-600"
              }`}>
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          </div>

          <p className="mt-1 text-center text-[10px] text-gray-400">
            {isRecording ? "Enregistrement… clique pour envoyer" : "Clique sur le micro, parle, reclique pour envoyer"}
          </p>
        </div>
      </div>
    </div>
  );
}
