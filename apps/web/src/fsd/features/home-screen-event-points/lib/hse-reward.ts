import {
  shopRewardDisplay,
  type ShopRewardDisplayContext,
} from "@/features/shop-rewards/@x/home-screen-event-points"
import { gameAssetUrl } from "@workspace/game-catalog"

export type HseRewardDisplay = {
  /** Absent for a reward without art: the grid shows a generic reward icon. */
  iconUrl?: string
  label: string
}

/** Summoning tokens appear on HSE ladders but in no shop, so the shop display does not know them. */
const SUMMONING_TOKENS: Readonly<
  Record<string, { iconUrl: string; labelKey: string }>
> = {
  summoningToken: {
    iconUrl: gameAssetUrl("misc/ui_icon_resource_req_order.webp"),
    labelKey: "dailies:hse.details.rewards.summoningToken",
  },
  specialSummoningToken: {
    iconUrl: gameAssetUrl("misc/ui_icon_resource_blessed_req_order.webp"),
    labelKey: "dailies:hse.details.rewards.specialSummoningToken",
  },
}

/**
 * A milestone reward's icon and label, from the reward display Shops uses. A reward id that display
 * does not know (it would fall back to a prettified name with no icon) keeps its id as the label.
 */
export function hseRewardDisplay(
  rewardId: string,
  context: ShopRewardDisplayContext,
  translate: (key: string) => string
): HseRewardDisplay {
  const token = SUMMONING_TOKENS[rewardId]
  if (token) return { iconUrl: token.iconUrl, label: translate(token.labelKey) }
  const display = shopRewardDisplay(rewardId, undefined, context)
  if (display.kind === "other" && !display.iconUrl) return { label: rewardId }
  return { iconUrl: display.iconUrl, label: display.label }
}
