import {
  orderLegendaryEventsForHub,
  type LegendaryEvent,
  type LegendaryEventLifecycle,
  type LegendaryEventProgress,
  type ReadState,
} from "@/entities/legendary-event"

import {
  legendaryEventRunDates,
  legendaryEventRunWindow,
} from "../../lib/run-dates"

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

/** One run of an unfinished event: its announced or guessed start, null when not estimable. */
export interface HubCardRun {
  run: number
  startMs: number | null
  guessed: boolean
}

export interface HubCardViewModel {
  eventId: string
  name: string
  lifecycle: LegendaryEventLifecycle
  synced: HubCardSynced
  /** Every run with its date (guessed from past run gaps when not announced); empty once the
   *  event is finished. */
  runs: HubCardRun[]
}

/** The dates of each run of an unfinished event (spec: guessed run dates on the hub). */
function hubRuns(
  event: LegendaryEvent,
  lifecycle: LegendaryEventLifecycle
): HubCardRun[] {
  if (lifecycle.state === "archived") return []
  return legendaryEventRunDates(event).starts.map((start) => {
    const window = legendaryEventRunWindow(start)
    return {
      run: start.run,
      startMs: window?.startMs ?? null,
      guessed: window?.guessed ?? false,
    }
  })
}

export interface HubViewModel {
  active: HubCardViewModel[]
  upcoming: HubCardViewModel[]
  archived: HubCardViewModel[]
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
export function buildHubViewModel(
  events: readonly LegendaryEvent[],
  progress: ReadState<LegendaryEventProgress[]>,
  nowMs: number,
  nameOf: (eventId: string) => string,
  locale: string
): HubViewModel {
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
    }): HubCardViewModel => ({
      eventId: event.id,
      name: nameOf(event.id),
      lifecycle,
      synced: withSync ? syncedFor(event.id, progress) : { kind: "none" },
      runs: hubRuns(event, lifecycle),
    })
  return {
    active: groups.active.map(toCard(true)),
    upcoming: groups.upcoming.map(toCard(false)),
    archived: groups.archived.map(toCard(false)),
  }
}
