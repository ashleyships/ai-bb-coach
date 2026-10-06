import OpenAI, { toFile } from "openai";
import { Buffer } from "node:buffer";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const extensions: Record<string, string> = {
  "audio/webm": "webm", "audio/mp4": "mp4", "audio/ogg": "ogg",
};

type Configuration = { apiKey?: string; model?: string };
type TranscriptionClient = Pick<OpenAI, "audio">;

export async function transcribeAudio(
  audio: Buffer,
  mimeType: string,
  configuration: Configuration,
  client?: TranscriptionClient,
) {
  if (!Object.hasOwn(extensions, mimeType)) return { status: 415, body: { code: "UNSUPPORTED_AUDIO" } };
  if (!audio.length) return { status: 400, body: { code: "EMPTY_AUDIO" } };
  if (audio.length > MAX_AUDIO_BYTES) return { status: 413, body: { code: "AUDIO_TOO_LARGE" } };
  if (!configuration.apiKey?.trim()) return { status: 503, body: { code: "NOT_CONFIGURED" } };
  try {
    const openai = client ?? new OpenAI({ apiKey: configuration.apiKey, timeout: 45_000, maxRetries: 0 });
    const file = await toFile(audio, `recording.${extensions[mimeType]}`, { type: mimeType });
    const result = await openai.audio.transcriptions.create({
      file, model: configuration.model?.trim() || "gpt-transcribe", response_format: "json",
    });
    const text = result.text?.trim();
    if (!text) return { status: 422, body: { code: "NO_SPEECH" } };
    return { status: 200, body: { text } };
  } catch {
    return { status: 502, body: { code: "TRANSCRIPTION_FAILED" } };
  }
}

export function transcriptionApiPlugin(configuration: Configuration): Plugin {
  async function handleRequest(request: IncomingMessage, response: ServerResponse, next: () => void) {
    if (request.url?.split("?")[0] !== "/api/transcribe") return next();
    const send = (status: number, body: unknown) => {
      response.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      response.end(JSON.stringify(body));
    };
    if (request.method !== "POST") {
      response.setHeader("Allow", "POST");
      return send(405, { code: "UNSUPPORTED_AUDIO" });
    }
    const mimeType = request.headers["content-type"]?.split(";")[0].trim().toLowerCase() ?? "";
    if (!Object.hasOwn(extensions, mimeType)) return send(415, { code: "UNSUPPORTED_AUDIO" });
    const chunks: Buffer[] = [];
    let bytes = 0;
    try {
      for await (const chunk of request) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        bytes += buffer.length;
        if (bytes > MAX_AUDIO_BYTES) return send(413, { code: "AUDIO_TOO_LARGE" });
        chunks.push(buffer);
      }
    } catch {
      return send(400, { code: "EMPTY_AUDIO" });
    }
    const result = await transcribeAudio(Buffer.concat(chunks), mimeType, configuration);
    send(result.status, result.body);
  }
  return {
    name: "teacher-transcription-api",
    configureServer(server) { server.middlewares.use(handleRequest); },
    configurePreviewServer(server) { server.middlewares.use(handleRequest); },
  };
}
