import { useQuery } from "@tanstack/react-query"

import { useQueryReadState } from "./use-query-read-state"

/** A local read's state: `loading` until the first result, then `ready` or `error`. */
export type ReadState<T> =
  | { status: "loading"; retry: () => void }
  | { status: "error"; retry: () => void }
  | { status: "ready"; data: T; retry: () => void }

/** A local read that has not settled by then is reported as failed (and offered a retry). */
export const localReadTimeoutMs = 15_000

export class LocalReadTimeoutError extends Error {
  constructor() {
    super(`Local read did not settle within ${localReadTimeoutMs} ms.`)
    this.name = "LocalReadTimeoutError"
  }
}

export function withReadTimeout<T>(read: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new LocalReadTimeoutError()),
      localReadTimeoutMs
    )
  })
  return Promise.race([read, timeout]).finally(() => clearTimeout(timer))
}

/** Local reads are refreshed by sync invalidation only. A transient failure retries once; a
 *  timeout does not, so a stuck read is reported after `localReadTimeoutMs`, not twice that. */
export const localReadQueryOptions = {
  staleTime: Infinity,
  gcTime: Infinity,
  retry: (failureCount: number, error: unknown) =>
    failureCount < 1 && !(error instanceof LocalReadTimeoutError),
} as const

/**
 * A composite local read (one that combines several datasets or computes over them) as a cached
 * query keyed `["local", "composite", name, ...deps]`; every sync invalidates that prefix. `deps`
 * must be plain values (ids, numbers) since they are part of the query key. `retry` re-issues it.
 */
export function useReadState<T>(
  name: string,
  querier: () => Promise<T>,
  deps: readonly (string | number | boolean | null | undefined)[]
): ReadState<T> {
  const query = useQuery({
    queryKey: ["local", "composite", name, ...deps],
    // TanStack rejects `undefined` data; a querier with nothing to return resolves null.
    queryFn: async () => (await withReadTimeout(querier())) ?? null,
    ...localReadQueryOptions,
  })
  return useQueryReadState(query) as ReadState<T>
}

type ReadyData<S> = S extends { status: "ready"; data: infer T } ? T : never

/** `loading` if any read is loading, else `error` (retrying every failed read) if any failed,
 *  else `ready` with every read's data in order. */
export function combineReadStates<S extends readonly ReadState<unknown>[]>(
  ...states: S
): ReadState<{ [I in keyof S]: ReadyData<S[I]> }> {
  const retry = () => {
    for (const state of states) if (state.status === "error") state.retry()
  }
  if (states.some((state) => state.status === "loading")) {
    return { status: "loading", retry }
  }
  if (states.some((state) => state.status === "error")) {
    return { status: "error", retry }
  }
  const data = states.map((state) =>
    state.status === "ready" ? state.data : undefined
  ) as { [I in keyof S]: ReadyData<S[I]> }
  return { status: "ready", data, retry }
}
