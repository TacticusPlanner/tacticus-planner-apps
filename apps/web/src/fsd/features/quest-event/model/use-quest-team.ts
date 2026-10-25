import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { EquipmentStorageModel } from "@workspace/game-catalog"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import { buildSummonerIds } from "@/entities/unit"
import { combineReadStates } from "@/shared/lib"
import { toById, useCatalogDataset, usePlayerChunk } from "@/shared/local-data"
import { characterPowerAt, useUnitPowerContext } from "@/shared/unit-power"

import type { QuestBattle } from "./quest-battles"
import {
  capUnitState,
  featuredHeroState,
  selectQuestTeam,
  type QuestTeam,
  type QuestTeamCandidate,
} from "./quest-team"
import { questTierCap } from "./quest-tier-cap"

const toRoster = (roster: PlayerDataChunkDto<"characters"> | null) =>
  roster ?? []

export type QuestTeamViewModel =
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  /** No synced roster: the featured hero alone, with a sync prompt. */
  | { status: "unsynced"; team: QuestTeam }
  | { status: "ready"; team: QuestTeam }

/**
 * The suggested team for one quest battle (spec: quest-event-teams) from the synced roster, every
 * unit's power taken at the tier's rarity cap. Summoners come from the generated
 * `npcAbilitySummoners` list, as for HRE teams.
 */
export function useQuestTeam(input: {
  battle: QuestBattle | null
  featuredCharacterId: string | null
  allowedFactionIds: readonly string[]
  equipment: readonly EquipmentStorageModel[] | undefined
}): QuestTeamViewModel {
  const roster = usePlayerChunk("characters", toRoster)
  const catalog = useCatalogDataset("characters", toById)
  const unitPower = useUnitPowerContext()
  const { i18n } = useTranslation("npcAbilitySummoners")
  const read = useMemo(
    () => combineReadStates(roster, catalog),
    [roster, catalog]
  )

  const summoners = useMemo(() => {
    if (read.status !== "ready") return new Set<string>()
    const summoning = new Set(
      Object.values(
        (i18n.getResourceBundle("en", "npcAbilitySummoners") ?? {}) as Record<
          string,
          string
        >
      )
    )
    return buildSummonerIds(read.data[1].values(), (abilityId) =>
      summoning.has(abilityId)
    )
  }, [read, i18n])

  const { battle, featuredCharacterId, allowedFactionIds, equipment } = input
  return useMemo((): QuestTeamViewModel => {
    if (read.status === "loading" || unitPower.status === "loading") {
      return { status: "loading" }
    }
    if (read.status === "error") return { status: "error", retry: read.retry }
    const [units, characters] = read.data
    const featured = featuredCharacterId
      ? characters.get(featuredCharacterId)
      : undefined
    if (!battle || !featured) return { status: "loading" }
    const cap = questTierCap(battle.tier, equipment)
    const context = unitPower.status === "ready" ? unitPower.data : null
    const featuredPower = context
      ? characterPowerAt(featured.id, featuredHeroState(cap), context)
      : null
    const candidates = units.flatMap((unit): QuestTeamCandidate[] => {
      const character = characters.get(unit.unitId)
      if (!character) return []
      const { values, atCap } = capUnitState(unit, cap)
      return [
        {
          character,
          power: context
            ? characterPowerAt(unit.unitId, values, context)
            : null,
          atCap,
          progression: values.progression,
          rank: values.rank,
        },
      ]
    })
    const team = selectQuestTeam({
      featured,
      featuredPower,
      candidates,
      allowedFactionIds,
      objectives: battle.objectives,
      deploySlots: battle.deploySlots,
      summoners,
    })
    return units.length === 0
      ? { status: "unsynced", team }
      : { status: "ready", team }
  }, [
    read,
    unitPower,
    summoners,
    battle,
    featuredCharacterId,
    allowedFactionIds,
    equipment,
  ])
}
