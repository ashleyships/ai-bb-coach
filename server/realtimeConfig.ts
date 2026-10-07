import type { LessonSession } from "../src/types/LessonSession.ts";
import { buildStudentInstructions } from "./studentPrompt.ts";

// Teaching conversation tuning lives here, not in the browser lifecycle hook.
// Low eagerness allows longer unfinished explanations; clear endings can respond sooner.
export const teachingTurnDetection = {
  type: "semantic_vad",
  eagerness: "low",
  create_response: true,
  interrupt_response: false,
} as const;

export function buildRealtimeConfig(session: LessonSession, model?: string) {
  return {
    type: "realtime",
    model: model?.trim() || "gpt-realtime-2.1",
    instructions: buildStudentInstructions(session),
    output_modalities: ["audio"],
    audio: {
      input: {
        transcription: { model: "gpt-transcribe" },
        noise_reduction: { type: "near_field" },
        turn_detection: teachingTurnDetection,
      },
      output: { voice: "marin" },
    },
  };
}
