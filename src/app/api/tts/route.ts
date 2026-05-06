import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { text, voiceId } = await req.json();
  if (!text || !voiceId) {
    return NextResponse.json({ error: "Missing text or voiceId" }, { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ElevenLabs not configured" }, { status: 500 });
  }

  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: 0.9 },
    }),
  });

  if (!r.ok) {
    const err = await r.text().catch(() => "");
    console.error("ElevenLabs error:", r.status, err);
    return NextResponse.json({ error: "ElevenLabs request failed" }, { status: 502 });
  }

  const audio = await r.arrayBuffer();
  return new NextResponse(audio, {
    headers: { "Content-Type": "audio/mpeg" },
  });
}
