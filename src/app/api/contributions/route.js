/**
 * /api/contributions
 *
 * In-memory store for MVP. Replace with Postgres queries in production.
 */

let contributions = {}; // threadId → Contribution[]

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get("threadId");
  if (!threadId) {
    return Response.json({ error: "threadId required" }, { status: 400 });
  }
  return Response.json(contributions[threadId] || []);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { threadId, ...rest } = body;

    if (!threadId) {
      return Response.json({ error: "threadId required" }, { status: 400 });
    }

    const contrib = {
      ...rest,
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      threadId,
    };

    if (!contributions[threadId]) contributions[threadId] = [];
    contributions[threadId].push(contrib);

    return Response.json(contrib, { status: 201 });
  } catch (error) {
    return Response.json({ error: "Failed to save contribution" }, { status: 500 });
  }
}
