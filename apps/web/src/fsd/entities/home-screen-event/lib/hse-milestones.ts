import type { GameCatalogHseTier } from "@workspace/game-catalog"

export type HseMilestoneCell = {
  /** Points this cell adds: its cumulative points minus the previous milestone's, or the repeat step. */
  points: number
  /** Cumulative points at which the reward is earned; for the endless cell, the first repeat. */
  cumulativePoints: number
  rewardId: string
  quantity: number
  endless: boolean
  /** At most this many repeats of the endless cell; null without a cap or for a milestone. */
  cap: number | null
}

/** The milestone grid of a tier: one cell per milestone, then the repeat step as the endless cell. */
export function hseMilestoneCells(
  tier: Pick<GameCatalogHseTier, "milestones" | "repeat">
): HseMilestoneCell[] {
  const cells: HseMilestoneCell[] = tier.milestones.map((milestone, index) => ({
    points:
      milestone.requiredPoints -
      (index === 0 ? 0 : tier.milestones[index - 1]!.requiredPoints),
    cumulativePoints: milestone.requiredPoints,
    rewardId: milestone.rewardId,
    quantity: milestone.quantity,
    endless: false,
    cap: null,
  }))
  const final = tier.milestones.at(-1)?.requiredPoints ?? 0
  if (tier.repeat)
    cells.push({
      points: tier.repeat.points,
      cumulativePoints: final + tier.repeat.points,
      rewardId: tier.repeat.rewardId,
      quantity: tier.repeat.quantity,
      endless: true,
      cap: tier.repeat.cap,
    })
  return cells
}

/**
 * The player's progress as the game shows it: milestones completed (repeats of the endless cell
 * count past the last milestone) and the points earned toward the next one, which restart at 0 after
 * each milestone.
 */
export type HseMilestoneProgress = {
  milestonesDone: number
  pointsInMilestone: number
}

export const NO_HSE_MILESTONE_PROGRESS: HseMilestoneProgress = {
  milestonesDone: 0,
  pointsInMilestone: 0,
}

/** The most milestones the player can complete: every milestone plus the capped repeats; null without a cap. */
export function hseMilestonesMax(
  cells: readonly HseMilestoneCell[]
): number | null {
  const endless = cells.at(-1)?.endless ? cells.at(-1)! : null
  const regular = endless ? cells.length - 1 : cells.length
  if (!endless) return regular
  return endless.cap === null ? null : regular + endless.cap
}

/** The cell the player is working toward after `milestonesDone` milestones; null once every one is done. */
export function hseCurrentMilestoneCell(
  cells: readonly HseMilestoneCell[],
  milestonesDone: number
): HseMilestoneCell | null {
  const max = hseMilestonesMax(cells)
  if (max !== null && milestonesDone >= max) return null
  const endless = cells.at(-1)?.endless ? cells.at(-1)! : null
  const regular = endless ? cells.length - 1 : cells.length
  return milestonesDone < regular ? cells[milestonesDone]! : endless
}

/**
 * Cumulative points of `progress`: the completed milestones' points (the repeat step for each repeat)
 * plus the points in the current one, capped at that milestone's points.
 */
export function hseProgressPoints(
  cells: readonly HseMilestoneCell[],
  progress: HseMilestoneProgress
): number {
  const max = hseMilestonesMax(cells)
  const done = Math.max(
    0,
    Math.floor(
      max === null
        ? progress.milestonesDone
        : Math.min(progress.milestonesDone, max)
    )
  )
  let total = 0
  for (let index = 0; index < done; index++)
    total += hseCurrentMilestoneCell(cells, index)?.points ?? 0
  const current = hseCurrentMilestoneCell(cells, done)
  return (
    total +
    (current
      ? Math.min(Math.max(0, progress.pointsInMilestone), current.points)
      : 0)
  )
}
