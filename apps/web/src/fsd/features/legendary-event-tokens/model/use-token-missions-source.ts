import { useMemo } from "react"

import {
  battleEnemies,
  type BattleEnemies,
  type LegendaryEvent,
  type LegendaryEventBattle,
  type LegendaryEventUnit,
} from "@/entities/legendary-event"
import { useNpcsById } from "@/entities/npc"

import type { TokenPlanMissionsSource } from "../lib/token-plan-view"

/**
 * What the token plan matches missions with: the catalog units by id and each lane battle's
 * enemies from its waves and the `npcs` dataset. Undefined until all three reads are in, so the
 * card shows no mission lines rather than wrong ones.
 */
export function useTokenMissionsSource(
  event:
    | Pick<
        LegendaryEvent,
        "alpha" | "beta" | "gamma" | "regularMissions" | "premiumMissions"
      >
    | undefined,
  units: readonly LegendaryEventUnit[] | undefined,
  battles: readonly LegendaryEventBattle[] | undefined
): TokenPlanMissionsSource | undefined {
  const npcs = useNpcsById()
  const npcsById = npcs.status === "ready" ? npcs.data : undefined
  return useMemo(() => {
    if (!event || !units || !battles || !npcsById) return undefined
    const enemiesById = new Map<string, BattleEnemies>(
      battles.map((battle) => [battle.id, battleEnemies(battle, npcsById)])
    )
    return {
      event,
      unitsById: new Map(units.map((unit) => [unit.id, unit])),
      enemiesOf: (laneId, battleIndex) => {
        const id = event[laneId].battleIds[battleIndex]
        return id === undefined ? undefined : enemiesById.get(id)
      },
    }
  }, [event, units, battles, npcsById])
}
