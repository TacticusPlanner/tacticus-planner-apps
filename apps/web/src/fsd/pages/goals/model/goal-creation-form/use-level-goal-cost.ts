import { useMemo } from "react"

import {
  computeLevelGoalCost,
  type LevelGoalCost,
} from "@/features/goal-farming"

/**
 * Resource-cost preview for a Level goal (plan scope decision: books required + gold to apply,
 * netted against owned books — no day/energy estimate, since XP books aren't campaign-farmable).
 * Only computed while the toggle is actually enabled, matching Rank/Ability's own preview gating.
 * Split out of `use-create-goal-form.ts` purely for that file's own max-lines budget.
 */
export function useLevelGoalCost({
  enabled,
  levelStart,
  levelEnd,
  currentXp,
  inventoryXpBooks,
}: {
  enabled: boolean
  levelStart: number
  levelEnd: number
  currentXp: number
  inventoryXpBooks: readonly { xpBookId: string; amount: number }[] | undefined
}): LevelGoalCost | null {
  return useMemo(
    () =>
      enabled
        ? computeLevelGoalCost({
            currentLevel: levelStart,
            currentXp,
            targetLevel: levelEnd,
            ownedXpBooks: inventoryXpBooks,
          })
        : null,
    [enabled, levelStart, levelEnd, currentXp, inventoryXpBooks]
  )
}
