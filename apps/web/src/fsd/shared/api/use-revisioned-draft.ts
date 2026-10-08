import { useCallback, useMemo, useState } from "react"
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryFunction,
  type QueryKey,
} from "@tanstack/react-query"

import { ApiError } from "./api-client"

/**
 * How a save ended. The hook never surfaces the API's own error text — callers map these outcomes
 * to their own translated messages.
 * - `saved`: the server accepted the draft; its response is now the saved state.
 * - `conflict`: the server rejected the revision (409); the saved state was reloaded and the draft
 *   dropped.
 * - `error`: any other failure (including a failed reload after a conflict); the draft is kept.
 */
export type RevisionedDraftSaveOutcome = "saved" | "conflict" | "error"

export type UseRevisionedDraftOptions<
  TSaved extends { revision: number },
  TDraft,
  TKey extends QueryKey,
> = {
  /** Query for the saved state, e.g. `somethingQueries.current()`. */
  query: { queryKey: TKey; queryFn?: QueryFunction<TSaved, TKey> }
  enabled?: boolean
  /** Editable projection of the saved state. Normalise here so `isEqual` compares like with like. */
  toDraft: (saved: TSaved) => TDraft
  /** Request body for a save, carrying the revision the draft was based on. */
  toPayload: (draft: TDraft, saved: TSaved) => TSaved
  save: (payload: TSaved) => Promise<TSaved>
  isEqual?: (a: TDraft, b: TDraft) => boolean
}

/**
 * Draft editing over a revisioned server resource: the draft follows the saved state until the
 * first edit, `isDirty` is a structural comparison (so editing a value back counts as clean), and
 * saves handle the API's 409 revision conflict by reloading.
 */
export function useRevisionedDraft<
  TSaved extends { revision: number },
  TDraft,
  TKey extends QueryKey,
>({
  query: queryOptions,
  enabled = true,
  toDraft,
  toPayload,
  save: saveFn,
  isEqual = structurallyEqual,
}: UseRevisionedDraftOptions<TSaved, TDraft, TKey>) {
  const queryClient = useQueryClient()
  const query = useQuery({ ...queryOptions, enabled })
  const mutation = useMutation({
    mutationFn: (payload: TSaved) => saveFn(payload),
  })
  const [edited, setEdited] = useState<TDraft | null>(null)

  const savedDraft = useMemo(
    () => (query.data ? toDraft(query.data) : undefined),
    [query.data, toDraft]
  )
  const draft = edited ?? savedDraft
  const isDirty =
    edited !== null && savedDraft !== undefined && !isEqual(edited, savedDraft)

  const update = useCallback(
    (updater: (current: TDraft) => TDraft) => {
      setEdited((current) => {
        const base = current ?? savedDraft
        return base === undefined ? current : updater(base)
      })
    },
    [savedDraft]
  )

  const discard = useCallback(() => setEdited(null), [])

  const save = async (): Promise<RevisionedDraftSaveOutcome> => {
    if (!query.data || draft === undefined) return "error"
    try {
      const saved = await mutation.mutateAsync(toPayload(draft, query.data))
      queryClient.setQueryData<TSaved>(queryOptions.queryKey, saved)
      setEdited(null)
      return "saved"
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        try {
          await queryClient.fetchQuery({ ...queryOptions, staleTime: 0 })
          setEdited(null)
          mutation.reset()
          return "conflict"
        } catch {
          // The reload failed too; keep the draft and report a general failure.
        }
      }
      return "error"
    }
  }

  return {
    query,
    draft,
    isDirty,
    isSaving: mutation.isPending,
    update,
    discard,
    save,
  }
}

function structurallyEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    a === null ||
    b === null
  ) {
    return false
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  if (aKeys.length !== bKeys.length) return false
  return aKeys.every(
    (key) =>
      Object.hasOwn(b, key) &&
      structurallyEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
  )
}
