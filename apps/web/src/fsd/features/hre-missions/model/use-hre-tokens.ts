import type { PlayerDataChunkDto } from "@workspace/player-data"

import { usePlayerChunk } from "@/shared/local-data"

import type { HreTokenMode } from "./hre-objectives"

export type HreTokens = Record<HreTokenMode, number | null>

function toTokens(
  liveProgress: PlayerDataChunkDto<"live-progress"> | null
): HreTokens | null {
  const tokens = liveProgress?.gameModeTokens
  if (!tokens) return null
  return {
    arena: tokens.arena?.current ?? null,
    guildRaid: tokens.guildRaid?.tokens.current ?? null,
    onslaught: tokens.onslaught?.current ?? null,
    salvageRun: tokens.salvageRun?.current ?? null,
  }
}

/** The synced tokens per mode now (null bucket: not unlocked); null when nothing is synced or the
 *  read failed, undefined while it loads. */
export function useHreTokens(): HreTokens | null | undefined {
  const read = usePlayerChunk("live-progress", toTokens)
  if (read.status === "loading") return undefined
  return read.status === "ready" ? read.data : null
}
