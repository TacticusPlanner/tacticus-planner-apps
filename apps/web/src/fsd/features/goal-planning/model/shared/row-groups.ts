import { compareGoalTypes, type GoalGroupValue } from "@/entities/goal"

import type { GoalRow } from "./types"

export type RowGroup = {
  /** `entityType:entityId` for the unit dimension, the goal type for the type dimension, `"all"`
   * when grouping is off — stable enough to key a rendered section on. */
  key: string
  dimension: GoalGroupValue
  rows: GoalRow[]
}

const groupKey = (row: GoalRow, group: GoalGroupValue) =>
  group === "unit"
    ? `${row.entityType}:${row.entityId}`
    : group === "type"
      ? row.goalType
      : "all"

/**
 * Partitions already-filtered, already-sorted rows into the blocks a goals route renders
 * (`project-management`: "Project detail groups by the selected dimension"). Shared by Overview and
 * project detail — both live in this page slice, so this is an intra-slice extraction.
 *
 * Row order is inherited, never imposed: each group's rows keep their incoming order, so whatever Sort
 * the caller applied survives partitioning. Unit groups come out in first-appearance order; type
 * groups in the fixed goal-type order (Rank first, as in v1), so the most-used section always
 * leads instead of moving with whichever type holds the top-priority goal. Headings are
 * the caller's job — a unit heading needs the catalog and a type heading needs `t`, and both routes
 * already hold those.
 */
export function groupRows(rows: GoalRow[], group: GoalGroupValue): RowGroup[] {
  const firstSeen = [...new Set(rows.map((row) => groupKey(row, group)))]
  const keys =
    group === "type" ? firstSeen.toSorted(compareGoalTypes) : firstSeen
  return keys.map((key) => ({
    key,
    dimension: group,
    rows: rows.filter((row) => groupKey(row, group) === key),
  }))
}

/** Identifies a group across dimensions, so collapsing "Rank" under Group by type never collapses a
 * unit section that happens to share its key. */
export const rowGroupId = (rowGroup: Pick<RowGroup, "dimension" | "key">) =>
  `${rowGroup.dimension}:${rowGroup.key}`

/** Rows of the groups the player has not collapsed, in order. Grouping off has a single,
 * header-less group that can never be collapsed. */
export function expandedRows(
  rowGroups: readonly RowGroup[],
  collapsed: ReadonlySet<string>
): GoalRow[] {
  return rowGroups.flatMap((rowGroup) =>
    rowGroup.dimension !== "none" && collapsed.has(rowGroupId(rowGroup))
      ? []
      : rowGroup.rows
  )
}
