import {
  maxRankForProgression,
  progressionIndex,
  progressionOrder,
  rankIndex,
  rankOrder,
  type Progression,
  type Rank,
  type Rarity,
} from "@workspace/game-domain"

import type { LegendaryEventRosterUnit } from "../model/types"
import { unlockedBaseUnit } from "./goal-preview-roster"

export type UpgradeStep =
  | { kind: "unlock"; unit: LegendaryEventRosterUnit }
  | { kind: "rank"; rank: Rank; unit: LegendaryEventRosterUnit }
  | {
      kind: "ascension"
      progression: Progression
      unit: LegendaryEventRosterUnit
    }

/**
 * A unit's next steps (spec: next upgrade steps of a team member): Unlock when the roster lacks it;
 * otherwise the next rank with no applied upgrades while the rarity allows it, and the next
 * progression step. Ability levels never change.
 */
export function nextUpgradeSteps(
  rosterUnit: LegendaryEventRosterUnit | undefined,
  unitId: string,
  initialRarity: Rarity | undefined
): UpgradeStep[] {
  if (!rosterUnit) {
    return [{ kind: "unlock", unit: unlockedBaseUnit(unitId, initialRarity) }]
  }
  const steps: UpgradeStep[] = []
  const nextRank = rankOrder[rankIndex(rosterUnit.rank) + 1]
  if (
    nextRank &&
    rankIndex(nextRank) <=
      rankIndex(maxRankForProgression(rosterUnit.progressionIndex))
  ) {
    steps.push({
      kind: "rank",
      rank: nextRank,
      unit: { ...rosterUnit, rank: nextRank, appliedUpgradeSlots: [] },
    })
  }
  const nextProgression =
    progressionOrder[progressionIndex(rosterUnit.progressionIndex) + 1]
  if (nextProgression) {
    steps.push({
      kind: "ascension",
      progression: nextProgression,
      unit: { ...rosterUnit, progressionIndex: nextProgression },
    })
  }
  return steps
}
