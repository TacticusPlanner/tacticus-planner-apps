import { eventStatus } from "@workspace/game-catalog"
import type { GameCatalogEventShopRecord } from "@workspace/game-catalog"

import { homeScreenEventInstanceKey } from "@/features/daily-raids"
import { deriveLegendaryEventLifecycle } from "@/entities/legendary-event"
import type { LegendaryEventProgress } from "@/entities/legendary-event"

import type { CalendarWindow } from "./calendar-window"

/** The fields the rows read from a Home Screen Event calendar entry. */
export interface HomeScreenEventEntry {
  /** Set on an authored occurrence; with the start it keys the HSE tab's `event` parameter. */
  occurrenceId?: string | null
  definitionId: string
  startUtc: string
  endUtc: string
  /** Occurrence parameters (e.g. a Faction Boost's `targetFactionId`), for its game art. */
  parameters?: Readonly<Record<string, unknown>> | null
}

/** The fields the rows read from a catalog Legendary Event. */
export interface LegendaryEventEntry {
  id: string
  eventStageStartDatesUtc: readonly string[]
}

/** A calendar occurrence with a featured hero (a Quest or a Hero Release Event). */
export interface FeaturedOccurrence {
  /** Opens the event's planner tab on this occurrence, where the tab supports it. */
  key: string
  startMs: number
  endMs: number
  featuredCharacterId: string | null
}

/** Running occurrences, by start, and the next one to start. */
export interface LiveAndNext<T> {
  live: readonly T[]
  next: T | null
}

/** The fields the rows read from a catalog event shop. */
export type EventShopEntry = Pick<
  GameCatalogEventShopRecord,
  "id" | "eventKey" | "definitionId" | "startUtc" | "dayCount"
>

interface HomeEventRowBase {
  /** Stable React key. */
  key: string
  live: boolean
  startMs: number
  endMs: number
  destination: string
}

export type HomeEventRow =
  | (HomeEventRowBase & {
      type: "homeScreen"
      definitionId: string
      parameters: Readonly<Record<string, unknown>> | null
    })
  | (HomeEventRowBase & {
      type: "legendaryEvent"
      /** The event unit's snowprint id, also the event id. */
      unitId: string
      /** From the sync, for a live event with a synced entry. */
      runNumber?: number | null
      points?: number
    })
  | (HomeEventRowBase & {
      type: "campaignEvent"
      /** The running campaign from the sync, for a live Campaign Event; the calendar names none. */
      campaignId: string | null
    })
  | (HomeEventRowBase & { type: "incursion" })
  | (HomeEventRowBase & {
      type: "quest"
      /** The quest's featured hero, from the calendar occurrence; null when it names none. */
      featuredCharacterId: string | null
    })
  | (HomeEventRowBase & {
      type: "hre"
      /** The Hero Release Event's featured hero; null when the occurrence names none. */
      featuredCharacterId: string | null
    })
  | (HomeEventRowBase & {
      type: "eventShop"
      /** The calendar definition (names the shop); null while its start date is TBA. */
      definitionId: string | null
      /** The game's event key (names an undated shop, e.g. `November2026`). */
      eventKey: string
      /** True when the start date is not announced yet: `startMs`/`endMs` are then Infinity. */
      dateTba: boolean
    })

const DAY_MS = 86_400_000

export interface HomeEvents {
  /** Running now: the live Home Screen Events, Legendary Event, Campaign Event, Incursion, Quest,
   *  Hero Release Event, then event shop. */
  live: HomeEventRow[]
  /** The next of each kind, by start (a shop with its start date TBA last). */
  upcoming: HomeEventRow[]
}

/**
 * Splits Home's event sources into what runs now and what starts next (UTC instants decide; the
 * device timezone only changes the displayed text). Every running occurrence is live. Upcoming holds
 * the next occurrence of each kind, so a run of Home Screen Events never pushes a Quest, Hero Release
 * Event or event shop off Home: the Home Screen Events that start first (several when they start
 * together), the next Legendary Event with a known start, Campaign Event, Incursion, Quest, Hero
 * Release Event, and the next dated event shop, else one whose start date is TBA. A shop with no date
 * is never live. Any source may be `null` when its read failed or is pending.
 */
export function selectHomeEvents({
  homeScreen,
  legendary,
  campaignEvent = null,
  incursion = null,
  quest = null,
  hre = null,
  eventShops = null,
  nowMs,
}: {
  homeScreen: {
    live: readonly HomeScreenEventEntry[]
    upcoming: readonly HomeScreenEventEntry[]
  } | null
  legendary: {
    events: readonly LegendaryEventEntry[]
    progress: readonly LegendaryEventProgress[]
  } | null
  campaignEvent?: (CalendarWindow & { campaignId: string | null }) | null
  incursion?: CalendarWindow | null
  quest?: LiveAndNext<FeaturedOccurrence> | null
  hre?: LiveAndNext<FeaturedOccurrence> | null
  eventShops?: readonly EventShopEntry[] | null
  nowMs: number
}): HomeEvents {
  const hseRow = (
    entry: HomeScreenEventEntry,
    live: boolean
  ): HomeEventRow => ({
    type: "homeScreen",
    key: `hse:${entry.definitionId}:${entry.startUtc}`,
    definitionId: entry.definitionId,
    parameters: entry.parameters ?? null,
    live,
    startMs: Date.parse(entry.startUtc),
    endMs: Date.parse(entry.endUtc),
    // Opens the HSE tab on this instance, not on whatever it shows by default.
    destination: `/dailies/hse?event=${encodeURIComponent(homeScreenEventInstanceKey(entry))}`,
  })

  const live: HomeEventRow[] = []
  const upcoming: HomeEventRow[] = []
  for (const entry of homeScreen?.live ?? []) live.push(hseRow(entry, true))
  const firstHseStartMs = Math.min(
    ...(homeScreen?.upcoming ?? []).map((entry) => Date.parse(entry.startUtc))
  )
  for (const entry of homeScreen?.upcoming ?? []) {
    if (Date.parse(entry.startUtc) === firstHseStartMs) {
      upcoming.push(hseRow(entry, false))
    }
  }

  let nextLegendary: HomeEventRow | null = null
  for (const event of legendary?.events ?? []) {
    const lifecycle = deriveLegendaryEventLifecycle(event, nowMs)
    if (lifecycle.runStartMs === undefined) continue // archived, or upcoming with the date TBA
    const isLive = lifecycle.state === "active"
    const synced = isLive
      ? legendary?.progress.find((entry) => entry.id === event.id)
      : undefined
    const row: HomeEventRow = {
      type: "legendaryEvent",
      key: `le:${event.id}:${lifecycle.runStartMs}`,
      unitId: event.id,
      live: isLive,
      startMs: lifecycle.runStartMs,
      endMs: lifecycle.runEndMs,
      destination: `/legendary-events/${event.id}`,
      ...(synced
        ? { runNumber: synced.currentEventRun, points: synced.currentPoints }
        : {}),
    }
    if (isLive) live.push(row)
    else if (!nextLegendary || row.startMs < nextLegendary.startMs) {
      nextLegendary = row
    }
  }
  if (nextLegendary) upcoming.push(nextLegendary)

  const windowRows: HomeEventRow[] = []
  if (campaignEvent) {
    const isLive = campaignEvent.status === "live"
    windowRows.push({
      type: "campaignEvent",
      key: `campaign-event:${campaignEvent.startMs}`,
      campaignId: isLive ? campaignEvent.campaignId : null,
      live: isLive,
      startMs: campaignEvent.startMs,
      endMs: campaignEvent.endMs,
      destination: "/my-game/campaign-events",
    })
  }
  if (incursion) {
    windowRows.push({
      type: "incursion",
      key: `incursion:${incursion.startMs}`,
      live: incursion.status === "live",
      startMs: incursion.startMs,
      endMs: incursion.endMs,
      destination: "/my-game/incursions",
    })
  }
  for (const row of windowRows) (row.live ? live : upcoming).push(row)

  const questRow = (
    occurrence: FeaturedOccurrence,
    isLive: boolean
  ): HomeEventRow => ({
    type: "quest",
    key: `quest:${occurrence.startMs}`,
    featuredCharacterId: occurrence.featuredCharacterId,
    live: isLive,
    startMs: occurrence.startMs,
    endMs: occurrence.endMs,
    // The Quest tab opens on the running quest, else the next one.
    destination: "/dailies/quest",
  })
  for (const occurrence of quest?.live ?? []) {
    live.push(questRow(occurrence, true))
  }
  if (quest?.next) upcoming.push(questRow(quest.next, false))

  const hreRow = (
    occurrence: FeaturedOccurrence,
    isLive: boolean
  ): HomeEventRow => ({
    type: "hre",
    key: `hre:${occurrence.startMs}`,
    featuredCharacterId: occurrence.featuredCharacterId,
    live: isLive,
    startMs: occurrence.startMs,
    endMs: occurrence.endMs,
    // Opens the HRE tab on this occurrence.
    destination: `/dailies/hre?event=${encodeURIComponent(occurrence.key)}`,
  })
  for (const occurrence of hre?.live ?? []) live.push(hreRow(occurrence, true))
  if (hre?.next) upcoming.push(hreRow(hre.next, false))

  const shopRow = (shop: EventShopEntry, isLive: boolean): HomeEventRow => {
    const startMs =
      shop.startUtc === null
        ? Number.POSITIVE_INFINITY
        : Date.parse(shop.startUtc)
    return {
      type: "eventShop",
      key: `event-shop:${shop.id}`,
      definitionId: shop.definitionId,
      eventKey: shop.eventKey,
      dateTba: shop.startUtc === null,
      live: isLive,
      startMs,
      endMs: startMs + shop.dayCount * DAY_MS,
      destination: `/dailies/event-shop/${encodeURIComponent(shop.id)}`,
    }
  }
  let nextShop: HomeEventRow | null = null
  for (const shop of eventShops ?? []) {
    if (shop.startUtc === null) continue
    const status = eventStatus(
      { startUtc: shop.startUtc, dayCount: shop.dayCount },
      nowMs
    )
    if (status === "running") live.push(shopRow(shop, true))
    else if (status === "upcoming") {
      const row = shopRow(shop, false)
      if (!nextShop || row.startMs < nextShop.startMs) nextShop = row
    }
  }
  // Only while no dated shop is coming: the served order puts the soonest undated one first.
  const undated = (eventShops ?? []).find((shop) => shop.startUtc === null)
  if (!nextShop && undated) nextShop = shopRow(undated, false)
  if (nextShop) upcoming.push(nextShop)

  // Infinity − Infinity is NaN, so two TBA starts compare equal explicitly.
  upcoming.sort((a, b) => (a.startMs === b.startMs ? 0 : a.startMs - b.startMs))

  return { live, upcoming }
}

/** Upcoming rows shown before "Show more". */
const UPCOMING_COLLAPSED_LIMIT = 3

/**
 * The upcoming rows Home shows collapsed: the first `limit` by start, with the next Legendary Event
 * pinned into the last slot when none is live, so a Legendary Event is always visible in Right now
 * or Upcoming events. The rest stay behind "Show more", in start order.
 */
export function collapseUpcoming(
  { live, upcoming }: HomeEvents,
  limit = UPCOMING_COLLAPSED_LIMIT
): HomeEventRow[] {
  const shown = upcoming.slice(0, limit)
  const hasLiveLegendary = live.some((row) => row.type === "legendaryEvent")
  const nextLegendary = upcoming.find((row) => row.type === "legendaryEvent")
  if (
    !hasLiveLegendary &&
    nextLegendary &&
    !shown.includes(nextLegendary) &&
    limit > 0
  ) {
    // Every shown row starts before it, so it stays last in start order.
    shown.splice(limit - 1, 1, nextLegendary)
  }
  return shown
}
