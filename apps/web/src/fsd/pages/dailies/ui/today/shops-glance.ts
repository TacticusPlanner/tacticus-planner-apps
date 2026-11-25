import type { ShopRecommendationsViewModel } from "@/features/shops/recommendations"

/** The Shops glance tile's value: today's guaranteed buys and the offers that may appear after a
 *  refresh, or null when the tile hides (no goals, a failed read). */
export type ShopsGlance =
  | { status: "loading" }
  | { status: "ready"; toBuy: number; possible: number }
  | null

/** Counts the offers the Shop recommendations card lists, from the same read. */
export function shopsGlanceOf(
  recommendations: ShopRecommendationsViewModel
): ShopsGlance {
  if (recommendations.status === "loading") return { status: "loading" }
  if (recommendations.status !== "ready") return null
  let toBuy = 0
  let possible = 0
  for (const section of recommendations.sections) {
    toBuy += section.guaranteed.length
    possible += section.possible.length
  }
  return { status: "ready", toBuy, possible }
}
