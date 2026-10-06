import { lessonLabels, difficultyLabels, sectionLabels } from "../data/practiceOptions";
import { mbtiTypes, type StudentProfile } from "./StudentProfile";

export type LessonId = keyof typeof lessonLabels;
export type Difficulty = keyof typeof difficultyLabels;
export type Section = keyof typeof sectionLabels;
export type PracticeScope = "full" | "section";

export type LessonMessage = {
  id: string;
  role: "teacher" | "student";
  content: string;
  timestamp: number;
};

export type LessonSession = {
  id: string;
  lessonId: LessonId;
  student: StudentProfile;
  difficulty: Difficulty;
  messages: LessonMessage[];
} & (
  | { practiceScope: "full"; selectedSection?: never }
  | { practiceScope: "section"; selectedSection: Section }
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStudentProfile(value: unknown): value is StudentProfile {
  if (!isRecord(value)) return false;
  const fields = ["id", "alias", "personality", "church", "healthAndHolidays",
    "environment", "companion", "sproutSeeking", "additionalInformation"];
  return fields.every((key) => typeof value[key] === "string")
    && value.id !== "" && value.alias !== ""
    && (value.mbtiType === undefined || value.mbtiType === ""
      || mbtiTypes.some((type) => type === value.mbtiType));
}

function isLessonMessage(value: unknown): value is LessonMessage {
  return isRecord(value)
    && typeof value.id === "string" && value.id !== ""
    && (value.role === "teacher" || value.role === "student")
    && typeof value.content === "string"
    && typeof value.timestamp === "number" && Number.isFinite(value.timestamp);
}

// Router state may be missing or malformed, so validate it before rendering.
export function isLessonSession(value: unknown): value is LessonSession {
  if (!isRecord(value)) return false;
  return typeof value.id === "string" && value.id !== ""
    && typeof value.lessonId === "string" && Object.hasOwn(lessonLabels, value.lessonId)
    && typeof value.difficulty === "string" && Object.hasOwn(difficultyLabels, value.difficulty)
    && isStudentProfile(value.student)
    && Array.isArray(value.messages) && value.messages.every(isLessonMessage)
    && ((value.practiceScope === "full" && value.selectedSection === undefined)
      || (value.practiceScope === "section" && typeof value.selectedSection === "string"
        && Object.hasOwn(sectionLabels, value.selectedSection)));
}
