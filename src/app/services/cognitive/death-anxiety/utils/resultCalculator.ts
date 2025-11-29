// app/services/cognitive/death-anxiety/utils/resultCalculator.ts

export interface DeathAnxietyResult {
  totalScore: number;
  maxScore: number;
  level: "low" | "medium" | "high";
  levelLabel: string;
  message: string;
  description: string;
  recommendations: string[];
  color: "green" | "yellow" | "red";
}

export function calculateDeathAnxietyResult(
  answers: { [key: number]: "yes" | "no" | null }
): DeathAnxietyResult {
  // Yes(1점) 답변 수 계산
  const yesCount = Object.values(answers).filter((answer) => answer === "yes").length;
  const totalScore = yesCount;
  const maxScore = 15;

  let level: "low" | "medium" | "high";
  let levelLabel: string;
  let message: string;
  let description: string;
  let recommendations: string[];
  let color: "green" | "yellow" | "red";

  if (totalScore <= 4) {
    level = "low";
    levelLabel = "낮은 수준";
    message = "죽음불안이 낮은 수준입니다";
    description = "현재 죽음에 대한 불안이 낮은 수준으로 나타났습니다. 이는 긍정적인 신호입니다.";
    color = "green";
    recommendations = [
      "현재의 마음가짐을 유지하세요.",
      "일상생활에서 의미 있는 활동을 계속하세요.",
      "가족이나 친구들과의 관계를 소중히 하세요.",
      "건강한 생활습관을 유지하세요.",
    ];
  } else if (totalScore <= 9) {
    level = "medium";
    levelLabel = "보통 수준";
    message = "죽음불안이 보통 수준입니다";
    description = "죽음에 대한 불안이 보통 수준으로 나타났습니다. 이는 자연스러운 반응일 수 있습니다.";
    color = "yellow";
    recommendations = [
      "죽음에 대한 생각을 긍정적으로 바꿔보세요.",
      "가족이나 신뢰할 수 있는 사람과 대화를 나누세요.",
      "명상이나 심호흡 등 스트레스 관리 방법을 시도해보세요.",
      "의미 있는 활동이나 취미에 집중하세요.",
      "필요하다면 전문 상담을 고려해보세요.",
    ];
  } else {
    level = "high";
    levelLabel = "높은 수준";
    message = "죽음불안이 높은 수준입니다";
    description = "죽음에 대한 불안이 높은 수준으로 나타났습니다. 전문적인 도움이 필요할 수 있습니다.";
    color = "red";
    recommendations = [
      "가능한 빨리 전문 상담사나 정신건강 전문의와 상담하세요.",
      "가족이나 신뢰할 수 있는 사람에게 도움을 요청하세요.",
      "죽음에 대한 생각을 다루는 심리 상담 프로그램을 고려해보세요.",
      "일상생활에서 즐거움을 느낄 수 있는 활동을 찾아보세요.",
      "규칙적인 생활 패턴을 유지하고 충분한 휴식을 취하세요.",
      "혼자 모든 것을 감당하려 하지 말고 주변의 도움을 받으세요.",
    ];
  }

  return {
    totalScore,
    maxScore,
    level,
    levelLabel,
    message,
    description,
    recommendations,
    color,
  };
}

export function getLevelColorClass(level: "low" | "medium" | "high"): string {
  switch (level) {
    case "low":
      return "bg-green-50 border-green-200 text-green-700";
    case "medium":
      return "bg-yellow-50 border-yellow-200 text-yellow-700";
    case "high":
      return "bg-red-50 border-red-200 text-red-700";
  }
}

export function getLevelGradient(level: "low" | "medium" | "high"): string {
  switch (level) {
    case "low":
      return "from-green-500 to-emerald-600";
    case "medium":
      return "from-yellow-500 to-amber-600";
    case "high":
      return "from-red-600 to-rose-700";
  }
}

