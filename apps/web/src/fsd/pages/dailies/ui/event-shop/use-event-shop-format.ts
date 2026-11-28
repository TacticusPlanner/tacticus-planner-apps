import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { dateTimeFormat } from "@/shared/lib"
import { useEventRewardFormat } from "@/widgets/event-rewards"
import type { EventRewardFormat, RewardDisplay } from "@/widgets/event-rewards"

export type RewardText = RewardDisplay

export interface EventShopFormat extends EventRewardFormat {
  /** `2026-10-29` → "Thu 29 Oct" in the user's language (the date is a UTC calendar date). */
  date: (date: string) => string
  /** `2026-10-29` → "Thu". */
  weekday: (date: string) => string
  /** `2026-10-29` → "29". */
  dayOfMonth: (date: string) => string
}

/**
 * Display helpers for the event shop: the seasonal reward labels, icons and numbers the Survival page
 * shares, plus locale-aware dates.
 */
export function useEventShopFormat(): EventShopFormat {
  const { i18n } = useTranslation()
  const rewards = useEventRewardFormat()
  const language = i18n.language

  return useMemo(() => {
    const dateFormat = dateTimeFormat(language, {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    })
    const weekdayFormat = dateTimeFormat(language, {
      weekday: "short",
      timeZone: "UTC",
    })
    const dayFormat = dateTimeFormat(language, {
      day: "numeric",
      timeZone: "UTC",
    })
    const parse = (date: string) => new Date(`${date}T00:00:00Z`)
    return {
      ...rewards,
      date: (date) => dateFormat.format(parse(date)),
      weekday: (date) => weekdayFormat.format(parse(date)),
      dayOfMonth: (date) => dayFormat.format(parse(date)),
    }
  }, [language, rewards])
}
