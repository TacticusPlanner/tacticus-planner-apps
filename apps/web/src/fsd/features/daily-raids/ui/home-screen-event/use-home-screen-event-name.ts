import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import type { HomeScreenEventEntry } from "../../model/select-active-home-screen-event"

/**
 * Resolves a Home Screen Event's display name from its definition id, with the localized target for
 * an event that carries one (Faction Boost's `targetFactionId`), e.g. "Faction Boost: Dark Angels".
 */
export function useHomeScreenEventName() {
  const { t } = useTranslation(["events", "factions"])
  return useCallback(
    (entry: HomeScreenEventEntry) => {
      const name = t(`events:definitions.${entry.definitionId}`, {
        defaultValue: entry.definitionId,
      })
      const factionId = entry.parameters?.targetFactionId
      return typeof factionId === "string"
        ? t("events:withFaction", {
            name,
            faction: t(`factions:${factionId}`, { defaultValue: factionId }),
          })
        : name
    },
    [t]
  )
}

/** "Oct 19 – 23, 2026" in the player's locale and timezone (end is the exclusive end instant). */
export function formatHomeScreenEventDates(
  entry: HomeScreenEventEntry,
  locale: string
): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).formatRange(
    new Date(entry.startUtc),
    new Date(entry.endUtc)
  )
}
