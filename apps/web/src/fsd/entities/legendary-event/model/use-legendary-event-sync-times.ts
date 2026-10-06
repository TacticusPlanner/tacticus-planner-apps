import {
  getManifestMetadata,
  getPlayerDataMetadata,
} from "@workspace/player-data"

import { useReadState, type ReadState } from "./use-read-state"

export interface LegendaryEventSyncTimes {
  /** When player data last synced (the manifest's `syncedAt`), `null` before the first sync. */
  syncedAtMs: number | null
  /** When the `lre-progress` chunk was last downloaded, the instant its token timers were read. */
  progressObservedAtMs: number | null
}

function parse(value: string | undefined): number | null {
  if (!value) return null
  const ms = Date.parse(value)
  return Number.isNaN(ms) ? null : ms
}

/** The player-data sync times the Run status needs, with the same loading / error channel as the
 *  other reads so a failed metadata read degrades instead of throwing to the error boundary. */
export function useLegendaryEventSyncTimes(): ReadState<LegendaryEventSyncTimes> {
  return useReadState(async () => {
    const metadata = await getPlayerDataMetadata()
    return {
      syncedAtMs: parse(getManifestMetadata(metadata)?.updatedAt),
      progressObservedAtMs: parse(metadata.get("lre-progress")?.updatedAt),
    }
  }, [])
}
