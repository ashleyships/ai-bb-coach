import type { LessonSession } from "../types/LessonSession";

export async function requestRealtimeSession(sdp: string, session: LessonSession, signal: AbortSignal): Promise<string> {
  const response = await fetch("/api/realtime/session", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sdp, session }), signal,
  });
  const data: unknown = await response.json();
  if (!response.ok || !data || typeof data !== "object" || !("sdp" in data) ||
      typeof data.sdp !== "string" || !data.sdp.startsWith("v=0")) {
    throw new Error("Unable to create the realtime session. Check server configuration and retry.");
  }
  return data.sdp;
}
