import { useLiveQuery } from "dexie-react-hooks"
import { getLiveProgress } from "@workspace/player-data/queries"

import type { HreTokenMode } from "./hre-objectives"

export type HreTokens = Record<HreTokenMode, number | null>

// `useLiveQuery` has no error channel, so a failed read resolves to "not synced".
async function readTokens(): Promise<HreTokens | null> {
  try {
    const tokens = (await getLiveProgress())?.gameModeTokens
    if (!tokens) return null
    return {
      arena: tokens.arena?.current ?? null,
      guildRaid: tokens.guildRaid?.tokens.current ?? null,
      onslaught: tokens.onslaught?.current ?? null,
      salvageRun: tokens.salvageRun?.current ?? null,
    }
  } catch {
    return null
  }
}

/** The synced tokens per mode now (null bucket: not unlocked); null when nothing is synced. */
export function useHreTokens(): HreTokens | null | undefined {
  return useLiveQuery(readTokens, [])
}
