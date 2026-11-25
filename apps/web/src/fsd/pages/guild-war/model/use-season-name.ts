import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { useCatalogDataset } from "@/shared/local-data"

import { seasonLetter } from "../lib/season"
import { calendarSeasonNumber } from "./calendar-season"

/**
 * A war's season as players know it: its number from the events calendar ("Season 29") at the
 * time given (when the war started, or now for a war not started yet). A season the calendar does
 * not name keeps its config letter ("Season C").
 */
export function useSeasonName() {
  const { t } = useTranslation("guildWar")
  const calendar = useCatalogDataset("events-calendar")
  const rows = calendar.status === "ready" ? calendar.data : undefined
  const seasonNumber = useCallback(
    (seasonId: string, at: string | number) =>
      rows
        ? calendarSeasonNumber(
            rows,
            seasonId,
            typeof at === "number" ? at : Date.parse(at)
          )
        : undefined,
    [rows]
  )
  const seasonName = useCallback(
    (seasonId: string, at?: string | number) => {
      const number = at === undefined ? undefined : seasonNumber(seasonId, at)
      return t("season", { name: number ?? seasonLetter(seasonId) })
    },
    [seasonNumber, t]
  )
  return { seasonName, seasonNumber }
}
