import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  datamineAssetUrl,
  resourceGlyphIcon,
  type GameIcon,
} from "@workspace/game-catalog"

import { shopCurrencyIcon, shopRewardDisplay } from "@/features/shops/rewards"
import { toById, useCatalogDataset } from "@/shared/local-data"

const NO_NAMES = new Map<string, { name: string }>()

export interface RewardText {
  label: string
  iconUrl?: GameIcon
}

export interface EventShopFormat {
  /** A reward's planner label and icon, from its id. */
  reward: (rewardType: string, unitId?: string) => RewardText
  currencyIcon: (currency: string) => string | undefined
  number: (value: number) => string
  /** `2026-10-29` → "Thu 29 Oct" in the user's language (the date is a UTC calendar date). */
  date: (date: string) => string
  /** `2026-10-29` → "Thu". */
  weekday: (date: string) => string
  /** `2026-10-29` → "29". */
  dayOfMonth: (date: string) => string
}

const EVENT_POINTS_ICON = datamineAssetUrl(
  "liveevents/ui_icon_resource_event_points_seasonalevent.webp"
)
const BLESSED_REQUISITION_ICON = datamineAssetUrl(
  "atlases/ui_icon_resource_summoning_special.webp"
)

/**
 * Display helpers for the event shop: reward labels and icons through the shared shop reward display,
 * plus the seasonal rewards it lacks (event points, requisition orders, profile themes), and
 * locale-aware numbers and dates.
 */
export function useEventShopFormat(): EventShopFormat {
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
    const dateFormat = new Intl.DateTimeFormat(language, {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    })
    const weekdayFormat = new Intl.DateTimeFormat(language, {
      weekday: "short",
      timeZone: "UTC",
    })
    const dayFormat = new Intl.DateTimeFormat(language, {
      day: "numeric",
      timeZone: "UTC",
    })
    const parse = (date: string) => new Date(`${date}T00:00:00Z`)
    const context = { t, charactersById, mowsById, equipmentById }

    const reward = (rewardType: string, unitId?: string): RewardText => {
      if (rewardType === "xp_seasonal") {
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
      const display = shopRewardDisplay(rewardType, unitId, context)
      return { label: display.label, iconUrl: display.iconUrl }
    }

    return {
      reward,
      currencyIcon: shopCurrencyIcon,
      number: (value) => numberFormat.format(value),
      date: (date) => dateFormat.format(parse(date)),
      weekday: (date) => weekdayFormat.format(parse(date)),
      dayOfMonth: (date) => dayFormat.format(parse(date)),
    }
  }, [language, t, tShop, tFactions, charactersById, mowsById, equipmentById])
}
