import { useEffect, useRef, useState } from "react";
import { requestStudentResponse } from "../api/studentResponse";
import type { LessonMessage, LessonSession } from "../types/LessonSession";

export function useLessonConversation(initialSession: LessonSession | null) {
  const [session, setSession] = useState(initialSession);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [failedSession, setFailedSession] = useState<LessonSession | null>(null);
  const pendingRequest = useRef<AbortController | null>(null);

  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      pendingRequest.current?.abort();
    };
  }, []);

  async function receiveStudentReply(updatedSession: LessonSession) {
    if (pendingRequest.current) return;
    const controller = new AbortController();
    pendingRequest.current = controller;
    setIsSending(true);
    setError("");
    const timeout = setTimeout(() => controller.abort(), 60_000);
    try {
      const message = await requestStudentResponse(updatedSession, controller.signal);
      if (controller.signal.aborted) return;
      setSession({ ...updatedSession, messages: [...updatedSession.messages, message] });
      setFailedSession(null);
    } catch (cause) {
      if (!active.current) return;
      setFailedSession(updatedSession);
      setError(controller.signal.aborted
        ? "The request timed out. Please try again."
        : cause instanceof Error && !(cause instanceof TypeError) && !(cause instanceof SyntaxError)
          ? cause.message
          : "Unable to reach the student simulator. Check your connection and try again.");
    } finally {
      clearTimeout(timeout);
      pendingRequest.current = null;
      if (active.current) setIsSending(false);
    }
  }

  function sendMessage() {
    const content = draft.trim();
    if (!session || !content || pendingRequest.current || failedSession) return;
    const message: LessonMessage = { id: crypto.randomUUID(), role: "teacher", content, timestamp: Date.now() };
    const updatedSession = { ...session, messages: [...session.messages, message] };
    setSession(updatedSession);
    setDraft("");
    void receiveStudentReply(updatedSession);
  }

  function retryResponse() {
    if (failedSession && !pendingRequest.current) void receiveStudentReply(failedSession);
  }

  return { session, draft, setDraft, isSending, error, canRetry: failedSession !== null, sendMessage, retryResponse };
}
