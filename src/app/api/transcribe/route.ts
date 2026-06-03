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
  // Prompt enrichi : exemples de vocabulaire japonais courant pour ancrer Whisper
  whisperForm.append("prompt", "日本語で話しています。観光、仕事、パスポート、ありがとうございます、すみません、です、ます、はい、いいえ、どこ、いくら、お願いします。");

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

  const HAS_JAPANESE = /[　-〿぀-ゟ゠-ヿ＀-￯一-龯]/;

  // Mots français/anglais qui indiquent une mauvaise reconnaissance du japonais
  const FRENCH_EN_WORDS = /\b(encore|mais|avec|pour|dans|bien|plus|très|aussi|votre|notre|cette|comme|tout|vous|nous|elle|ils|merci|bonjour|oui|non|the|and|but|for|with|this|that|have|from|they|what|just|when|your|more|will|about|there|their|been|also|would|could|should|were|said|each|she|him|his|how|its|now|only|over|than|then|time|very|after|before|through|where|while)\b/i;

  const isHallucination = (text: string) => {
    const t = text.trim();
    if (t.length < 3) return true;
    if (HALLUCINATIONS.some(h => t === h)) return true;
    if (/^[。、．，\s]+$/.test(t)) return true;
    // Rejet si aucun caractère japonais ET ressemble à du français/anglais
    if (!HAS_JAPANESE.test(t) && FRENCH_EN_WORDS.test(t)) return true;
    return false;
  };

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
