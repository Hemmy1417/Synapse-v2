/**
 * /api/threads
 *
 * In-memory store for MVP. For production, replace with your DB (Postgres/Supabase).
 * The client-side Zustand store is the source of truth during a session;
 * this route exists as the persistence layer stub.
 */

import { SEED_THREADS } from "@/lib/constants";

// Shared in-memory store (resets on server restart)
let threads = [...SEED_THREADS];

export async function GET() {
  return Response.json(threads);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const thread = {
      ...body,
      id: `t-${Date.now()}`,
      timestamp: Date.now(),
      consensusScore: 0,
    };
    threads = [thread, ...threads];
    return Response.json(thread, { status: 201 });
  } catch (error) {
    return Response.json({ error: "Failed to create thread" }, { status: 500 });
  }
}
