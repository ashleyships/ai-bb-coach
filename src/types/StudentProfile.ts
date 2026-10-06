export const mbtiTypes = [
  "INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP",
] as const;

export type MbtiType = "" | (typeof mbtiTypes)[number];

export type StudentProfile = {
  id: string;
  alias: string;
  personality: string;
  // Only an explicitly supplied type belongs here. Never infer an MBTI type.
  // The wider profile remains the primary source for future roleplay behaviour.
  mbtiType?: MbtiType;
  church: string;
  healthAndHolidays: string;
  environment: string;
  companion: string;
  sproutSeeking: string;
  additionalInformation: string;
};
