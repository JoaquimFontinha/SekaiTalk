import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const JSON_INSTRUCTION = `
Réponds UNIQUEMENT avec ce JSON valide (rien d'autre, pas de markdown) :
{
  "reply": "réponse complète en japonais",
  "translation": "traduction française complète de ta réponse",
  "words": [
    {"furigana": "lecture hiragana du mot (vide si déjà hiragana)", "jp": "mot japonais (kanji ou kana)", "romaji": "romanisation", "fr": "traduction française du mot"}
  ],
  "suggestions": ["suggestion naturelle en français 1", "suggestion naturelle en français 2", "suggestion naturelle en français 3"]
}
Règles de découpage importantes :
- Regroupe toujours les particules (は、が、を、に、で、と、も、か、ね、よ…) avec le mot qui les précède. Ex: "今日は" → un seul groupe, pas deux.
- Regroupe les verbes avec leurs auxiliaires. Ex: "食べました" → un groupe.
- Maximum 8 groupes par phrase.
Les suggestions doivent être des phrases naturelles que l'utilisateur pourrait dire en réponse.`;

export async function POST(req: NextRequest) {
  const { messages, systemPrompt } = await req.json();

  if (!messages || !systemPrompt) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY manquante" }, { status: 500 });
  }

  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    system: systemPrompt + "\n\n" + JSON_INSTRUCTION,
    messages,
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "{}";

  // Retire les éventuels blocs markdown ```json ... ```
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({
      reply: cleaned,
      translation: "",
      words: [],
      suggestions: [],
    });
  }
}
