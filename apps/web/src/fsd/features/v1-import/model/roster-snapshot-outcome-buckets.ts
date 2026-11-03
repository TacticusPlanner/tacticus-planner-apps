import type { V1RosterSnapshotOutcome } from "@/entities/account"

import type { OutcomeBucketKey } from "./outcome-buckets"

// No roster snapshot outcome asks the user for a manual step.
export type RosterSnapshotBucketKey = Exclude<OutcomeBucketKey, "needsAction">

const STATUS_BUCKETS: Record<
  V1RosterSnapshotOutcome["status"],
  RosterSnapshotBucketKey
> = {
  imported: "imported",
  skippedDuplicate: "needsNoImport",
  skippedDeleted: "notImported",
  skippedLimit: "notImported",
  failed: "failed",
}

export type RosterSnapshotBuckets = Record<
  RosterSnapshotBucketKey,
  V1RosterSnapshotOutcome[]
>

/** Per-snapshot outcomes of the `rosterSnapshots` part, bucketed like goals (design D5). An unknown
 *  status lands in Not imported. */
export function groupRosterSnapshotOutcomes(
  outcomes: readonly V1RosterSnapshotOutcome[]
): RosterSnapshotBuckets {
  const buckets: RosterSnapshotBuckets = {
    imported: [],
    needsNoImport: [],
    notImported: [],
    failed: [],
  }
  for (const outcome of outcomes) {
    buckets[STATUS_BUCKETS[outcome.status] ?? "notImported"].push(outcome)
  }
  return buckets
}

// Literal key unions, so `t()` can verify every key exists (see outcome-buckets.ts' ReasonKey).
type ReasonKey =
  | "goals.v1Import.rosterSnapshots.reasons.imported"
  | "goals.v1Import.rosterSnapshots.reasons.skippedDuplicate"
  | "goals.v1Import.rosterSnapshots.reasons.skippedDeleted"
  | "goals.v1Import.rosterSnapshots.reasons.skippedLimit"
  | "goals.v1Import.rosterSnapshots.reasons.failed"
  | "goals.v1Import.reasons.generic"

/** The translated reason for one snapshot's outcome. */
export function reasonKeyForRosterSnapshotOutcome(
  outcome: Pick<V1RosterSnapshotOutcome, "status">
): ReasonKey {
  return outcome.status in STATUS_BUCKETS
    ? `goals.v1Import.rosterSnapshots.reasons.${outcome.status}`
    : "goals.v1Import.reasons.generic"
}

type PartReasonKey =
  | "goals.v1Import.rosterSnapshots.partReasons.missing_roster_snapshots"
  | "goals.v1Import.rosterSnapshots.partReasons.invalid_roster_snapshots"
  | "goals.v1Import.rosterSnapshots.partReasons.no_roster_snapshot_imported"
  | "goals.v1Import.rosterSnapshots.partReasons.roster_snapshot_import_failed"
  | "goals.v1Import.rosterSnapshots.partReasons.roster_snapshot_import_conflict"

const PART_CODES = [
  "missing_roster_snapshots",
  "invalid_roster_snapshots",
  "no_roster_snapshot_imported",
  "roster_snapshot_import_failed",
  "roster_snapshot_import_conflict",
] as const

/** The translated reason for the part's own code; undefined for an unknown code, whose server
 *  message is shown instead. */
export function reasonKeyForRosterSnapshotPart(
  code: string
): PartReasonKey | undefined {
  return (PART_CODES as readonly string[]).includes(code)
    ? (`goals.v1Import.rosterSnapshots.partReasons.${code}` as PartReasonKey)
    : undefined
}
