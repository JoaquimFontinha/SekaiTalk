import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

const REMEMBER_TOOL: Anthropic.Tool = {
  name: "remember_fact",
  description:
    "Mémorise discrètement un fait important sur l'utilisateur pour t'en souvenir lors de futures conversations. Utilise cet outil dès que l'utilisateur mentionne son nom, son métier, ses goûts, ou un événement notable. Ne mentionne jamais que tu utilises cet outil.",
  input_schema: {
    type: "object" as const,
    properties: {
      key: {
        type: "string",
        description:
          "Catégorie courte du fait (ex: name, job, favorite_food, recent_event, hobby)",
      },
      value: {
        type: "string",
        description: "La valeur à mémoriser, en une phrase concise",
      },
    },
    required: ["key", "value"],
  },
};

export async function POST(req: NextRequest) {
  const { messages, systemPrompt, characterId } = await req.json();

  if (!messages || !systemPrompt) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY manquante" }, { status: 500 });
  }

  // ── Memory: load + inject if character is friendable ──────────────────────
  let enhancedSystemPrompt = systemPrompt;
  let userId: string | null = null;
  let isFriendable = false;

  if (characterId) {
    const [session, character] = await Promise.all([
      getServerSession(authOptions),
      prisma.character.findUnique({
        where: { id: characterId },
        select: { isFriendable: true },
      }),
    ]);

    userId = (session?.user as { id?: string })?.id ?? null;
    isFriendable = character?.isFriendable ?? false;

    if (isFriendable && userId) {
      const memories = await prisma.characterMemory.findMany({
        where: { characterId, userId },
        orderBy: { updatedAt: "desc" },
      });

      if (memories.length > 0) {
        enhancedSystemPrompt +=
          "\n\n[MÉMOIRE — ce que tu sais de cet utilisateur]\n" +
          memories.map((m) => `${m.key}: ${m.value}`).join("\n");
      }
    }
  }

  const useTool = isFriendable && !!userId && !!characterId;

  const anthropic = new Anthropic({ apiKey });

  // ── Agentic loop: handle remember_fact tool calls ─────────────────────────
  let currentMessages: Anthropic.MessageParam[] = messages;
  let finalText = "{}";

  for (let turn = 0; turn < 5; turn++) {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: enhancedSystemPrompt + "\n\n" + JSON_INSTRUCTION,
      messages: currentMessages,
      ...(useTool ? { tools: [REMEMBER_TOOL], tool_choice: { type: "auto" } } : {}),
    });

    if (response.stop_reason === "tool_use") {
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type !== "tool_use" || block.name !== "remember_fact") continue;
        const { key, value } = block.input as { key: string; value: string };

        if (characterId && userId) {
          await prisma.characterMemory.upsert({
            where: { characterId_userId_key: { characterId, userId, key } },
            update: { value },
            create: { characterId, userId, key, value },
          });
        }

        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: "Mémorisé.",
        });
      }

      currentMessages = [
        ...currentMessages,
        { role: "assistant", content: response.content },
        { role: "user", content: toolResults },
      ];
      continue;
    }

    // Text response — extract and break
    const textBlock = response.content.find((b) => b.type === "text");
    finalText = textBlock?.type === "text" ? textBlock.text : "{}";
    break;
  }

  const cleaned = finalText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    return NextResponse.json(JSON.parse(cleaned));
  } catch {
    return NextResponse.json({
      reply: cleaned,
      translation: "",
      words: [],
      suggestions: [],
    });
  }
}
