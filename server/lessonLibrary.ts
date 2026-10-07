import type { BBLessonPlan } from "../src/types/BBLessonPlan.ts";
import { treeByStreams } from "./data/lessons/treeByStreams.ts";

// Keep detailed lesson content on the server, separate from browser options.
const lessons: BBLessonPlan[] = [treeByStreams];

export function getLessonById(id: string): BBLessonPlan | undefined {
  return lessons.find((lesson) => lesson.id === id);
}
