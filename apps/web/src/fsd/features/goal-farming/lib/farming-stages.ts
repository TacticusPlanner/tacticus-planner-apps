import { rankOrder } from "@workspace/game-domain"

import type { FarmingStrategy } from "@/entities/goal"

const rankMilestones = [
  "Bronze1",
  "Silver1",
  "Gold1",
  "Diamond1",
  "Diamond3",
  "Adamantine3",
]
const rankMajorMilestones = ["Gold1", "Diamond3", "Adamantine3"]
const abilityMilestones = [17, 26, 35, 50, 60]
const abilityMajorMilestones = [35, 50, 60]

export function farmingStageTargets(
  kind: "rank" | "ability",
  start: number,
  end: number,
  strategy: FarmingStrategy
): number[] {
  if (end <= start) return []
  let candidates: number[]
  if (strategy === "TotalUpgrades") candidates = []
  else if (strategy === "EveryStep") {
    candidates = Array.from(
      { length: end - start },
      (_, index) => start + index + 1
    )
  } else if (kind === "rank") {
    const names =
      strategy === "MajorMilestones" ? rankMajorMilestones : rankMilestones
    candidates = names.map((name) =>
      rankOrder.indexOf(name as (typeof rankOrder)[number])
    )
  } else {
    candidates =
      strategy === "MajorMilestones"
        ? abilityMajorMilestones
        : abilityMilestones
  }
  const targets = candidates.filter((target) => target > start && target <= end)
  if (targets.at(-1) !== end) targets.push(end)
  return targets
}
