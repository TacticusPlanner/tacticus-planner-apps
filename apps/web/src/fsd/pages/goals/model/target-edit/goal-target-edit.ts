import {
  isProgression,
  lastRank,
  maxAbilityLevel,
  progressionIndex,
  rankAt,
  rankIndex,
  rankOrder,
  type Progression,
  type Rank,
} from "@workspace/game-domain"

import type { GoalDetail, GoalKind, GoalTargetEdit } from "@/entities/goal"
import {
  additionalTargetFromWire,
  additionalTargetSelection,
  type RankAdditionalTarget,
} from "@/features/goal-farming"

import { MAX_CHARACTER_LEVEL } from "../goal-creation-form/goal-validation"

/** The editable *end* target of one goal, as the target editor holds it while the owner adjusts it.
 * Only the goal's own kind's fields exist — the start/baseline is never part of a draft (it is stored
 * on the goal and never changes). Rank keeps the creation form's "Additional target" vocabulary so the
 * two forms speak the same language. */
export type GoalTargetDraft =
  | { kind: "Rank"; end: Rank; additional: RankAdditionalTarget }
  | { kind: "Ascension"; end: Progression }
  | { kind: "Level"; end: number }
  | { kind: "Ability"; activeEnd: number; passiveEnd: number }
  | {
      kind: "Upgrade"
      targets: { upgradeId: string; quantity: number }[]
    }

export type GoalTargetIssue =
  | "rankNotAboveStart"
  | "progressionNotAboveStart"
  | "levelNotAboveStart"
  | "levelAboveMax"
  | "abilityBelowStart"
  | "abilityNoAdvance"
  | "abilityAboveMax"
  | "upgradeQuantity"
  | "upgradeEmpty"

/** The largest Upgrade quantity the editor accepts — the same ceiling the creation form's quantity input
 * uses (`max` on its `Input`). */
export const MAX_UPGRADE_QUANTITY = 10000

const editableKinds: ReadonlySet<GoalKind> = new Set([
  "Rank",
  "Ascension",
  "Level",
  "Ability",
  "Upgrade",
])

/** Whether the goal offers an Edit target action: an Active or Paused goal of a kind that has an
 * adjustable target. Unlock has none, and Completed/Archived goals are history. */
export function isGoalTargetEditable(
  detail: Pick<GoalDetail, "goalType" | "status">
): boolean {
  return (
    (detail.status === "Active" || detail.status === "Paused") &&
    editableKinds.has(detail.goalType)
  )
}

/** The draft holding the goal's *stored* end target (not one inferred from current progression), or
 * null when the goal has no adjustable target. */
export function goalTargetDraftFromDetail(
  detail: GoalDetail
): GoalTargetDraft | null {
  const { config } = detail
  switch (detail.goalType) {
    case "Rank": {
      if (!config.rank) return null
      const end = rankAt(config.rank.end)
      return {
        kind: "Rank",
        end,
        additional: additionalTargetFromWire(end, config.rank),
      }
    }
    case "Ascension": {
      const end = config.progression?.end
      return end && isProgression(end) ? { kind: "Ascension", end } : null
    }
    case "Level":
      return config.level ? { kind: "Level", end: config.level.end } : null
    case "Ability":
      return config.ability
        ? {
            kind: "Ability",
            activeEnd: config.ability.activeEnd,
            passiveEnd: config.ability.passiveEnd,
          }
        : null
    case "Upgrade":
      return config.upgrade
        ? {
            kind: "Upgrade",
            targets: config.upgrade.targets.map((target) => ({ ...target })),
          }
        : null
    default:
      return null
  }
}

/** The wire body for `PUT /me/goals/{id}/target` — only the end values of the draft's own kind. */
export function goalTargetEditFromDraft(
  draft: GoalTargetDraft
): GoalTargetEdit {
  switch (draft.kind) {
    case "Rank": {
      const { pointFive, appliedUpgrades } = additionalTargetSelection(
        draft.additional
      )
      return {
        rank: {
          end: rankIndex(draft.end),
          endPointFive: pointFive,
          endAppliedUpgrades: appliedUpgrades,
        },
      }
    }
    case "Ascension":
      return { progression: { end: draft.end } }
    case "Level":
      return { level: { end: draft.end } }
    case "Ability":
      return {
        ability: { activeEnd: draft.activeEnd, passiveEnd: draft.passiveEnd },
      }
    case "Upgrade":
      return { upgrade: { targets: draft.targets } }
  }
}

/** True when the draft differs from what the goal currently stores — Save target stays disabled for an
 * unchanged draft (the server treats an identical target as a no-op anyway). */
export function isGoalTargetDraftChanged(
  detail: GoalDetail,
  draft: GoalTargetDraft
): boolean {
  const stored = goalTargetDraftFromDetail(detail)
  return !stored || JSON.stringify(stored) !== JSON.stringify(draft)
}

/**
 * The first reason `draft` is not a valid target for `detail`, or null. These are the target-shape rules
 * creation applies (`getGoalValidationIssue`) evaluated against the goal's *stored start* rather than the
 * unit's live progress — so a target the unit has already reached is valid (it just needs nothing more),
 * exactly as the server treats an edit. Rank/Ascension "above the start" is compared by ladder position,
 * so a partial-slot target on the same rank as the start is still a target above it only when the rank
 * itself is higher (the server's rule).
 */
export function getGoalTargetIssue(
  detail: GoalDetail,
  draft: GoalTargetDraft
): GoalTargetIssue | null {
  const { config } = detail
  switch (draft.kind) {
    case "Rank":
      return config.rank && rankIndex(draft.end) <= config.rank.start
        ? "rankNotAboveStart"
        : null
    case "Ascension":
      return config.progression &&
        isProgression(config.progression.start) &&
        progressionIndex(draft.end) <=
          progressionIndex(config.progression.start)
        ? "progressionNotAboveStart"
        : null
    case "Level":
      if (config.level && draft.end <= config.level.start) {
        return "levelNotAboveStart"
      }
      return draft.end > MAX_CHARACTER_LEVEL ? "levelAboveMax" : null
    case "Ability": {
      if (!config.ability) return null
      const { activeStart, passiveStart } = config.ability
      if (draft.activeEnd < activeStart || draft.passiveEnd < passiveStart) {
        return "abilityBelowStart"
      }
      if (
        draft.activeEnd > maxAbilityLevel ||
        draft.passiveEnd > maxAbilityLevel
      ) {
        return "abilityAboveMax"
      }
      return draft.activeEnd > activeStart || draft.passiveEnd > passiveStart
        ? null
        : "abilityNoAdvance"
    }
    case "Upgrade": {
      if (draft.targets.length === 0) return "upgradeEmpty"
      return draft.targets.every(
        (target) =>
          Number.isInteger(target.quantity) &&
          target.quantity >= 1 &&
          target.quantity <= MAX_UPGRADE_QUANTITY
      )
        ? null
        : "upgradeQuantity"
    }
  }
}

/** Ranks a Rank target can be raised or lowered to: everything above the stored start, up to the top of
 * the ladder (never an empty list — the start's own rank stands in when it is the last one). */
export function rankEndOptionsFor(detail: GoalDetail): Rank[] {
  const start = detail.config.rank?.start ?? 0
  const options = rankOrder.filter((rank) => rankIndex(rank) > start)
  return options.length > 0 ? options : [lastRank]
}
