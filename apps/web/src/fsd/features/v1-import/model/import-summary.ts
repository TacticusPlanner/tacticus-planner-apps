import type { ImportV1ProfileResult } from "@/entities/account"

import { groupLegendaryEventOutcomes } from "./legendary-event-outcome-buckets"
import { bucketForCode } from "./outcome-buckets"

// The plain parts a summary names when they came across, in display order.
const SUMMARY_PARTS = [
  "personalTacticusApiKey",
  "tacticusUserId",
  "guildApiToken",
  "onslaughtProgress",
  "campaignEventProgress",
] as const

type SummaryPartKey = (typeof SUMMARY_PARTS)[number]

export type ImportSummary = {
  /** Goals created, prerequisites included. */
  goals: number
  /** V1 events whose teams, inputs or marks came across. */
  legendaryEvents: number
  /** V1 roster snapshots stored as personal snapshots. */
  rosterSnapshots: number
  parts: SummaryPartKey[]
}

/** What an import brought across, for the short summary shown above its full report. */
export function importSummary(result: ImportV1ProfileResult): ImportSummary {
  return {
    goals: result.outcomes.filter(
      (outcome) => bucketForCode(outcome.code) === "imported"
    ).length,
    legendaryEvents: groupLegendaryEventOutcomes(
      result.legendaryEventOutcomes ?? []
    ).imported.length,
    rosterSnapshots: (result.rosterSnapshotOutcomes ?? []).filter(
      (outcome) => outcome.status === "imported"
    ).length,
    parts: SUMMARY_PARTS.filter((key) => result[key].status === "Imported"),
  }
}

export function isEmptySummary(summary: ImportSummary): boolean {
  return (
    summary.goals === 0 &&
    summary.legendaryEvents === 0 &&
    summary.rosterSnapshots === 0 &&
    summary.parts.length === 0
  )
}
