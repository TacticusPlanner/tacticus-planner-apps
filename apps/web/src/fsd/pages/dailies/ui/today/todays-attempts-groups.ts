import type { BattleId } from "@workspace/game-domain"

/** One node raided today. */
export interface TodaysAttemptRow {
  battleId: BattleId
  attemptsUsed: number
  /** The resource the node drops (undefined for a node the catalog has no drop for). */
  resourceId: string | undefined
  /** The campaign with its difficulty (undefined when the catalog cannot place the node). */
  campaignKey: string | undefined
}

/** Rows that share one upgrade or one campaign, most attempts first. */
export interface TodaysAttemptGroup {
  key: string
  /** The shared upgrade (`upgrade` grouping) or campaign (`campaign` grouping); undefined for a row
   *  that has none, which stands alone. */
  groupKey: string | undefined
  attempts: number
  rows: TodaysAttemptRow[]
}

const byAttempts = (a: TodaysAttemptRow, b: TodaysAttemptRow) =>
  b.attemptsUsed - a.attemptsUsed

/**
 * Today's attempts grouped as the Raids lists are (Group by): by upgrade, one group per material,
 * most attempts first; by campaign, one group per campaign in the plan's campaign order
 * (`campaignOrder`, the campaigns of today's plan as it lists them), then the rest by most attempts.
 * Rows inside a group sort by attempts, most first. A row with no upgrade or campaign is a group of
 * its own.
 */
export function groupTodaysAttempts(
  rows: readonly TodaysAttemptRow[],
  grouping: "upgrade" | "campaign",
  campaignOrder: readonly string[] = []
): TodaysAttemptGroup[] {
  const groups = new Map<string, TodaysAttemptGroup>()
  for (const row of rows) {
    const groupKey = grouping === "upgrade" ? row.resourceId : row.campaignKey
    const key = groupKey === undefined ? `none:${row.battleId}` : groupKey
    const group = groups.get(key) ?? { key, groupKey, attempts: 0, rows: [] }
    group.attempts += row.attemptsUsed
    group.rows.push(row)
    groups.set(key, group)
  }
  for (const group of groups.values()) group.rows.sort(byAttempts)

  const rank = (group: TodaysAttemptGroup) => {
    if (grouping !== "campaign" || group.groupKey === undefined) return -1
    return campaignOrder.indexOf(group.groupKey)
  }
  return [...groups.values()].toSorted((a, b) => {
    const rankA = rank(a)
    const rankB = rank(b)
    if (rankA !== -1 || rankB !== -1) {
      if (rankA === -1) return 1
      if (rankB === -1) return -1
      if (rankA !== rankB) return rankA - rankB
    }
    return b.attempts - a.attempts
  })
}
