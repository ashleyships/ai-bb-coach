import OpenAI from "openai";
import { Buffer } from "node:buffer";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

type Configuration = { apiKey?: string; model?: string };
type SpeechResult = { status: number; body: { code: string } | Buffer };

export async function generateSpeech(
  input: unknown,
  configuration: Configuration,
  signal?: AbortSignal,
  client?: Pick<OpenAI, "audio">,
): Promise<SpeechResult> {
  if (typeof input !== "object" || input === null || !("text" in input) ||
      typeof input.text !== "string" || !input.text.trim() || input.text.length > 4096) {
    return { status: 400, body: { code: "INVALID_TEXT" } };
  }
  if (!configuration.apiKey?.trim()) return { status: 503, body: { code: "NOT_CONFIGURED" } };
  try {
    const openai = client ?? new OpenAI({ apiKey: configuration.apiKey, timeout: 45_000, maxRetries: 0 });
    const audio = await openai.audio.speech.create({
      model: configuration.model?.trim() || "gpt-4o-mini-tts",
      voice: "marin",
      input: input.text,
      response_format: "mp3",
    }, { signal });
    const body = Buffer.from(await audio.arrayBuffer());
    if (!body.length) throw new Error("Empty audio");
    return { status: 200, body };
  } catch {
    return { status: 502, body: { code: "SPEECH_FAILED" } };
  }
}

export function speechApiPlugin(configuration: Configuration): Plugin {
  async function handleRequest(request: IncomingMessage, response: ServerResponse, next: () => void) {
    if (request.url?.split("?")[0] !== "/api/speech") return next();
    const sendError = (status: number, code: string) => {
      response.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      response.end(JSON.stringify({ code }));
    };
    if (request.method !== "POST") {
      response.setHeader("Allow", "POST");
      return sendError(405, "INVALID_TEXT");
    }
    if (request.headers["content-type"]?.split(";")[0].trim().toLowerCase() !== "application/json") {
      return sendError(415, "INVALID_TEXT");
    }
    let input: unknown;
    try {
      const chunks: Buffer[] = [];
      let bytes = 0;
      for await (const chunk of request) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        bytes += buffer.length;
        if (bytes > 32 * 1024) return sendError(413, "INVALID_TEXT");
        chunks.push(buffer);
      }
      input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      return sendError(400, "INVALID_TEXT");
    }
    const controller = new AbortController();
    const abort = () => controller.abort();
    response.on("close", abort);
    try {
      const result = await generateSpeech(input, configuration, controller.signal);
      if (response.destroyed || controller.signal.aborted) return;
      if (!Buffer.isBuffer(result.body)) return sendError(result.status, result.body.code);
      response.writeHead(200, { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" });
      response.end(result.body);
    } finally {
      response.off("close", abort);
    }
  }
  return {
    name: "student-speech-api",
    configureServer(server) { server.middlewares.use(handleRequest); },
    configurePreviewServer(server) { server.middlewares.use(handleRequest); },
  };
}
