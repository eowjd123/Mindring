// app/services/cognitive/social-network/utils/resultCalculator.ts

export interface LSNSResult {
  totalScore: number;
  maxScore: number;
  level: "low" | "medium" | "high";
  levelLabel: string;
  message: string;
  description: string;
  recommendations: string[];
  color: "red" | "yellow" | "green";
  categoryScores?: {
    family: number;
    friends: number;
  };
}

export function calculateLSNSResult(
  answers: { [key: number]: number | null }
): LSNSResult {
  // 총점 계산 (0~30점)
  const scores = Object.values(answers).filter((a): a is number => a !== null);
  const totalScore = scores.reduce((sum, score) => sum + score, 0);
  const maxScore = 30;

  // 카테고리별 점수 계산
  const familyScores = [
    answers[1] ?? 0,
    answers[2] ?? 0,
    answers[3] ?? 0,
  ];
  const friendsScores = [
    answers[4] ?? 0,
    answers[5] ?? 0,
    answers[6] ?? 0,
  ];
  const familyTotal = familyScores.reduce((sum, score) => sum + score, 0);
  const friendsTotal = friendsScores.reduce((sum, score) => sum + score, 0);

  let level: "low" | "medium" | "high";
  let levelLabel: string;
  let message: string;
  let description: string;
  let recommendations: string[];
  let color: "red" | "yellow" | "green";

  if (totalScore <= 12) {
    level = "low";
    levelLabel = "낮은 수준 (사회적 고립 위험)";
    message = "사회적 관계망이 낮은 수준입니다";
    description = "현재 사회적 관계망이 낮은 수준으로 나타났습니다. 사회적 고립의 위험이 있을 수 있으므로 주의가 필요합니다.";
    color = "red";
    recommendations = [
      "가족이나 친척들과의 연락을 더 자주 해보세요.",
      "이웃이나 지역 커뮤니티 활동에 참여해보세요.",
      "취미나 관심사가 같은 사람들과 만날 기회를 만들어보세요.",
      "지역 센터나 복지관의 프로그램에 참여해보세요.",
      "전문 상담사나 사회복지사와 상담을 통해 사회적 관계 형성을 위한 도움을 받아보세요.",
      "작은 모임부터 시작하여 점진적으로 사회적 관계를 넓혀가세요.",
    ];
  } else if (totalScore <= 20) {
    level = "medium";
    levelLabel = "보통 수준";
    message = "사회적 관계망이 보통 수준입니다";
    description = "사회적 관계망이 보통 수준으로 나타났습니다. 현재 관계를 유지하면서 더 넓은 관계망을 형성해보시기 바랍니다.";
    color = "yellow";
    recommendations = [
      "현재의 사회적 관계를 소중히 유지하세요.",
      "새로운 사람들과 만날 기회를 만들어보세요.",
      "가족이나 친구들과의 정기적인 만남을 계획해보세요.",
      "지역 커뮤니티 활동이나 봉사활동에 참여해보세요.",
      "취미나 관심사를 공유하는 모임에 참여해보세요.",
    ];
  } else {
    level = "high";
    levelLabel = "높은 수준";
    message = "사회적 관계망이 높은 수준입니다";
    description = "사회적 관계망이 높은 수준으로 나타났습니다. 풍부한 사회적 지지 체계를 가지고 계시며, 이는 건강한 노후 생활에 매우 긍정적입니다.";
    color = "green";
    recommendations = [
      "현재의 풍부한 사회적 관계를 계속 유지하세요.",
      "다양한 사람들과의 관계를 소중히 하세요.",
      "가족과 친구들과의 정기적인 만남을 지속하세요.",
      "새로운 사람들에게도 관심을 가지고 관계를 확장해보세요.",
      "사회적 관계를 통해 얻는 지지와 도움을 적극 활용하세요.",
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
    categoryScores: {
      family: familyTotal,
      friends: friendsTotal,
    },
  };
}

export function getLevelColorClass(level: "low" | "medium" | "high"): string {
  switch (level) {
    case "low":
      return "bg-red-50 border-red-200 text-red-700";
    case "medium":
      return "bg-yellow-50 border-yellow-200 text-yellow-700";
    case "high":
      return "bg-green-50 border-green-200 text-green-700";
  }
}

export function getLevelGradient(level: "low" | "medium" | "high"): string {
  switch (level) {
    case "low":
      return "from-red-600 to-rose-700";
    case "medium":
      return "from-yellow-500 to-amber-600";
    case "high":
      return "from-green-500 to-emerald-600";
  }
}

