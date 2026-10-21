import { useMemo } from "react"
import type { BattleId } from "@workspace/game-domain"

import {
  battleEnemyStats,
  type BattleEnemyStats,
  type StatsBattle,
  type StatsNpc,
} from "./battle-enemy-stats"
import {
  battleEventPoints,
  type RuleBattle,
  type RuleNpc,
} from "./home-screen-event-rules"

type MapsBattle = RuleBattle & StatsBattle & { id: string }
type MapsNpc = RuleNpc & StatsNpc

/**
 * Per-battle values `useDailyRaids` reads from the `npcs` dataset once it has loaded: the points
 * one raid earns in the running Home Screen Event (`homeScreenEventId`), and, while `enemyStats`
 * (the HRE battles fought by hand), each battle's enemy health and enemies per faction.
 */
export function useBattleMaps(input: {
  homeScreenEventId: string | undefined
  enemyStats: boolean
  battles: readonly MapsBattle[] | undefined
  npcsById: ReadonlyMap<string, MapsNpc> | undefined
}): {
  eventPointsByBattleId: ReadonlyMap<BattleId, number> | undefined
  enemyStatsByBattleId: ReadonlyMap<BattleId, BattleEnemyStats> | undefined
} {
  const { homeScreenEventId, enemyStats, battles, npcsById } = input
  const eventPointsByBattleId = useMemo(() => {
    if (!homeScreenEventId || !npcsById) return undefined
    return new Map(
      (battles ?? []).map((battle) => [
        battle.id as BattleId,
        battleEventPoints(homeScreenEventId, battle, npcsById),
      ])
    )
  }, [homeScreenEventId, npcsById, battles])
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
