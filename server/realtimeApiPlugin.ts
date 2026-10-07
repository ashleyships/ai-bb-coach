import type { IncomingMessage, ServerResponse } from "node:http";
import { Buffer } from "node:buffer";
import type { Plugin } from "vite";
import { isLessonSession } from "../src/types/LessonSession.ts";
import { buildRealtimeConfig } from "./realtimeConfig.ts";

type Configuration = { apiKey?: string; model?: string };

export async function createRealtimeSession(input: unknown, config: Configuration, signal: AbortSignal) {
  if (typeof input !== "object" || !input || !("sdp" in input) ||
      typeof input.sdp !== "string" || !input.sdp.startsWith("v=0") || input.sdp.length > 65536 ||
      !("session" in input) || !isLessonSession(input.session)) {
    return { status: 400, body: { error: "Invalid lesson or connection request." } };
  }
  if (!config.apiKey?.trim()) return { status: 503, body: { error: "Realtime is not configured. Check the server API key." } };
  try {
    const form = new FormData();
    form.set("sdp", input.sdp);
    form.set("session", JSON.stringify(buildRealtimeConfig(input.session, config.model)));
    const response = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST", headers: { Authorization: `Bearer ${config.apiKey}` }, body: form,
      signal: AbortSignal.any([signal, AbortSignal.timeout(30_000)]),
    });
    if (!response.ok) throw new Error("Session creation failed");
    const sdp = await response.text();
    if (!sdp.startsWith("v=0")) throw new Error("Invalid answer");
    return { status: 200, body: { sdp } };
  } catch {
    return { status: 502, body: { error: "Unable to connect to the student. Please retry." } };
  }
}

export function realtimeApiPlugin(config: Configuration): Plugin {
  async function handle(request: IncomingMessage, response: ServerResponse, next: () => void) {
    if (request.url?.split("?")[0] !== "/api/realtime/session") return next();
    const send = (status: number, body: unknown) => {
      if (response.destroyed) return;
      response.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      response.end(JSON.stringify(body));
    };
    if (request.method !== "POST") {
      response.setHeader("Allow", "POST");
      return send(405, { error: "Use POST." });
    }
    if (request.headers["content-type"]?.split(";")[0] !== "application/json") return send(415, { error: "Expected JSON." });
    let input: unknown;
    try {
      const chunks: Buffer[] = [];
      let size = 0;
      for await (const chunk of request) {
        const buffer = Buffer.from(chunk);
        size += buffer.length;
        if (size > 256 * 1024) return send(413, { error: "Session request too large." });
        chunks.push(buffer);
      }
      input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch { return send(400, { error: "Invalid JSON." }); }
    const controller = new AbortController();
    const abort = () => controller.abort();
    response.on("close", abort);
    try {
      const result = await createRealtimeSession(input, config, controller.signal);
      if (!controller.signal.aborted) send(result.status, result.body);
    } finally { response.off("close", abort); }
  }
  return {
    name: "realtime-lesson-api",
    configureServer(server) { server.middlewares.use(handle); },
    configurePreviewServer(server) { server.middlewares.use(handle); },
  };
}
