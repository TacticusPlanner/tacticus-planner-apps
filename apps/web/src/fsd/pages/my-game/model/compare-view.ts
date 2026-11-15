import {
  contributesTo,
  summarizeRosterDiff,
  type RosterDiffMetric,
  type RosterDiffSummary,
  type UnitDiff,
} from "@/entities/roster-snapshot"
import type { UnitTileUnit } from "@/entities/unit"

import type { CompareOrder } from "./compare-query"

/** The fields setting (design D7): which changes the chips and details show. */
export const compareFields = [
  "shards",
  "mythicShards",
  "xp",
  "upgrades",
  "abilities",
  "equipment",
  "power",
] as const
export type CompareField = (typeof compareFields)[number]

export interface CompareItem {
  unit: UnitTileUnit
  diff: UnitDiff
}

export interface CompareView {
  /** Over the units matching the search, filters, quick filter and Legendary Event filter. */
  summary: RosterDiffSummary
  /** How many units the summary covers. */
  matching: number
  /** Changed units passing the selected metric, in the chosen order. */
  changed: CompareItem[]
  /** Unchanged matching units, in Collection's order (listed only with "Show unchanged"). */
  unchanged: CompareItem[]
}

export interface CompareViewOptions {
  metric: RosterDiffMetric | null
  /** The Legendary Event filter's members and reserves; null when no event is selected. */
  teamUnitIds: ReadonlySet<string> | null
  order: CompareOrder
  locale: string
}

/**
 * Compare mode's list (spec: "Compare mode lists changed units by power gain"): `units` are the
 * Collection view's listed units in the "to" state, already searched, filtered and sorted;
 * `diffs` the shared roster diff by unit id. Units not owned in "to" are left out.
 */
export function buildCompareView(
  units: readonly UnitTileUnit[],
  diffs: ReadonlyMap<string, UnitDiff>,
  options: CompareViewOptions
): CompareView {
  const matching: CompareItem[] = []
  for (const unit of units) {
    if (unit.data.state !== "owned") continue
    if (options.teamUnitIds && !options.teamUnitIds.has(unit.unitId)) continue
    const diff = diffs.get(unit.unitId)
    if (diff) matching.push({ unit, diff })
  }
  const summary = summarizeRosterDiff(matching.map((item) => item.diff))
  const changed = matching.filter(
    (item) =>
      item.diff.changed &&
      (options.metric === null || contributesTo(item.diff, options.metric))
  )
  if (options.order === "gain") {
    changed.sort(
      (a, b) =>
        (b.diff.power?.delta ?? 0) - (a.diff.power?.delta ?? 0) ||
        a.unit.name.localeCompare(b.unit.name, options.locale)
    )
  }
  return {
    summary,
    matching: matching.length,
    changed,
    unchanged: matching.filter((item) => !item.diff.changed),
  }
}

/** The members and reserves of an event plan's teams, optionally in one lane. */
export function teamUnitIdsOf(
  teams: readonly {
    laneId: string
    memberUnitIds: readonly string[]
    reserveUnitId: string | null
  }[],
  lane: string | null
): Set<string> {
  return new Set(
    teams
      .filter((team) => lane === null || team.laneId === lane)
      .flatMap((team) => [
        ...team.memberUnitIds,
        ...(team.reserveUnitId ? [team.reserveUnitId] : []),
      ])
  )
}

const FIELDS_SEPARATOR = ","

/** The fields setting as stored; all on when nothing (or nothing valid) is stored. */
export function parseCompareFields(raw: string | null): Set<CompareField> {
  if (raw === null) return new Set(compareFields)
  const stored = raw
    .split(FIELDS_SEPARATOR)
    .filter((value): value is CompareField =>
      (compareFields as readonly string[]).includes(value)
    )
  // An explicit empty selection is kept; garbage falls back to all on.
  return raw === "" || stored.length > 0
    ? new Set(stored)
    : new Set(compareFields)
}

export function serializeCompareFields(
  fields: ReadonlySet<CompareField>
): string {
  return compareFields
    .filter((field) => fields.has(field))
    .join(FIELDS_SEPARATOR)
}
