import {
  isProgression,
  lastProgression,
  lastRank,
  maxAbilityLevel,
  progressionIndex,
  progressionOrder,
  rankAt,
  rankIndex,
  rankOrder,
  type Progression,
  type Rank,
} from "@workspace/game-domain"

import type {
  GoalDetail,
  GoalKind,
  GoalTargetEdit,
  UpgradeRange,
} from "@/entities/goal"
import {
  additionalTargetFromWire,
  additionalTargetSelection,
  type RankAdditionalTarget,
} from "@/features/goal-farming/@x/goal-create"

/** The editable *end* target of one goal, as the target editor holds it while the owner adjusts it.
 * Only the goal's own kind's fields exist — the start/baseline is never part of a draft (it is stored
 * on the goal and never changes). Rank keeps the creation form's "Additional target" vocabulary so the
 * two forms speak the same language. */
export type GoalTargetDraft =
  | { kind: "Rank"; end: Rank; additional: RankAdditionalTarget }
  | { kind: "Ascension"; end: Progression }
  | { kind: "Ability"; activeEnd: number; passiveEnd: number }
  | {
      kind: "Upgrade"
      targets: { upgradeId: string; quantity: number }[]
      /** The range(s) the goal was created against, `null` when it has none. */
      rankRange: UpgradeRange | null
      activeRange: UpgradeRange | null
      passiveRange: UpgradeRange | null
    }

export type GoalTargetIssue =
  | "rankNotAboveStart"
  | "progressionNotAboveStart"
  | "abilityBelowStart"
  | "abilityNoAdvance"
  | "abilityAboveMax"
  | "upgradeQuantity"
  | "upgradeEmpty"
  | "upgradeRange"

/** The largest Upgrade quantity the editor accepts — the same ceiling the creation form's quantity input
 * uses (`max` on its `Input`). */
export const MAX_UPGRADE_QUANTITY = 10000

const editableKinds: ReadonlySet<GoalKind> = new Set([
  "Rank",
  "Ascension",
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
            rankRange: config.upgrade.rankRange ?? null,
            activeRange: config.upgrade.activeRange ?? null,
            passiveRange: config.upgrade.passiveRange ?? null,
          }
        : null
    default:
      return null
  }
}

/** The wire body for `PUT /goals/{id}/target` — only the end values of the draft's own kind. */
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
    case "Ability":
      return {
        ability: { activeEnd: draft.activeEnd, passiveEnd: draft.passiveEnd },
      }
    case "Upgrade":
      // The ranges are replaced with the targets as one unit, so a cleared range is simply left out.
      return {
        upgrade: {
          targets: draft.targets,
          ...(draft.rankRange && { rankRange: draft.rankRange }),
          ...(draft.activeRange && { activeRange: draft.activeRange }),
          ...(draft.passiveRange && { passiveRange: draft.passiveRange }),
        },
      }
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
    case "Ability": {
      if (!config.ability) return null
      const { activeStart, passiveStart } = config.ability
      if (
        !Number.isInteger(draft.activeEnd) ||
        !Number.isInteger(draft.passiveEnd) ||
        draft.activeEnd < activeStart ||
        draft.passiveEnd < passiveStart
      ) {
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
      const ranges = [draft.rankRange, draft.activeRange, draft.passiveRange]
      if (
        ranges.some(
          (range) => range && (range.start < 0 || range.end <= range.start)
        )
      ) {
        return "upgradeRange"
      }
      return draft.targets.every((target) =>
        isValidUpgradeQuantity(target.quantity)
      )
        ? null
        : "upgradeQuantity"
    }
  }
}

/** `getGoalTargetIssue`, but only for a target the owner actually changed: an untouched stored target is
 * never validated (it may predate these rules, e.g. an untargeted ability track stored below its start)
 * and is never sent, so it must not block Save. */
export function getChangedGoalTargetIssue(
  detail: GoalDetail,
  draft: GoalTargetDraft
): GoalTargetIssue | null {
  return isGoalTargetDraftChanged(detail, draft)
    ? getGoalTargetIssue(detail, draft)
    : null
}

/** `options` with a stored value that isn't among them put back in ladder order, so a picker holding an
 * out-of-range stored target (e.g. from an import) never opens blank. */
function keepStored<T>(
  options: readonly T[],
  ladder: readonly T[],
  stored: T | undefined
): T[] {
  if (stored === undefined || options.includes(stored)) return [...options]
  return ladder.filter((step) => step === stored || options.includes(step))
}

/** Ranks a Rank target can be set to: everything above `start` (a rank index), plus a stored target
 * that is itself at or below it. Never empty: the last rank stands in at the top of the ladder. */
export function rankOptionsAbove(start: number, stored?: Rank): Rank[] {
  const options = rankOrder.filter((rank) => rankIndex(rank) > start)
  return keepStored(
    options.length > 0 ? options : [lastRank],
    rankOrder,
    stored
  )
}

/** {@link rankOptionsAbove} for a stored goal's start and target. */
export function rankEndOptionsFor(detail: GoalDetail): Rank[] {
  return rankOptionsAbove(
    detail.config.rank?.start ?? 0,
    detail.config.rank ? rankAt(detail.config.rank.end) : undefined
  )
}

/** Ascension steps above `start`, plus a stored target at or below it. Never "None" or empty: the last
 * step stands in at the top of the ladder. */
export function progressionEndOptionsFor(
  start: Progression,
  stored?: Progression
): Progression[] {
  const from = progressionIndex(start)
  const options = progressionOrder.filter(
    (step) => progressionIndex(step) > from
  )
  return keepStored(
    options.length > 0 ? options : [lastProgression],
    progressionOrder,
    stored
  )
}

/**
 * One ability track's target levels: the start level, which leaves the track where it is so a single
 * Ability goal can raise just the other track, then every level above it up to the maximum, plus a stored
 * level below the start. A level of 0 (no start) offers from 1.
 */
export function abilityLevelOptionsFor(
  start: number,
  stored?: number
): number[] {
  const from = Math.max(start, 1)
  const options = Array.from(
    { length: Math.max(0, maxAbilityLevel - from + 1) },
    (_, i) => from + i
  )
  return stored === undefined || options.includes(stored) || stored < 1
    ? options
    : [...options, stored].sort((a, b) => a - b)
}

/** Whether an Upgrade quantity is a whole number from 1 to {@link MAX_UPGRADE_QUANTITY}. A cleared field
 * reads as `NaN`. */
export function isValidUpgradeQuantity(quantity: number): boolean {
  return (
    Number.isInteger(quantity) &&
    quantity >= 1 &&
    quantity <= MAX_UPGRADE_QUANTITY
  )
}

/** Whether the goal stores a start the "Started from" text can show (an Upgrade goal has none). */
export function hasGoalTargetStart(detail: GoalDetail): boolean {
  const { config } = detail
  switch (detail.goalType) {
    case "Rank":
      return !!config.rank
    case "Ascension":
      return !!config.progression
    case "Ability":
      return !!config.ability
    default:
      return false
  }
}
