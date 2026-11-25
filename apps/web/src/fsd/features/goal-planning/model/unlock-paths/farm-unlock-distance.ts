import type { FarmUnlockPath } from "./farm-unlock-paths"

/** How far a locked node is: battles to beat (its own track's plus the campaigns that must be
 *  cleared first), or "during the event" for a campaign event's node. */
export function farmUnlockDistance(
  path: FarmUnlockPath
): { kind: "event" } | { kind: "campaign"; battles: number; started: boolean } {
  if (path.kind === "event") return { kind: "event" }
  return {
    kind: "campaign",
    battles: path.prerequisiteBattles + path.battlesToGo,
    started: path.started,
  }
}
