// utils/resultCalculator.ts
// 치매 검사 결과 계산 및 해석 유틸리티

export type RiskLevel = "normal" | "borderline" | "risk" | "high_risk";

export interface TestResult {
  score: number;
  riskLevel: RiskLevel;
  percentage: number;
  message: string;
  recommendations: string[];
  color: string;
  icon: string;
}

/**
 * 본인 치매 검사 결과 계산
 * @param answers - 질문별 답변 (예/아니오)
 * @returns 검사 결과
 */
export function calculateSelfTestResult(answers: { [key: number]: "yes" | "no" | null }): TestResult {
  const totalQuestions = 14;
  const yesCount = Object.values(answers).filter(a => a === "yes").length;
  const noCount = Object.values(answers).filter(a => a === "no").length;
  const answeredCount = yesCount + noCount;

  // 답변 비율 계산 (예 답변 비율이 높을수록 위험)
  const yesRatio = answeredCount > 0 ? yesCount / answeredCount : 0;
  const percentage = Math.round(yesRatio * 100);

  let riskLevel: RiskLevel;
  let message: string;
  let recommendations: string[];
  let color: string;
  let icon: string;

  // 평가 기준: 예 답변 수에 따른 위험도
  if (yesCount <= 3) {
    riskLevel = "normal";
    message = "인지 기능이 양호한 상태로 보입니다.";
    recommendations = [
      "규칙적인 운동과 건강한 식습관을 유지하세요.",
      "독서, 퍼즐, 취미 활동 등으로 뇌를 자주 사용하세요.",
      "정기적인 건강검진을 받으시기 바랍니다."
    ];
    color = "green";
    icon = "✓";
  } else if (yesCount <= 6) {
    riskLevel = "borderline";
    message = "인지 기능에 일부 변화가 있을 수 있습니다.";
    recommendations = [
      "인지 기능 개선을 위한 활동을 꾸준히 하세요.",
      "의료진과 상담하여 정기적인 모니터링을 받으시기 바랍니다.",
      "건강한 생활습관(운동, 식이, 수면)을 유지하세요.",
      "가족이나 주변 사람들과의 대화를 자주 나누세요."
    ];
    color = "yellow";
    icon = "⚠";
  } else if (yesCount <= 9) {
    riskLevel = "risk";
    message = "인지 기능 저하가 의심됩니다.";
    recommendations = [
      "가까운 병원의 신경과 또는 정신건강의학과를 방문하여 전문의 상담을 받으시기 바랍니다.",
      "정밀 검사를 통해 정확한 진단을 받으시기 바랍니다.",
      "가족 구성원과 함께 상담에 참석하시는 것을 권장합니다.",
      "인지 기능 개선 프로그램에 참여를 고려해보세요."
    ];
    color = "orange";
    icon = "⚠";
  } else {
    riskLevel = "high_risk";
    message = "인지 기능 저하가 우려됩니다.";
    recommendations = [
      "즉시 전문의 상담을 받으시기 바랍니다.",
      "신경과 또는 정신건강의학과 전문의와 상담하여 정밀 검사를 받으세요.",
      "가족 구성원과 함께 상담에 참석하시기 바랍니다.",
      "치매 조기 발견 및 관리 프로그램에 참여하시기 바랍니다.",
      "일상생활에서 안전사고 예방에 주의하세요."
    ];
    color = "red";
    icon = "⚠";
  }

  return {
    score: yesCount,
    riskLevel,
    percentage,
    message,
    recommendations,
    color,
    icon
  };
}

/**
 * 가족 치매 검사 결과 계산
 * @param answers - 질문별 답변 (0, 1, 2, 9)
 * @returns 검사 결과
 */
export function calculateFamilyTestResult(answers: { [key: number]: "0" | "1" | "2" | "9" | null }): TestResult {
  const totalQuestions = 15;
  
  // 9점(해당 없음)을 제외한 유효 답변만 계산
  const validAnswers = Object.values(answers).filter(
    (a): a is "0" | "1" | "2" => a !== null && a !== "9"
  );
  
  const validCount = validAnswers.length;
  
  if (validCount === 0) {
    return {
      score: 0,
      riskLevel: "normal",
      percentage: 0,
      message: "유효한 답변이 없어 결과를 산출할 수 없습니다.",
      recommendations: ["검사를 다시 진행해주세요."],
      color: "gray",
      icon: "?"
    };
  }

  // 점수 합계 계산 (0=0점, 1=1점, 2=2점)
  const totalScore = validAnswers.reduce((sum, answer) => {
    return sum + parseInt(answer);
  }, 0);

  // 평균 점수 계산 (0~2 범위)
  const averageScore = totalScore / validCount;
  
  // 백분율 계산 (0점=0%, 2점=100%)
  const percentage = Math.round((averageScore / 2) * 100);

  let riskLevel: RiskLevel;
  let message: string;
  let recommendations: string[];
  let color: string;
  let icon: string;

  // 평가 기준: 평균 점수에 따른 위험도
  // 0점 = 정상, 0.5점 = 경계, 1.0점 = 위험, 1.5점 이상 = 고위험
  if (averageScore <= 0.5) {
    riskLevel = "normal";
    message = "10년 전과 비교하여 인지 기능이 크게 변화하지 않은 것으로 보입니다.";
    recommendations = [
      "현재 상태를 유지하기 위해 규칙적인 운동과 건강한 식습관을 유지하세요.",
      "인지 기능 향상을 위한 활동(독서, 취미, 사회적 활동)을 지속하세요.",
      "정기적인 건강검진을 받으시기 바랍니다."
    ];
    color = "green";
    icon = "✓";
  } else if (averageScore <= 1.0) {
    riskLevel = "borderline";
    message = "10년 전과 비교하여 인지 기능에 일부 변화가 있는 것으로 보입니다.";
    recommendations = [
      "의료진과 상담하여 정기적인 모니터링을 받으시기 바랍니다.",
      "인지 기능 개선을 위한 활동을 꾸준히 하세요.",
      "건강한 생활습관(운동, 식이, 수면)을 유지하세요.",
      "가족 구성원의 관찰과 지원이 필요할 수 있습니다."
    ];
    color = "yellow";
    icon = "⚠";
  } else if (averageScore <= 1.5) {
    riskLevel = "risk";
    message = "10년 전과 비교하여 인지 기능 저하가 의심됩니다.";
    recommendations = [
      "가까운 병원의 신경과 또는 정신건강의학과를 방문하여 전문의 상담을 받으시기 바랍니다.",
      "정밀 검사(MMSE, MoCA 등)를 통해 정확한 진단을 받으시기 바랍니다.",
      "가족 구성원과 함께 상담에 참석하시는 것을 권장합니다.",
      "인지 기능 개선 프로그램에 참여를 고려해보세요.",
      "일상생활에서 안전사고 예방에 주의하세요."
    ];
    color = "orange";
    icon = "⚠";
  } else {
    riskLevel = "high_risk";
    message = "10년 전과 비교하여 인지 기능 저하가 우려됩니다.";
    recommendations = [
      "즉시 전문의 상담을 받으시기 바랍니다.",
      "신경과 또는 정신건강의학과 전문의와 상담하여 정밀 검사를 받으세요.",
      "가족 구성원과 함께 상담에 참석하시기 바랍니다.",
      "치매 조기 발견 및 관리 프로그램에 참여하시기 바랍니다.",
      "일상생활에서 안전사고 예방에 각별히 주의하세요.",
      "가족 구성원의 지속적인 관찰과 지원이 필요합니다."
    ];
    color = "red";
    icon = "⚠";
  }

  return {
    score: Math.round(averageScore * 10) / 10, // 소수점 첫째자리까지
    riskLevel,
    percentage,
    message,
    recommendations,
    color,
    icon
  };
}

/**
 * 위험도 레벨에 따른 한글 라벨
 */
export function getRiskLevelLabel(riskLevel: RiskLevel): string {
  const labels = {
    normal: "정상",
    borderline: "경계",
    risk: "위험",
    high_risk: "고위험"
  };
  return labels[riskLevel];
}

/**
 * 위험도 레벨에 따른 색상 클래스
 */
export function getRiskLevelColorClass(riskLevel: RiskLevel): string {
  const colors = {
    normal: "text-green-600 bg-green-50 border-green-200",
    borderline: "text-yellow-600 bg-yellow-50 border-yellow-200",
    risk: "text-orange-600 bg-orange-50 border-orange-200",
    high_risk: "text-red-600 bg-red-50 border-red-200"
  };
  return colors[riskLevel];
}

/**
 * 위험도 레벨에 따른 그라데이션 색상
 */
export function getRiskLevelGradient(riskLevel: RiskLevel): string {
  const gradients = {
    normal: "from-green-500 to-emerald-600",
    borderline: "from-yellow-500 to-amber-600",
    risk: "from-orange-500 to-red-600",
    high_risk: "from-red-600 to-rose-700"
  };
  return gradients[riskLevel];
}

