import { useEffect, useRef, useState } from "react";
import { createRealtimeLesson } from "../services/realtimeLesson";
import type { LessonSession } from "../types/LessonSession";
import type { RealtimeLesson, RealtimeView } from "../types/RealtimeLesson";

export function useRealtimeLesson(session: LessonSession, saveLesson: (lesson: RealtimeLesson) => void) {
  const [view, setView] = useState<RealtimeView>({ status: "connecting", teacherMuted: false, microphoneSuppressed: false, microphoneUnavailable: false, error: "" });
  const [lesson, setLesson] = useState<RealtimeLesson>({ session: { ...session, messages: [] }, transcript: [], startedAt: null, endedAt: null });
  const [attempt, setAttempt] = useState(0);
  const latest = useRef(lesson);
  const muted = useRef(false);
  const controller = useRef<ReturnType<typeof createRealtimeLesson> | null>(null);

  useEffect(() => {
    let active = true;
    const connection = createRealtimeLesson({ ...latest.current, endedAt: null }, next => {
      if (!active) return;
      muted.current = next.teacherMuted;
      setView(next);
    }, next => {
      latest.current = next;
      saveLesson(next);
      if (active) setLesson(next);
    }, muted.current);
    controller.current = connection;
    // Deferring also prevents StrictMode's discarded mount from requesting a microphone.
    void Promise.resolve().then(() => { if (active) void connection.start(); });
    return () => { active = false; connection.end(); };
  }, [attempt, saveLesson]);

  return { view, lesson, end: () => controller.current?.end(), toggleMute: () => controller.current?.toggleMute(), retry: () => setAttempt(value => value + 1) };
}
