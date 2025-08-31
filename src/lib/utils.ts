// lib/utils.ts
export const normDeg = (deg: number): number => ((deg % 360) + 360) % 360;

type PlainObject = Record<string, unknown>;

/** 배열은 덮어쓰고, 객체는 재귀 병합 */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<unknown>
    ? T[K]                   // 배열은 병합하지 않고 patch 값으로 교체
    : T[K] extends PlainObject
      ? DeepPartial<T[K]>    // 객체는 재귀
      : T[K];                // 원시값 등은 교체
};

function isPlainObject(value: unknown): value is PlainObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * 타입 안전한 깊은 병합
 * - 배열: patch로 교체
 * - 객체: 재귀 병합
 * - 그 외: patch로 교체
 */
export function deepMerge<T extends PlainObject>(base: T, patch: DeepPartial<T>): T {
  const result: PlainObject = { ...base };

  (Object.keys(patch) as (keyof T)[]).forEach((key) => {
    const pVal = patch[key] as unknown;
    const bVal = base[key] as unknown;

    if (isPlainObject(bVal) && isPlainObject(pVal)) {
      result[key as string] = deepMerge(
        bVal as PlainObject,
        pVal as DeepPartial<PlainObject>
      );
    } else if (typeof pVal !== "undefined") {
      // 배열/원시/기타 타입은 patch 값으로 교체
      result[key as string] = pVal;
    }
  });

  return result as T;
}
