import {
  buildHseEventPointsState,
  type HseCatalogRead,
  type HseInstance,
  type HsePlayerRead,
} from "@/features/home-screen-event-points/model/hse-event-points"
import { useHseProjectionInputs } from "@/features/home-screen-event-points/model/use-hse-projection-inputs"

import {
  hseDefinitionConfig,
  type HseFixtureId,
} from "./home-screen-event-scoring"
import scoring from "./home-screen-event-scoring.json"

// Stands in for `useHseProjection` in page and tour tests: the real state builder and the real
// persisted inputs over fixture reads (the real scoring JSON, a synced High-tier account), so the
// page renders what the hook would derive without IndexedDB.

const HOUR_S = 3600

/** The spec's illustrative buckets (not game constants): Arena 4 of 10, next in 1 h, regen 2 h;
 * Onslaught 1 of 3, next in 2 h, regen 8 h; Salvage Run 2 of 2, next in 8 h, regen 8 h. */
export const hseFixtureBuckets = {
  Arena: {
    current: 4,
    max: 10,
    nextTokenInSeconds: 1 * HOUR_S,
    regenDelayInSeconds: 2 * HOUR_S,
  },
  Onslaught: {
    current: 1,
    max: 3,
    nextTokenInSeconds: 2 * HOUR_S,
    regenDelayInSeconds: 8 * HOUR_S,
  },
  SalvageRun: {
    current: 2,
    max: 2,
    nextTokenInSeconds: 8 * HOUR_S,
    regenDelayInSeconds: 8 * HOUR_S,
  },
}

/** A High-tier account (power level 62, a one-blue-star unit) synced at `observedAtMs`. */
export function hseFixturePlayer(
  overrides: Partial<Extract<HsePlayerRead, { status: "ready" }>> = {}
): HsePlayerRead {
  return {
    status: "ready",
    player: { powerLevel: 62, hasBlueStarUnit: true },
    buckets: hseFixtureBuckets,
    observedAtMs: null,
    ...overrides,
  }
}

/** The catalog read of a definition: its fixture `config.hse`, or no config (Against the Tide). */
function hseFixtureCatalog(definitionId: string): HseCatalogRead {
  return {
    status: "ready",
    config:
      definitionId in scoring
        ? hseDefinitionConfig(definitionId as HseFixtureId)
        : null,
  }
}

export type HseFixtureReads = {
  /** undefined: loading. Defaults to the fixture catalog. */
  catalog?: (definitionId: string) => HseCatalogRead | undefined
  /** undefined: loading. Defaults to `hseFixturePlayer()`. */
  player?: () => HsePlayerRead | undefined
}

export function useFixtureHseProjection(
  instance: HseInstance | null,
  reads: HseFixtureReads = {}
) {
  const definitionId = instance?.entry.definitionId ?? ""
  const inputs = useHseProjectionInputs(definitionId, instance?.key ?? "")
  return buildHseEventPointsState({
    instance,
    catalog: (reads.catalog ?? hseFixtureCatalog)(definitionId),
    player: reads.player ? reads.player() : hseFixturePlayer(),
    inputs,
  })
}
