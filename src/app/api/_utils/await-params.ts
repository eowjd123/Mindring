// app/api/_utils/await-params.ts
export type ParamsOrPromise<T> = T | Promise<T>;
export type Ctx<T> = { params: ParamsOrPromise<T> };

export async function awaitParams<T>(ctx: Ctx<T>): Promise<T> {
  const p = (ctx as { params: unknown }).params as unknown;
  return typeof (p as { then?: unknown }).then === 'function' ? await (p as Promise<T>) : (p as T);
}
