import { useMemo } from "react"
import type { UseQueryResult } from "@tanstack/react-query"

import type { ReadState } from "./use-read-state"

type QueryReadInput<T> = Pick<
  UseQueryResult<T>,
  "data" | "isError" | "isFetching" | "refetch"
>

/** `loading` while pending (or disabled before its first result) and while a retry refetches after
 *  a failure (TanStack keeps `isError` during it), `error` once it failed with no data, `ready`
 *  otherwise. */
function readStatus<T>({
  data,
  isError,
  isFetching,
}: QueryReadInput<T>): ReadState<T>["status"] {
  if (data !== undefined) return "ready"
  // Fetching wins over a previous failure: a retry is in flight.
  return isError && !isFetching ? "error" : "loading"
}

function toReadState<T>(
  status: ReadState<T>["status"],
  data: T | undefined,
  refetch: QueryReadInput<T>["refetch"]
): ReadState<T> {
  const retry = () => void refetch()
  return status === "ready" && data !== undefined
    ? { status, data, retry }
    : { status: status === "error" ? "error" : "loading", retry }
}

/** A server query as the shared `ReadState` (see `readStatus`); `retry` refetches. The value stays
 *  referentially stable while the status and data stay the same, so consumers can memoise on it. */
export function useQueryReadState<T>(query: QueryReadInput<T>): ReadState<T> {
  const status = readStatus(query)
  const { data, refetch } = query
  return useMemo(
    () => toReadState(status, data, refetch),
    [status, data, refetch]
  )
}
