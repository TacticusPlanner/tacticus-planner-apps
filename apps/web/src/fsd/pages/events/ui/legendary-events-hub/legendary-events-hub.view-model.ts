import {
  orderLegendaryEventsForHub,
  type LegendaryEvent,
  type LegendaryEventLifecycle,
  type LegendaryEventProgress,
  type ReadState,
} from "@/entities/legendary-event"

/** What a hub card shows from the sync, for an active event only. */
type HubCardSynced =
  | { kind: "none" }
  | { kind: "unavailable" }
  | {
      kind: "entry"
      run: number | null
      tokens: { current: number; max: number } | null
      points: number
    }

export interface HubCardView {
  eventId: string
  name: string
  lifecycle: LegendaryEventLifecycle
  synced: HubCardSynced
}

export interface HubView {
  active: HubCardView[]
  upcoming: HubCardView[]
  archived: HubCardView[]
}

function syncedFor(
  eventId: string,
  progress: ReadState<LegendaryEventProgress[]>
): HubCardSynced {
  if (progress.status === "error") return { kind: "unavailable" }
  if (progress.status !== "ready") return { kind: "none" }
  const entry = progress.data.find((item) => item.id === eventId)
  if (!entry) return { kind: "none" }
  const tokens = entry.currentEventTokens
  return {
    kind: "entry",
    run: entry.currentEventRun,
    tokens: tokens ? { current: tokens.current, max: tokens.max } : null,
    points: entry.currentPoints,
  }
}

/** Groups the catalog events for the hub (active, upcoming by start, archived by localized name)
 *  and attaches the synced run, tokens and points to the active ones. */
export function buildHubView(
  events: readonly LegendaryEvent[],
  progress: ReadState<LegendaryEventProgress[]>,
  nowMs: number,
  nameOf: (eventId: string) => string,
  locale: string
): HubView {
  const groups = orderLegendaryEventsForHub(
    events,
    nowMs,
    (event) => nameOf(event.id),
    locale
  )
  const toCard =
    (withSync: boolean) =>
    ({
      event,
      lifecycle,
    }: {
      event: LegendaryEvent
      lifecycle: LegendaryEventLifecycle
    }): HubCardView => ({
      eventId: event.id,
      name: nameOf(event.id),
      lifecycle,
      synced: withSync ? syncedFor(event.id, progress) : { kind: "none" },
    })
  return {
    active: groups.active.map(toCard(true)),
    upcoming: groups.upcoming.map(toCard(false)),
    archived: groups.archived.map(toCard(false)),
  }
}
