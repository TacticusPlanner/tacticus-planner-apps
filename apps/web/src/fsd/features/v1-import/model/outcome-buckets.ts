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
      return `- ${label}: ${outcome.message}`
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
