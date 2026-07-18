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

/** The subset of an estimate-preview outcome this builder actually reads — see
 * `SnapshotMissingUpgradeInput`'s note; the regular create-goal flow's real `EstimateOutcome` (a
 * discriminated union) satisfies this shape as-is. */
export type SnapshotEstimateInput = {
  status?: string
  days?: number
  date?: string
  energyTotal?: number
  raidsTotal?: number
} | null

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
  estimatePreview: SnapshotEstimateInput
}): CreateGoalSnapshotRequest {
  const estimate =
    params.estimatePreview?.status !== "Blocked" ? params.estimatePreview : null
  const ownsResourcePreview =
    (params.entityType === "Character" && params.spec.goalType === "Rank") ||
    (params.entityType === "Mow" && params.spec.goalType === "Ability")
  return {
    initialRank: params.playerCharacter?.rank ?? null,
    initialProgression: params.playerEntity?.progressionIndex ?? null,
    initialActiveAbilityLevel: params.currentActiveAbility,
    initialPassiveAbilityLevel: params.currentPassiveAbility,
    initialUnlocked: !!params.playerEntity,
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
    originalEnergyTotal: ownsResourcePreview
      ? (estimate?.energyTotal ?? null)
      : null,
    originalRaidsTotal: ownsResourcePreview
      ? (estimate?.raidsTotal ?? null)
      : null,
    originalEstimateDays: ownsResourcePreview ? (estimate?.days ?? null) : null,
    originalEstimateDate: ownsResourcePreview ? (estimate?.date ?? null) : null,
  }
}
