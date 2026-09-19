import type { V1GoalOutcome } from "@/entities/account"

// Presentation buckets over the flat, ordered outcome list the import returns — a client-side
// classification precisely so revisiting a boundary (a code that reads as benign today may deserve
// attention tomorrow) is a local change, not an API change (design.md: "Group in the client, from a
// flat server list").
export type OutcomeBucketKey =
  "imported" | "needsNoImport" | "notImported" | "failed"

// Every code the API can emit (rewrite-v1-goal-import API contract), mapped to the bucket it reads
// as. An unrecognised code falls back to "notImported" — surfaced for attention rather than hidden
// in the benign bucket or silently swallowed, so a future server code never disappears (design.md:
// "Map codes to copy through an explicit lookup with a fallback").
const CODE_BUCKETS: Record<string, OutcomeBucketKey> = {
  goal_created: "imported",
  prerequisite_added: "imported",
  target_already_reached: "needsNoImport",
  goal_already_exists: "needsNoImport",
  duplicate_goal_merged: "needsNoImport",
  prerequisite_target_insufficient: "notImported",
  unknown_unit: "notImported",
  unsupported_goal_type: "notImported",
  invalid_progression: "notImported",
  missing_target: "notImported",
  player_data_required: "failed",
  target_rejected: "failed",
  project_slot_conflict: "failed",
  prerequisite_rejected: "failed",
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
  | "goals.v1Import.reasons.targetAlreadyReached"
  | "goals.v1Import.reasons.goalAlreadyExists"
  | "goals.v1Import.reasons.duplicateGoalMerged"
  | "goals.v1Import.reasons.prerequisiteTargetInsufficient"
  | "goals.v1Import.reasons.unknownUnit"
  | "goals.v1Import.reasons.unsupportedGoalType"
  | "goals.v1Import.reasons.invalidProgression"
  | "goals.v1Import.reasons.missingTarget"
  | "goals.v1Import.reasons.playerDataRequired"
  | "goals.v1Import.reasons.targetRejected"
  | "goals.v1Import.reasons.projectSlotConflict"
  | "goals.v1Import.reasons.prerequisiteRejected"
  | "goals.v1Import.reasons.generic"

const REASON_KEYS: Record<string, ReasonKey> = {
  goal_created: "goals.v1Import.reasons.goalCreated",
  prerequisite_added: "goals.v1Import.reasons.prerequisiteAdded",
  target_already_reached: "goals.v1Import.reasons.targetAlreadyReached",
  goal_already_exists: "goals.v1Import.reasons.goalAlreadyExists",
  duplicate_goal_merged: "goals.v1Import.reasons.duplicateGoalMerged",
  prerequisite_target_insufficient:
    "goals.v1Import.reasons.prerequisiteTargetInsufficient",
  unknown_unit: "goals.v1Import.reasons.unknownUnit",
  unsupported_goal_type: "goals.v1Import.reasons.unsupportedGoalType",
  invalid_progression: "goals.v1Import.reasons.invalidProgression",
  missing_target: "goals.v1Import.reasons.missingTarget",
  player_data_required: "goals.v1Import.reasons.playerDataRequired",
  target_rejected: "goals.v1Import.reasons.targetRejected",
  project_slot_conflict: "goals.v1Import.reasons.projectSlotConflict",
  prerequisite_rejected: "goals.v1Import.reasons.prerequisiteRejected",
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

/**
 * Plain-text diagnostic for the clipboard (design.md: "Copy details as plain text, assembled from
 * what is already rendered"): one line per not-imported/failed outcome, naming the unit, the goal
 * type when one was determined, and the server's own reason. There is no per-outcome trace
 * identifier in this API's response shape — a trace id only ever appears on a whole-request
 * failure (an unhandled 500's ProblemDetails body), which is a different code path from this
 * bucketed report entirely, so none is appended here (see import-v1-dialog.tsx's deviation note).
 */
export function buildDiagnosticText(params: {
  notImported: readonly V1GoalOutcome[]
  failed: readonly V1GoalOutcome[]
  heading: (bucket: "notImported" | "failed") => string
  unitName: (entityType: string | null, entityId: string | null) => string
  goalTypeLabel: (goalType: string | null) => string | null
  noUnitLabel: string
  // Translated reason text for one outcome's code — not `outcome.message` (the server's untranslated
  // English), same reasoning as OutcomeRow's own rendering in import-v1-result.tsx.
  reasonFor: (code: string) => string
}): string {
  const section = (
    bucket: "notImported" | "failed",
    outcomes: readonly V1GoalOutcome[]
  ) => {
    if (outcomes.length === 0) return null
    const rows = outcomes.map((outcome) => {
      const unit = outcome.entityId
        ? params.unitName(outcome.entityType, outcome.entityId)
        : params.noUnitLabel
      const type = params.goalTypeLabel(outcome.goalType)
      const label = type ? `${unit} (${type})` : unit
      return `- ${label}: ${params.reasonFor(outcome.code)}`
    })
    return [`${params.heading(bucket)}:`, ...rows].join("\n")
  }

  return [
    section("notImported", params.notImported),
    section("failed", params.failed),
  ]
    .filter((part): part is string => part !== null)
    .join("\n\n")
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
