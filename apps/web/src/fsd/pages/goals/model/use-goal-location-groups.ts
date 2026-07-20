import { useMemo } from "react"

import type { GoalDetail } from "@/entities/goal"
import type { UpgradeId } from "@workspace/game-domain"
import type { useGoalCatalog } from "./use-goal-catalog"

/**
 * Derives the farm/shard-location picker's state for `GoalDetailSheet`: Rank goals never expose a
 * farming-location override (product decision), Unlock goals farm a shard rather than an upgrade so
 * their location list comes from the character's own catalog `shardLocations` (the snapshot-derived
 * upgrade requirement every other costed goal type uses is always empty for Unlock), and Level goals
 * are uncosted so nothing farmable applies at all. Split out of goal-detail-sheet.tsx to keep that
 * file under this repo's max-lines rule, mirroring how goal-projects-field.tsx/goal-locations-field.tsx
 * were split out for the same reason.
 */
export function useGoalLocationGroups(
  detail: GoalDetail | null,
  upgradesById: ReturnType<typeof useGoalCatalog>["upgradesById"],
  charactersById: ReturnType<typeof useGoalCatalog>["charactersById"],
  selectedLocations: string[]
) {
  const isRank = detail?.goalType === "Rank"
  const isUnlock = detail?.goalType === "Unlock"
  const isLevel = detail?.goalType === "Level"

  const upgradeLocationGroups = useMemo(() => {
    if (!detail?.snapshot) return []
    return detail.snapshot.initialRequirement.map((resource) => ({
      resourceId: resource.resourceId,
      battleIds: [
        ...new Set(
          upgradesById
            .get(resource.resourceId as UpgradeId)
            ?.farmLocations.map((location) => location.battleId) ?? []
        ),
      ],
    }))
  }, [detail, upgradesById])

  const shardBattleIds = useMemo(() => {
    if (!detail || detail.goalType !== "Unlock") return []
    return [
      ...new Set(
        charactersById
          ?.get(detail.entityId)
          ?.shardLocations.map((location) => location.battleId) ?? []
      ),
    ]
  }, [detail, charactersById])

  const locationGroups = isUnlock
    ? shardBattleIds.length > 0
      ? [{ resourceId: "shards", battleIds: shardBattleIds }]
      : []
    : upgradeLocationGroups
  const allLocations = [
    ...new Set(locationGroups.flatMap((group) => group.battleIds)),
  ]
  const overrideValid =
    isRank ||
    isLevel ||
    selectedLocations.length === 0 ||
    locationGroups.every((group) =>
      group.battleIds.some((id) => selectedLocations.includes(id))
    )

  return { isRank, isUnlock, isLevel, allLocations, overrideValid }
}
