import type { BattleId } from "@workspace/game-domain"

import type { Battle } from "@/shared/lib"

import type { DailyRaidsCalculationViewModel } from "./daily-raids.domain"
import {
  planMissionRaids,
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
 * synced attempts, energy left today and filters; Today's plan is not counted. The campaign-type Raids
 * Filter does not apply: every campaign battle counts as a win, so a type picked for farming drops
 * must not hide the cheapest nodes (the other filters still apply). A request's `slots` replaces the
 * slots filter and its `alliance` the allies-alliance filter; its `enemyFaction` adds the nodes
 * with that faction's enemies, each raid counting the node's enemies as kills.
 */
export function planHookMissionRaids(input: {
  request: MissionRaidsRequest
  calculation: DailyRaidsCalculationViewModel | null
  availableBattles: readonly (Pick<Battle, "energyCost" | "dailyAttempts"> & {
    id: string
    campaignGroupId: string
    type: string
    nodeNumber: number
    rewards: {
      guaranteed: readonly { id: string; min: number; max: number }[]
      potential: readonly { id: string; effectiveRate: number | null }[]
    }
  })[]
  campaignDefinitions: readonly {
    groupId: string
    releaseType?: string | null
  }[]
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
  const { enemyFaction } = input.request
  const filters: RaidsFilters = {
    ...input.raidsFilters,
    campaignTypes: [],
    ...(input.request.slots ? { slots: [input.request.slots] } : {}),
    ...(input.request.alliance
      ? { alliesAlliances: [input.request.alliance] }
      : {}),
  }
  return planMissionRaids({
    ...input.request,
    battles: input.availableBattles.map((battle) => ({
      id: battle.id as BattleId,
      energyCost: battle.energyCost,
      dailyAttempts: battle.dailyAttempts,
      isEvent: eventCampaignIds.has(battle.campaignGroupId),
      expectedGold: expectedGold(battle.rewards.guaranteed),
      lightningCondition: hasLightningCondition(battle),
      dropRates: new Map(
        battle.rewards.potential.map((reward) => [
          reward.id,
          reward.effectiveRate ?? 0,
        ])
      ),
    })),
    attemptsLeftByBattle: input.attemptsLeftByBattle,
    dailyEnergy: input.dailyEnergy,
    realEnergyUsedToday: input.realEnergyUsedToday,
    goalNodesByBattle: input.calculation?.missionGoalNodes ?? new Map(),
    passesFilter: (battleId) => {
      const battle = input.filterBattlesById.get(battleId)
      return !battle || passLocationFilter(battle, filters)
    },
    factionKillsPerRaid: enemyFaction
      ? (battleId) => {
          const battle = input.filterBattlesById.get(battleId)
          return battle?.enemiesFactions.includes(enemyFaction.faction)
            ? battle.enemiesTotal
            : 0
        }
      : undefined,
  })
}

/** Indomitus, whose nodes below 19 have no lightning-victory condition (Severyn, 2026-10). */
const INDOMITUS_GROUP_ID = "campaign1"
const FIRST_LIGHTNING_INDOMITUS_NODE = 19

const hasLightningCondition = (battle: {
  campaignGroupId: string
  nodeNumber: number
}) =>
  battle.campaignGroupId !== INDOMITUS_GROUP_ID ||
  battle.nodeNumber >= FIRST_LIGHTNING_INDOMITUS_NODE

const expectedGold = (
  guaranteed: readonly { id: string; min: number; max: number }[]
) => {
  const gold = guaranteed.find((reward) => reward.id === "gold")
  return gold ? (gold.min + gold.max) / 2 : 0
}
