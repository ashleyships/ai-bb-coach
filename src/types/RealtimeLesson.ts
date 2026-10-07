import type { LessonMessage, LessonSession } from "./LessonSession";

export type RealtimeStatus = "connecting" | "listening" | "thinking" | "speaking" | "error" | "ended";
export type TranscriptEntry = LessonMessage & {
  previousId?: string | null;
  playback?: "playing" | "finished" | "interrupted";
  status: "pending" | "complete" | "incomplete" | "failed";
};
export type RealtimeLesson = {
  session: LessonSession;
  transcript: TranscriptEntry[];
  startedAt: number | null;
  endedAt: number | null;
};
export type RealtimeView = {
  status: RealtimeStatus;
  teacherMuted: boolean;
  microphoneSuppressed: boolean;
  microphoneUnavailable: boolean;
  error: string;
};
export type PracticeFlowContext = {
  lessons: Record<string, RealtimeLesson>;
  saveLesson: (lesson: RealtimeLesson) => void;
};
