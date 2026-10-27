import {
  parseHseConfig,
  resolveHseVariant,
  type GameCatalogHseConfig,
  type GameCatalogHseTracker,
  type GameCatalogHseVariant,
} from "@workspace/game-catalog"

import {
  CAMPAIGN_GAME_MODES,
  restrictionPasses,
  type HseRaidRule,
} from "./home-screen-event-rules"
import type {
  HomeScreenEventDefinitions,
  HomeScreenEventEntry,
} from "./select-active-home-screen-event"

// The served config and its variants keep their identity while the dataset is unchanged, so the
// parse and the rule are cached per object: a re-render or a minute tick keeps the same rule.
const parsedByConfig = new WeakMap<object, GameCatalogHseConfig | null>()
const ruleByVariant = new WeakMap<GameCatalogHseVariant, HseRaidRule | null>()

function cachedHseConfig(config: unknown): GameCatalogHseConfig | null {
  if (typeof config !== "object" || config === null) return null
  if (!parsedByConfig.has(config))
    parsedByConfig.set(config, parseHseConfig(config))
  return parsedByConfig.get(config) ?? null
}

const scoresInCampaign = (tracker: GameCatalogHseTracker) =>
  tracker.kind === "KillUnits" &&
  tracker.player === null &&
  CAMPAIGN_GAME_MODES.some((mode) => restrictionPasses(tracker.gameModes, mode))

/**
 * The raid-point rule of an occurrence, from its definition's served `config` and its parameters
 * (which pick the variant). Null when the definition has no `config.hse`, no variant applies, or no
 * tracker scores campaign raids (Faction Boost, Squig Smash, the 11th-edition weeks, ...).
 */
export function homeScreenEventRaidRule(
  config: unknown,
  parameters: Readonly<Record<string, unknown>> | null | undefined
): HseRaidRule | null {
  const hse = cachedHseConfig(config)
  const variant = hse ? resolveHseVariant(hse, parameters) : null
  if (!variant) return null
  if (!ruleByVariant.has(variant)) {
    const trackers = variant.trackers.filter(scoresInCampaign)
    ruleByVariant.set(variant, trackers.length > 0 ? { trackers } : null)
  }
  return ruleByVariant.get(variant) ?? null
}

/** The raid-point rule of a calendar entry, from its definition's served `config.hse`. */
export function homeScreenEventEntryRule(
  entry: HomeScreenEventEntry,
  definitionsById: HomeScreenEventDefinitions
): HseRaidRule | null {
  return homeScreenEventRaidRule(
    definitionsById.get(entry.definitionId)?.config,
    entry.parameters
  )
}
