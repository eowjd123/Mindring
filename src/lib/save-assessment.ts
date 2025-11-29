// lib/save-assessment.ts
// 검사 결과 저장 유틸리티 함수

export interface SaveAssessmentParams {
  assessmentType: string;
  age?: number | null;
  gender?: string | null;
  testDate?: string;
  answers: any;
  totalScore?: number | null;
  averageScore?: number | null;
  percentage?: number | null;
  riskLevel?: string | null;
  interpretation?: string | null;
  message?: string | null;
  description?: string | null;
  recommendations?: string[] | null;
  categoryScores?: any;
  metadata?: any;
}

export async function saveAssessment(params: SaveAssessmentParams): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("/api/cognitive-assessments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        ...params,
        testDate: params.testDate || new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "검사 결과 저장에 실패했습니다.");
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to save assessment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "검사 결과 저장에 실패했습니다.",
    };
  }
}

