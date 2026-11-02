import type { GoalGroupValue } from "@/entities/goal"

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
 * Order is inherited, never imposed: groups come out in first-appearance order and each group's rows
 * keep their incoming order, so whatever Sort the caller applied survives partitioning. Headings are
 * the caller's job — a unit heading needs the catalog and a type heading needs `t`, and both routes
 * already hold those.
 */
export function groupRows(rows: GoalRow[], group: GoalGroupValue): RowGroup[] {
  return [...new Set(rows.map((row) => groupKey(row, group)))].map((key) => ({
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
