import { useMemo } from "react"
import type {
  EquipmentStorageModel,
  NpcStorageModel,
} from "@workspace/game-catalog"
import type { Rarity } from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import {
  capUnitState,
  isBoardPickup,
  questTierCap,
} from "@/features/quest-event"
import { combineReadStates } from "@/shared/lib"
import { toById, useCatalogDataset, usePlayerChunk } from "@/shared/local-data"
import {
  characterPowerAt,
  npcPowerAt,
  rosterCharacterPower,
  useUnitPowerContext,
  type UnitPowerContext,
} from "@/shared/unit-power"

import {
  eligibleCandidates,
  estimateTierRuns,
  hasSustain,
  incursionBattlePower,
  suggestIncursionTeam,
  teamPowerOf,
  tierPower,
  type IncursionCandidate,
  type TierPower,
  type TierRunsEstimate,
} from "./incursion-plan.model"
import { enemyStatRow, type Incursion } from "./incursions.model"

/** The suggested team from the synced roster, or why there is none. */
type IncursionTeamPlan =
  | {
      status: "ready"
      team: IncursionCandidate[]
      teamPower: number
      /** The team has a useful Healer or Mechanic, so it loses less HP per battle. */
      sustained: boolean
      /** Every hero of the allowed factions, strongest first. */
      eligible: IncursionCandidate[]
    }
  | { status: "unsynced" }
  /** Fewer heroes of the allowed factions than a run needs. */
  | { status: "tooFew"; eligible: IncursionCandidate[] }

/** A tier's suggested team with every hero capped to the tier's rarity, and how it fares. */
export type CappedTierTeam = {
  members: readonly IncursionCandidate[]
  power: number
  sustained: boolean
  estimate: TierRunsEstimate
}

/** One tier's enemy power and, from a synced roster with enough heroes, its capped team. */
export type IncursionTierPlan = TierPower & { team?: CappedTierTeam }

/** One MoW's plan per tier and the player's suggested team (uncapped). */
type IncursionPlan = {
  /** By tier index; a tier whose enemy power is unknown is missing. */
  tiers: ReadonlyMap<number, IncursionTierPlan>
  team: IncursionTeamPlan
}

export type IncursionPlans =
  /** `unsynced`: the roster is known to be empty while enemy power still loads. */
  | { status: "loading"; unsynced?: boolean }
  /** No power data: nothing to compare. */
  | { status: "unavailable" }
  /** By MoW id. */
  | { status: "ready"; plans: ReadonlyMap<string, IncursionPlan> }

const toRoster = (roster: PlayerDataChunkDto<"characters"> | null) =>
  roster ?? []

/**
 * Per MoW, every battle's enemy power (enemies taken at their battle levels) and the suggested team
 * from the synced roster. Recomputed live and never stored.
 */
export function useIncursionPlans(
  incursions: readonly Incursion[],
  npcsById: ReadonlyMap<string, NpcStorageModel> | undefined
): IncursionPlans {
  const roster = usePlayerChunk("characters", toRoster)
  const characters = useCatalogDataset("characters", toById)
  const equipment = useCatalogDataset("equipment")
  const unitPower = useUnitPowerContext()
  const read = useMemo(
    () => combineReadStates(roster, characters),
    [roster, characters]
  )

  return useMemo((): IncursionPlans => {
    if (read.status === "loading") return { status: "loading" }
    if (read.status === "error") return { status: "unavailable" }
    const [units, catalog] = read.data
    if (unitPower.status === "loading" || !npcsById) {
      return { status: "loading", unsynced: units.length === 0 }
    }
    const context = unitPower.status === "ready" ? unitPower.data : null
    if (!context) return { status: "unavailable" }

    const candidatesAt = (
      powerOf: (unit: (typeof units)[number]) => number | null
    ) =>
      units.flatMap((unit): IncursionCandidate[] => {
        const character = catalog.get(unit.unitId)
        const power = powerOf(unit)
        return character && power
          ? [
              {
                id: unit.unitId,
                faction: character.faction,
                traits: character.traits,
                power,
                rank: unit.rank,
                progression: unit.progressionIndex,
              },
            ]
          : []
      })
    const candidates = candidatesAt((unit) =>
      rosterCharacterPower(unit, context)
    )
    const equipmentList =
      equipment.status === "ready" ? equipment.data : undefined
    const cappedByRarity = new Map<string, IncursionCandidate[]>()
    const cappedCandidates = (rarity: string) => {
      let list = cappedByRarity.get(rarity)
      if (!list) {
        list = cappedPool(rarity, equipmentList, context, candidatesAt)
        cappedByRarity.set(rarity, list)
      }
      return list
    }
    const enemyPower = (npcId: string, level: number) => {
      const npc = npcsById.get(npcId)
      if (isBoardPickup(npcId, npc)) return 0
      const row = npc ? enemyStatRow(npc, level) : undefined
      return row ? npcPowerAt(npcId, row, context) : null
    }

    const plans = new Map<string, IncursionPlan>()
    for (const incursion of incursions) {
      const tiers = new Map<number, IncursionTierPlan>()
      for (const tier of incursion.tiers) {
        const power = tierPower(tier, (battle) =>
          incursionBattlePower(battle, enemyPower)
        )
        if (!power) continue
        const members = suggestIncursionTeam(
          eligibleCandidates(
            cappedCandidates(tier.rarity),
            incursion.allowedFactions
          ),
          incursion.minUnitsOfGrandAllianceNeeded
        )
        if (!members) {
          tiers.set(tier.index, power)
          continue
        }
        const teamPower = teamPowerOf(members)
        const sustained = hasSustain(members)
        tiers.set(tier.index, {
          ...power,
          team: {
            members,
            power: teamPower,
            sustained,
            estimate: estimateTierRuns(teamPower, power.path, sustained),
          },
        })
      }
      plans.set(incursion.mowId, {
        tiers,
        team: teamPlan(candidates, units.length > 0, incursion),
      })
    }
    return { status: "ready", plans }
  }, [read, unitPower, npcsById, incursions, equipment])
}

/** The roster as candidates with every hero capped to `rarity` (stars, rank, abilities, items). */
function cappedPool<Unit extends Parameters<typeof capUnitState>[0]>(
  rarity: string,
  equipment: readonly EquipmentStorageModel[] | undefined,
  context: UnitPowerContext,
  candidatesAt: (powerOf: (unit: Unit) => number | null) => IncursionCandidate[]
): IncursionCandidate[] {
  const cap = questTierCap(rarity as Rarity, equipment)
  return candidatesAt((unit) =>
    characterPowerAt(unit.unitId, capUnitState(unit, cap).values, context)
  )
}

function teamPlan(
  candidates: readonly IncursionCandidate[],
  synced: boolean,
  incursion: Incursion
): IncursionTeamPlan {
  if (!synced) return { status: "unsynced" }
  const eligible = eligibleCandidates(candidates, incursion.allowedFactions)
  const team = suggestIncursionTeam(
    eligible,
    incursion.minUnitsOfGrandAllianceNeeded
  )
  if (!team) return { status: "tooFew", eligible }
  return {
    status: "ready",
    team,
    teamPower: teamPowerOf(team),
    sustained: hasSustain(team),
    eligible,
  }
}
