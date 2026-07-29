import type { PlayerDataChunkDto } from "@workspace/player-data"

import type { CombinedGoalSpec, CreateGoalSnapshotRequest } from "./types"

/** The subset of a resource-requirement preview entry this builder actually reads — deliberately
 * structural (not importing `pages/goals`' own `MissingUpgradeEntry`) so this entities-layer module
 * stays independent of the pages layer; the regular create-goal flow's real entries satisfy this
 * shape as-is. */
export type SnapshotMissingUpgradeInput = {
  id: string
  required: number
  inventoryContribution: number
}

export function buildCreateGoalSnapshot(params: {
  spec: CombinedGoalSpec
  entityType: "Character" | "Mow"
  playerEntity:
    | PlayerDataChunkDto<"characters">[number]
    | PlayerDataChunkDto<"mows">[number]
    | undefined
  playerCharacter: PlayerDataChunkDto<"characters">[number] | undefined
  currentActiveAbility: number
  currentPassiveAbility: number
  missingUpgrades: SnapshotMissingUpgradeInput[]
}): CreateGoalSnapshotRequest {
  const ownsResourcePreview =
    (params.entityType === "Character" && params.spec.goalType === "Rank") ||
    (params.entityType === "Mow" && params.spec.goalType === "Ability")
  return {
    initialRank: params.playerCharacter?.rank ?? null,
    initialProgression: params.playerEntity?.progressionIndex ?? null,
    initialActiveAbilityLevel: params.currentActiveAbility,
    initialPassiveAbilityLevel: params.currentPassiveAbility,
    initialRequirement: ownsResourcePreview
      ? params.missingUpgrades.map((entry) => ({
          resourceId: entry.id,
          count: entry.required,
        }))
      : [],
    initialInventoryContribution: ownsResourcePreview
      ? params.missingUpgrades
          .filter((entry) => entry.inventoryContribution > 0)
          .map((entry) => ({
            resourceId: entry.id,
            count: entry.inventoryContribution,
          }))
      : [],
  }
}
