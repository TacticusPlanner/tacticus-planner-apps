import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { GameCatalogHseTracker } from "@workspace/game-catalog"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import type { HreTeamPlan } from "@/features/hre-missions/@x/team-recommendations"
import { combineReadStates } from "@/shared/lib"
import { toById, useCatalogDataset, usePlayerChunk } from "@/shared/local-data"

import { buildSummonerIds } from "./hre-summoners"
import { buildHreTeam, type HreTeam } from "./hre-team-recommendations"
import { useTeamUnitPower } from "./use-team-unit-power"

const toRoster = (roster: PlayerDataChunkDto<"characters"> | null) =>
  roster ?? []

export type HreTeamViewModel =
  | { status: "hidden" }
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  | { status: "ready"; team: HreTeam }

/**
 * One HRE mission team per team plan of the current mission (`selectTeamPlans`), in plan order.
 * Summoners come from the English ability rules text (`npcAbilityText`). A running HSE's
 * `hseTrackers` put its scoring units first in the token-mode teams.
 */
export function useHreTeamRecommendations(input: {
  plans: readonly (HreTeamPlan & { factions?: readonly string[] })[]
  alliance: string | null
  featuredCharacterId: string | null
  hseTrackers?: readonly GameCatalogHseTracker[] | null
}): HreTeamViewModel[] {
  const roster = usePlayerChunk("characters", toRoster)
  const catalog = useCatalogDataset("characters", toById)
  const read = useMemo(
    () => combineReadStates(roster, catalog),
    [roster, catalog]
  )
  const { loading: unitPowerLoading, unitPower } = useTeamUnitPower()
  const { i18n } = useTranslation("npcAbilityText")

  const summoners = useMemo(() => {
    if (read.status !== "ready") return new Set<never>()
    return buildSummonerIds(read.data[1].values(), (abilityId) => {
      const entry = i18n.getResource("en", "npcAbilityText", abilityId) as
        { description?: string } | undefined
      return entry?.description
    })
  }, [read, i18n])

  return input.plans.map((plan): HreTeamViewModel => {
    if (read.status === "loading" || unitPowerLoading)
      return { status: "loading" }
    if (read.status === "error") return { status: "error", retry: read.retry }
    const team = buildHreTeam({
      plan,
      alliance: input.alliance,
      featuredCharacterId: input.featuredCharacterId,
      roster: read.data[0],
      catalog: read.data[1],
      summoners,
      unitPower,
      hseTrackers: input.hseTrackers,
    })
    return team ? { status: "ready", team } : { status: "hidden" }
  })
}
