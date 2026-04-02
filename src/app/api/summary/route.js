import Groq from "groq-sdk";
import { AGENTS } from "@/lib/constants";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

function extractJSON(text) {
  try { return JSON.parse(text.trim()); } catch {}
  const match = text.match(/\{[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]); } catch {} }
  return null;
}

export async function POST(request) {
  try {
    const { thread, contributions } = await request.json();

    if (!thread || !contributions?.length) {
      return Response.json({ error: "thread and contributions required" }, { status: 400 });
    }

    const contribText = contributions
      .slice(-12)
      .map((c) => {
        const name = c.agentId ? (AGENTS[c.agentId]?.name ?? "Agent") : (c.author || "Human");
        return `${name} (${c.sentiment}, ${c.confidence}% confidence): ${c.claim}`;
      })
      .join("\n");

    const prompt = `You are a neutral summarizer for a structured decision-making platform called Synapse.

Thread: "${thread.title}"
${thread.description ? `Context: "${thread.description}"` : ""}

Contributions:
${contribText}

Analyze the contributions and produce a concise structured summary.
Respond ONLY with a valid JSON object — no markdown, no explanation, just JSON:

{
  "currentState": "1-2 sentences on where the discussion currently stands",
  "keyFor": "The strongest argument supporting the proposition",
  "keyAgainst": "The strongest argument opposing the proposition",
  "openQuestions": "The most important unresolved question",
  "nextSteps": "One concrete next step to advance the discussion",
  "minorityView": "A significant minority perspective, or empty string if none"
}`;

    const completion = await client.chat.completions.create({
      model:      "llama-3.3-70b-versatile",
      max_tokens: 700,
      messages:   [{ role: "user", content: prompt }],
    });

    const raw    = completion.choices[0]?.message?.content || "{}";
    const parsed = extractJSON(raw);

    if (!parsed) {
      return Response.json({ error: "Failed to parse summary response" }, { status: 500 });
    }

    return Response.json({
      currentState:  String(parsed.currentState  || ""),
      keyFor:        String(parsed.keyFor        || ""),
      keyAgainst:    String(parsed.keyAgainst    || ""),
      openQuestions: String(parsed.openQuestions || ""),
      nextSteps:     String(parsed.nextSteps     || ""),
      minorityView:  String(parsed.minorityView  || ""),
      generatedAt:   Date.now(),
    });
  } catch (error) {
    console.error("Summary API error:", error?.message || error);
    return Response.json(
      { error: error?.message || "Failed to generate summary" },
      { status: 500 }
    );
  }
}
