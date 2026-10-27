import type { DailyRaidsViewModel } from "@/features/daily-raids"

/** The player's goal need for one quest drop: have / need and up to 3 units, in goal priority. */
export type QuestDropNeed =
  | { status: "loading" }
  | { status: "error" }
  | { status: "none" }
  | { status: "need"; have: number; need: number; units: string[] }

const MAX_UNITS = 3

/**
 * A drop's need over the player's active goals, read from the goal-farming run the Raids tab plans:
 * its have / need totals for the material, and the units of the goals needing it, by priority.
 */
export function questDropNeed(
  raids: DailyRaidsViewModel,
  upgradeId: string
): QuestDropNeed {
  if (raids.status === "loading") return { status: "loading" }
  if (raids.status === "error") return { status: "error" }
  if (raids.status !== "ready") return { status: "none" }
  const totals = raids.resourceTotals.get(upgradeId)
  if (!totals || totals.target <= totals.owned) return { status: "none" }
  const units: string[] = []
  const goals = [...raids.goalsById.values()].sort(
    (a, b) => a.priority - b.priority
  )
  for (const goal of goals) {
    if (units.length >= MAX_UNITS) break
    if (
      !raids.resourceUrgencyByGoalAndResource.has(`${goal.goalId}:${upgradeId}`)
    )
      continue
    if (!units.includes(goal.unitLabel)) units.push(goal.unitLabel)
  }
  return { status: "need", have: totals.owned, need: totals.target, units }
}
