import type { PlayerDataChunkDto } from "@workspace/player-data"

import type {
  CombinedGoalSpec,
  CreateGoalSnapshotRequest,
} from "@/entities/goal"
import type { EstimateOutcome } from "./estimate/estimate.domain"
import type { MissingUpgradeEntry } from "./goal-spec-builder"

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
  missingUpgrades: MissingUpgradeEntry[]
  estimatePreview: EstimateOutcome | null
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
