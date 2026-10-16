import type { UseQueryResult } from "@tanstack/react-query"

import type { ReadState } from "./use-read-state"

/** A server query as the shared `ReadState`: `loading` while pending (or disabled before its first
 *  result), `error` once it failed with no data, `ready` otherwise. `retry` refetches. */
export function queryReadState<T>(
  query: Pick<UseQueryResult<T>, "data" | "isError" | "refetch">
): ReadState<T> {
  const retry = () => void query.refetch()
  if (query.data !== undefined) {
    return { status: "ready", data: query.data, retry }
  }
  return query.isError
    ? { status: "error", retry }
    : { status: "loading", retry }
}
