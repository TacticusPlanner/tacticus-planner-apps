import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { seasonLetter, zoneNumber } from "../lib/season"
import type { GuildWarSeason } from "../lib/season"

/** The game's names for a season's zones, tiers and buffs, and the season's own name. */
export function useGuildWarNames() {
  const { t } = useTranslation([
    "guildWar",
    "guildWarZones",
    "guildWarTiers",
    "guildWarBuffs",
  ])
  const zoneName = useCallback(
    (season: GuildWarSeason | undefined, zoneId: string) => {
      const zone = season?.zones.find((entry) => entry.id === zoneId)
      // A zone of a season no longer served keeps its id's words ("Bunker2" → "Bunker 2").
      if (!zone) return zoneId.replace(/(\D)(\d+)$/, "$1 $2")
      const name = t(`guildWarZones:${zone.visualId}`, {
        defaultValue: zone.visualId,
      })
      const number = zoneNumber(zone.id)
      return number ? `${name} ${number}` : name
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
  const seasonName = useCallback(
    (seasonId: string) =>
      t("guildWar:season", { letter: seasonLetter(seasonId) }),
    [t]
  )
  return { zoneName, tierName, buffName, seasonName }
}
