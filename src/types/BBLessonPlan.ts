import type { LessonId } from "./LessonSession.ts";

export type BBLessonPlanning = {
  lessonGoals: string[];
  confessionGoals: string[];
  weighingGoals: string[];
  actionGoals: string[];
};

// Examples illustrate concepts; they are optional alternatives, never required scripts.
export type BBLessonIntro = {
  goals?: string[];
  examples?: string[];
  scriptureReferences?: string[];
  buyHeart: string[];
  questionsToCheck: string[];
  piqueInterest: string[];
};

export type BBLessonBodySection = {
  id: string;
  title: string;
  goals?: string[];
  flow: string[];
  uproot?: string[];
  plant?: string[];
  examples?: string[];
  scriptureReferences?: string[];
  questionsToCheck?: string[];
};

export type BBLessonBody = {
  sections: BBLessonBodySection[];
};

export type BBLessonConclusion = {
  goals?: string[];
  examples?: string[];
  scriptureReferences?: string[];
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
// Named stages follow Intro → Body → Conclusion and the standard BB order within
// intro/conclusion. Body sections follow array order; wording is not a script.
// The reference transcript illustrates delivery; the plan defines the lesson.
export type BBLessonPlan = {
  id: LessonId;
  title: string;
  planning: BBLessonPlanning;
  scriptureReferences?: string[];
  flow: {
    referenceMaterials?: BBLessonReferenceMaterial[];
    intro: BBLessonIntro;
    body: BBLessonBody;
    conclusion: BBLessonConclusion;
  };
  referenceTranscript?: BBLessonReferenceTranscript;
};
