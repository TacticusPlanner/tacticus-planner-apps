import {
  rankAt,
  rankIndex,
  type Rank,
  type UnitId,
  type UpgradeId,
} from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import type { GoalDetail } from "@/entities/goal"
import { computeMowMissingUpgrades } from "@/features/goal-farming/@x/goal-create"

import {
  computeMissingUpgrades,
  computeUpgradeGoalNeed,
} from "../goal-creation-form/goal-spec-builder"
import type { useGoalCatalog } from "@/features/goal-planning/@x/goal-create"
import {
  goalTargetEditFromDraft,
  type GoalTargetDraft,
} from "../target-edit/goal-target-edit"

/** The upgrades in the applied slots of `rank`, as one-each inventory entries. */
function appliedOnRank(
  character: NonNullable<ReturnType<Catalog["getCharacter"]>>,
  rank: Rank,
  slots: readonly number[]
): { upgradeId: UpgradeId; amount: number }[] {
  const upgrades =
    character.rankUpUpgrades.find((entry) => entry.rank === rank)?.upgradeIds ??
    []
  return upgrades
    .filter((_, index) => slots.includes(index))
    .map((upgradeId) => ({ upgradeId, amount: 1 }))
}

type Catalog = Pick<
  ReturnType<typeof useGoalCatalog>,
  "getCharacter" | "mowsById" | "upgradesById"
>

/** The unit's synced state, which turns the gross need into what is still left to farm. */
export type GoalEditLiveProgress = {
  character?: PlayerDataChunkDto<"characters">[number]
  mow?: PlayerDataChunkDto<"mows">[number]
  inventoryUpgrades?: PlayerDataChunkDto<"inventory-upgrades">
}

/**
 * The base materials an edited Rank, Upgrade, or Machine-of-War Ability goal needs for its draft
 * target. Without `live` it is the gross requirement from the goal's stored start (no inventory),
 * enough to tell which Mythic materials the Edit goal dialog's Mythic-material control lists
 * (add-mythic-material-shop-sources). With `live` it is what is still left, as the create preview
 * counts it: from where the unit is now (the later of its synced rank or levels and the stored
 * start), less the upgrades applied on that rank and the materials in the inventory. Empty for other
 * kinds.
 */
export function goalEditMaterialNeeds(
  detail: GoalDetail,
  target: GoalTargetDraft | null,
  catalog: Catalog,
  live?: GoalEditLiveProgress
): { id: string; missing: number }[] {
  const toNeeds = (
    entries: { id: string; required: number; missing: number }[]
  ) =>
    entries.map((entry) => ({
      id: entry.id,
      missing: live ? entry.missing : entry.required,
    }))
  const inventoryUpgrades = live?.inventoryUpgrades
  const edit = target ? goalTargetEditFromDraft(target) : null
  const { config } = detail

  if (detail.goalType === "Rank" && detail.entityType === "Character") {
    const rank = edit?.rank ?? config.rank
    if (!config.rank || !rank) return []
    const storedStart = rankAt(config.rank.start)
    const liveRank = live?.character?.rank
    const rankStart =
      liveRank && rankIndex(liveRank) > rankIndex(storedStart)
        ? liveRank
        : storedStart
    const character = catalog.getCharacter(detail.entityId as UnitId)
    return toNeeds(
      computeMissingUpgrades({
        rankEnabled: true,
        character,
        rankStart,
        rankEnd: rankAt(rank.end),
        rankEndPointFive: rank.endPointFive,
        rankEndAppliedUpgrades: rank.endAppliedUpgrades,
        // `playerCharacter` would also count every upgrade consumed on the ranks below as owned;
        // only the slots applied on the rank the range starts from offset this range.
        playerCharacter: undefined,
        inventoryUpgrades:
          live?.character?.rank === rankStart && character
            ? [
                ...(inventoryUpgrades ?? []),
                ...appliedOnRank(
                  character,
                  rankStart,
                  live.character.appliedUpgradeSlots
                ),
              ]
            : inventoryUpgrades,
        upgradesById: catalog.upgradesById,
        includeCovered: true,
      })
    )
  }

  if (detail.goalType === "Ability" && detail.entityType === "Mow") {
    const ability = config.ability
    if (!ability) return []
    return toNeeds(
      computeMowMissingUpgrades({
        abilityEnabled: true,
        mow: catalog.mowsById?.get(detail.entityId),
        // Counted from the live levels, so nothing below them is needed or counted as applied.
        playerMow: undefined,
        activeStart: Math.max(
          ability.activeStart,
          live?.mow?.abilities[0]?.level ?? 0
        ),
        activeEnd: edit?.ability?.activeEnd ?? ability.activeEnd,
        passiveStart: Math.max(
          ability.passiveStart,
          live?.mow?.abilities[1]?.level ?? 0
        ),
        passiveEnd: edit?.ability?.passiveEnd ?? ability.passiveEnd,
        inventoryUpgrades,
        upgradesById: catalog.upgradesById,
        includeCovered: true,
      })
    )
  }

  if (detail.goalType === "Upgrade") {
    const targets = edit?.upgrade?.targets ?? config.upgrade?.targets ?? []
    return toNeeds(
      computeUpgradeGoalNeed({
        upgradeEnabled: true,
        targets: targets.map((entry) => ({
          upgradeId: entry.upgradeId as UpgradeId,
          quantity: entry.quantity,
        })),
        inventoryUpgrades,
        upgradesById: catalog.upgradesById,
        includeCovered: true,
      })
    )
  }

  return []
}
