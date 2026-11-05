import { rankAt, type Rank } from "@workspace/game-domain"

import type {
  EstimateOutcome,
  GoalCheckpointEstimate,
} from "@/features/goal-farming"

/** What a checkpoint is a target of: a rank, or one ability track's level. */
export type CheckpointTarget =
  | { kind: "Rank"; rank: Rank }
  | { kind: "Ability"; track: "primary" | "secondary"; level: number }

export type CheckpointRow = GoalCheckpointEstimate & {
  label: CheckpointTarget | null
}

export type GoalCheckpointsView = {
  rows: CheckpointRow[]
  /** The first checkpoint farming still has to reach; null once every one is covered already. */
  next: CheckpointRow | null
}

/** Reads a stage target (`calculateGoalFarmingStages`: a rank index, or `track:level` for a MoW
 *  Ability goal). Null for a target this view does not know how to name. */
export function parseCheckpointTarget(
  target: string,
  goalType: string
): CheckpointTarget | null {
  if (goalType === "Rank") {
    const index = Number(target)
    return Number.isInteger(index)
      ? { kind: "Rank", rank: rankAt(index) }
      : null
  }
  if (goalType === "Ability") {
    const [track, level] = target.split(":")
    const parsed = Number(level)
    if (
      (track === "primary" || track === "secondary") &&
      Number.isInteger(parsed)
    )
      return { kind: "Ability", track, level: parsed }
  }
  return null
}

/** The checkpoints of a staged goal's estimate ("Every step", "Milestones", …), or null when the
 *  estimate has none to show (one stage, blocked, or not estimated). */
export function goalCheckpointsView(
  estimate: EstimateOutcome | undefined,
  goalType: string
): GoalCheckpointsView | null {
  if (!estimate || estimate.status === "Blocked") return null
  const checkpoints = estimate.checkpoints ?? []
  if (checkpoints.length < 2) return null
  const rows = checkpoints.map((checkpoint) => ({
    ...checkpoint,
    label: parseCheckpointTarget(checkpoint.target, goalType),
  }))
  return { rows, next: rows.find((row) => row.days > 0) ?? null }
}
