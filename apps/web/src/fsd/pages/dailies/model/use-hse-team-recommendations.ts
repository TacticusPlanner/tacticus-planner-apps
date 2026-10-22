import { useMemo } from "react"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import type {
  HseEventPointsState,
  HseInstance,
} from "@/features/home-screen-event-points"
import { combineReadStates } from "@/shared/lib"
import { toById, useCatalogDataset, usePlayerChunk } from "@/shared/local-data"

import type { HseTeamsViewModel } from "./hse-team-recommendations.types"
import {
  buildHseTeamsViewModel,
  type HseTeamsRead,
} from "./hse-teams-view-model"
import { useTeamUnitPower } from "./use-team-unit-power"

const toRoster = (roster: PlayerDataChunkDto<"characters"> | null) =>
  roster ?? []

/**
 * The selected HSE instance's event teams: reads the synced roster and the character catalog and
 * builds one Arena team and one team per alliance for Onslaught and Salvage Run, for the modes the
 * event scores in.
 */
export function useHseTeamRecommendations(
  instance: HseInstance | null,
  points: HseEventPointsState
): HseTeamsViewModel {
  const roster = usePlayerChunk("characters", toRoster)
  const catalog = useCatalogDataset("characters", toById)
  const read = useMemo(
    () => combineReadStates(roster, catalog),
    [roster, catalog]
  )
  const teamsRead = useMemo((): HseTeamsRead | undefined => {
    if (read.status === "loading") return undefined
    if (read.status === "error") return { status: "error" }
    return { status: "ready", roster: read.data[0], catalog: read.data[1] }
  }, [read])
  const { loading: unitPowerLoading, unitPower } = useTeamUnitPower()
  return buildHseTeamsViewModel({
    instance,
    points,
    read: teamsRead,
    unitPower: unitPowerLoading ? "loading" : unitPower,
    retry: read.retry,
  })
}
