import {
  progressionOrder,
  rankIndex,
  type Progression,
  type UpgradeId,
} from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import type { GoalDetail } from "@/entities/goal"

// Pure attainment calc — whether a goal's target conditions are already satisfied by the player's
// synced progression, independent of the goal's lifecycle `status` (plan §3: "Unfulfilled" vs.
// "Reached" is computed here, never a manually-set flag). Mirrors `goal-requirements.ts`'s
// per-`GoalKind` split, but compares *current vs. target* rather than deriving a farmable need — no
// catalog/cost data required, only the player's own synced records.

type PlayerCharacter = PlayerDataChunkDto<"characters">[number]
type PlayerMow = PlayerDataChunkDto<"mows">[number]
type InventoryUpgrade = PlayerDataChunkDto<"inventory-upgrades">[number]
type InventoryItem = PlayerDataChunkDto<"inventory-items">[number]

type GoalAttainmentStatus = "reached" | "not-reached" | "unknown"

/** `unknown` means the synced player record this goal's kind depends on hasn't loaded/synced yet —
 *  distinct from `not-reached` (we know the target isn't met). `reached` is the derived convenience
 *  field callers actually group/filter on. */
export type GoalAttainment = {
  status: GoalAttainmentStatus
  reached: boolean
}

const REACHED: GoalAttainment = { status: "reached", reached: true }
const NOT_REACHED: GoalAttainment = { status: "not-reached", reached: false }
const UNKNOWN: GoalAttainment = { status: "unknown", reached: false }

function fromBoolean(value: boolean): GoalAttainment {
  return value ? REACHED : NOT_REACHED
}

/** Reads by array position, same convention as `mow-ability-calc.ts`'s `mowAbilityTrackLevel` —
 *  `abilities[0]` is the primary/active track, `abilities[1]` is secondary/passive. Applies equally
 *  to a Character or a MoW record since both share `playerUnitBaseSchema`. Defaults to `1`
 *  (unowned/base) so an as-yet-unsynced ability never reads as ahead of its actual level. */
export function abilityTrackLevel(
  owned: { abilities: readonly { level: number }[] } | undefined,
  track: "primary" | "secondary"
): number {
  const index = track === "primary" ? 0 : 1
  return owned?.abilities[index]?.level ?? 1
}

export type GoalAttainmentParams = {
  detail: GoalDetail
  playerCharacter: PlayerCharacter | undefined
  playerMow: PlayerMow | undefined
  inventoryUpgrades: readonly InventoryUpgrade[]
  inventoryItems: readonly InventoryItem[]
}

export function computeGoalAttainment(
  params: GoalAttainmentParams
): GoalAttainment {
  const { detail } = params
  const isMow = detail.entityType === "Mow"
  const owned: PlayerCharacter | PlayerMow | undefined = isMow
    ? params.playerMow
    : params.playerCharacter

  switch (detail.goalType) {
    case "Rank": {
      const target = detail.config.rank
      if (!target || !params.playerCharacter) return UNKNOWN
      const currentIndex = rankIndex(params.playerCharacter.rank)
      if (currentIndex > target.end) return REACHED
      if (currentIndex < target.end) return NOT_REACHED
      const requiredApplied = Math.max(
        target.endAppliedUpgrades,
        target.endPointFive ? 3 : 0
      )
      return fromBoolean(
        params.playerCharacter.appliedUpgradeSlots.length >= requiredApplied
      )
    }
    case "Ability": {
      const target = detail.config.ability
      if (!target || !owned) return UNKNOWN
      const activeLevel = abilityTrackLevel(owned, "primary")
      const passiveLevel = abilityTrackLevel(owned, "secondary")
      return fromBoolean(
        activeLevel >= target.activeEnd && passiveLevel >= target.passiveEnd
      )
    }
    case "Ascension": {
      const target = detail.config.progression
      if (!target || !owned) return UNKNOWN
      const currentIndex = progressionOrder.indexOf(
        owned.progressionIndex as Progression
      )
      const endIndex = progressionOrder.indexOf(target.end as Progression)
      if (currentIndex < 0 || endIndex < 0) return UNKNOWN
      return fromBoolean(currentIndex >= endIndex)
    }
    case "Unlock":
      // Reached once the unit itself is owned/unlocked — its rank/progression from there on is
      // tracked by separate Rank/Ascension goals, not this one.
      return fromBoolean(!!owned)
    case "Level": {
      const target = detail.config.level
      if (!target || !owned) return UNKNOWN
      return fromBoolean(owned.xpLevel >= target.end)
    }
    case "UpgradeItem": {
      // entityType "Item" — entityId is the equipment id itself, tracked via the un-equipped
      // inventory stock rather than a per-character/MoW record.
      const target = detail.config.item
      if (!target) return UNKNOWN
      const entry = params.inventoryItems.find(
        (item) => item.itemId === detail.entityId
      )
      // A confirmed absence (synced inventory loaded, nothing at this id) is a known "not reached",
      // not "unknown" — only a not-yet-loaded inventory chunk is unknown (guarded by the caller
      // gating on catalog/player-data readiness before calling this at all).
      if (!entry) return NOT_REACHED
      return fromBoolean(entry.level >= target.targetLevel && entry.amount > 0)
    }
    case "Upgrade": {
      const target = detail.config.upgrade
      if (!target || target.targets.length === 0) return UNKNOWN
      const ownedById = new Map(
        params.inventoryUpgrades.map((entry) => [entry.upgradeId, entry.amount])
      )
      return fromBoolean(
        target.targets.every(
          (need) =>
            (ownedById.get(need.upgradeId as UpgradeId) ?? 0) >= need.quantity
        )
      )
    }
    default:
      return UNKNOWN
  }
}
