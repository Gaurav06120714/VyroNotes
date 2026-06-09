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

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function* streamChat(
  messages: OllamaMessage[],
  options?: { model?: string; signal?: AbortSignal }
): AsyncGenerator<string, void, unknown> {
  const model  = options?.model ?? PRIMARY_MODEL;
  const signal = options?.signal;

  let res: Response | undefined;
  let lastErr: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) {
      await sleep(1000);
      if (signal?.aborted) return;
    }
    try {
      res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, stream: true }),
        signal,
      });
      lastErr = null;
      break;
    } catch (err) {
      lastErr = err;
      if (err instanceof Error && err.name === "AbortError") throw err;
      
    }
  }

  if (lastErr || !res) {
    throw new OllamaError("Failed to connect to Ollama. Is it running?", lastErr);
  }

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
          
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function generate(
  prompt: string,
  options?: { model?: string; system?: string; signal?: AbortSignal }
): Promise<{ text: string; model: string }> {
  const model  = options?.model ?? PRIMARY_MODEL;
  const signal = options?.signal;

  let res: Response | undefined;
  let lastErr: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) {
      await sleep(1000);
      if (signal?.aborted) throw new OllamaError("Aborted");
    }
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
      lastErr = null;
      break;
    } catch (err) {
      lastErr = err;
      if (err instanceof Error && err.name === "AbortError") throw err;
    }
  }

  if (lastErr || !res) {
    throw new OllamaError("Failed to connect to Ollama.", lastErr);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new OllamaError(`Ollama returned ${res.status}: ${text}`);
  }

  const data = await res.json() as { response: string };
  return { text: data.response ?? "", model };
}

export class OllamaError extends Error {
  cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name  = "OllamaError";
    this.cause = cause;
  }
}
