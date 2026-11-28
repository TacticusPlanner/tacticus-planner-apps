import { useMemo } from "react"
import type { GameCatalogHseTracker } from "@workspace/game-catalog"

import type { HreTeamPlan } from "@/entities/hre-mission"
import { combineReadStates } from "@/shared/lib"
import {
  orEmpty,
  toById,
  useCatalogDataset,
  usePlayerChunk,
} from "@/shared/local-data"

import { forcedSummonerIds } from "@/entities/unit"
import { buildHreTeam } from "./hre-team-recommendations"
import type { HreTeam } from "./hre-team-recommendations"
import { useTeamUnitPower } from "./use-team-unit-power"

export type HreTeamViewModel =
  | { status: "hidden" }
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  | { status: "ready"; team: HreTeam }

/**
 * One HRE mission team per team plan of the current mission (`selectTeamPlans`), in plan order.
 * A summon-free team leaves out the forced summoners (catalog `summons`): they summon on their
 * own, as the LRE "No Summons" rule reads it. `hseTrackersFor` gives the running personal
 * HSE that scores in a plan's mode, whose units come first.
 */
export function useHreTeamRecommendations(input: {
  plans: readonly (HreTeamPlan & { factions?: readonly string[] })[]
  alliance: string | null
  featuredCharacterId: string | null
  hseTrackersFor?: (
    mode: HreTeamPlan["mode"]
  ) => readonly GameCatalogHseTracker[] | null
}): HreTeamViewModel[] {
  const roster = usePlayerChunk("characters", orEmpty)
  const catalog = useCatalogDataset("characters", toById)
  const read = useMemo(
    () => combineReadStates(roster, catalog),
    [roster, catalog]
  )
  const { loading: unitPowerLoading, unitPower } = useTeamUnitPower()
  const summoners = useMemo(
    () =>
      read.status === "ready"
        ? forcedSummonerIds(read.data[1].values())
        : new Set<never>(),
    [read]
  )

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
      hseTrackers: input.hseTrackersFor?.(plan.mode) ?? null,
    })
    return team ? { status: "ready", team } : { status: "hidden" }
  })
}
