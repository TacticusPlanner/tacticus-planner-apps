import {
  lastRank,
  maxRankForProgression,
  progressionOrder,
  rankAt,
  rankIndex,
  type Progression,
  type Rank,
  type Rarity,
  type UpgradeId,
} from "@workspace/game-domain"
import type { UnlockShardCostStorageModel } from "@workspace/game-catalog"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import { rankTargetSlots } from "@/entities/goal"
import {
  reachableRankProgress,
  type LevelRules,
} from "@/features/goal-farming/@x/goal-planning"

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
  | {
      kind: "Rank"
      current: Rank
      target: Rank
      /** How many of `target`'s own 6 upgrade slots the target includes (the normalized additional
       *  target — 0 for a clean rank boundary). With `target` this labels a Rank milestone, so two goals
       *  for one character (e.g. Silver3 and Gold1) read apart. */
      targetSlots: number
      ratio: number
      /** How far the goal's own ratio scale can advance *right now*, given the character's current
       *  rarity and level — both independently cap how far a rank can go, whichever is lower binds.
       *  `null` when the target is already fully reachable (no current restriction to mark). */
      reachableRatio: number | null
      /** The actual rank `reachableRatio` corresponds to — for display in the ceiling marker's
       *  tooltip. Always `null` exactly when `reachableRatio` is `null`. */
      reachableRank: Rank | null
      /** How many of `reachableRank`'s own 6 upgrade slots are included in the ceiling (e.g. "4" for
       *  a "Diamond1 4/6" ceiling) — the slot-level detail `reachableRank` alone can't convey. Always
       *  `null` exactly when `reachableRatio` is `null`. */
      reachableAppliedSlots: number | null
      /** Which of the two independent caps is the one currently binding — for the ceiling marker's
       *  tooltip to explain *why* (e.g. a Rare-rarity character can rarity-cap at Silver1 while
       *  still level-capped lower, until they level up further). `"both"` when they land on the same
       *  rank. Always `null` exactly when `reachableRatio` is `null`. */
      reachableRankLimitedBy: "rarity" | "level" | "both" | null
    }
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
  | {
      /** Not a goal kind — the level a Rank/Ability goal's target needs while the character is below
       *  it (`computeLevelRequirementProgress`), shown next to that goal as ordinary progress. */
      kind: "LevelRequirement"
      current: number
      target: number
      /** Where a goal partly covered by a higher-priority goal of the same unit starts its own level
       *  interval (a second Rank goal reads "Lv 35 -> 38"); absent when nothing is covered. */
      chainedFrom?: number
      ratio: number
      /** How far the ratio scale can advance *right now*, given the character's current rarity — a
       *  character can't earn XP past its rarity's level cap until it Ascends. `null` when the
       *  requirement is already fully reachable. */
      reachableRatio: number | null
      /** The actual level `reachableRatio` corresponds to — for display in the ceiling marker's
       *  tooltip. Always `null` exactly when `reachableRatio` is `null`. */
      reachableLevel: number | null
      /** Raw XP still needed to reach the required level, from the character's true current
       *  level+XP — *not* netted against owned XP books (mirrors how a Rank goal's Remaining column
       *  shows the raw slot/material count, not a potential-adjusted one). */
      remainingXp: number
    }
  | {
      kind: "Upgrade"
      ratio: number | null
      /** One entry per targeted material, in the goal's own order, so the row can show each
       *  material's image beside its owned/needed count. */
      materials: UpgradeProgressMaterial[]
    }
  | { kind: "Unknown" }

type UpgradeProgressMaterial = {
  upgradeId: UpgradeId
  /** Catalog name, or the raw id while the catalog hasn't loaded. */
  label: string
  rarity?: Rarity
  crafted?: boolean
  /** `null` while the upgrade inventory hasn't loaded. */
  owned: number | null
  quantity: number
}

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
  /** Upgrade catalog, for an Upgrade goal's material names/rarities; absent falls back to the raw
   *  id with no rarity frame. */
  upgradesById?: ReadonlyMap<
    UpgradeId,
    { label: string; rarity: Rarity; crafted: boolean }
  >
  /** The game's level rules; absent (still loading) leaves a Rank goal without its reachable marker. */
  levelRules?: LevelRules
}

/** What rarity and level let a Rank goal reach right now, when that falls short of its `totalSlots`
 *  span from `startRank`; `null` when nothing restricts it or the level rules haven't loaded. */
function rankRestriction(
  xpLevel: number,
  rarityMaxRank: Rank,
  startRank: number,
  totalSlots: number,
  levelRules: LevelRules | undefined
) {
  if (!levelRules || totalSlots <= 0) return null
  const combined = reachableRankProgress(xpLevel, rarityMaxRank, levelRules)
  const reachableContinuousSlots =
    (rankIndex(combined.rank) - startRank) * 6 + combined.appliedSlots
  if (reachableContinuousSlots >= totalSlots) return null
  return {
    combined,
    levelUnrestricted: reachableRankProgress(xpLevel, lastRank, levelRules),
    ratio: clampRatio(reachableContinuousSlots, totalSlots),
  }
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
      // What the goal's own slot scale can reach *right now* — rarity and level each independently
      // cap how far a rank can advance, whichever is lower binds. Slot-level granularity (not just
      // whole ranks) matters: a character's real applied-slot count can sit partway through a rank
      // (e.g. Diamond1 4/6), and a whole-rank-only ceiling could land *behind* that real progress,
      // which is never valid — `reachableRankProgress` walks level-gated slots one at a time so the
      // ceiling can't outpace real, level-gated applied-slot progress. `null` (no marker) once that
      // ceiling is at or past the target, i.e. nothing currently restricts this goal.
      const rarityMaxRank = maxRankForProgression(
        params.playerCharacter.progressionIndex
      )
      const restriction = rankRestriction(
        params.playerCharacter.xpLevel,
        rarityMaxRank,
        target.start,
        totalSlots,
        params.levelRules
      )
      return {
        kind: "Rank",
        // Never displayed past the goal's own target, even once the player's live rank has
        // overtaken it — the ratio above already treats an overshoot as complete.
        current:
          currentIndex > target.end
            ? rankAt(target.end)
            : params.playerCharacter.rank,
        target: rankAt(target.end),
        targetSlots: rankTargetSlots(target),
        ratio:
          totalSlots <= 0
            ? currentIndex >= target.end
              ? 1
              : 0
            : clampRatio(completedSlots, totalSlots),
        reachableRatio: restriction?.ratio ?? null,
        reachableRank: restriction?.combined.rank ?? null,
        reachableAppliedSlots: restriction?.combined.appliedSlots ?? null,
        reachableRankLimitedBy: !restriction
          ? null
          : restriction.combined.rank !== restriction.levelUnrestricted.rank
            ? "rarity"
            : rankIndex(rarityMaxRank) ===
                rankIndex(restriction.levelUnrestricted.rank)
              ? "both"
              : "level",
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
      const startIndex = progressionOrder.indexOf(target.start)
      const endIndex = progressionOrder.indexOf(target.end)
      const currentIndex = progressionOrder.indexOf(ownedUnit.progressionIndex)
      if (startIndex < 0 || endIndex < 0 || currentIndex < 0)
        return UNKNOWN_PROGRESS
      const clampedCurrent = Math.min(
        Math.max(currentIndex, startIndex),
        endIndex
      )
      return {
        kind: "Ascension",
        // Capped at the target independently of `clampedCurrent` above, which also floors at
        // `startIndex` for the ratio — a floor that must never apply to the displayed value (see
        // the "below start" scenario in the goal-progress-display spec).
        current:
          currentIndex > endIndex ? target.end : ownedUnit.progressionIndex,
        target: target.end,
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
    case "Upgrade": {
      const targets = detail.config.upgrade?.targets ?? []
      const ownedById = params.inventoryUpgrades
        ? new Map(
            params.inventoryUpgrades.map((entry) => [
              entry.upgradeId,
              entry.amount,
            ])
          )
        : null
      const materials = targets.map((need): UpgradeProgressMaterial => {
        const upgradeId = need.upgradeId as UpgradeId
        const upgrade = params.upgradesById?.get(upgradeId)
        return {
          upgradeId,
          label: upgrade?.label ?? need.upgradeId,
          rarity: upgrade?.rarity,
          crafted: upgrade?.crafted,
          owned: ownedById ? (ownedById.get(upgradeId) ?? 0) : null,
          quantity: need.quantity,
        }
      })
      if (materials.length === 0 || !ownedById)
        return { kind: "Upgrade", ratio: null, materials }
      const ratios = materials.map((material) =>
        clampRatio(material.owned ?? 0, material.quantity)
      )
      return {
        kind: "Upgrade",
        ratio: ratios.reduce((sum, value) => sum + value, 0) / ratios.length,
        materials,
      }
    }
    default:
      return UNKNOWN_PROGRESS
  }
}
