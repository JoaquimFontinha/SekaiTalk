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
  whisperForm.append("prompt", "日本語で話しています。");

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
  return NextResponse.json({ text: data.text ?? "" });
}
