import { useMemo } from "react"
import type { NpcStorageModel } from "@workspace/game-catalog"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import { isBoardPickup } from "@/features/quest-event"
import { combineReadStates } from "@/shared/lib"
import { toById, useCatalogDataset, usePlayerChunk } from "@/shared/local-data"
import {
  npcPowerAt,
  rosterCharacterPower,
  useUnitPowerContext,
} from "@/shared/unit-power"

import {
  estimateTierRun,
  hasSustain,
  incursionBattlePower,
  lightestPath,
  suggestIncursionTeam,
  teamPowerOf,
  type IncursionCandidate,
  type TierRunEstimate,
} from "./incursion-plan.model"
import { enemyStatRow, type Incursion } from "./incursions.model"

/** One MoW's suggested team and how far it is estimated to get in each tier. */
export type IncursionPlan = {
  team: IncursionCandidate[]
  teamPower: number
  /** The team has a useful Healer or Mechanic, so it loses less HP per battle. */
  sustained: boolean
  /** By tier index; a tier whose enemy power is unknown is missing. */
  tiers: ReadonlyMap<number, TierRunEstimate>
}

export type IncursionPlans =
  | { status: "loading" }
  /** No synced roster, or no power data: nothing to estimate from. */
  | { status: "unavailable"; reason: "unsynced" | "noPower" }
  /** By MoW id; null when the roster has too few heroes of the allowed factions. */
  | { status: "ready"; plans: ReadonlyMap<string, IncursionPlan | null> }

const toRoster = (roster: PlayerDataChunkDto<"characters"> | null) =>
  roster ?? []

/**
 * Per MoW, the suggested team from the synced roster and its estimated run through each tier,
 * enemies taken at their battle levels. Recomputed live and never stored.
 */
export function useIncursionPlans(
  incursions: readonly Incursion[],
  npcsById: ReadonlyMap<string, NpcStorageModel> | undefined
): IncursionPlans {
  const roster = usePlayerChunk("characters", toRoster)
  const characters = useCatalogDataset("characters", toById)
  const unitPower = useUnitPowerContext()
  const read = useMemo(
    () => combineReadStates(roster, characters),
    [roster, characters]
  )

  return useMemo((): IncursionPlans => {
    if (read.status === "loading") return { status: "loading" }
    if (read.status === "error") {
      return { status: "unavailable", reason: "noPower" }
    }
    const [units, catalog] = read.data
    if (units.length === 0) return { status: "unavailable", reason: "unsynced" }
    if (unitPower.status === "loading" || !npcsById) {
      return { status: "loading" }
    }
    const context = unitPower.status === "ready" ? unitPower.data : null
    if (!context) return { status: "unavailable", reason: "noPower" }

    const candidates = units.flatMap((unit): IncursionCandidate[] => {
      const character = catalog.get(unit.unitId)
      const power = rosterCharacterPower(unit, context)
      return character && power
        ? [
            {
              id: unit.unitId,
              faction: character.faction,
              traits: character.traits,
              power,
            },
          ]
        : []
    })
    const enemyPower = (npcId: string, level: number) => {
      const npc = npcsById.get(npcId)
      if (isBoardPickup(npcId, npc)) return 0
      const row = npc ? enemyStatRow(npc, level) : undefined
      return row ? npcPowerAt(npcId, row, context) : null
    }

    const plans = new Map<string, IncursionPlan | null>()
    for (const incursion of incursions) {
      const team = suggestIncursionTeam(
        candidates,
        incursion.allowedFactions,
        incursion.minUnitsOfGrandAllianceNeeded
      )
      if (!team) {
        plans.set(incursion.mowId, null)
        continue
      }
      const teamPower = teamPowerOf(team)
      const sustained = hasSustain(team)
      const tiers = new Map<number, TierRunEstimate>()
      for (const tier of incursion.tiers) {
        const path = lightestPath(tier, (battle) =>
          incursionBattlePower(battle, enemyPower)
        )
        if (path) {
          tiers.set(tier.index, estimateTierRun(teamPower, path, sustained))
        }
      }
      plans.set(incursion.mowId, { team, teamPower, sustained, tiers })
    }
    return { status: "ready", plans }
  }, [read, unitPower, npcsById, incursions])
}
