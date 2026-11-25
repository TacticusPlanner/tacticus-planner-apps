import { useTranslation } from "react-i18next"
import type { BattleId } from "@workspace/game-domain"

import { farmUnlockDistance } from "./farm-unlock-distance"
import { useFarmUnlockPaths } from "./use-farm-unlock-paths"
import { useLockReasonText } from "./use-lock-reason-text"

/** A locked node that drops a resource, worded for a list: how far away it is and what else is in
 *  the way. */
export type LockedNode = {
  battleId: BattleId
  /** "7 battles to go", or "during the campaign event" for an event node. */
  distance: string
  /** Every other blocker, one line each (Power Level, missing heroes, a campaign to clear first). */
  notes: readonly string[]
}

/**
 * Resolves a resource (an upgrade id or `shard:<unit>`) to the locked nodes that drop it, closest
 * first, with their distance and blockers as text — the "Unlocks at" answer for lists that can't
 * render Goals' own lock-reason controls (the material details popover).
 */
export function useLockedNodes(): (resourceId: string) => LockedNode[] {
  const { t } = useTranslation()
  const pathsOf = useFarmUnlockPaths()
  const reasonText = useLockReasonText()
  return (resourceId: string) =>
    pathsOf(resourceId).map((path) => {
      const distance = farmUnlockDistance(path)
      return {
        battleId: path.battleId,
        distance:
          distance.kind === "event"
            ? t("goals.estimate.unlockDuringEvent")
            : t(
                distance.started
                  ? "goals.estimate.battlesToGo"
                  : "goals.estimate.battlesToGoNotStarted",
                { count: distance.battles }
              ),
        notes: path.kind === "campaign" ? path.lockReasons.map(reasonText) : [],
      }
    })
}
