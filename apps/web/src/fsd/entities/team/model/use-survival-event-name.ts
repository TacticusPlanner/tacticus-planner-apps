import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { survivalEventMonthUtc } from "../lib/survival-event-name"

/**
 * A Survival event's name: its month and year in the UI language ("December 2026") for a monthly
 * event, else the `survival:events.<id>` name ("Crescendo A"), else the id.
 */
export function useSurvivalEventName() {
  const { t, i18n } = useTranslation("survival")
  const language = i18n.language
  return useCallback(
    (id: string) => {
      const month = survivalEventMonthUtc(id)
      if (month !== null) {
        return new Intl.DateTimeFormat(language, {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }).format(month)
      }
      return t(`events.${id}` as never, { defaultValue: id })
    },
    [t, language]
  )
}
