import type { PlayerDataChunkDto } from "@workspace/player-data"

import { MAX_RESOURCE_ID_LENGTH, MAX_SNAPSHOT_RESOURCES } from "./goal-limits"
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
  const resources = ownsResourcePreview
    ? boundedResources(params.missingUpgrades)
    : []
  return {
    initialRank: params.playerCharacter?.rank ?? null,
    initialProgression: params.playerEntity?.progressionIndex ?? null,
    initialActiveAbilityLevel: params.currentActiveAbility,
    initialPassiveAbilityLevel: params.currentPassiveAbility,
    initialRequirement: resources.map((entry) => ({
      resourceId: entry.id,
      count: entry.required,
    })),
    initialInventoryContribution: resources
      .filter((entry) => entry.inventoryContribution > 0)
      .map((entry) => ({
        resourceId: entry.id,
        count: entry.inventoryContribution,
      })),
  }
}

/**
 * The resource list as the API accepts it: each id once, non-blank and at most
 * `MAX_RESOURCE_ID_LENGTH` characters, at most `MAX_SNAPSHOT_RESOURCES` entries. The caller passes
 * catalog upgrade ids only (the API also checks that); the preview already aggregates by id, so
 * this only guards the contract — a whole rank ladder needs about 150 distinct materials.
 */
function boundedResources(
  entries: readonly SnapshotMissingUpgradeInput[]
): SnapshotMissingUpgradeInput[] {
  const seen = new Set<string>()
  const kept: SnapshotMissingUpgradeInput[] = []
  for (const entry of entries) {
    const id = entry.id.trim()
    if (!id || id.length > MAX_RESOURCE_ID_LENGTH || seen.has(id)) continue
    seen.add(id)
    kept.push({ ...entry, id })
  }
  // ponytail: a list past the cap is cut, not split; no real unit comes near it.
  return kept.slice(0, MAX_SNAPSHOT_RESOURCES)
}
