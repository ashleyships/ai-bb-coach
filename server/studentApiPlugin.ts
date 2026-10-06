import { Buffer } from "node:buffer";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import { generateStudentResponse } from "./studentResponse.ts";

const MAX_BODY_BYTES = 256 * 1024;

export function studentApiPlugin(configuration: { apiKey?: string; model?: string }): Plugin {
  async function handleRequest(request: IncomingMessage, response: ServerResponse, next: () => void) {
    if (request.url?.split("?")[0] !== "/api/student-response") return next();
    const send = (status: number, body: unknown) => {
      response.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      response.end(JSON.stringify(body));
    };
    if (request.method !== "POST") {
      response.setHeader("Allow", "POST");
      return send(405, { code: "INVALID_SESSION" });
    }
    if (!request.headers["content-type"]?.startsWith("application/json")) {
      return send(415, { code: "INVALID_SESSION" });
    }
    let input: unknown;
    try {
      const chunks: Buffer[] = [];
      let bytes = 0;
      for await (const chunk of request) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        bytes += buffer.length;
        if (bytes > MAX_BODY_BYTES) return send(413, { code: "REQUEST_TOO_LARGE" });
        chunks.push(buffer);
      }
      input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      return send(400, { code: "INVALID_SESSION" });
    }
    const result = await generateStudentResponse(input, configuration);
    send(result.status, result.body);
  }

  return {
    name: "student-simulation-api",
    configureServer(server) { server.middlewares.use(handleRequest); },
    configurePreviewServer(server) { server.middlewares.use(handleRequest); },
  };
}
