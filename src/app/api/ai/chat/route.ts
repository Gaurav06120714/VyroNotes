import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { streamChat, OllamaError, PRIMARY_MODEL } from "@/lib/ollama";

export const runtime = "nodejs";

const MessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1).max(32_000),
});

const ChatBodySchema = z.object({
  messages: z.array(MessageSchema).min(1).max(100),
  model: z.string().optional(),
});

const rlMap = new Map<string, number[]>();

function checkRateLimit(key: string, limit = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  let timestamps = rlMap.get(key) ?? [];
  timestamps = timestamps.filter((t) => now - t < windowMs);
  if (timestamps.length >= limit) return false;
  timestamps.push(now);
  rlMap.set(key, timestamps);
  return true;
}

const hasSupabase =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "your_supabase_url";

async function getSessionUserId(req: NextRequest): Promise<string | null> {
  if (!hasSupabase) return "anonymous";
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user.id ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  
  const userId = await getSessionUserId(req);
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized. Please sign in." },
      { status: 401 }
    );
  }

  if (!checkRateLimit(`chat:${userId}`)) {
    return NextResponse.json(
      { error: "Too many requests. Wait a moment before sending another message." },
      { status: 429 }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ChatBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { messages, model = PRIMARY_MODEL } = parsed.data;

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 60_000);

  req.signal.addEventListener("abort", () => {
    abortController.abort();
    clearTimeout(timeoutId);
  });

  let generator: AsyncGenerator<string, void, unknown>;
  try {
    generator = streamChat(messages, {
      model,
      signal: abortController.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    const msg = err instanceof OllamaError ? err.message : "Ollama unavailable";
    return NextResponse.json({ error: msg }, { status: 503 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async pull(controller) {
      try {
        const { value, done } = await generator.next();
        if (done) {
          controller.close();
          clearTimeout(timeoutId);
          return;
        }
        controller.enqueue(encoder.encode(value));
      } catch (err) {
        clearTimeout(timeoutId);
        if (err instanceof Error && err.name === "AbortError") {
          controller.close();
        } else {
          controller.error(err);
        }
      }
    },
    cancel() {
      abortController.abort();
      clearTimeout(timeoutId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
