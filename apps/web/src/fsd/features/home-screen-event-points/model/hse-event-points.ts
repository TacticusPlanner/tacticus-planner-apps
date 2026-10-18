import {
  hseRestrictionPasses,
  parseHseConfig,
  type GameCatalogHseTier,
  type GameCatalogHseTracker,
  type GameCatalogHseVariant,
} from "@workspace/game-catalog"

import { hseDescriptionLines, type HseText } from "../lib/hse-description"
import {
  hseModeScoring,
  projectHsePoints,
  type HseProjection,
} from "../lib/hse-projection"
import {
  HSE_TOKEN_MODES,
  hseTokenSupply,
  type HseTokenBuckets,
} from "../lib/hse-token-supply"
import {
  resolveHseScoring,
  type HsePlayerTier,
  type HseTierPlayer,
} from "../lib/resolve-hse-scoring"
import type { HseProjectionInputs } from "./use-hse-projection-inputs"

/** The HSE instance the tab shows (structurally the daily-raids `HomeScreenEventInstance`). */
export type HseInstance = {
  key: string
  status: "running" | "upcoming" | "past"
  entry: {
    definitionId: string
    startUtc: string
    endUtc: string
    parameters?: Record<string, unknown> | null
  }
}

/** The catalog read for one definition: its served `config` (null for none). */
export type HseCatalogRead =
  { status: "ready"; config: unknown } | { status: "error" }

/** The synced account read: tier inputs and token buckets. */
export type HsePlayerRead =
  | {
      status: "ready"
      player: HseTierPlayer
      buckets: HseTokenBuckets
      /** When the buckets were synced; null when unknown. */
      observedAtMs: number | null
    }
  | { status: "error" }

export type HseDetailsView = {
  definitionId: string
  variantKey: string
  scope: GameCatalogHseVariant["scope"]
  /** The variant's point trackers (the HSE event teams read their game modes and unit filters). */
  trackers: readonly GameCatalogHseTracker[]
  tier: GameCatalogHseTier
  playerTier: HsePlayerTier | null
  hasTierChoice: boolean
  /** Null when the account could not be read. */
  powerLevel: number | null
  description: HseText[]
}

export type HseProjectionView =
  /** Past, Global, or no tracker scoring in a token mode: the details stand alone. */
  | { status: "hidden" }
  | { status: "error" }
  | {
      status: "ready"
      projection: HseProjection
      instanceStatus: "running" | "upcoming"
      observedAtMs: number | null
      /** True when a scoring tracker only counts some enemies (For the Emperor, Squig Smash). */
      enemyRestricted: boolean
      /** True when the variant also scores in campaign battles (Warp Surge, Machine Hunt). */
      scoresInCampaign: boolean
      inputs: HseProjectionInputs
    }

export type HseEventPointsState =
  | { status: "none" }
  /** `projectionPending`: the instance may get a projection (it is not past). */
  | { status: "loading"; projectionPending: boolean }
  | { status: "error" }
  /** No `config.hse` (Against the Tide) or no variant for this occurrence. */
  | { status: "no-data" }
  | { status: "ready"; details: HseDetailsView; projection: HseProjectionView }

const CAMPAIGN_MODES = [
  "Campaign",
  "MirrorCampaign",
  "EliteCampaign",
  "MirrorEliteCampaign",
  "CampaignEvent",
]

/** True when an enemy filter counts fewer than every enemy (beyond leaving Summons out). */
function restrictsEnemies(
  enemy: GameCatalogHseVariant["trackers"][number]["enemy"]
): boolean {
  if (!enemy) return false
  const disallowed = (enemy.tags?.disallowed ?? []).filter(
    (tag) => tag !== "Summon" && tag !== "Steppable"
  )
  return (
    !!enemy.tags?.allowed?.length ||
    disallowed.length > 0 ||
    !!enemy.factionIds ||
    !!enemy.unitIds?.length
  )
}

function projectionView(
  instance: HseInstance,
  variant: GameCatalogHseVariant,
  tier: GameCatalogHseTier,
  player: HsePlayerRead,
  inputs: HseProjectionInputs
): HseProjectionView {
  if (instance.status === "past" || variant.scope === "Global")
    return { status: "hidden" }
  // Only an event that scores in a token mode has a projection (Arsenal of War has none).
  if (hseModeScoring(variant.trackers).length === 0) return { status: "hidden" }
  if (player.status === "error") return { status: "error" }
  const endMs = Date.parse(instance.entry.endUtc)
  const tokens = hseTokenSupply(
    player.buckets,
    instance.status === "running"
      ? {
          status: "running",
          endMs,
          observedAtMs: player.observedAtMs ?? Date.now(),
        }
      : {
          status: "upcoming",
          startMs: Date.parse(instance.entry.startUtc),
          endMs,
        }
  )
  const projection = projectHsePoints({
    tier,
    trackers: variant.trackers,
    tokens,
    averages: inputs.averages,
    pointsSoFar: instance.status === "running" ? inputs.pointsSoFar : 0,
  })
  if (!projection) return { status: "hidden" }
  return {
    status: "ready",
    projection,
    instanceStatus: instance.status,
    observedAtMs: player.observedAtMs,
    enemyRestricted: variant.trackers.some(
      (tracker) =>
        HSE_TOKEN_MODES.some((mode) =>
          hseRestrictionPasses(tracker.gameModes, mode)
        ) && restrictsEnemies(tracker.enemy)
    ),
    scoresInCampaign: variant.trackers.some((tracker) =>
      CAMPAIGN_MODES.some((mode) =>
        hseRestrictionPasses(tracker.gameModes, mode)
      )
    ),
    inputs,
  }
}

/**
 * The HSE tab's details and projection for one instance, from the catalog and player reads (each
 * undefined while loading). Pure, so every state is testable without IndexedDB.
 */
export function buildHseEventPointsState(input: {
  instance: HseInstance | null
  catalog: HseCatalogRead | undefined
  player: HsePlayerRead | undefined
  inputs: HseProjectionInputs
}): HseEventPointsState {
  const { instance, catalog, player, inputs } = input
  if (!instance) return { status: "none" }
  if (!catalog || !player)
    return { status: "loading", projectionPending: instance.status !== "past" }
  if (catalog.status === "error") return { status: "error" }
  const hse = parseHseConfig(catalog.config)
  if (!hse) return { status: "no-data" }
  const scoring = resolveHseScoring(
    hse,
    instance.entry.parameters,
    player.status === "ready" ? player.player : null
  )
  if (!scoring) return { status: "no-data" }
  const { variant, tier } = scoring
  return {
    status: "ready",
    details: {
      definitionId: instance.entry.definitionId,
      variantKey: variant.variantKey,
      scope: variant.scope,
      trackers: variant.trackers,
      tier,
      playerTier: scoring.playerTier,
      hasTierChoice: scoring.hasTierChoice,
      powerLevel: player.status === "ready" ? player.player.powerLevel : null,
      description: hseDescriptionLines(variant),
    },
    projection: projectionView(instance, variant, tier, player, inputs),
  }
}

/** Which HSE sections a state renders, for the page layout and the tour (whose targets must exist). */
export function hseSectionsShown(state: HseEventPointsState): {
  details: boolean
  milestones: boolean
  projection: boolean
} {
  switch (state.status) {
    case "none":
      return { details: false, milestones: false, projection: false }
    case "loading":
      return {
        details: true,
        milestones: false,
        projection: state.projectionPending,
      }
    case "ready":
      return {
        details: true,
        milestones: true,
        projection: state.projection.status !== "hidden",
      }
    default:
      return { details: true, milestones: false, projection: false }
  }
}
