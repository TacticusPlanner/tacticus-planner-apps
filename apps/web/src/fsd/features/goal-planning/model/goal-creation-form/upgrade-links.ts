import { useMemo, useState } from "react"

import { linkCandidates, type GoalDetail } from "@/entities/goal"

import type { UpgradeRanges } from "./goal-spec-builder"

type Range = { start: number; end: number }

const overlaps = (left: Range | null | undefined, right: Range) =>
  !!left && left.start < right.end && right.start < left.end

/** The candidates a new Upgrade goal links to by default: those whose span overlaps its range (the
 *  implicit link, made visible). A Rank goal's span reaches one rank further when it ends partway
 *  through a rank. */
export function defaultUpgradeLinks(
  candidates: readonly GoalDetail[],
  ranges: UpgradeRanges
): string[] {
  return candidates
    .filter(({ config: { rank, ability } }) =>
      rank
        ? overlaps(ranges.rankRange, {
            start: rank.start,
            end:
              rank.endPointFive || rank.endAppliedUpgrades > 0
                ? rank.end + 1
                : rank.end,
          })
        : ability
          ? overlaps(ranges.activeRange, {
              start: ability.activeStart,
              end: ability.activeEnd,
            }) ||
            overlaps(ranges.passiveRange, {
              start: ability.passiveStart,
              end: ability.passiveEnd,
            })
          : false
    )
    .map((goal) => goal.goalId)
}

/** "Counts toward" for the create form: the unit's in-flight Rank (or MoW Ability) goals, and which the
 *  new Upgrade goal links to. Until the owner picks, the ones overlapping the range; a pick holds for the
 *  unit it was made on. */
export function useUpgradeLinks(
  inFlight: readonly GoalDetail[],
  unit: { entityType: string; entityId: string },
  ranges: UpgradeRanges
) {
  const { entityType, entityId } = unit
  const candidates = useMemo(
    () => linkCandidates(inFlight, { entityType, entityId }),
    [inFlight, entityType, entityId]
  )
  const [pick, setPick] = useState<{ entityId: string; ids: string[] } | null>(
    null
  )
  const selected =
    pick && pick.entityId === entityId
      ? pick.ids.filter((id) => candidates.some((goal) => goal.goalId === id))
      : defaultUpgradeLinks(candidates, ranges)
  return {
    candidates,
    selected,
    onChange: (ids: string[]) => setPick({ entityId, ids }),
  }
}
