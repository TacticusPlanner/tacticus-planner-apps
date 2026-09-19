import {
  consumeOwnedBooks,
  isMowDetail,
  maxLevelReachableWithXp,
  ownedBooksByRarity,
  xpNeededForLevelRange,
} from "@/features/goal-farming"
import type { GoalDetail } from "@/entities/goal"

export type LevelGoalNeed = {
  goalId: string
  priority: number
  currentLevel: number
  currentXp: number
  targetLevel: number
}

/** A Level goal's `LevelGoalNeed`, one per goal that has a priority and a synced owned unit to read
 *  xpLevel/xp from — split out of `plan-insights-calc.ts`'s main per-detail loop (this repo's
 *  max-lines rule) since a Level goal never produces the `need`/`stages` output that loop's body is
 *  gated behind (`calculateGoalResourceNeed`/`calculateGoalFarmingStages` only handle Rank/Ability/
 *  Ascension/Unlock), so it needs its own pass over `orderedDetails`. */
export function buildLevelGoalNeeds(params: {
  orderedDetails: readonly GoalDetail[]
  priorityByGoalId: ReadonlyMap<string, number>
  playerCharacterById: ReadonlyMap<
    string,
    { xpLevel: number; xp: number } | undefined
  >
  playerMowById: ReadonlyMap<
    string,
    { xpLevel: number; xp: number } | undefined
  >
}): LevelGoalNeed[] {
  const levelGoalNeeds: LevelGoalNeed[] = []
  for (const detail of params.orderedDetails) {
    if (detail.goalType !== "Level" || !detail.config.level) continue
    const priority = params.priorityByGoalId.get(detail.goalId)
    if (priority === undefined) continue
    const ownedUnit = isMowDetail(detail)
      ? params.playerMowById.get(detail.entityId)
      : params.playerCharacterById.get(detail.entityId)
    if (!ownedUnit) continue
    levelGoalNeeds.push({
      goalId: detail.goalId,
      priority,
      currentLevel: ownedUnit.xpLevel,
      currentXp: ownedUnit.xp,
      targetLevel: detail.config.level.end,
    })
  }
  return levelGoalNeeds
}

/** The highest level each Level goal's own XP need can reach *right now*, spending the account's
 *  shared, indivisible XP-book pool in priority order — mirrors how Rank/Ability goals share their
 *  upgrade-material inventory (`allocatePlanInventory`) and Ascension goals share alliance orbs
 *  (`allocateOrbInventory`): a higher-priority goal's allocation is computed first and its spent
 *  books are removed from the pool before the next goal's allocation runs, so two Level goals never
 *  double-count the same books. Applying a book is all-or-nothing in-game (see `consumeOwnedBooks`),
 *  so a goal's leftover XP within a spent book still counts toward *that* goal, never a later one. */
export function allocateXpBooksAcrossGoals(
  goals: readonly LevelGoalNeed[],
  ownedXpBooks: readonly { xpBookId: string; amount: number }[] | undefined
): Map<string, number> {
  let pool = ownedBooksByRarity(ownedXpBooks)
  const orderedGoals = [...goals].sort((a, b) => a.priority - b.priority)

  const potentialLevelByGoalId = new Map<string, number>()
  for (const goal of orderedGoals) {
    const xpNeeded = xpNeededForLevelRange(
      goal.currentLevel,
      goal.currentXp,
      goal.targetLevel
    )
    if (xpNeeded <= 0) continue

    const { remainingXp, remainingOwned } = consumeOwnedBooks(xpNeeded, pool)
    pool = remainingOwned
    const allocatedXp = xpNeeded - remainingXp
    potentialLevelByGoalId.set(
      goal.goalId,
      maxLevelReachableWithXp(
        goal.currentLevel,
        goal.currentXp,
        goal.targetLevel,
        allocatedXp
      )
    )
  }
  return potentialLevelByGoalId
}
