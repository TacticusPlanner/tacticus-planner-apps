import type { V1LegendaryEventOutcome } from "@/entities/account"

import type { OutcomeBucketKey } from "./outcome-buckets"

// Per-event outcomes of the `legendaryEventPlans` part, bucketed like goals (add-legendary-event-
// teams design D10). An unknown code falls back by status, so a new server code still lands in a
// bucket that reads right ("Failed" → failed, anything else not imported).
const CODE_BUCKETS: Record<string, OutcomeBucketKey> = {
  imported: "imported",
  plan_already_exists: "needsNoImport",
  event_not_in_catalog: "notImported",
  legendary_event_import_failed: "failed",
}

function bucketForLegendaryEventOutcome(
  outcome: Pick<V1LegendaryEventOutcome, "code" | "status">
): OutcomeBucketKey {
  return (
    CODE_BUCKETS[outcome.code] ??
    (outcome.status === "Failed" ? "failed" : "notImported")
  )
}

export type LegendaryEventBuckets = Record<
  OutcomeBucketKey,
  V1LegendaryEventOutcome[]
>

export function groupLegendaryEventOutcomes(
  outcomes: readonly V1LegendaryEventOutcome[]
): LegendaryEventBuckets {
  const buckets: LegendaryEventBuckets = {
    imported: [],
    needsNoImport: [],
    notImported: [],
    failed: [],
  }
  for (const outcome of outcomes) {
    buckets[bucketForLegendaryEventOutcome(outcome)].push(outcome)
  }
  return buckets
}

// Literal key unions, so `t()` can verify every key exists (see outcome-buckets.ts' ReasonKey).
type ReasonKey =
  | "goals.v1Import.legendaryEvents.reasons.imported"
  | "goals.v1Import.legendaryEvents.reasons.imported_without_teams"
  | "goals.v1Import.legendaryEvents.reasons.plan_already_exists"
  | "goals.v1Import.legendaryEvents.reasons.event_not_in_catalog"
  | "goals.v1Import.legendaryEvents.reasons.no_legendary_event_imported"
  | "goals.v1Import.legendaryEvents.reasons.legendary_events_skipped"
  | "goals.v1Import.legendaryEvents.reasons.missing_legendary_event_plans"
  | "goals.v1Import.legendaryEvents.reasons.invalid_legendary_event_plans"
  | "goals.v1Import.legendaryEvents.reasons.legendary_event_import_failed"
  | "goals.v1Import.reasons.generic"

const REASON_CODES = [
  "imported",
  "plan_already_exists",
  "event_not_in_catalog",
  "no_legendary_event_imported",
  "legendary_events_skipped",
  "missing_legendary_event_plans",
  "invalid_legendary_event_plans",
  "legendary_event_import_failed",
] as const

/** The translated reason for an event outcome or part code; unknown codes read generically. */
export function reasonKeyForLegendaryEventCode(code: string): ReasonKey {
  return (REASON_CODES as readonly string[]).includes(code)
    ? (`goals.v1Import.legendaryEvents.reasons.${code}` as ReasonKey)
    : "goals.v1Import.reasons.generic"
}

/** The translated reason for one event's outcome: an event imported without a single team (every
 *  team was dropped) reads as such instead of "Teams imported". */
export function reasonKeyForLegendaryEventOutcome(
  outcome: Pick<V1LegendaryEventOutcome, "code" | "teamsImported">
): ReasonKey {
  return outcome.code === "imported" && outcome.teamsImported === 0
    ? "goals.v1Import.legendaryEvents.reasons.imported_without_teams"
    : reasonKeyForLegendaryEventCode(outcome.code)
}

type IssueKey =
  | "goals.v1Import.legendaryEvents.issues.unknown_unit"
  | "goals.v1Import.legendaryEvents.issues.unit_not_allowed_on_lane"
  | "goals.v1Import.legendaryEvents.issues.duplicate_unit"
  | "goals.v1Import.legendaryEvents.issues.unknown_objective"
  | "goals.v1Import.legendaryEvents.issues.unknown_lane"
  | "goals.v1Import.legendaryEvents.issues.empty_team"
  | "goals.v1Import.legendaryEvents.issues.team_truncated"
  | "goals.v1Import.legendaryEvents.issues.duplicate_team_merged"
  | "goals.v1Import.legendaryEvents.issues.conflicting_depth_discarded"
  | "goals.v1Import.legendaryEvents.issues.existing_notes_kept"
  | "goals.v1Import.legendaryEvents.issues.notes_truncated"
  | "goals.v1Import.reasons.generic"

const ISSUE_CODES = [
  "unknown_unit",
  "unit_not_allowed_on_lane",
  "duplicate_unit",
  "unknown_objective",
  "unknown_lane",
  "empty_team",
  "team_truncated",
  "duplicate_team_merged",
  "conflicting_depth_discarded",
  "existing_notes_kept",
  "notes_truncated",
] as const

export function issueKeyForLegendaryEventCode(code: string): IssueKey {
  return (ISSUE_CODES as readonly string[]).includes(code)
    ? (`goals.v1Import.legendaryEvents.issues.${code}` as IssueKey)
    : "goals.v1Import.reasons.generic"
}

/** Whether the Legendary Event report has anything worth copying: an event not imported or
 *  failed, or any issue. */
export function legendaryEventsNeedAttention(
  buckets: LegendaryEventBuckets
): boolean {
  return (
    buckets.notImported.length > 0 ||
    buckets.failed.length > 0 ||
    Object.values(buckets).some((outcomes) =>
      outcomes.some((outcome) => outcome.issues.length > 0)
    )
  )
}

/**
 * The Legendary Event lines of the copied diagnostic: one line per not-imported or failed event
 * and per issue (under its event), all in translated copy.
 */
export function buildLegendaryEventDiagnosticText(params: {
  buckets: LegendaryEventBuckets
  title: string
  eventName: (outcome: V1LegendaryEventOutcome) => string
  reasonFor: (code: string) => string
  issueFor: (code: string) => string
}): string {
  const lines: string[] = []
  for (const outcome of Object.values(params.buckets).flat()) {
    const attention =
      bucketForLegendaryEventOutcome(outcome) === "notImported" ||
      bucketForLegendaryEventOutcome(outcome) === "failed"
    if (attention) {
      lines.push(
        `- ${params.eventName(outcome)}: ${params.reasonFor(outcome.code)}`
      )
    }
    for (const issue of outcome.issues) {
      const where = [issue.teamName, issue.value].filter(Boolean).join(": ")
      lines.push(
        `- ${params.eventName(outcome)}: ${params.issueFor(issue.code)}${
          where ? ` (${where})` : ""
        }`
      )
    }
  }
  return lines.length > 0 ? [`${params.title}:`, ...lines].join("\n") : ""
}
