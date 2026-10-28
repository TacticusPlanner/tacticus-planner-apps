import type { ComponentProps } from "react"
import type { BattleId } from "@workspace/game-domain"

import {
  buildOnslaughtRuns,
  isLocationVisible,
  selectTodayRaids,
  type DailyRaidBattleResource,
  type DailyRaidsReadyViewModel,
  type RaidSchedule,
} from "@/features/daily-raids"

export const BONUS_LIMIT = 3

type TodayRaidsSelection = ReturnType<typeof selectTodayRaids>
type RaidEntry = TodayRaidsSelection["planEntries"][number]

export type TodayView = {
  selection: TodayRaidsSelection
  /** Bonus entries to render: every entry at the limit, otherwise the top 3 unless expanded. */
  bonusShown: RaidEntry[]
  /** Below the limit there are more bonus entries than the top 3 (Show more / Show less applies). */
  bonusHasMore: boolean
  scheduleProps: Omit<ComponentProps<typeof RaidSchedule>, "entries" | "testId">
  /** Location rows the plan card shows (a node with no real attempts left is not shown). */
  planNodeCount: number
  /** Location rows across every bonus entry, not just the ones shown. */
  bonusNodeCount: number
  attempts: { rows: number; total: number }
  planResourceByBattle: ReadonlyMap<BattleId, DailyRaidBattleResource>
  onslaughtRuns: ReturnType<typeof buildOnslaughtRuns>
  /** Today's whole Onslaught tokens: a token is spent whole, so the expected runs round up. */
  onslaughtTokens: number
  /** Real energy spent today as a percentage of the daily energy, not capped at 100. */
  energy: { percent: number; overLimit: boolean }
  planned: { energy: number; raids: number }
}

/**
 * Everything Today shows, derived once from the ready raids so the cards and the glance tiles can't
 * disagree. Moved verbatim from the former `TodaySchedule`.
 */
export function buildTodayView(
  raids: DailyRaidsReadyViewModel,
  { showAllBonus }: { showAllBonus: boolean }
): TodayView {
  // Exhausted bonus locations are dropped before slicing to BONUS_LIMIT — otherwise an actionable
  // entry past the limit can become unreachable if the first few entries all happen to be exhausted.
  // Once today's real energy spend reaches the daily limit, the plan is dropped and Bonus Raids is
  // the only raids list, shown in full.
  const selection = selectTodayRaids({
    todayEntries: raids.today.entries,
    bonusEntries: raids.bonus.entries,
    raidsLeftTodayEntries: raids.raidsLeftToday.entries,
    attemptsLeftByBattle: raids.attemptsLeftByBattle,
    dailyEnergy: raids.dailyEnergy,
    realEnergyUsedToday: raids.realEnergyUsedToday,
  })
  const overLimit = selection.energyLimitReached
  const bonusShown =
    overLimit || showAllBonus
      ? selection.bonusEntries
      : selection.bonusEntries.slice(0, BONUS_LIMIT)

  // Passed as one combined map alongside the combined entries below — only Raids Plan's own
  // (unaffected) material-emphasis rendering ever reads this for its per-node fully-raided chip;
  // the "location" emphasis path used here relies on `attemptsLeftByBattle` instead.
  const combinedAttemptsUsedByBattle = new Map(raids.today.attemptsUsedByBattle)
  for (const [battleId, used] of raids.bonus.attemptsUsedByBattle) {
    combinedAttemptsUsedByBattle.set(
      battleId,
      (combinedAttemptsUsedByBattle.get(battleId) ?? 0) + used
    )
  }

  // Today's Attempts is account-wide, so most locations there sit outside this project's plan. Where
  // this project's schedule/Bonus Raids do name a node, that entry wins — the resource the player is
  // actually farming beats the node's generic drop — and the first plan entry per node wins, as
  // before. Every other node falls back to the catalog's own node → drop index so it still gets an
  // icon (tacticus-planner-apps#121); the fallback is read per row rather than merged in here, so
  // the catalog-wide index is never copied on a render.
  const planResourceByBattle = new Map<BattleId, DailyRaidBattleResource>()
  for (const entry of [...raids.today.entries, ...raids.bonus.entries]) {
    if (planResourceByBattle.has(entry.battleId)) continue
    const visual = raids.resourceVisuals.get(entry.resourceId)
    if (!visual) continue
    planResourceByBattle.set(entry.battleId, {
      label: raids.resourceLabels.get(entry.resourceId) ?? entry.resourceId,
      visual,
    })
  }

  // Today's share of the account's Onslaught tokens, already split across goals in priority order by
  // the same run the Schedule's day cards read.
  const onslaughtRuns = buildOnslaughtRuns(raids.today, raids)
  const onslaughtRunsTotal = onslaughtRuns.reduce(
    (sum, run) => sum + run.runs,
    0
  )

  const visibleRows = (entries: readonly RaidEntry[]) =>
    entries.filter((entry) =>
      isLocationVisible(entry, raids.attemptsLeftByBattle)
    ).length

  return {
    selection,
    bonusShown,
    bonusHasMore: !overLimit && selection.bonusEntries.length > BONUS_LIMIT,
    scheduleProps: {
      attemptsLeftByBattle: raids.attemptsLeftByBattle,
      attemptsUsedByBattle: combinedAttemptsUsedByBattle,
      cardLayout: "grid",
      emphasis: "location",
      goalsById: raids.goalsById,
      locationsByBattleId: raids.locationsByBattleId,
      resourceLabels: raids.resourceLabels,
      resourceProgress: raids.resourceProgressByDay.get(1) ?? new Map(),
      resourceUrgencyByGoalAndResource: raids.resourceUrgencyByGoalAndResource,
      resourceVisuals: raids.resourceVisuals,
    },
    planNodeCount: visibleRows(selection.planEntries),
    bonusNodeCount: visibleRows(selection.bonusEntries),
    attempts: {
      rows: raids.todaysAttempts.length,
      total: raids.todaysAttempts.reduce(
        (sum, attempt) => sum + attempt.attemptsUsed,
        0
      ),
    },
    planResourceByBattle,
    onslaughtRuns,
    onslaughtTokens: Math.ceil(onslaughtRunsTotal),
    energy: {
      percent:
        raids.dailyEnergy > 0
          ? (raids.realEnergyUsedToday / raids.dailyEnergy) * 100
          : 0,
      overLimit,
    },
    planned: { energy: raids.today.energyTotal, raids: raids.today.raidsTotal },
  }
}
