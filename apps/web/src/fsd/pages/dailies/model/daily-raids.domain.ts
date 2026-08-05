import type {
  BattleId,
  Rank,
  Rarity,
  UnitId,
  UpgradeId,
} from "@workspace/game-domain"

import type { GoalKind } from "@/entities/goal"
import type { RaidDaySchedule, RaidPlanSummary } from "@/features/goal-farming"

import type { TodaysAttempt } from "./daily-raids-energy"

export type DailyRaidGoalViewModel = {
  goalId: string
  priority: number
  unitId: UnitId
  unitType: "Character" | "Mow"
  unitLabel: string
  targetLabel: string
  goalKind: GoalKind
  // Only set when goalKind === "Rank" — the raw target rank, for icon-only rendering.
  targetRank?: Rank
}

export type DailyRaidResourceVisual =
  | {
      kind: "upgrade"
      id: UpgradeId
      rarity: Rarity
      crafted: boolean
    }
  | { kind: "shard"; unitId: UnitId }

export type DailyRaidResourceProgress = {
  owned: number
  target: number
}

export type DailyRaidLocationViewModel = {
  id: string
  // Full campaign/tier name (e.g. "Indomitus Elite") for the location-primary Today/Bonus rendering.
  fullName: string
  // Compact "{name} {code} {node}{B?}" form Raids Plan's chips still use verbatim.
  shortLabel: string
  nodeNumber: number
  challenge: boolean
  icon?: string
}

export function dailyRaidResourceKey(goalId: string, resourceId: string) {
  return `${goalId}:${resourceId}`
}

export type DailyRaidsReadyViewModel = {
  status: "ready"
  today: RaidDaySchedule
  bonus: RaidDaySchedule
  planDays: RaidDaySchedule[]
  planSummary: RaidPlanSummary
  dailyEnergy: number
  goalsById: ReadonlyMap<string, DailyRaidGoalViewModel>
  resourceLabels: ReadonlyMap<string, string>
  resourceVisuals: ReadonlyMap<string, DailyRaidResourceVisual>
  resourceProgressByDay: ReadonlyMap<
    number,
    ReadonlyMap<string, DailyRaidResourceProgress>
  >
  locationsByBattleId: ReadonlyMap<BattleId, DailyRaidLocationViewModel>
  attemptsUsedByBattle: ReadonlyMap<BattleId, number>
  // Real, account-wide energy spent today per synced attempts at standing (non-event) campaign
  // nodes — independent of this project's simulated plan, and NOT capped at `dailyEnergy`.
  realEnergyUsedToday: number
  // Real, per-node attempts remaining today for standing (non-event) campaign nodes, keyed by
  // BattleId — the ground truth for de-duping an exhausted location out of Today's/Bonus's normal
  // schedule listing (attemptsLeft === 0), independent of the simulated plan's own attempt counters.
  attemptsLeftByBattle: ReadonlyMap<BattleId, number>
  // Every standing-campaign node actually raided today, account-wide — backs the "Today's
  // Attempts" section (not scoped to this project's schedule).
  todaysAttempts: TodaysAttempt[]
}

export type DailyRaidsCalculationViewModel = Omit<
  DailyRaidsReadyViewModel,
  | "locationsByBattleId"
  | "realEnergyUsedToday"
  | "attemptsLeftByBattle"
  | "todaysAttempts"
>

export type DailyRaidsViewModel =
  | { status: "no-project" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "no-farmable" }
  | DailyRaidsReadyViewModel
