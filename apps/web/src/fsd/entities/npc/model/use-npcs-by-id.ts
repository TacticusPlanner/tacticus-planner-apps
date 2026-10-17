import { useCallback, useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { getNpcsMap } from "@workspace/game-catalog/queries"

import type { NpcRecord } from "./types"

export type NpcsByIdState =
  | { status: "loading"; retry: () => void }
  | { status: "error"; retry: () => void }
  | {
      status: "ready"
      data: ReadonlyMap<string, NpcRecord>
      retry: () => void
    }

type Settled =
  | { status: "ready"; data: ReadonlyMap<string, NpcRecord> }
  | { status: "error" }

/**
 * Every served NPC variation by id, from the synced `npcs` dataset. `useLiveQuery` throws a rejected
 * querier to the error boundary, so the read resolves a tagged result instead; `retry` re-issues it.
 */
export function useNpcsById(): NpcsByIdState {
  const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => setAttempt((value) => value + 1), [])
  const result = useLiveQuery(
    (): Promise<Settled> =>
      getNpcsMap().then(
        (data) => ({ status: "ready", data }),
        () => ({ status: "error" })
      ),
    [attempt]
  )
  if (!result) return { status: "loading", retry }
  return { ...result, retry }
}
