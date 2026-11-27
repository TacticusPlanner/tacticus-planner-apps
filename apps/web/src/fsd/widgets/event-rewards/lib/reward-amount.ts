import type { GameCatalogEventShopRewardRange } from "@workspace/game-catalog"

/** A reward amount: "600" or "600–660", with the page's number format. */
export function rewardAmount(
  reward: Pick<GameCatalogEventShopRewardRange, "min" | "max">,
  format: { number: (value: number) => string }
) {
  return reward.min === reward.max
    ? format.number(reward.min)
    : `${format.number(reward.min)}–${format.number(reward.max)}`
}
