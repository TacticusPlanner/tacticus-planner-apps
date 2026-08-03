import type {
  BattleId,
  Rarity,
  UnitId,
  UpgradeId,
} from "@workspace/game-domain"

import type { RaidDaySchedule, RaidPlanSummary } from "@/features/goal-farming"

export type DailyRaidGoalViewModel = {
  goalId: string
  priority: number
  unitId: UnitId
  unitType: "Character" | "Mow"
  unitLabel: string
  targetLabel: string
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
  label: string
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
}

export type DailyRaidsCalculationViewModel = Omit<
  DailyRaidsReadyViewModel,
  "locationsByBattleId"
>

export type DailyRaidsViewModel =
  | { status: "no-project" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "no-farmable" }
  | DailyRaidsReadyViewModel
