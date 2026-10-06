import type { LessonMessage, LessonSession } from "../types/LessonSession";

const errorMessages: Record<string, string> = {
  INVALID_SESSION: "This lesson session is incomplete. Return to Practice Setup and begin again.",
  NOT_CONFIGURED: "The student simulator is not configured yet. Add the server API key and restart the app.",
  AI_UNAVAILABLE: "The student could not respond right now. Please try again.",
  EMPTY_RESPONSE: "The student returned an empty response. Please try again.",
  REQUEST_TOO_LARGE: "This conversation is too long to send. Please begin a new lesson.",
};

export async function requestStudentResponse(session: LessonSession, signal: AbortSignal): Promise<LessonMessage> {
  const response = await fetch("/api/student-response", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(session),
    signal,
  });
  const data: unknown = await response.json();
  if (!response.ok) {
    const code = typeof data === "object" && data !== null && "code" in data && typeof data.code === "string"
      ? data.code : "AI_UNAVAILABLE";
    throw new Error(errorMessages[code] ?? errorMessages.AI_UNAVAILABLE);
  }
  if (typeof data !== "object" || data === null || !("message" in data)) {
    throw new Error("The student response could not be read. Please try again.");
  }
  const message = data.message;
  if (typeof message !== "object" || message === null
    || !("id" in message) || typeof message.id !== "string" || !message.id
    || !("role" in message) || message.role !== "student"
    || !("content" in message) || typeof message.content !== "string" || !message.content.trim()
    || !("timestamp" in message) || typeof message.timestamp !== "number" || !Number.isFinite(message.timestamp)) {
    throw new Error("The student response could not be read. Please try again.");
  }
  return { id: message.id, role: "student", content: message.content, timestamp: message.timestamp };
}
