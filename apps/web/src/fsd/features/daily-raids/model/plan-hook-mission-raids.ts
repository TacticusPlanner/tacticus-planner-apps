import type { BattleId } from "@workspace/game-domain"

import type { Battle } from "@/shared/lib"

import type { DailyRaidsCalculationViewModel } from "./daily-raids.domain"
import {
  planMissionRaids,
  remainingPlannedRaids,
  type MissionRaidPlan,
  type MissionRaidsRequest,
} from "./mission-raids"
import { passLocationFilter } from "./raids-filters/pass-location-filter"
import type {
  RaidsFilterBattle,
  RaidsFilters,
} from "./raids-filters/raids-filters.domain"

/**
 * `useDailyRaids`' HRE suggestions: the mission request applied to the hook's eligible battles,
 * synced attempts, energy and filters. Today's remaining plan is its entries less the attempts
 * already used today (attempts used = the node's cap less its synced attempts left).
 */
export function planHookMissionRaids(input: {
  request: MissionRaidsRequest
  calculation: DailyRaidsCalculationViewModel | null
  availableBattles: readonly (Pick<Battle, "energyCost" | "dailyAttempts"> & {
    id: string
    campaignGroupId: string
  })[]
  campaignDefinitions: readonly {
    groupId: string
    releaseType?: string | null
  }[]
  allBattlesById: ReadonlyMap<BattleId, Pick<Battle, "dailyAttempts">>
  attemptsLeftByBattle: ReadonlyMap<BattleId, number>
  dailyEnergy: number
  realEnergyUsedToday: number
  filterBattlesById: ReadonlyMap<string, RaidsFilterBattle>
  raidsFilters: RaidsFilters
}): MissionRaidPlan {
  const eventCampaignIds = new Set(
    input.campaignDefinitions
      .filter((definition) => definition.releaseType === "event")
      .map((definition) => definition.groupId)
  )
  const attemptsUsed = new Map<BattleId, number>()
  for (const [battleId, left] of input.attemptsLeftByBattle) {
    const cap = input.allBattlesById.get(battleId)?.dailyAttempts ?? 0
    attemptsUsed.set(battleId, Math.max(0, cap - left))
  }
  return planMissionRaids({
    ...input.request,
    battles: input.availableBattles.map((battle) => ({
      id: battle.id as BattleId,
      energyCost: battle.energyCost,
      dailyAttempts: battle.dailyAttempts,
      isEvent: eventCampaignIds.has(battle.campaignGroupId),
    })),
    attemptsLeftByBattle: input.attemptsLeftByBattle,
    plannedByBattle: input.calculation
      ? remainingPlannedRaids(input.calculation.today.entries, attemptsUsed)
      : new Map(),
    dailyEnergy: input.dailyEnergy,
    realEnergyUsedToday: input.realEnergyUsedToday,
    goalNodesByBattle: input.calculation?.missionGoalNodes ?? new Map(),
    passesFilter: (battleId) => {
      const battle = input.filterBattlesById.get(battleId)
      return !battle || passLocationFilter(battle, input.raidsFilters)
    },
  })
}
