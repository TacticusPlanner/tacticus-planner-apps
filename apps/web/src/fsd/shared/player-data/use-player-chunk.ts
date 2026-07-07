import { useEffect, useState } from "react"

import {
  getChunkRecord,
  type PlayerDataChunkPayload,
  type SplitPlayerDataChunkKey,
} from "@workspace/player-data"

import { usePlayerDataStatus } from "./player-data-provider"

// Tags the fetched data with the id it belongs to, so a change to `id` can be recognized as "stale"
// purely by comparison during render (see usePlayerChunkRecord below) instead of needing a
// synchronous setState at the top of the effect to reset it — which a previous id's still-resolving
// fetch could otherwise race past, briefly surfacing that previous id's data as if it were the new
// id's.
type ChunkRecordState<K extends SplitPlayerDataChunkKey> = {
  id: string | undefined
  data: PlayerDataChunkPayload<K>[number] | undefined
  error: string | null
}

/**
 * Loads a single record from a split player-data chunk by its natural id, refreshing whenever the
 * sync status or the requested id changes — a cheaper read than pulling the whole chunk into memory
 * and filtering, for callers that only ever need one record (e.g. Character Lookup's currently
 * selected character). Pass `undefined` for `id` to skip the read entirely (e.g. while signed out, or
 * no character selected).
 */
export function usePlayerChunkRecord<K extends SplitPlayerDataChunkKey>(
  chunkKey: K,
  id: string | undefined
) {
  const { status } = usePlayerDataStatus()
  const [state, setState] = useState<ChunkRecordState<K>>({
    id: undefined,
    data: undefined,
    error: null,
  })

  useEffect(() => {
    // No synchronous setState here — an absent id has nothing to fetch, and the returned value below
    // is derived independently of `state` in that case anyway.
    if (id === undefined) {
      return
    }

    let cancelled = false

    void getChunkRecord(chunkKey, id)
      .then((data) => {
        if (!cancelled) {
          setState({ id, data, error: null })
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setState({
            id,
            data: undefined,
            error: caught instanceof Error ? caught.message : String(caught),
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [chunkKey, id, status])

  if (id === undefined) {
    return { data: undefined, loading: false, error: null }
  }

  // `state` still belongs to a previous id (or nothing has resolved yet) — a fetch for the current id
  // is in flight, so report loading rather than surfacing another id's data as if it were this one's.
  if (state.id !== id) {
    return { data: undefined, loading: true, error: null }
  }

  return { data: state.data, loading: false, error: state.error }
}
