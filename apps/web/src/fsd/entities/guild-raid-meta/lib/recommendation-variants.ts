import type { GameCatalogGuildRaidMetaRecommendation } from "@workspace/game-catalog"

/** A recommendation cached before variant rules existed carries neither field at runtime, even
 *  though the current type declares them required. */
type CachedRecommendation = Partial<
  Pick<
    GameCatalogGuildRaidMetaRecommendation,
    "heroSlots" | "mowReplacementIds"
  >
>

/** The recommendation's hero slots and MoW substitutes, empty for a stale cached row rather than a
 *  crash while it is still on screen, mid-rollout. */
export function recommendationVariants(recommendation: CachedRecommendation) {
  return {
    heroSlots: recommendation.heroSlots ?? [],
    mowReplacementIds: recommendation.mowReplacementIds ?? [],
  }
}
