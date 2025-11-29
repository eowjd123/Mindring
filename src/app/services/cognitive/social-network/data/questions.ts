// app/services/cognitive/social-network/data/questions.ts

export interface LSNSQuestion {
  id: number;
  question: string;
  category: string;
}

export const lsnsQuestions: LSNSQuestion[] = [
  {
    id: 1,
    question: "얼마나 많은 친척들이 당신과 정기적으로 연락을 주고받습니까?",
    category: "가족 관계",
  },
  {
    id: 2,
    question: "얼마나 많은 친척들이 당신에게 중요한 결정을 내릴 때 도움을 줄 수 있다고 느끼십니까?",
    category: "가족 관계",
  },
  {
    id: 3,
    question: "얼마나 많은 친척들이 당신이 아플 때 도움을 줄 수 있다고 느끼십니까?",
    category: "가족 관계",
  },
  {
    id: 4,
    question: "얼마나 많은 친구들이 당신과 정기적으로 연락을 주고받습니까?",
    category: "친구 관계",
  },
  {
    id: 5,
    question: "얼마나 많은 친구들이 당신에게 중요한 결정을 내릴 때 도움을 줄 수 있다고 느끼십니까?",
    category: "친구 관계",
  },
  {
    id: 6,
    question: "얼마나 많은 친구들이 당신이 아플 때 도움을 줄 수 있다고 느끼십니까?",
    category: "친구 관계",
  },
];

export const likertScaleOptions = [
  { value: 0, label: "0명", description: "없음" },
  { value: 1, label: "1명", description: "1명" },
  { value: 2, label: "2명", description: "2명" },
  { value: 3, label: "3~4명", description: "3~4명" },
  { value: 4, label: "5~8명", description: "5~8명" },
  { value: 5, label: "9명 이상", description: "9명 이상" },
];

