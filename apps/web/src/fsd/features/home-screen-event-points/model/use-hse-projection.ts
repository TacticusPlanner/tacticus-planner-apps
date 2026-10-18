import { useLiveQuery } from "dexie-react-hooks"
import { hasBlueStarUnit } from "@workspace/game-catalog"
import { getEventDefinitions } from "@workspace/game-catalog/queries"
import { progressionStarsIndex, type Progression } from "@workspace/game-domain"
import { getPlayerDataMetadata } from "@workspace/player-data"
import {
  getLiveProgress,
  getPlayerCharacters,
  getPlayerDetails,
  getPlayerMows,
} from "@workspace/player-data/queries"

import {
  buildHseEventPointsState,
  type HseCatalogRead,
  type HseEventPointsState,
  type HseInstance,
  type HsePlayerRead,
} from "./hse-event-points"
import { useHseProjectionInputs } from "./use-hse-projection-inputs"

// `useLiveQuery` has no error channel (a rejected querier throws to the error boundary), so each
// querier resolves a tagged result instead, like `use-active-home-screen-event.ts`.
async function readCatalog(definitionId: string): Promise<HseCatalogRead> {
  try {
    const definitions = await getEventDefinitions()
    const definition = definitions.find(
      (candidate) => candidate.id === definitionId
    )
    return { status: "ready", config: definition?.config ?? null }
  } catch {
    return { status: "error" }
  }
}

const rosterStars = (
  units: readonly { unitId: string; progressionIndex: Progression }[]
) =>
  units.map((unit) => ({
    unitId: unit.unitId,
    stars: progressionStarsIndex(unit.progressionIndex),
  }))

async function readPlayer(): Promise<HsePlayerRead> {
  try {
    const [details, characters, mows, liveProgress, metadata] =
      await Promise.all([
        getPlayerDetails(),
        getPlayerCharacters(),
        getPlayerMows(),
        getLiveProgress(),
        getPlayerDataMetadata(),
      ])
    const tokens = liveProgress?.gameModeTokens
    const observedAt = metadata.get("live-progress")?.updatedAt
    return {
      status: "ready",
      player: {
        powerLevel: details?.powerLevel ?? 0,
        hasBlueStarUnit: hasBlueStarUnit([
          ...rosterStars(characters ?? []),
          ...rosterStars(mows ?? []),
        ]),
      },
      buckets: {
        Arena: tokens?.arena ?? null,
        Onslaught: tokens?.onslaught ?? null,
        SalvageRun: tokens?.salvageRun ?? null,
      },
      observedAtMs: observedAt ? Date.parse(observedAt) : null,
    }
  } catch {
    return { status: "error" }
  }
}

/**
 * The selected HSE instance's details (variant, tier, description, milestones) and points
 * projection, from the catalog's `config.hse`, the synced account (power level, roster, token
 * buckets) and the projection inputs persisted in this browser.
 */
export function useHseProjection(
  instance: HseInstance | null
): HseEventPointsState {
  const definitionId = instance?.entry.definitionId ?? ""
  const catalog = useLiveQuery(() => readCatalog(definitionId), [definitionId])
  const player = useLiveQuery(readPlayer, [])
  const inputs = useHseProjectionInputs(definitionId, instance?.key ?? "")
  return buildHseEventPointsState({ instance, catalog, player, inputs })
}
