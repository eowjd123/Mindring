export * from './life-graph';

// 공통 API 응답 타입
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}