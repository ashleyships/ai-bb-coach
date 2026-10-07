import type { LessonId } from "./LessonSession.ts";

export type BBLessonPlanning = {
  lessonGoals: string[];
  confessionGoals: string[];
  weighingGoals: string[];
  actionGoals: string[];
};

export type BBLessonIntro = {
  buyHeart: string[];
  questionsToCheck: string[];
  piqueInterest: string[];
};

export type BBLessonBody = {
  flow: string[];
  uproot?: string[];
  plant?: string[];
  examples?: string[];
  scriptureReferences?: string[];
  questionsToCheck?: string[];
};

export type BBLessonConclusion = {
  questionsForConfession: string[];
  connectSprout?: string[];
  weighing?: string[];
  action?: string[];
  homework?: string[];
};

export type BBLessonReferenceMaterial = {
  title: string;
  description?: string;
  url?: string;
};

export type BBLessonReferenceTranscript = {
  sections: {
    id: string;
    title: string;
    content: string;
  }[];
};

// Arrays preserve the author's intended teaching and transcript order.
// The reference transcript illustrates delivery; the plan defines the lesson.
export type BBLessonPlan = {
  id: LessonId;
  title: string;
  planning: BBLessonPlanning;
  flow: {
    referenceMaterials?: BBLessonReferenceMaterial[];
    intro: BBLessonIntro;
    body: BBLessonBody;
    conclusion: BBLessonConclusion;
  };
  referenceTranscript?: BBLessonReferenceTranscript;
};
