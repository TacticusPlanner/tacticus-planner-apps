import type { V1GoalOutcome } from "@/entities/account"

// Presentation buckets over the flat, ordered outcome list the import returns — a client-side
// classification precisely so revisiting a boundary (a code that reads as benign today may deserve
// attention tomorrow) is a local change, not an API change (design.md: "Group in the client, from a
// flat server list").
export type OutcomeBucketKey =
  "imported" | "needsNoImport" | "needsAction" | "notImported" | "failed"

// Every code the API can emit (rewrite-v1-goal-import API contract), mapped to the bucket it reads
// as. An unrecognised code falls back to "notImported" — surfaced for attention rather than hidden
// in the benign bucket or silently swallowed, so a future server code never disappears (design.md:
// "Map codes to copy through an explicit lookup with a fallback").
const CODE_BUCKETS: Record<string, OutcomeBucketKey> = {
  goal_created: "imported",
  prerequisite_added: "imported",
  // A V1 material goal placed on a suggested unit (it had none): created, but worth a look.
  upgrade_goal_assigned: "imported",
  target_already_reached: "needsNoImport",
  goal_already_exists: "needsNoImport",
  duplicate_goal_merged: "needsNoImport",
  // A V1 material goal the import couldn't place: nothing was created, and the user has a step to
  // take (see materialSteps).
  manual_step_required: "needsAction",
  prerequisite_target_insufficient: "notImported",
  unknown_unit: "notImported",
  unsupported_goal_type: "notImported",
  invalid_progression: "notImported",
  missing_target: "notImported",
  unknown_upgrade: "notImported",
  no_upgrade_owner: "notImported",
  player_data_required: "failed",
  target_rejected: "failed",
  project_slot_conflict: "failed",
  prerequisite_rejected: "failed",
  // The account's caps: a goal type already at 200 non-archived goals skips the goal; at 100
  // non-archived projects the import cannot create its own project, so its goals fail.
  goal_limit_reached: "notImported",
  project_limit_reached: "failed",
  // Summary lines: V1 goals past the import's 500-goal bound, and outcomes past the listed 1000.
  too_many_goals: "notImported",
  outcomes_truncated: "notImported",
}

export function bucketForCode(code: string): OutcomeBucketKey {
  return CODE_BUCKETS[code] ?? "notImported"
}

// The server composes `V1GoalOutcome.message` in English only (it has no notion of the caller's
// locale) — a `code` -> translation-key lookup, same shape and same explicit-fallback rule as
// CODE_BUCKETS above, is what actually satisfies "every outcome code has translated copy in every
// supported locale" (v1-profile-import spec) instead of rendering that raw server text. A handful of
// codes cover several distinct server messages (e.g. `target_already_reached` reads differently for
// a Rank vs. an Ascension vs. an already-unlocked Unlock goal, and `target_rejected`/
// `prerequisite_rejected` wrap whatever open-ended validation message the goal-target validator
// produced) — those get one translated sentence that stays true for every case the code can mean,
// rather than trying to keep an exhaustive per-message translation catalog in sync with the API.
// An explicit literal union, not `string` — `t()`'s typed overload only accepts a key it can
// statically verify exists in the locale resources, same reasoning as goal-type-badge.tsx's
// `t(\`goals.create.goalTypes.${type}\`)` (there a closed union narrows the template literal; here
// there's no such union to narrow from, since `code` is the API's plain `string`, so the lookup's
// value type has to carry the narrowing instead).
type ReasonKey =
  | "goals.v1Import.reasons.goalCreated"
  | "goals.v1Import.reasons.prerequisiteAdded"
  | "goals.v1Import.reasons.upgradeGoalAssigned"
  | "goals.v1Import.reasons.targetAlreadyReached"
  | "goals.v1Import.reasons.goalAlreadyExists"
  | "goals.v1Import.reasons.duplicateGoalMerged"
  | "goals.v1Import.reasons.prerequisiteTargetInsufficient"
  | "goals.v1Import.reasons.unknownUnit"
  | "goals.v1Import.reasons.unsupportedGoalType"
  | "goals.v1Import.reasons.invalidProgression"
  | "goals.v1Import.reasons.missingTarget"
  | "goals.v1Import.reasons.unknownUpgrade"
  | "goals.v1Import.reasons.noUpgradeOwner"
  | "goals.v1Import.reasons.manualStepRequired"
  | "goals.v1Import.reasons.playerDataRequired"
  | "goals.v1Import.reasons.targetRejected"
  | "goals.v1Import.reasons.projectSlotConflict"
  | "goals.v1Import.reasons.prerequisiteRejected"
  | "goals.v1Import.reasons.goalLimitReached"
  | "goals.v1Import.reasons.projectLimitReached"
  | "goals.v1Import.reasons.tooManyGoals"
  | "goals.v1Import.reasons.outcomesTruncated"
  | "goals.v1Import.reasons.generic"

const REASON_KEYS: Record<string, ReasonKey> = {
  goal_created: "goals.v1Import.reasons.goalCreated",
  prerequisite_added: "goals.v1Import.reasons.prerequisiteAdded",
  upgrade_goal_assigned: "goals.v1Import.reasons.upgradeGoalAssigned",
  target_already_reached: "goals.v1Import.reasons.targetAlreadyReached",
  goal_already_exists: "goals.v1Import.reasons.goalAlreadyExists",
  duplicate_goal_merged: "goals.v1Import.reasons.duplicateGoalMerged",
  prerequisite_target_insufficient:
    "goals.v1Import.reasons.prerequisiteTargetInsufficient",
  unknown_unit: "goals.v1Import.reasons.unknownUnit",
  unsupported_goal_type: "goals.v1Import.reasons.unsupportedGoalType",
  invalid_progression: "goals.v1Import.reasons.invalidProgression",
  missing_target: "goals.v1Import.reasons.missingTarget",
  unknown_upgrade: "goals.v1Import.reasons.unknownUpgrade",
  no_upgrade_owner: "goals.v1Import.reasons.noUpgradeOwner",
  manual_step_required: "goals.v1Import.reasons.manualStepRequired",
  player_data_required: "goals.v1Import.reasons.playerDataRequired",
  target_rejected: "goals.v1Import.reasons.targetRejected",
  project_slot_conflict: "goals.v1Import.reasons.projectSlotConflict",
  prerequisite_rejected: "goals.v1Import.reasons.prerequisiteRejected",
  goal_limit_reached: "goals.v1Import.reasons.goalLimitReached",
  project_limit_reached: "goals.v1Import.reasons.projectLimitReached",
  too_many_goals: "goals.v1Import.reasons.tooManyGoals",
  outcomes_truncated: "goals.v1Import.reasons.outcomesTruncated",
}

export function reasonKeyForCode(code: string): ReasonKey {
  return REASON_KEYS[code] ?? "goals.v1Import.reasons.generic"
}

export type BucketedOutcomes = Record<OutcomeBucketKey, V1GoalOutcome[]>

export function groupOutcomes(
  outcomes: readonly V1GoalOutcome[]
): BucketedOutcomes {
  const buckets: BucketedOutcomes = {
    imported: [],
    needsNoImport: [],
    needsAction: [],
    notImported: [],
    failed: [],
  }
  for (const outcome of outcomes) {
    buckets[bucketForCode(outcome.code)].push(outcome)
  }
  return buckets
}

/** The imported bucket reports goals and units as two distinct numbers (never a single ambiguous
 * "created" count) — a synthesized prerequisite counts as a created goal same as a source goal. */
export function importedCounts(imported: readonly V1GoalOutcome[]): {
  goals: number
  units: number
} {
  const units = new Set(
    imported
      .filter((outcome) => outcome.entityType && outcome.entityId)
      .map((outcome) => `${outcome.entityType}:${outcome.entityId}`)
  )
  return { goals: imported.length, units: units.size }
}

export function isAutomaticallyAdded(outcome: V1GoalOutcome): boolean {
  return outcome.code === "prerequisite_added"
}

type StepUnit = { entityType: string; entityId: string }

/** One V1 material goal (upgrade material or pre-farm) the user must re-create by hand as an Upgrade
 * goal: the material, an upgrade-material goal's quantity, the distinct units of a pre-farm goal's linked
 * goals (resolved through those goals' own outcomes in this same report, so a linked goal that wasn't
 * imported contributes no unit), and the units to offer — the linked ones, else the server's suggestion. */
export type MaterialStep = {
  sourceGoalId: string | null
  upgradeId: string | null
  quantity: number | null
  linkedUnits: StepUnit[]
  units: StepUnit[]
}

export function materialSteps(
  outcomes: readonly V1GoalOutcome[]
): MaterialStep[] {
  const bySourceId = new Map(
    outcomes
      .filter((outcome) => outcome.sourceGoalId)
      .map((outcome) => [outcome.sourceGoalId, outcome])
  )
  return outcomes
    .filter((outcome) => outcome.code === "manual_step_required")
    .map((outcome) => {
      const linked = new Map<string, StepUnit>()
      for (const linkedId of outcome.linkedSourceGoalIds ?? []) {
        const goal = bySourceId.get(linkedId)
        if (!goal?.entityType || !goal.entityId) continue
        linked.set(`${goal.entityType}:${goal.entityId}`, {
          entityType: goal.entityType,
          entityId: goal.entityId,
        })
      }
      const linkedUnits = [...linked.values()]
      const suggested =
        outcome.entityType && outcome.entityId
          ? [{ entityType: outcome.entityType, entityId: outcome.entityId }]
          : []
      return {
        sourceGoalId: outcome.sourceGoalId,
        upgradeId: outcome.upgradeId,
        quantity: outcome.upgradeQuantity,
        linkedUnits,
        units: linkedUnits.length > 0 ? linkedUnits : suggested,
      }
    })
}

/** One outcome's subject for the report: its unit and/or the material it carries (a material or
 *  pre-farm goal), else the "no unit" label. Rendered by OutcomeRow. */
export function outcomeSubject(
  outcome: V1GoalOutcome,
  names: {
    unitName: (entityType: string | null, entityId: string | null) => string
    upgradeName: (upgradeId: string) => string
    noUnitLabel: string
  }
): string {
  const parts = [
    outcome.entityId && names.unitName(outcome.entityType, outcome.entityId),
    outcome.upgradeId && names.upgradeName(outcome.upgradeId),
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(" · ") : names.noUnitLabel
}

/** The goals part's reported status, derived from the outcomes rather than trusting the server's
 * pre-submission "Imported" (spec: "The goals part status reflects what the import did"). The
 * server only distinguishes Failed (refused for missing player data) from Imported; when not
 * refused it reports Imported unconditionally, even if every outcome turned out not-imported or
 * failed. Left alone when there was nothing to import (an empty V1 goal list is not a failure). */
export function effectiveGoalsStatus(
  serverStatus: "Imported" | "Skipped" | "Failed",
  outcomes: readonly V1GoalOutcome[]
): "Imported" | "Skipped" | "Failed" {
  if (serverStatus !== "Imported" || outcomes.length === 0) return serverStatus
  return outcomes.some((outcome) => bucketForCode(outcome.code) === "imported")
    ? "Imported"
    : "Failed"
}
