import {
  useLegendaryEvents,
  useLegendaryEventsProgress,
  useMinuteNow,
} from "@/entities/legendary-event"
import { useIncursionWindow } from "@/entities/incursion"
import { useHomeScreenEventCalendar } from "@/features/daily-raids"
import { useCatalogDataset, usePlayerChunk } from "@/shared/local-data"

import { calendarLiveAndNext, calendarWindowEntry } from "./calendar-window"
import type { CalendarOccurrence } from "./calendar-window"
import { selectHomeEvents } from "./select-home-events"
import type {
  EventShopEntry,
  FeaturedOccurrence,
  HomeEventRow,
  LiveAndNext,
} from "./select-home-events"

/** The calendar's definition id for a Campaign Event window; it names no campaign. */
const CAMPAIGN_EVENT_DEFINITION_ID = "campaign-event"
/** The calendar's definition id for a Quest Event; its occurrence names the featured hero. */
const QUEST_DEFINITION_ID = "quest"
/** The calendar's definition id for a Hero Release Event; its occurrence names the featured hero. */
const HRE_DEFINITION_ID = "new-character-event"

type CalendarEntry = {
  occurrenceId?: string | null
  definitionId: string
  startUtc: string
  endUtc: string
  parameters?: Record<string, unknown> | null
}

function featuredOccurrence({
  startMs,
  endMs,
  entry,
}: CalendarOccurrence<CalendarEntry>): FeaturedOccurrence {
  const featured = entry.parameters?.featuredCharacterId
  return {
    // The HRE tab's `event` key: the occurrence id, else `definitionId@startUtc`.
    key: entry.occurrenceId ?? `${entry.definitionId}@${entry.startUtc}`,
    startMs,
    endMs,
    featuredCharacterId: typeof featured === "string" ? featured : null,
  }
}

function featuredLiveAndNext(
  entries: readonly CalendarEntry[],
  definitionId: string,
  nowMs: number
): LiveAndNext<FeaturedOccurrence> {
  const { live, next } = calendarLiveAndNext(entries, definitionId, nowMs)
  return {
    live: live.map(featuredOccurrence),
    next: next && featuredOccurrence(next),
  }
}

/** Every running HSE (they can overlap, e.g. a global event beside a Faction Boost), the one the
 *  HSE tab opens on first, and the upcoming ones. */
function homeScreenLiveAndUpcoming<TEntry>(state: {
  active: TEntry | null
  upcoming: TEntry[]
  instances: readonly { entry: TEntry; status: string }[]
}): { live: TEntry[]; upcoming: TEntry[] } {
  const others = state.instances
    .filter(
      (instance) =>
        instance.status === "running" && instance.entry !== state.active
    )
    .map((instance) => instance.entry)
  return {
    live: state.active === null ? others : [state.active, ...others],
    upcoming: state.upcoming,
  }
}

/** Module-level, so TanStack memoises the slim shop list per dataset read. */
function toEventShopEntries(
  records: readonly EventShopEntry[]
): EventShopEntry[] {
  return records.map(({ id, eventKey, definitionId, startUtc, dayCount }) => ({
    id,
    eventKey,
    definitionId,
    startUtc,
    dayCount,
  }))
}

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
  const eventShops = useCatalogDataset("event-shops", toEventShopEntries)
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
      ? calendarWindowEntry(calendar.data, CAMPAIGN_EVENT_DEFINITION_ID, nowMs)
      : null
  const quest =
    calendar.status === "ready"
      ? featuredLiveAndNext(calendar.data, QUEST_DEFINITION_ID, nowMs)
      : null
  const hre =
    calendar.status === "ready"
      ? featuredLiveAndNext(calendar.data, HRE_DEFINITION_ID, nowMs)
      : null
  const { live, upcoming } = selectHomeEvents({
    homeScreen:
      homeScreen.status === "ready"
        ? homeScreenLiveAndUpcoming(homeScreen)
        : null,
    legendary:
      legendary.status === "ready"
        ? {
            events: legendary.data,
            progress: progress.status === "ready" ? progress.data : [],
          }
        : null,
    campaignEvent: campaignEventWindow && {
      ...campaignEventWindow.window,
      confirmed: campaignEventWindow.entry.confirmed,
      campaignId:
        activeCampaignEvent.status === "ready"
          ? activeCampaignEvent.data
          : null,
    },
    incursion,
    quest,
    hre,
    eventShops: eventShops.status === "ready" ? eventShops.data : null,
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
