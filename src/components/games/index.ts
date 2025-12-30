/**
 * index.ts - Games Components Export
 * 모든 게임 컴포넌트를 한곳에서 export
 */

export { GameLayout } from "./GameLayout";
export { AssessmentProgress } from "./AssessmentProgress";
export { UserInfoForm } from "./UserInfoForm";
export { QuestionForm } from "./QuestionForm";
export { LikertScaleForm } from "./LikertScaleForm";
export { IntroScreen } from "./IntroScreen";
export { ResultDisplay } from "./ResultDisplay";
export { GameCard, type GameStatus } from "./GameCard";

// 타입 export
export interface Question {
  id: number;
  question: string;
  description?: string;
}

export interface YesNoQuestion extends Question {
  positiveAnswer: "yes" | "no";
}

export interface LikertQuestion extends Question {
  category?: string;
}

export interface UserInfo {
  age: string;
  gender: "" | "male" | "female";
  date: string;
}
