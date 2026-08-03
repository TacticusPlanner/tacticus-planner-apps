import {
  progressionOrder,
  rankAt,
  rankIndex,
  type Progression,
  type Rank,
  type UpgradeId,
} from "@workspace/game-domain"
import type { UnlockShardCostStorageModel } from "@workspace/game-catalog"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import { abilityTrackLevel, type GoalAttainmentParams } from "./goal-attainment"

type InventoryShard = PlayerDataChunkDto<"inventory-shards">[number]

// Pure "how far along is this goal" calc — a compact, goal-kind-specific current/target/ratio for
// the overview row/card's progress bar (plan §2). Reuses `GoalAttainmentParams`'s inputs; Unlock
// additionally needs the character's starting rarity and the shard-cost table, since unlock progress
// is the only kind with no natural ladder position to read a ratio from.

/** Current/target values stay in their raw catalog form (a `Rank`/`Progression` id, a plain level
 *  number) rather than a translated label — callers render them with the existing `RankBadge`/
 *  `ProgressionBadge` components (or plain numbers) for visual consistency with the rest of the app. */
export type GoalProgress =
  | { kind: "Rank"; current: Rank; target: Rank; ratio: number }
  | {
      kind: "Ascension"
      current: Progression
      target: Progression
      ratio: number
    }
  | {
      kind: "Ability"
      currentActive: number
      targetActive: number
      currentPassive: number
      targetPassive: number
      ratio: number
    }
  | { kind: "Unlock"; owned: number; required: number; ratio: number | null }
  | { kind: "Level"; current: number; target: number; ratio: number }
  | { kind: "UpgradeItem"; current: number; target: number; ratio: number }
  | { kind: "Upgrade"; ratio: number | null }
  | { kind: "Unknown" }

const UNKNOWN_PROGRESS: GoalProgress = { kind: "Unknown" }

function clampRatio(done: number, total: number): number {
  if (total <= 0) return 1
  return Math.min(1, Math.max(0, done / total))
}

export type GoalProgressParams = GoalAttainmentParams & {
  /** The character's starting rarity (`CharacterStorageModel.initialRarity`) — Unlock's shard cost is
   *  keyed by it, same as `unlockResourceNeed`. */
  initialRarity: string | undefined
  unlockShardCostsById: ReadonlyMap<string, UnlockShardCostStorageModel>
  /** The not-yet-unlocked unit's shard inventory (`inventory-shards` chunk) — separate from
   *  `playerCharacter`/`playerMow`'s own `shards` field, which only exists once already unlocked. */
  inventoryShard: InventoryShard | undefined
}

export function computeGoalProgress(params: GoalProgressParams): GoalProgress {
  const { detail } = params
  const isMow = detail.entityType === "Mow"
  const ownedUnit = isMow ? params.playerMow : params.playerCharacter

  switch (detail.goalType) {
    case "Rank": {
      const target = detail.config.rank
      if (!target || !params.playerCharacter) return UNKNOWN_PROGRESS
      const currentIndex = rankIndex(params.playerCharacter.rank)
      const appliedSlots = new Set(params.playerCharacter.appliedUpgradeSlots)
        .size
      // Treat each crossed rank as six slots and append any partial target at the end rank. Applied
      // slots then advance the bar continuously and same-rank partial goals have a real span.
      const requiredApplied = Math.max(
        target.endAppliedUpgrades,
        target.endPointFive ? 3 : 0
      )
      const totalSlots = (target.end - target.start) * 6 + requiredApplied
      const completedSlots =
        currentIndex > target.end
          ? totalSlots
          : currentIndex < target.start
            ? 0
            : (currentIndex - target.start) * 6 +
              (currentIndex === target.end
                ? Math.min(appliedSlots, requiredApplied)
                : Math.min(appliedSlots, 6))
      return {
        kind: "Rank",
        current: params.playerCharacter.rank,
        target: rankAt(target.end),
        ratio:
          totalSlots <= 0
            ? currentIndex >= target.end
              ? 1
              : 0
            : clampRatio(completedSlots, totalSlots),
      }
    }
    case "Ability": {
      const target = detail.config.ability
      if (!target || !ownedUnit) return UNKNOWN_PROGRESS
      const currentActive = abilityTrackLevel(ownedUnit, "primary")
      const currentPassive = abilityTrackLevel(ownedUnit, "secondary")
      const activeSpan = Math.max(0, target.activeEnd - target.activeStart)
      const passiveSpan = Math.max(0, target.passiveEnd - target.passiveStart)
      const doneActive = Math.min(
        activeSpan,
        Math.max(0, currentActive - target.activeStart)
      )
      const donePassive = Math.min(
        passiveSpan,
        Math.max(0, currentPassive - target.passiveStart)
      )
      return {
        kind: "Ability",
        currentActive,
        targetActive: target.activeEnd,
        currentPassive,
        targetPassive: target.passiveEnd,
        ratio: clampRatio(doneActive + donePassive, activeSpan + passiveSpan),
      }
    }
    case "Ascension": {
      const target = detail.config.progression
      if (!target || !ownedUnit) return UNKNOWN_PROGRESS
      const startIndex = progressionOrder.indexOf(target.start as Progression)
      const endIndex = progressionOrder.indexOf(target.end as Progression)
      const currentIndex = progressionOrder.indexOf(
        ownedUnit.progressionIndex as Progression
      )
      if (startIndex < 0 || endIndex < 0 || currentIndex < 0)
        return UNKNOWN_PROGRESS
      const clampedCurrent = Math.min(
        Math.max(currentIndex, startIndex),
        endIndex
      )
      return {
        kind: "Ascension",
        current: ownedUnit.progressionIndex as Progression,
        target: target.end as Progression,
        ratio: clampRatio(clampedCurrent - startIndex, endIndex - startIndex),
      }
    }
    case "Unlock": {
      // Already owned — the shard inventory that funded the unlock is no longer tracked once
      // complete, so report done rather than reading a stale/absent `inventoryShard` as still-short.
      if (ownedUnit) {
        return { kind: "Unlock", owned: 1, required: 1, ratio: 1 }
      }
      const required = params.initialRarity
        ? (params.unlockShardCostsById.get(params.initialRarity)?.shards ?? 0)
        : 0
      const owned = params.inventoryShard?.amount ?? 0
      return {
        kind: "Unlock",
        owned,
        required,
        ratio: required > 0 ? clampRatio(owned, required) : null,
      }
    }
    case "Level": {
      const target = detail.config.level
      if (!target || !ownedUnit) return UNKNOWN_PROGRESS
      const current = ownedUnit.xpLevel
      const clampedCurrent = Math.min(
        Math.max(current, target.start),
        target.end
      )
      return {
        kind: "Level",
        current,
        target: target.end,
        ratio: clampRatio(
          clampedCurrent - target.start,
          target.end - target.start
        ),
      }
    }
    case "UpgradeItem": {
      const target = detail.config.item
      if (!target) return UNKNOWN_PROGRESS
      if (!params.inventoryItems) return UNKNOWN_PROGRESS
      const entry = params.inventoryItems.find(
        (item) => item.itemId === detail.entityId
      )
      const current = entry?.level ?? 0
      const meetsLevel = current >= target.targetLevel
      // Mirrors `computeGoalAttainment`'s requirement that the item also has positive stock — at the
      // target level with none in stock isn't "done" (used up), so never show a full bar for it.
      const hasStock = (entry?.amount ?? 0) > 0
      return {
        kind: "UpgradeItem",
        current,
        target: target.targetLevel,
        ratio: meetsLevel
          ? hasStock
            ? 1
            : 0.99
          : clampRatio(current, target.targetLevel),
      }
    }
    case "Upgrade": {
      const target = detail.config.upgrade
      if (!target || target.targets.length === 0)
        return { kind: "Upgrade", ratio: null }
      if (!params.inventoryUpgrades) return { kind: "Upgrade", ratio: null }
      const ownedById = new Map(
        params.inventoryUpgrades.map((entry) => [entry.upgradeId, entry.amount])
      )
      const ratios = target.targets.map((need) =>
        clampRatio(
          ownedById.get(need.upgradeId as UpgradeId) ?? 0,
          need.quantity
        )
      )
      return {
        kind: "Upgrade",
        ratio: ratios.reduce((sum, value) => sum + value, 0) / ratios.length,
      }
    }
    default:
      return UNKNOWN_PROGRESS
  }
}
