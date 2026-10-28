import {
  useLegendaryEvents,
  useLegendaryEventsProgress,
  useMinuteNow,
} from "@/entities/legendary-event"
import { useHomeScreenEventCalendar } from "@/features/daily-raids"

import { selectHomeEvents, type HomeEventRow } from "./select-home-events"

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

  if (homeScreen.status === "loading" || legendary.status === "loading") {
    return { status: "loading" }
  }
  if (homeScreen.status === "error" && legendary.status === "error") {
    return { status: "error" }
  }

  // One instant for both choosing the rows and their countdowns, so a row is never labelled with a
  // clock it was not selected at.
  const nowMs = homeScreen.status === "ready" ? homeScreen.nowMs : minuteNowMs
  const { live, upcoming } = selectHomeEvents({
    homeScreen: homeScreen.status === "ready" ? homeScreen : null,
    legendary:
      legendary.status === "ready"
        ? {
            events: legendary.data,
            progress: progress.status === "ready" ? progress.data : [],
          }
        : null,
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
