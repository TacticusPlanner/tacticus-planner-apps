import {
  parseHseConfig,
  type GameCatalogHseConfig,
} from "@workspace/game-catalog"

import scoring from "./home-screen-event-scoring.json"

// Real `config.hse` payloads: tacticus-planner-api's `home-screen-event-scoring.json` entries in the
// shape `event-definitions` serves them (a modifier omits the other kind's null fields). Parsing them
// through the catalog schema proves it against actual data.

export type HseFixtureId = keyof typeof scoring

/** The served `config` of a definition with this scoring. */
export const hseDefinitionConfig = (definitionId: HseFixtureId) => ({
  hse: scoring[definitionId],
})

/** The parsed `config.hse` of a definition. */
export function hseConfig(definitionId: HseFixtureId): GameCatalogHseConfig {
  const hse = parseHseConfig(hseDefinitionConfig(definitionId))
  if (!hse) throw new Error(`${definitionId}: config.hse does not parse`)
  return hse
}

/** The variant of a definition by key (throws when missing, so tests fail loudly). */
export function hseVariant(definitionId: HseFixtureId, variantKey = "default") {
  const variant = hseConfig(definitionId).variants.find(
    (candidate) => candidate.variantKey === variantKey
  )
  if (!variant) throw new Error(`${definitionId}: no variant ${variantKey}`)
  return variant
}

/** A variant's tier by key. */
export function hseTier(
  definitionId: HseFixtureId,
  tierKey: string,
  variantKey = "default"
) {
  const tier = hseVariant(definitionId, variantKey).tiers.find(
    (candidate) => candidate.tier === tierKey
  )
  if (!tier) throw new Error(`${definitionId}: no tier ${tierKey}`)
  return tier
}
