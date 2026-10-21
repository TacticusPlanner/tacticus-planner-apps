import type { BattleId } from "@workspace/game-domain"

import type { Battle } from "@/shared/lib"

import type { BattleEnemyStats } from "./battle-enemy-stats"
import type { DailyRaidsCalculationViewModel } from "./daily-raids.domain"
import {
  planMissionRaids,
  type MissionRaidPlan,
  type MissionRaidsRequest,
} from "./mission-raids"
import {
  DEFAULT_SLOTS,
  passLocationFilter,
} from "./raids-filters/pass-location-filter"
import type {
  RaidsFilterBattle,
  RaidsFilters,
} from "./raids-filters/raids-filters.domain"

/**
 * `useDailyRaids`' HRE suggestions: the mission request applied to the hook's eligible battles,
 * synced attempts, energy left today and filters; Today's plan is not counted. The campaign-type Raids
 * Filter does not apply: every campaign battle counts as a win, so a type picked for farming drops
 * must not hide the cheapest nodes (the other filters still apply). The battles fought by hand for
 * the manual objectives keep the same filters, with the request's `slots` replacing the slots
 * filter, its `alliance` the allies-alliance filter, and its `faction` keeping nodes with that
 * faction's enemies. One battle yields the node's enemies as kills (its enemy count, or that
 * faction's enemies), its enemies' total health as damage (`enemyStatsByBattleId`), five ability
 * uses on a 5-slot node, or one win.
 */
export function planHookMissionRaids(input: {
  request: MissionRaidsRequest
  calculation: DailyRaidsCalculationViewModel | null
  availableBattles: readonly (Pick<Battle, "energyCost" | "dailyAttempts"> & {
    id: string
    campaignGroupId: string
    type: string
    nodeNumber: number
    enemyPower?: number
    alliesFactions?: readonly string[]
    slots?: number
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
  /** Points per raid in the running Home Screen Event, when one with a raid rule runs. */
  eventPointsByBattleId?: ReadonlyMap<BattleId, number>
  /** Each node's enemy health and enemies per faction, from the `npcs` dataset. */
  enemyStatsByBattleId?: ReadonlyMap<BattleId, BattleEnemyStats>
}): MissionRaidPlan {
  const eventCampaignIds = new Set(
    input.campaignDefinitions
      .filter((definition) => definition.releaseType === "event")
      .map((definition) => definition.groupId)
  )
  const manual = input.request.manual
  const raidFilters: RaidsFilters = { ...input.raidsFilters, campaignTypes: [] }
  const battleFilters: RaidsFilters = {
    ...raidFilters,
    ...(manual?.slots ? { slots: [manual.slots] } : {}),
    ...(manual?.alliance ? { alliesAlliances: [manual.alliance] } : {}),
    ...(manual?.heroFaction ? { alliesFactions: [manual.heroFaction] } : {}),
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
      enemyPower: battle.enemyPower ?? 0,
      ...(battle.alliesFactions
        ? {
            deploy: {
              factions: battle.alliesFactions,
              slots: battle.slots || DEFAULT_SLOTS,
            },
          }
        : {}),
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
    eventPointsByBattle: input.eventPointsByBattleId,
    passesFilter: (battleId) => {
      const battle = input.filterBattlesById.get(battleId)
      return !battle || passLocationFilter(battle, raidFilters)
    },
    passesBattlesFilter: (battleId) => {
      const battle = input.filterBattlesById.get(battleId)
      if (!battle) return !manual?.faction
      return (
        passLocationFilter(battle, battleFilters) &&
        (!manual?.faction || battle.enemiesFactions.includes(manual.faction))
      )
    },
    battleYield: (battleId, per) => {
      const battle = input.filterBattlesById.get(battleId)
      switch (per) {
        case "battle": {
          return 1
        }
        case "abilityUses": {
          return ABILITY_USES_PER_BATTLE
        }
        case "enemies": {
          return battle?.enemiesTotal ?? 0
        }
        case "factionEnemies": {
          return manual?.faction
            ? (input.enemyStatsByBattleId
                ?.get(battleId)
                ?.byFaction.get(manual.faction) ?? 0)
            : 0
        }
        case "enemyHealth": {
          return input.enemyStatsByBattleId?.get(battleId)?.health ?? 0
        }
      }
    },
  })
}

/** Ability uses one battle fought by hand with five units yields: one each (Severyn: mission 7 at
 * 12 / 20 still needs 2 battles). */
const ABILITY_USES_PER_BATTLE = 5

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
