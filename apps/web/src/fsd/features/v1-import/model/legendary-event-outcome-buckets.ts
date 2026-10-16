import type {
  V1LegendaryEventIssue,
  V1LegendaryEventOutcome,
} from "@/entities/account"
import { MAX_CLOSE_SHARDS, MIN_TEAM_MEMBERS } from "@/entities/legendary-event"

import type { OutcomeBucketKey } from "./outcome-buckets"

// Per-event outcomes of the `legendaryEventPlans` part, bucketed like goals (add-legendary-event-
// teams design D10). An unknown code falls back by status, so a new server code still lands in a
// bucket that reads right ("Failed" → failed, anything else not imported).
const CODE_BUCKETS: Record<string, OutcomeBucketKey> = {
  imported: "imported",
  // Run inputs, marks and/or notes written without a team (add-legendary-event-run-inputs D7).
  inputs_imported: "imported",
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
  | "goals.v1Import.legendaryEvents.reasons.inputs_imported"
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
  "inputs_imported",
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

/** The translated reason for one event's outcome: an event imported without a single team, run
 *  input or mark (every team was dropped) reads as such instead of "Teams imported". */
export function reasonKeyForLegendaryEventOutcome(
  outcome: Pick<
    V1LegendaryEventOutcome,
    "code" | "teamsImported" | "runInputsImported" | "annotationsImported"
  >
): ReasonKey {
  return outcome.code === "imported" &&
    outcome.teamsImported === 0 &&
    !(outcome.runInputsImported > 0) &&
    !(outcome.annotationsImported > 0)
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
  | "goals.v1Import.legendaryEvents.issues.team_too_small"
  | "goals.v1Import.legendaryEvents.issues.team_truncated"
  | "goals.v1Import.legendaryEvents.issues.duplicate_team_merged"
  | "goals.v1Import.legendaryEvents.issues.conflicting_depth_discarded"
  | "goals.v1Import.legendaryEvents.issues.existing_notes_kept"
  | "goals.v1Import.legendaryEvents.issues.notes_truncated"
  | "goals.v1Import.legendaryEvents.issues.run_input_clamped"
  | "goals.v1Import.legendaryEvents.issues.run_input_clamped_unbounded"
  | "goals.v1Import.legendaryEvents.issues.unknown_run"
  | "goals.v1Import.legendaryEvents.issues.existing_run_inputs_kept"
  | "goals.v1Import.legendaryEvents.issues.unknown_battle"
  | "goals.v1Import.legendaryEvents.issues.unknown_battle_unbounded"
  | "goals.v1Import.legendaryEvents.issues.existing_annotations_kept"
  | "goals.v1Import.legendaryEvents.issues.unknown_objective_mark"
  | "goals.v1Import.legendaryEvents.issues.unknown_lane_mark"
  | "goals.v1Import.reasons.generic"

const ISSUE_CODES = [
  "unknown_unit",
  "unit_not_allowed_on_lane",
  "duplicate_unit",
  "unknown_objective",
  "unknown_lane",
  "empty_team",
  "team_too_small",
  "team_truncated",
  "duplicate_team_merged",
  "conflicting_depth_discarded",
  "existing_notes_kept",
  "notes_truncated",
  "run_input_clamped",
  "unknown_run",
  "existing_run_inputs_kept",
  "unknown_battle",
  "existing_annotations_kept",
] as const

function issueKeyForLegendaryEventCode(code: string): IssueKey {
  return (ISSUE_CODES as readonly string[]).includes(code)
    ? (`goals.v1Import.legendaryEvents.issues.${code}` as IssueKey)
    : "goals.v1Import.reasons.generic"
}

type LaneKey =
  | "goals.v1Import.legendaryEvents.lanes.alpha"
  | "goals.v1Import.legendaryEvents.lanes.beta"
  | "goals.v1Import.legendaryEvents.lanes.gamma"
type FieldKey =
  | "goals.v1Import.legendaryEvents.fields.regularMissions"
  | "goals.v1Import.legendaryEvents.fields.premiumMissions"
  | "goals.v1Import.legendaryEvents.fields.closeShards"

const LANES = ["alpha", "beta", "gamma"] as const
const RUN_INPUT_FIELDS = [
  "regularMissions",
  "premiumMissions",
  "closeShards",
] as const

/** The catalog figures an issue line names: mission counts and each lane's battle count. */
export interface LegendaryEventIssueCatalog {
  regularMissions: number
  premiumMissions: number
  battleCounts: Partial<Record<(typeof LANES)[number], number>>
}

/** A translated lane name, or `undefined` for a lane the planner does not know. */
function laneKey(lane: string): LaneKey | undefined {
  return (LANES as readonly string[]).includes(lane)
    ? (`goals.v1Import.legendaryEvents.lanes.${lane}` as LaneKey)
    : undefined
}

/** Splits `a:b:c` at the first `parts − 1` colons (an objective name may hold a colon). */
function split(value: string | null, parts: number): string[] {
  const pieces = (value ?? "").split(":")
  return [...pieces.slice(0, parts - 1), pieces.slice(parts - 1).join(":")]
}

/**
 * How one issue line reads (design D7): its translation key, the values it interpolates (each a
 * translation key to resolve, or a literal) and whether the raw `value` is shown beside it. Run
 * input and mark issues interpolate the parsed `value` (and the catalog bound when known), so the
 * raw value is not repeated; team issues keep the Stage 2 "reason + team + value" line.
 */
export function describeLegendaryEventIssue(
  issue: V1LegendaryEventIssue,
  catalog: LegendaryEventIssueCatalog | undefined
): {
  key: IssueKey
  params: Record<string, string | number | { key: LaneKey | FieldKey }>
  showValue: boolean
} {
  const plain = {
    key: issueKeyForLegendaryEventCode(issue.code),
    params: {},
    showValue: true,
  }
  switch (issue.code) {
    case "run_input_clamped": {
      const [run = "", field = "", original = ""] = split(issue.value, 3)
      if (!(RUN_INPUT_FIELDS as readonly string[]).includes(field)) return plain
      const typed = field as (typeof RUN_INPUT_FIELDS)[number]
      const bound =
        typed === "closeShards" ? MAX_CLOSE_SHARDS : catalog?.[typed]
      return {
        key:
          bound === undefined
            ? "goals.v1Import.legendaryEvents.issues.run_input_clamped_unbounded"
            : "goals.v1Import.legendaryEvents.issues.run_input_clamped",
        params: {
          run,
          field: {
            key: `goals.v1Import.legendaryEvents.fields.${typed}` as FieldKey,
          },
          original,
          ...(bound === undefined ? {} : { bound }),
        },
        showValue: false,
      }
    }
    case "team_too_small": {
      // The value is how many units remained; the team name shows beside the line.
      const remaining = Number(issue.value)
      if (!Number.isInteger(remaining)) return plain
      return {
        ...plain,
        params: { count: remaining, min: MIN_TEAM_MEMBERS },
        showValue: false,
      }
    }
    case "existing_run_inputs_kept":
      return { ...plain, params: { run: issue.value ?? "" }, showValue: false }
    case "existing_annotations_kept":
      return {
        ...plain,
        params: { count: Number(issue.value ?? 0) },
        showValue: false,
      }
    case "unknown_battle": {
      const [lane = "", index = ""] = split(issue.value, 2)
      const name = laneKey(lane)
      const battle = Number(index)
      if (!name || !Number.isInteger(battle)) return plain
      const count = catalog?.battleCounts[lane as (typeof LANES)[number]]
      return {
        key:
          count === undefined
            ? "goals.v1Import.legendaryEvents.issues.unknown_battle_unbounded"
            : "goals.v1Import.legendaryEvents.issues.unknown_battle",
        params: {
          lane: { key: name },
          battle: battle + 1,
          ...(count === undefined ? {} : { count }),
        },
        showValue: false,
      }
    }
    case "unknown_objective": {
      // A team's objective names its team; a mark's names none (the value is `lane:objective`).
      if (issue.teamName) return plain
      const [lane = "", objective = ""] = split(issue.value, 2)
      const name = laneKey(lane)
      if (!name) return plain
      return {
        key: "goals.v1Import.legendaryEvents.issues.unknown_objective_mark",
        params: { lane: { key: name }, objective },
        showValue: false,
      }
    }
    case "unknown_lane":
      return issue.teamName
        ? plain
        : {
            key: "goals.v1Import.legendaryEvents.issues.unknown_lane_mark",
            params: { lane: issue.value ?? "" },
            showValue: false,
          }
    default:
      return plain
  }
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
  /** The issue's translated line and whether its raw value is shown beside it. */
  issueFor: (
    issue: V1LegendaryEventIssue,
    outcome: V1LegendaryEventOutcome
  ) => { text: string; showValue: boolean }
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
      const { text, showValue } = params.issueFor(issue, outcome)
      const where = [issue.teamName, showValue ? issue.value : null]
        .filter(Boolean)
        .join(": ")
      lines.push(
        `- ${params.eventName(outcome)}: ${text}${where ? ` (${where})` : ""}`
      )
    }
  }
  return lines.length > 0 ? [`${params.title}:`, ...lines].join("\n") : ""
}
