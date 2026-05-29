/**
 * POST /api/ai/generate
 *
 * One-shot generation endpoint for summarize / quiz / flashcard / key concepts.
 * Body: { prompt: string, model?: string, system?: string }
 * Returns: { text: string, model: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { generate, OllamaError, PRIMARY_MODEL } from "@/lib/ollama";

export const runtime = "nodejs";

interface GenerateRequestBody {
  prompt: string;
  model?: string;
  system?: string;
}

export async function POST(req: NextRequest) {
  let body: GenerateRequestBody;
  try {
    body = await req.json() as GenerateRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { prompt, model = PRIMARY_MODEL, system } = body;

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "prompt string required" }, { status: 400 });
  }

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 30000);
  req.signal.addEventListener("abort", () => {
    abortController.abort();
    clearTimeout(timeoutId);
  });

  try {
    const result = await generate(prompt, { model, system, signal: abortController.signal });
    clearTimeout(timeoutId);
    return NextResponse.json({ text: result.text, model: result.model });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof OllamaError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
