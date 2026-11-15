import {
  plTier,
  resolveHseVariant,
  type GameCatalogHseConfig,
  type GameCatalogHseTier,
  type GameCatalogHseVariant,
} from "@workspace/game-catalog"

/** The reward tier a player's account earns (V1 `plTier`, keyed as the served tiers are). */
export type HsePlayerTier = "High" | "Mid" | "Low"

/** What the tier rule reads of the synced account. */
export type HseTierPlayer = {
  powerLevel: number
  /** True when the roster holds a character or MoW at Legendary one blue star or above. */
  hasBlueStarUnit: boolean
}

export function hsePlayerTier(player: HseTierPlayer): HsePlayerTier {
  const tier = plTier(player.powerLevel, player.hasBlueStarUnit)
  return tier === "high" ? "High" : tier === "medium" ? "Mid" : "Low"
}

export type ResolvedHseScoring = {
  variant: GameCatalogHseVariant
  /** The ladder shown and projected. */
  tier: GameCatalogHseTier
  /** The player's tier by the rule, or null when the account could not be read. */
  playerTier: HsePlayerTier | null
  /** True when the variant has more than one tier, so the power level and tier are worth showing. */
  hasTierChoice: boolean
}

/**
 * Resolves an occurrence's scoring: its variant (`resolveHseVariant`) and the tier the player's
 * account earns, falling back to the variant's `Default` tier when it has no tier of that key (and to
 * its first tier when it has neither, or when the account is unknown). Null without a variant.
 */
export function resolveHseScoring(
  hse: GameCatalogHseConfig,
  parameters: Readonly<Record<string, unknown>> | null | undefined,
  player: HseTierPlayer | null
): ResolvedHseScoring | null {
  const variant = resolveHseVariant(hse, parameters)
  if (!variant) return null
  const playerTier = player ? hsePlayerTier(player) : null
  const byKey = (key: string) => variant.tiers.find((tier) => tier.tier === key)
  const tier =
    (playerTier ? byKey(playerTier) : undefined) ??
    byKey("Default") ??
    variant.tiers[0]!
  return {
    variant,
    tier,
    playerTier,
    hasTierChoice: variant.tiers.length > 1,
  }
}
