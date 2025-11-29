/**
 * 퍼즐 점수 계산 유틸리티
 */

interface PuzzleScoreParams {
  difficulty: number; // 4, 9, 16, 36
  completionTime: number; // 초 단위
  moves: number; // 이동 횟수
}

/**
 * 난이도별 보너스 배수
 */
const DIFFICULTY_MULTIPLIER: Record<number, number> = {
  4: 1.0,   // 1단계
  9: 1.5,   // 2단계
  16: 2.0,  // 3단계
  36: 3.0,  // 4단계
};

const BASE_SCORE = 1000;
const TIME_PENALTY_RATE = 2; // 초당 2점 감점
const MOVE_PENALTY_RATE = 1; // 이동당 1점 감점

/**
 * 퍼즐 점수 계산
 * 
 * @param params 점수 계산 파라미터
 * @returns 계산된 점수 (최소 0점)
 */
export function calculatePuzzleScore(params: PuzzleScoreParams): number {
  const { difficulty, completionTime, moves } = params;
  
  // 난이도 보너스
  const multiplier = DIFFICULTY_MULTIPLIER[difficulty] || 1.0;
  
  // 기본 점수에 난이도 보너스 적용
  const baseScore = BASE_SCORE * multiplier;
  
  // 페널티 계산
  const timePenalty = completionTime * TIME_PENALTY_RATE;
  const movePenalty = moves * MOVE_PENALTY_RATE;
  
  // 최종 점수 계산 (최소 0점)
  const finalScore = Math.max(0, Math.floor(baseScore - timePenalty - movePenalty));
  
  return finalScore;
}

/**
 * 난이도 레이블 가져오기
 */
export function getDifficultyLabel(difficulty: number): string {
  const labels: Record<number, string> = {
    4: '1단계',
    9: '2단계',
    16: '3단계',
    36: '4단계',
  };
  return labels[difficulty] || `${difficulty}조각`;
}

/**
 * 시간 포맷팅 (초 → 분:초)
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}분 ${secs}초`;
}

