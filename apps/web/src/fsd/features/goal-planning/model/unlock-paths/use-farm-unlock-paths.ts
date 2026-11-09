import { useCallback } from "react"
import { campaignDescriptor, campaignIcon } from "@workspace/game-catalog"
import type { BattleId, UpgradeId } from "@workspace/game-domain"

import { useCampaignDisplay, type FarmLocation } from "@/shared/lib"

import { useGoalCatalog } from "../shared/use-goal-catalog"
import { farmUnlockPaths, type FarmUnlockPath } from "./farm-unlock-paths"

/** A `FarmUnlockPath` with the node's display labels, as `CampaignLocationName` renders them. */
export type FarmUnlockPathViewModel = FarmUnlockPath & {
  campaignName: string
  nodeLabel: string
  difficultyLabel?: string
  icon?: string
}

const noBattles = new Map()
const noProgress = new Map()

/**
 * Resolves a blocked resource (an upgrade id or `shard:<unit>`) to the locked nodes that drop it,
 * closest first (see `farmUnlockPaths`), labelled for display. Empty until the catalog loads.
 */
export function useFarmUnlockPaths(): (
  resourceId: string
) => FarmUnlockPathViewModel[] {
  const {
    upgradesById,
    charactersById,
    battlesById,
    allBattlesById,
    campaignProgressByKey,
    releaseTypeByGroupId,
  } = useGoalCatalog()
  const { campaignName, difficultyLabel } = useCampaignDisplay()

  return useCallback(
    (resourceId: string) => {
      const battles = allBattlesById ?? noBattles
      const paths = farmUnlockPaths({
        farmLocations: resourceFarmLocations(
          resourceId,
          upgradesById,
          charactersById
        ),
        allBattlesById: battles,
        eligibleBattleIds: new Set(battlesById?.keys() ?? []),
        campaignProgressByKey: campaignProgressByKey ?? noProgress,
        isEventGroup: (groupId) =>
          releaseTypeByGroupId?.get(groupId) === "event",
      })
      return paths.map((path) => {
        const battle = battles.get(path.battleId)!
        const descriptor = campaignDescriptor(
          battle.campaignGroupId,
          battle.type,
          battle.challenge
        )
        const node = `${battle.nodeNumber}${battle.challenge ? "B" : ""}`
        const difficulty = descriptor ? difficultyLabel(descriptor) : ""
        return {
          ...path,
          campaignName: descriptor ? campaignName(descriptor) : path.battleId,
          nodeLabel: difficulty ? `${difficulty} ${node}` : node,
          difficultyLabel: difficulty || undefined,
          icon: campaignIcon(
            battle.campaignGroupId,
            battle.type,
            battle.challenge
          ),
        }
      })
    },
    [
      allBattlesById,
      battlesById,
      campaignProgressByKey,
      campaignName,
      charactersById,
      difficultyLabel,
      releaseTypeByGroupId,
      upgradesById,
    ]
  )
}

/** Where a plan resource drops in the catalog: an upgrade's farm locations, or a character's
 *  (non-mythic) shard locations for `shard:<unit>`. */
function resourceFarmLocations(
  resourceId: string,
  upgradesById: ReadonlyMap<UpgradeId, { farmLocations: FarmLocation[] }>,
  charactersById:
    | ReadonlyMap<
        string,
        {
          shardLocations: readonly (FarmLocation & { battleId: BattleId })[]
        }
      >
    | undefined
): readonly FarmLocation[] {
  if (resourceId.startsWith("shard:")) {
    const unitId = resourceId.slice("shard:".length)
    return (charactersById?.get(unitId)?.shardLocations ?? []).filter(
      (location) => !location.isMythic
    )
  }
  return upgradesById?.get(resourceId as UpgradeId)?.farmLocations ?? []
}
