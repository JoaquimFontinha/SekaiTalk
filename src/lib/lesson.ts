export type StepType =
  | "INTRO"
  | "TRUE_FALSE"
  | "COMPLETE_WORD"
  | "CHOOSE_ANSWER"
  | "MATCH_PAIRS"
  | "CULTURE_NOTE";

export type IntroStepData = {
  word: string;
  kana?: string;
  romaji: string;
  translation: string;
  example?: string;
};

export type TrueFalseStepData = {
  statement: string;
  isTrue: boolean;
  explanation: string;
  word?: string;
};

export type ChooseAnswerStepData = {
  question: string;
  choices: { text: string; subtext?: string; isCorrect: boolean }[];
  explanation: string;
  translation?: string;
};

export type CompleteWordStepData = {
  question: string;
  prefix?: string;
  suffix?: string;
  answer: string;
  choices: string[];
  explanation: string;
  translation: string;
};

export type MatchPairsStepData = {
  pairs: { left: string; right: string }[];
};

export type CultureNoteStepData = {
  title: string;
  text: string;
  vocab?: { word: string; kana?: string; translation: string }[];
};

export type AnyStepData =
  | IntroStepData
  | TrueFalseStepData
  | ChooseAnswerStepData
  | CompleteWordStepData
  | MatchPairsStepData
  | CultureNoteStepData;

export type LessonStepFull = {
  id: string;
  order: number;
  type: StepType;
  data: AnyStepData;
};

export type LessonWithProgress = {
  id: string;
  poiId: string;
  title: string;
  description: string | null;
  steps: LessonStepFull[];
  userProgress: {
    score: number;
    validated: boolean;
    completedAt: string | null;
  } | null;
};

export const SCORED_TYPES: StepType[] = [
  "TRUE_FALSE",
  "CHOOSE_ANSWER",
  "COMPLETE_WORD",
  "MATCH_PAIRS",
];
