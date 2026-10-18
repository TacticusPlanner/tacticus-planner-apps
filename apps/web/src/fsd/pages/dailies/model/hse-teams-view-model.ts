import type { Alliance, UnitId } from "@workspace/game-domain"

import type {
  HseEventPointsState,
  HseInstance,
} from "@/features/home-screen-event-points"

import { mapRosterCharacter } from "./arena-recommendations"
import type { RawRosterCharacter } from "./arena-recommendations.types"
import {
  buildHseTeamRecommendations,
  hseTeamModes,
} from "./hse-team-recommendations"
import type {
  HseTeamCatalog,
  HseTeamsViewModel,
} from "./hse-team-recommendations.types"

/** The roster and character catalog the event teams read; undefined while loading. */
export type HseTeamsRead =
  | {
      status: "ready"
      roster: readonly RawRosterCharacter[]
      catalog: ReadonlyMap<
        string,
        { traits?: readonly string[]; alliance: Alliance; faction: string }
      >
    }
  | { status: "error" }

/** The scoring the teams need from the points state, or null when no section is shown. */
function teamScoring(
  instance: HseInstance | null,
  points: HseEventPointsState
): "loading" | null | Extract<HseEventPointsState, { status: "ready" }> {
  if (!instance || instance.status === "past") return null
  if (points.status === "loading") return "loading"
  if (points.status !== "ready") return null
  if (points.details.scope === "Global") return null
  if (hseTeamModes(points.details.trackers).length === 0) return null
  return points
}

/**
 * The HSE event teams as a view model, from the selected instance, its points state (variant and
 * trackers) and the roster read. Pure, so every state is testable without IndexedDB: `hidden` for a
 * past, Global, data-less or non-token-mode event; `loading` until the scoring and roster resolve;
 * `error` (retryable) when the roster or catalog cannot be read; else the teams.
 */
export function buildHseTeamsViewModel(input: {
  instance: HseInstance | null
  points: HseEventPointsState
  read: HseTeamsRead | undefined
  retry: () => void
}): HseTeamsViewModel {
  const scoring = teamScoring(input.instance, input.points)
  if (scoring === null) return { status: "hidden" }
  if (scoring === "loading" || !input.read) return { status: "loading" }
  if (input.read.status === "error")
    return { status: "error", retry: input.retry }
  const catalog = new Map<
    UnitId,
    { traits: readonly string[]; alliance: Alliance; faction: string }
  >()
  for (const character of input.read.roster) {
    const view = input.read.catalog.get(character.unitId)
    if (!view) continue
    catalog.set(character.unitId, {
      traits: view.traits ?? [],
      alliance: view.alliance,
      faction: view.faction,
    })
  }
  return {
    status: "ready",
    recommendations: buildHseTeamRecommendations({
      trackers: scoring.details.trackers,
      roster: input.read.roster.map(mapRosterCharacter),
      catalog: catalog as HseTeamCatalog,
    }),
  }
}
