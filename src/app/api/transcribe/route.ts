import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const audio = formData.get("audio") as File | null;

  if (!audio) {
    return NextResponse.json({ error: "No audio" }, { status: 400 });
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "GROQ_API_KEY manquante" }, { status: 500 });
  }

  const whisperForm = new FormData();
  whisperForm.append("file", audio, "audio.webm");
  whisperForm.append("model", "whisper-large-v3-turbo");
  whisperForm.append("language", "ja");
  whisperForm.append("response_format", "verbose_json");
  whisperForm.append("temperature", "0");
  whisperForm.append("prompt", "日本語");

  const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: whisperForm,
  });

  if (!response.ok) {
    const err = await response.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  const data = await response.json();

  // Whisper hallucination patterns — phrases générées quand il n'y a pas de vraie parole
  const HALLUCINATIONS = [
    "日本語", "ご視聴", "字幕", "翻訳", "ありがとうございました",
    "お願いします。", "です。", "ます。",
  ];
  const isHallucination = (text: string) =>
    text.trim().length < 3 ||
    HALLUCINATIONS.some(h => text.trim() === h) ||
    /^[。、．，\s]+$/.test(text.trim());

  // Filter segments where Whisper detected no meaningful speech
  if (Array.isArray(data.segments) && data.segments.length > 0) {
    const voiced = data.segments.filter(
      (seg: { no_speech_prob: number; avg_logprob: number }) =>
        seg.no_speech_prob < 0.4 && seg.avg_logprob > -1.0
    );
    if (voiced.length === 0) {
      return NextResponse.json({ text: "" });
    }
    const text = voiced.map((s: { text: string }) => s.text).join("").trim();
    if (isHallucination(text)) return NextResponse.json({ text: "" });
    return NextResponse.json({ text });
  }

  const rawText = (data.text ?? "").trim();
  if (isHallucination(rawText)) return NextResponse.json({ text: "" });
  return NextResponse.json({ text: rawText });
}
