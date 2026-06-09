import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generate, OllamaError, PRIMARY_MODEL, estimateTokens } from "@/lib/ollama";

export const runtime = "nodejs";

const GenerateBodySchema = z.object({
  prompt: z.string().min(1).max(32_000),
  model: z.string().optional(),
  system: z.string().max(8_000).optional(),
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
    return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
  }

  if (!checkRateLimit(`generate:${userId}`)) {
    return NextResponse.json(
      { error: "Too many requests. Wait a moment." },
      { status: 429 }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = GenerateBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { prompt, model = PRIMARY_MODEL, system } = parsed.data;

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 60_000);
  req.signal.addEventListener("abort", () => {
    abortController.abort();
    clearTimeout(timeoutId);
  });

  try {
    const result = await generate(prompt, { model, system, signal: abortController.signal });
    clearTimeout(timeoutId);
    return NextResponse.json({
      text: result.text,
      model: result.model,
      estimatedTokens: estimateTokens(prompt + result.text),
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof OllamaError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
