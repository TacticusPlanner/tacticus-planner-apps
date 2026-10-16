import { useTranslation } from "react-i18next"
import type { Progression } from "@workspace/game-domain"

import type {
  OnslaughtRewardKey,
  OnslaughtRewardRange,
  OnslaughtSector,
  OnslaughtTier,
} from "@/entities/player-data-override"

export const rewardProgression: Record<OnslaughtRewardKey, Progression> = {
  Common: "Common:None",
  Uncommon: "Uncommon:TwoStars",
  Rare: "Rare:FourStars",
  Epic: "Epic:RedOneStar",
  Legendary: "Legendary:RedThreeStars",
  LegendaryBlue: "Legendary:OneBlueStar",
  Mythic: "Mythic:OneBlueStar",
}

/** A reward cell: "3", "15-17", or "1M" for mythic shards. */
export const formatReward = (reward: OnslaughtRewardRange) =>
  `${reward.min === reward.max ? reward.min : `${reward.min}-${reward.max}`}${reward.mythic ? "M" : ""}`

/** "Gold · Tier 2", or "Gold · Sector complete" for tier 4 — the one label every surface uses. */
export function useOnslaughtPositionLabel() {
  const { t } = useTranslation()
  return (sector: OnslaughtSector, tier: OnslaughtTier) =>
    tier === 4
      ? t("onslaught.positionComplete", {
          sector: t(`onslaught.sectors.${sector}`),
        })
      : t("onslaught.position", {
          sector: t(`onslaught.sectors.${sector}`),
          tier,
        })
}
