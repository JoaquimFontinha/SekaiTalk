import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const INSTRUCTION = `
Réponds UNIQUEMENT avec ce JSON valide (rien d'autre, pas de markdown) :
{
  "translation": "traduction française complète",
  "words": [
    {"furigana": "lecture hiragana du mot (vide si déjà hiragana)", "jp": "mot japonais (kanji ou kana)", "romaji": "romanisation", "fr": "traduction française du mot"}
  ]
}
Règles de découpage :
- Regroupe toujours les particules (は、が、を、に、で、と、も、か、ね、よ…) avec le mot qui les précède.
- Regroupe les verbes avec leurs auxiliaires. Ex: "食べました" → un groupe.
- Maximum 8 groupes par phrase.
`;

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (!text) return NextResponse.json({ translation: "", words: [] });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ translation: "", words: [] });

  const anthropic = new Anthropic({ apiKey });

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: INSTRUCTION,
      messages: [{ role: "user", content: `Analyse ce texte japonais : "${text}"` }],
    });

    const block = response.content.find(b => b.type === "text");
    const raw = block?.type === "text" ? block.text : "{}";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

    return NextResponse.json(JSON.parse(cleaned));
  } catch {
    return NextResponse.json({ translation: "", words: [] });
  }
}
