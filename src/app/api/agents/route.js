import Groq from "groq-sdk";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

function extractJSON(text) {
  try { return JSON.parse(text.trim()); } catch {}
  const match = text.match(/\{[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]); } catch {} }
  return null;
}

export async function POST(request) {
  try {
    const { prompt } = await request.json();
    if (!prompt) {
      return Response.json({ error: "prompt is required" }, { status: 400 });
    }

    const completion = await client.chat.completions.create({
      model:      "llama-3.3-70b-versatile",
      max_tokens: 600,
      messages:   [{ role: "user", content: prompt }],
    });

    const raw    = completion.choices[0]?.message?.content || "{}";
    const parsed = extractJSON(raw);

    if (!parsed) {
      return Response.json({
        claim:      "Analysis complete.",
        reasoning:  "The agent processed the thread context.",
        evidence:   "",
        confidence: 55,
        sentiment:  "neutral",
      });
    }

    const sentiment = ["support", "oppose", "neutral"].includes(parsed.sentiment)
      ? parsed.sentiment
      : "neutral";

    return Response.json({
      claim:      String(parsed.claim     || "Analysis complete."),
      reasoning:  String(parsed.reasoning || ""),
      evidence:   String(parsed.evidence  || ""),
      confidence: Math.min(95, Math.max(10, Number(parsed.confidence) || 60)),
      sentiment,
    });
  } catch (error) {
    console.error("Agent API error:", error?.message || error);
    return Response.json(
      { error: error?.message || "Failed to generate agent response" },
      { status: 500 }
    );
  }
}
