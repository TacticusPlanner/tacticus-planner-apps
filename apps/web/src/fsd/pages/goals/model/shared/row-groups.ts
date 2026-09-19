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
