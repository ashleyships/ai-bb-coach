import OpenAI from "openai";
import { randomUUID } from "node:crypto";
import { isLessonSession, type LessonMessage } from "../src/types/LessonSession.ts";
import { buildStudentInstructions } from "./studentPrompt.ts";

export type ResponseErrorCode = "INVALID_SESSION" | "NOT_CONFIGURED" | "AI_UNAVAILABLE" | "EMPTY_RESPONSE";
type Result = { status: number; body: { message: LessonMessage } | { code: ResponseErrorCode } };
type Configuration = { apiKey?: string; model?: string };
type ResponseClient = Pick<OpenAI, "responses">;

export async function generateStudentResponse(
  input: unknown,
  configuration: Configuration,
  // Injection keeps tests offline; production always uses the official SDK.
  client?: ResponseClient,
): Promise<Result> {
  if (!isLessonSession(input)
    || input.messages.length === 0
    || input.messages.at(-1)?.role !== "teacher"
    || input.messages.some((message) => !message.content.trim())) {
    return { status: 400, body: { code: "INVALID_SESSION" } };
  }
  if (!configuration.apiKey?.trim()) {
    return { status: 503, body: { code: "NOT_CONFIGURED" } };
  }

  try {
    const openai = client ?? new OpenAI({ apiKey: configuration.apiKey, timeout: 45_000, maxRetries: 0 });
    const response = await openai.responses.create({
      model: configuration.model?.trim() || "gpt-6-astra",
      instructions: buildStudentInstructions(input),
      // Replay the application's complete text transcript on every turn.
      input: input.messages.map((message) => ({
        role: message.role === "teacher" ? "user" as const : "assistant" as const,
        content: message.content,
      })),
      store: false,
    });
    const content = response.output_text?.trim();
    if (!content) return { status: 502, body: { code: "EMPTY_RESPONSE" } };
    return {
      status: 200,
      body: { message: { id: randomUUID(), role: "student", content, timestamp: Date.now() } },
    };
  } catch {
    // Never return provider errors, credentials, or profile details to the browser.
    return { status: 502, body: { code: "AI_UNAVAILABLE" } };
  }
}
