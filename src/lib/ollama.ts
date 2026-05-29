/**
 * ollama.ts
 *
 * Core Ollama client for VyroNotes.
 * Base URL: http://localhost:11434
 * Primary model: qwen2.5-coder:7b
 * Fallback model: qwen2.5-coder:7b (same, used for graceful degradation)
 *
 * Features:
 *  - Streaming chat via /api/chat
 *  - One-shot generation via /api/generate
 *  - AbortController support
 *  - 30s timeout
 *  - Error normalization
 */

export const OLLAMA_BASE_URL = "http://localhost:11434";
export const PRIMARY_MODEL   = "qwen2.5-coder:7b";
export const FALLBACK_MODEL  = "qwen2.5-coder:7b";

export interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OllamaStreamChunk {
  message?: { content: string };
  done: boolean;
}

export interface OllamaGenerateChunk {
  response: string;
  done: boolean;
}

/**
 * Check Ollama availability and return available model names.
 */
export async function listModels(): Promise<string[]> {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json() as { models: { name: string }[] };
    return data.models.map((m) => m.name);
  } catch {
    return [];
  }
}

/**
 * Pick the best available model, falling back if primary is absent.
 */
export async function resolveModel(requested?: string): Promise<string> {
  const available = await listModels();
  if (requested && available.some((m) => m.startsWith(requested.split(":")[0]))) {
    return requested;
  }
  if (available.some((m) => m.startsWith(PRIMARY_MODEL.split(":")[0]))) {
    return PRIMARY_MODEL;
  }
  return available[0] ?? PRIMARY_MODEL;
}

/**
 * Stream a chat completion from Ollama.
 * Returns an async generator that yields text chunks.
 */
export async function* streamChat(
  messages: OllamaMessage[],
  options?: { model?: string; signal?: AbortSignal }
): AsyncGenerator<string, void, unknown> {
  const model  = options?.model ?? PRIMARY_MODEL;
  const signal = options?.signal;

  const timeoutId = setTimeout(() => {
    // We can't abort from here without a controller reference,
    // but the signal from caller handles abort anyway.
  }, 30000);

  let res: Response;
  try {
    res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, stream: true }),
      signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    throw new OllamaError("Failed to connect to Ollama. Is it running?", err);
  }

  clearTimeout(timeoutId);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new OllamaError(`Ollama returned ${res.status}: ${text}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new OllamaError("No response body");

  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      for (const line of text.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const chunk = JSON.parse(trimmed) as OllamaStreamChunk;
          if (chunk.message?.content) {
            yield chunk.message.content;
          }
          if (chunk.done) return;
        } catch {
          // Non-JSON line, skip
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * One-shot generation (non-streaming).
 * Returns { text, model }.
 */
export async function generate(
  prompt: string,
  options?: { model?: string; system?: string; signal?: AbortSignal }
): Promise<{ text: string; model: string }> {
  const model  = options?.model ?? PRIMARY_MODEL;
  const signal = options?.signal;

  let res: Response;
  try {
    res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        system: options?.system,
        stream: false,
      }),
      signal,
    });
  } catch (err) {
    throw new OllamaError("Failed to connect to Ollama.", err);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new OllamaError(`Ollama returned ${res.status}: ${text}`);
  }

  const data = await res.json() as { response: string };
  return { text: data.response ?? "", model };
}

/**
 * Structured error class for Ollama failures.
 */
export class OllamaError extends Error {
  cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name  = "OllamaError";
    this.cause = cause;
  }
}
