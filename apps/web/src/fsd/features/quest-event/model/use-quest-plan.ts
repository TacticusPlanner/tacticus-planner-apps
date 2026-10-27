import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { EquipmentStorageModel } from "@workspace/game-catalog"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import { useNpcsById } from "@/entities/npc"
import { buildSummonerIds } from "@/entities/unit"
import { combineReadStates } from "@/shared/lib"
import { toById, useCatalogDataset, usePlayerChunk } from "@/shared/local-data"
import {
  characterPowerAt,
  npcPowerAt,
  useUnitPowerContext,
} from "@/shared/unit-power"

import type { QuestBattle } from "./quest-battles"
import {
  estimateQuestBattle,
  questBattlePower,
  type QuestBattleEstimate,
} from "./quest-estimates"
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

type QuestBattlePlan = {
  team: QuestTeam
  /** Null when no estimate can be made: unit power absent or failed, or no synced roster. */
  estimate: QuestBattleEstimate | null
}

export type QuestPlanViewModel =
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  | {
      status: "ready"
      /** No synced roster: each team is the featured hero alone. */
      unsynced: boolean
      battles: ReadonlyMap<number, QuestBattlePlan>
    }

export type QuestTeamViewModel =
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  | { status: "unsynced"; team: QuestTeam }
  | { status: "ready"; team: QuestTeam }

/** One battle's team as the team section shows it. */
export function questTeamView(
  plan: QuestPlanViewModel,
  battleNumber: number | null
): QuestTeamViewModel {
  if (plan.status !== "ready") return plan
  const battle =
    battleNumber === null ? undefined : plan.battles.get(battleNumber)
  if (!battle) return { status: "loading" }
  return plan.unsynced
    ? { status: "unsynced", team: battle.team }
    : { status: "ready", team: battle.team }
}

/**
 * Every battle's suggested team (spec: quest-event-teams) and clear estimates (spec:
 * quest-event-clear-estimates) from the synced roster, every unit's power taken at the battle tier's
 * rarity cap. Summoners come from the generated `npcAbilitySummoners` list, as for HRE teams.
 * Recomputed live from the datasets and never stored.
 */
export function useQuestPlan(input: {
  battles: readonly QuestBattle[]
  featuredCharacterId: string | null
  allowedFactionIds: readonly string[]
  equipment: readonly EquipmentStorageModel[] | undefined
}): QuestPlanViewModel {
  const roster = usePlayerChunk("characters", toRoster)
  const catalog = useCatalogDataset("characters", toById)
  const unitPower = useUnitPowerContext()
  const npcs = useNpcsById()
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

  const { battles, featuredCharacterId, allowedFactionIds, equipment } = input
  return useMemo((): QuestPlanViewModel => {
    if (
      read.status === "loading" ||
      unitPower.status === "loading" ||
      npcs.status === "loading"
    ) {
      return { status: "loading" }
    }
    if (read.status === "error") return { status: "error", retry: read.retry }
    const [units, characters] = read.data
    const featured = featuredCharacterId
      ? characters.get(featuredCharacterId)
      : undefined
    if (!featured) return { status: "loading" }
    const context = unitPower.status === "ready" ? unitPower.data : null
    const npcsById = npcs.status === "ready" ? npcs.data : undefined
    const unsynced = units.length === 0
    const plans = new Map<number, QuestBattlePlan>()

    for (const battle of battles) {
      const cap = questTierCap(battle.tier, equipment)
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
      const select = (ignoreObjectives: boolean) =>
        selectQuestTeam({
          featured,
          featuredPower: context
            ? characterPowerAt(featured.id, featuredHeroState(cap), context)
            : null,
          candidates,
          allowedFactionIds,
          objectives: battle.objectives,
          deploySlots: battle.deploySlots,
          summoners,
          ignoreObjectives,
        })
      const team = select(false)
      const estimate =
        context && !unsynced
          ? estimateQuestBattle({
              battle,
              battlePower: questBattlePower(
                battle,
                (id) => npcsById?.get(id),
                (id, row) => npcPowerAt(id, row, context)
              ),
              team,
              buildHardRulesTeam: () => select(true),
              gainAtCap: (unitId) => {
                const unit = units.find((entry) => entry.unitId === unitId)
                const candidate = candidates.find(
                  (entry) => entry.character.id === unitId
                )
                if (!unit || candidate?.power == null) return null
                const { values } = capUnitState(unit, cap)
                const full = characterPowerAt(
                  unitId,
                  {
                    ...values,
                    progression: cap.progression,
                    rank: cap.rank,
                    appliedUpgradeSlots:
                      values.rank === cap.rank
                        ? values.appliedUpgradeSlots
                        : [],
                    activeAbilityLevel: cap.abilityLevel,
                    passiveAbilityLevel: cap.abilityLevel,
                  },
                  context
                )
                return full === null ? null : full - candidate.power
              },
            })
          : null
      plans.set(battle.number, { team, estimate })
    }
    return { status: "ready", unsynced, battles: plans }
  }, [
    read,
    unitPower,
    npcs,
    summoners,
    battles,
    featuredCharacterId,
    allowedFactionIds,
    equipment,
  ])
}
