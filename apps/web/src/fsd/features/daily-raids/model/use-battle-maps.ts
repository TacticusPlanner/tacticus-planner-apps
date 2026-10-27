import { useMemo } from "react"
import type { CampaignDefinitionStorageModel } from "@workspace/game-catalog"
import type { BattleId } from "@workspace/game-domain"

import {
  battleEnemyStats,
  type BattleEnemyStats,
  type StatsBattle,
  type StatsNpc,
} from "./battle-enemy-stats"
import {
  battleEventPoints,
  eventCampaignGroupIds,
  type HseRaidRule,
  type RuleBattle,
  type RuleNpc,
} from "./home-screen-event-rules"

type MapsBattle = RuleBattle & StatsBattle & { id: string }
type MapsNpc = RuleNpc & StatsNpc

/**
 * Per-battle values `useDailyRaids` reads from the `npcs` dataset once it has loaded: the points
 * one raid earns under the Home Screen Event's raid rule (`homeScreenEventRule`), and, while `enemyStats`
 * (the HRE battles fought by hand), each battle's enemy health and enemies per faction.
 */
export function useBattleMaps(input: {
  homeScreenEventRule: HseRaidRule | undefined
  enemyStats: boolean
  battles: readonly MapsBattle[] | undefined
  campaignDefinitions: readonly CampaignDefinitionStorageModel[] | undefined
  npcsById: ReadonlyMap<string, MapsNpc> | undefined
}): {
  eventPointsByBattleId: ReadonlyMap<BattleId, number> | undefined
  enemyStatsByBattleId: ReadonlyMap<BattleId, BattleEnemyStats> | undefined
} {
  const {
    homeScreenEventRule,
    enemyStats,
    battles,
    campaignDefinitions,
    npcsById,
  } = input
  const eventPointsByBattleId = useMemo(() => {
    if (!homeScreenEventRule || !npcsById || !campaignDefinitions)
      return undefined
    const eventGroupIds = eventCampaignGroupIds(campaignDefinitions)
    return new Map(
      (battles ?? []).map((battle) => [
        battle.id as BattleId,
        battleEventPoints(homeScreenEventRule, battle, npcsById, eventGroupIds),
      ])
    )
  }, [homeScreenEventRule, npcsById, campaignDefinitions, battles])
  const enemyStatsByBattleId = useMemo(() => {
    if (!enemyStats || !npcsById) return undefined
    return new Map(
      (battles ?? []).map((battle) => [
        battle.id as BattleId,
        battleEnemyStats(battle, npcsById),
      ])
    )
  }, [enemyStats, npcsById, battles])
  return { eventPointsByBattleId, enemyStatsByBattleId }
}
