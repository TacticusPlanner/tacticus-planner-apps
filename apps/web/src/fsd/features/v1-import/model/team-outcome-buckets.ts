import type { V1TeamIssue, V1TeamOutcome } from "@/entities/account"
import { TEAM_RULE_CODES } from "@/entities/team"
import type { TeamRuleCode } from "@/entities/team"

import type { OutcomeBucketKey } from "./outcome-buckets"

// No team outcome asks the user for a manual step.
export type TeamBucketKey = Exclude<OutcomeBucketKey, "needsAction">

export type TeamBuckets = Record<TeamBucketKey, V1TeamOutcome[]>

const SKIP_BUCKETS: Record<string, TeamBucketKey> = {
  already_imported: "needsNoImport",
  duplicate_name: "needsNoImport",
  team_limit_reached: "notImported",
  no_units: "notImported",
}

/** Per-team outcomes of the `teams` part, bucketed like goals (design D8): Imported; Needed no
 *  import (imported before, or a planner team has the name); Not imported (the limit, no units);
 *  Failed (unreadable). An unknown skip code lands in Not imported. */
export function groupTeamOutcomes(
  outcomes: readonly V1TeamOutcome[]
): TeamBuckets {
  const buckets: TeamBuckets = {
    imported: [],
    needsNoImport: [],
    notImported: [],
    failed: [],
  }
  for (const outcome of outcomes) {
    if (outcome.status === "Imported") buckets.imported.push(outcome)
    else if (outcome.status === "Failed") buckets.failed.push(outcome)
    else
      buckets[SKIP_BUCKETS[outcome.code ?? ""] ?? "notImported"].push(outcome)
  }
  return buckets
}

// Literal key unions, so `t()` can verify every key exists (see outcome-buckets.ts' ReasonKey).
type ReasonKey =
  | "goals.v1Import.teams.reasons.imported"
  | "goals.v1Import.teams.reasons.already_imported"
  | "goals.v1Import.teams.reasons.duplicate_name"
  | "goals.v1Import.teams.reasons.team_limit_reached"
  | "goals.v1Import.teams.reasons.no_units"
  | "goals.v1Import.teams.reasons.invalid_team"
  | "goals.v1Import.reasons.generic"

const OUTCOME_CODES = [
  "already_imported",
  "duplicate_name",
  "team_limit_reached",
  "no_units",
  "invalid_team",
] as const

/** The translated reason for one team's outcome. */
export function reasonKeyForTeamOutcome(
  outcome: Pick<V1TeamOutcome, "status" | "code">
): ReasonKey {
  if (outcome.status === "Imported")
    return "goals.v1Import.teams.reasons.imported"
  return outcome.code &&
    (OUTCOME_CODES as readonly string[]).includes(outcome.code)
    ? (`goals.v1Import.teams.reasons.${outcome.code}` as ReasonKey)
    : "goals.v1Import.reasons.generic"
}

type IssueKey =
  | "goals.v1Import.teams.issues.unit_not_recognised"
  | "goals.v1Import.teams.issues.campaign_not_recognised"
  | "goals.v1Import.teams.issues.duplicate_unit"
  | "goals.v1Import.teams.issues.flex_dropped"
  | "goals.v1Import.teams.issues.name_shortened"
  | "goals.v1Import.teams.issues.notes_shortened"
  | "goals.v1Import.teams.issues.unknown"

const IMPORT_ISSUE_CODES = [
  "unit_not_recognised",
  "campaign_not_recognised",
  "duplicate_unit",
  "flex_dropped",
  "name_shortened",
  "notes_shortened",
] as const

/** A team's issue: a team rule it breaks (its copy is the Teams page's), or an import issue. */
export type TeamImportIssue =
  | { kind: "rule"; code: TeamRuleCode }
  | { kind: "import"; key: IssueKey; value: string | null }

export function classifyTeamIssue(issue: V1TeamIssue): TeamImportIssue {
  const rule = TEAM_RULE_CODES.find((code) => code === issue.code)
  if (rule) return { kind: "rule", code: rule }
  return {
    kind: "import",
    key: (IMPORT_ISSUE_CODES as readonly string[]).includes(issue.code)
      ? (`goals.v1Import.teams.issues.${issue.code}` as IssueKey)
      : "goals.v1Import.teams.issues.unknown",
    value: issue.value,
  }
}

type PartReasonKey =
  | "goals.v1Import.teams.partReasons.missing_teams"
  | "goals.v1Import.teams.partReasons.invalid_teams"
  | "goals.v1Import.teams.partReasons.teams_skipped"
  | "goals.v1Import.teams.partReasons.team_import_failed"

const PART_CODES = [
  "missing_teams",
  "invalid_teams",
  "teams_skipped",
  "team_import_failed",
] as const

/** The translated reason for the part's own code; undefined for an unknown code, whose server
 *  message is shown instead. */
export function reasonKeyForTeamPart(code: string): PartReasonKey | undefined {
  return (PART_CODES as readonly string[]).includes(code)
    ? (`goals.v1Import.teams.partReasons.${code}` as PartReasonKey)
    : undefined
}
