import { useCallback, useMemo } from "react"
import {
  hasBlueStarUnit,
  type EventDefinitionStorageModel,
} from "@workspace/game-catalog"
import { progressionStarsIndex, type Progression } from "@workspace/game-domain"
import {
  getPlayerDataMetadata,
  type PlayerDataChunkDto,
} from "@workspace/player-data"

import { combineReadStates, useReadState } from "@/shared/lib"
import { useCatalogDataset, usePlayerChunk } from "@/shared/local-data"

import {
  buildHseEventPointsState,
  type HseCatalogRead,
  type HseEventPointsState,
  type HseInstance,
  type HsePlayerRead,
} from "./hse-event-points"
import { useHseProjectionInputs } from "./use-hse-projection-inputs"

const rosterStars = (
  units: readonly { unitId: string; progressionIndex: Progression }[]
) =>
  units.map((unit) => ({
    unitId: unit.unitId,
    stars: progressionStarsIndex(unit.progressionIndex),
  }))

const toPowerLevel = (details: PlayerDataChunkDto<"player-details"> | null) =>
  details?.powerLevel ?? 0

const toStars = (
  units: PlayerDataChunkDto<"characters"> | PlayerDataChunkDto<"mows"> | null
) => rosterStars(units ?? [])

const toTokens = (liveProgress: PlayerDataChunkDto<"live-progress"> | null) =>
  liveProgress?.gameModeTokens

async function readLiveProgressObservedAt() {
  return (await getPlayerDataMetadata()).get("live-progress")?.updatedAt ?? null
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
  const selectConfig = useCallback(
    (definitions: EventDefinitionStorageModel[]) =>
      definitions.find((candidate) => candidate.id === definitionId)?.config ??
      null,
    [definitionId]
  )
  const configRead = useCatalogDataset("event-definitions", selectConfig)
  const catalog = useMemo((): HseCatalogRead | undefined => {
    if (configRead.status === "loading") return undefined
    return configRead.status === "ready"
      ? { status: "ready", config: configRead.data }
      : { status: "error" }
  }, [configRead])

  const powerLevel = usePlayerChunk("player-details", toPowerLevel)
  const characters = usePlayerChunk("characters", toStars)
  const mows = usePlayerChunk("mows", toStars)
  const tokens = usePlayerChunk("live-progress", toTokens)
  // When the buckets were synced: the chunk's metadata, not its payload.
  const observedAt = useReadState(
    "live-progress-observed-at",
    readLiveProgressObservedAt,
    []
  )
  const playerRead = useMemo(
    () => combineReadStates(powerLevel, characters, mows, tokens, observedAt),
    [powerLevel, characters, mows, tokens, observedAt]
  )
  const player = useMemo((): HsePlayerRead | undefined => {
    if (playerRead.status === "loading") return undefined
    if (playerRead.status === "error") return { status: "error" }
    const [level, characterStars, mowStars, buckets, updatedAt] =
      playerRead.data
    return {
      status: "ready",
      player: {
        powerLevel: level,
        hasBlueStarUnit: hasBlueStarUnit([...characterStars, ...mowStars]),
      },
      buckets: {
        Arena: buckets?.arena ?? null,
        Onslaught: buckets?.onslaught ?? null,
        SalvageRun: buckets?.salvageRun ?? null,
      },
      observedAtMs: updatedAt ? Date.parse(updatedAt) : null,
    }
  }, [playerRead])
  const inputs = useHseProjectionInputs(definitionId, instance?.key ?? "")
  return buildHseEventPointsState({ instance, catalog, player, inputs })
}
