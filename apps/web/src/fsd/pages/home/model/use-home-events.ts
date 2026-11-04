import {
  useLegendaryEvents,
  useLegendaryEventsProgress,
  useMinuteNow,
} from "@/entities/legendary-event"
import { useIncursionWindow } from "@/entities/incursion"
import { useHomeScreenEventCalendar } from "@/features/daily-raids"
import { useCatalogDataset, usePlayerChunk } from "@/shared/local-data"

import { calendarWindow } from "./calendar-window"
import { selectHomeEvents, type HomeEventRow } from "./select-home-events"

/** The calendar's definition id for a Campaign Event window; it names no campaign. */
const CAMPAIGN_EVENT_DEFINITION_ID = "campaign-event"

export type HomeEventsState =
  | { status: "loading" }
  | { status: "error" }
  | {
      status: "ready"
      live: HomeEventRow[]
      upcoming: HomeEventRow[]
      /** The source whose read failed while the other succeeded; its rows are missing. */
      failedSource: "homeScreen" | "legendary" | null
      /** The instant the rows were selected at, for their countdowns. */
      nowMs: number
    }

/** Home's events, read once and shared by the Right now band (live) and Upcoming events. */
export function useHomeEvents(): HomeEventsState {
  // No raid-point rules: Home needs none, and their zod-backed parse would join the Home bundle.
  const homeScreen = useHomeScreenEventCalendar()
  const legendary = useLegendaryEvents()
  const progress = useLegendaryEventsProgress()
  // The rows count down; `legendary` re-renders only on a lifecycle flip.
  const minuteNowMs = useMinuteNow()
  const incursion = useIncursionWindow(minuteNowMs)
  const calendar = useCatalogDataset("events-calendar")
  const activeCampaignEvent = usePlayerChunk(
    "live-progress",
    (chunk) => chunk?.activeCampaignEventId ?? null
  )

  if (homeScreen.status === "loading" || legendary.status === "loading") {
    return { status: "loading" }
  }
  if (homeScreen.status === "error" && legendary.status === "error") {
    return { status: "error" }
  }

  // One instant for both choosing the rows and their countdowns, so a row is never labelled with a
  // clock it was not selected at.
  const nowMs = homeScreen.status === "ready" ? homeScreen.nowMs : minuteNowMs
  const campaignEventWindow =
    calendar.status === "ready"
      ? calendarWindow(calendar.data, CAMPAIGN_EVENT_DEFINITION_ID, nowMs)
      : null
  const { live, upcoming } = selectHomeEvents({
    homeScreen: homeScreen.status === "ready" ? homeScreen : null,
    legendary:
      legendary.status === "ready"
        ? {
            events: legendary.data,
            progress: progress.status === "ready" ? progress.data : [],
          }
        : null,
    campaignEvent: campaignEventWindow && {
      ...campaignEventWindow,
      campaignId:
        activeCampaignEvent.status === "ready"
          ? activeCampaignEvent.data
          : null,
    },
    incursion,
    nowMs,
  })

  return {
    status: "ready",
    live,
    upcoming,
    failedSource:
      homeScreen.status === "error"
        ? "homeScreen"
        : legendary.status === "error"
          ? "legendary"
          : null,
    nowMs,
  }
}
