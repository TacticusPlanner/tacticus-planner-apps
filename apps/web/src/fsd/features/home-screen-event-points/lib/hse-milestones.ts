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
