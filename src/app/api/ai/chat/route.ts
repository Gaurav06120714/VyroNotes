/**
 * POST /api/ai/chat
 *
 * Streaming chat endpoint backed by Ollama.
 * Body: { messages: OllamaMessage[], model?: string }
 * Returns: text/event-stream (chunks of raw text)
 */

import { NextRequest, NextResponse } from "next/server";
import { streamChat, OllamaError, PRIMARY_MODEL } from "@/lib/ollama";
import type { OllamaMessage } from "@/lib/ollama";

export const runtime = "nodejs";

interface ChatRequestBody {
  messages: OllamaMessage[];
  model?: string;
}

export async function POST(req: NextRequest) {
  let body: ChatRequestBody;
  try {
    body = await req.json() as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { messages, model = PRIMARY_MODEL } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages array required" }, { status: 400 });
  }

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 30000);

  // Set up connection close → abort
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
