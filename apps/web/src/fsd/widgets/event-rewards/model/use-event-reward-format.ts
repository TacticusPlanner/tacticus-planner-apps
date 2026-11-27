import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  datamineAssetUrl,
  gameModeTokenIcon,
  resourceGlyphIcon,
} from "@workspace/game-catalog"
import type { GameIcon } from "@workspace/game-catalog"

import { shopCurrencyIcon, shopRewardDisplay } from "@/entities/shops/reward"
import { toById, useCatalogDataset } from "@/shared/local-data"

const NO_NAMES = new Map<string, { name: string }>()

/** A reward's planner label and icon. */
export interface RewardDisplay {
  label: string
  iconUrl?: GameIcon
}

/** Display helpers for a seasonal event's rewards (event shop, Survival). */
export interface EventRewardFormat {
  /** A reward's planner label and icon, from its id. */
  reward: (rewardType: string, unitId?: string) => RewardDisplay
  currencyIcon: (currency: string) => string | undefined
  number: (value: number) => string
}

const EVENT_POINTS_ICON = datamineAssetUrl(
  "liveevents/ui_icon_resource_event_points_seasonalevent.webp"
)
const BLESSED_REQUISITION_ICON = datamineAssetUrl(
  "atlases/ui_icon_resource_summoning_special.webp"
)

/** Seasonal rewards the shop display does not name: battle tokens, Survival and Crusade extras. */
const SEASONAL_REWARDS: Partial<
  Record<string, { key: SeasonalRewardKey; iconUrl?: string }>
> = {
  stamina_survival: {
    key: "survivalToken",
    iconUrl: gameModeTokenIcon("survival"),
  },
  stamina_waves: {
    key: "onslaughtToken",
    iconUrl: gameModeTokenIcon("onslaught"),
  },
  stamina_treasureBeach: {
    key: "salvageRunToken",
    iconUrl: gameModeTokenIcon("salvageRun"),
  },
  xp_crusadePoints: { key: "crusadePoints", iconUrl: EVENT_POINTS_ICON },
  crusadeNpc: { key: "crusadeUnit" },
  seasonalEcBonus: { key: "eventCurrencyBonus" },
  seasonalPremium: { key: "premiumMissions" },
  survivalBoost_stats: { key: "statBoost" },
}

type SeasonalRewardKey =
  | "survivalToken"
  | "onslaughtToken"
  | "salvageRunToken"
  | "crusadePoints"
  | "crusadeUnit"
  | "eventCurrencyBonus"
  | "premiumMissions"
  | "statBoost"

/**
 * Reward labels and icons through the shared shop reward display, plus the seasonal rewards it lacks
 * (event points, requisition orders, profile themes, battle tokens, Survival and Crusade extras), and locale-aware numbers.
 */
export function useEventRewardFormat(): EventRewardFormat {
  const { t, i18n } = useTranslation([
    "shops",
    "characters",
    "upgrades",
    "equipmentItems",
  ])
  const { t: tShop } = useTranslation("eventShops")
  const { t: tFactions } = useTranslation("factions")
  const characters = useCatalogDataset("characters", toById)
  const mows = useCatalogDataset("mows", toById)
  const equipment = useCatalogDataset("equipment", toById)
  const charactersById =
    characters.status === "ready" ? characters.data : NO_NAMES
  const mowsById = mows.status === "ready" ? mows.data : NO_NAMES
  const equipmentById = equipment.status === "ready" ? equipment.data : NO_NAMES
  const language = i18n.language

  return useMemo(() => {
    const numberFormat = new Intl.NumberFormat(language)
    const context = { t, charactersById, mowsById, equipmentById }

    const reward = (rewardType: string, unitId?: string): RewardDisplay => {
      // Survival medals pay event points by tier (xp_seasonal, xp_seasonalCrescendo).
      if (
        rewardType === "xp_seasonal" ||
        rewardType === "xp_seasonalCrescendo"
      ) {
        return {
          label: tShop("rewards.eventPoints"),
          iconUrl: EVENT_POINTS_ICON,
        }
      }
      if (rewardType === "summoningToken") {
        return {
          label: tShop("rewards.requisitionOrder"),
          iconUrl: resourceGlyphIcon("summoningToken"),
        }
      }
      if (rewardType === "specialSummoningToken") {
        return {
          label: tShop("rewards.blessedRequisitionOrder"),
          iconUrl: BLESSED_REQUISITION_ICON,
        }
      }
      if (rewardType.startsWith("eventSummoningToken_")) {
        const faction = rewardType.slice("eventSummoningToken_".length)
        return {
          label: tShop("rewards.factionRequisitionOrder", {
            faction: tFactions(faction, { defaultValue: faction }),
          }),
          iconUrl: resourceGlyphIcon("summoningToken"),
        }
      }
      if (rewardType.startsWith("playerProfileTheme_")) {
        return { label: tShop("rewards.profileTheme") }
      }
      const seasonal = SEASONAL_REWARDS[rewardType]
      if (seasonal) {
        return {
          label: tShop(`rewards.${seasonal.key}`),
          iconUrl: seasonal.iconUrl,
        }
      }
      const display = shopRewardDisplay(rewardType, unitId, context)
      return { label: display.label, iconUrl: display.iconUrl }
    }

    return {
      reward,
      currencyIcon: shopCurrencyIcon,
      number: (value) => numberFormat.format(value),
    }
  }, [language, t, tShop, tFactions, charactersById, mowsById, equipmentById])
}
