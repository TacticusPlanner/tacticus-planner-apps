import { useCallback, useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { getCharactersMap } from "@workspace/game-catalog/queries"
import { getPlayerCharacters } from "@workspace/player-data/queries"

import type {
  HseEventPointsState,
  HseInstance,
} from "@/features/home-screen-event-points"

import type { HseTeamsViewModel } from "./hse-team-recommendations.types"
import {
  buildHseTeamsViewModel,
  type HseTeamsRead,
} from "./hse-teams-view-model"
import { useTeamUnitPower } from "./use-team-unit-power"

// `useLiveQuery` has no error channel (a rejected querier throws to the error boundary), so the
// querier resolves a tagged result instead.
async function readTeams(): Promise<HseTeamsRead> {
  try {
    const [roster, catalog] = await Promise.all([
      getPlayerCharacters(),
      getCharactersMap(),
    ])
    return { status: "ready", roster: roster ?? [], catalog }
  } catch {
    return { status: "error" }
  }
}

/**
 * The selected HSE instance's event teams: reads the synced roster and the character catalog and
 * builds one Arena team and one team per alliance for Onslaught and Salvage Run, for the modes the
 * event scores in.
 */
export function useHseTeamRecommendations(
  instance: HseInstance | null,
  points: HseEventPointsState
): HseTeamsViewModel {
  const [retryNonce, setRetryNonce] = useState(0)
  const read = useLiveQuery(readTeams, [retryNonce])
  const retry = useCallback(() => setRetryNonce((nonce) => nonce + 1), [])
  const { loading: unitPowerLoading, unitPower } = useTeamUnitPower()
  return buildHseTeamsViewModel({
    instance,
    points,
    read,
    unitPower: unitPowerLoading ? "loading" : unitPower,
    retry,
  })
}
