import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import type { Rarity } from "@workspace/game-domain"

import { fillBuffDescription } from "../lib/buff-description"
import type { GuildWarSeason } from "../lib/season"

/** The game's names for a season's zones, tiers and buffs, and its description of each buff. A zone is named by its kind only
 *  ("Bunker", not "Bunker 2"): the game shows no numbers, and copies of a kind are the same. */
export function useGuildWarNames() {
  const { t } = useTranslation([
    "guildWar",
    "guildWarZones",
    "guildWarTiers",
    "guildWarBuffs",
    "guildWarBuffDescriptions",
  ])
  const zoneName = useCallback(
    (season: GuildWarSeason | undefined, zoneId: string) => {
      const zone = season?.zones.find((entry) => entry.id === zoneId)
      // A zone of a season no longer served keeps its id's words ("Bunker2" → "Bunker").
      if (!zone) return zoneId.replace(/\d+$/, "")
      return t(`guildWarZones:${zone.visualId}`, {
        defaultValue: zone.visualId,
      })
    },
    [t]
  )
  const tierName = useCallback(
    (tierId: string) => t(`guildWarTiers:${tierId}`, { defaultValue: tierId }),
    [t]
  )
  const buffName = useCallback(
    (buffId: string) => t(`guildWarBuffs:${buffId}`, { defaultValue: buffId }),
    [t]
  )
  /** What a buff does, in the game's words, at the defenders' rarity when known. */
  const buffDescription = useCallback(
    (
      season: GuildWarSeason | undefined,
      buffId: string,
      rarity: Rarity | undefined
    ) =>
      fillBuffDescription(
        t(`guildWarBuffDescriptions:${buffId}`, { defaultValue: "" }),
        season,
        buffId,
        rarity
      ),
    [t]
  )
  return { zoneName, tierName, buffName, buffDescription }
}
