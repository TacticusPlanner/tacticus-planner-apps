import { useEffect, useState } from "react"

import {
  getChunkData,
  type PlayerDataChunkKey,
  type PlayerDataChunkPayload,
} from "@workspace/player-data"

import { usePlayerDataStatus } from "./player-data-provider"

type ChunkState<K extends PlayerDataChunkKey> = {
  data: PlayerDataChunkPayload<K> | undefined
  loading: boolean
  error: string | null
}

/** Loads one player-data chunk from IndexedDB, refreshing whenever the sync status changes. */
export function usePlayerChunkRecords<K extends PlayerDataChunkKey>(
  chunkKey: K
) {
  const { status } = usePlayerDataStatus()
  const [state, setState] = useState<ChunkState<K>>({
    data: undefined,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    void getChunkData(chunkKey)
      .then((data) => {
        if (!cancelled) {
          setState({ data, loading: false, error: null })
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setState({
            data: undefined,
            loading: false,
            error: caught instanceof Error ? caught.message : String(caught),
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [chunkKey, status])

  return state
}
