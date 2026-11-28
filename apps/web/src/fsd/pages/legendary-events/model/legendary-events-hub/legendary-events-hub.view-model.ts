import {
  orderLegendaryEventsForHub,
  legendaryEventRunDates,
  legendaryEventRunWindow,
} from "@/entities/legendary-event"
import type {
  LegendaryEvent,
  LegendaryEventLifecycle,
  LegendaryEventProgress,
  ReadState,
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

/** Where a run stands: finished, running now, announced and still ahead, or only guessed
 *  (or not estimable at all). */
export type HubCardRunStatus = "past" | "current" | "upcoming" | "maybe"

/** One run of an unfinished event: its announced or guessed start, null when not estimable. */
interface HubCardRun {
  run: number
  startMs: number | null
  guessed: boolean
  status: HubCardRunStatus
}

function runStatus(
  window: { startMs: number; endMs: number; guessed: boolean } | null,
  nowMs: number
): HubCardRunStatus {
  if (!window) return "maybe"
  if (window.endMs <= nowMs) return "past"
  if (window.guessed) return "maybe"
  return window.startMs <= nowMs ? "current" : "upcoming"
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
  lifecycle: LegendaryEventLifecycle,
  events: readonly LegendaryEvent[],
  nowMs: number
): HubCardRun[] {
  if (lifecycle.state === "archived") return []
  return legendaryEventRunDates(event, events).starts.map((start) => {
    const window = legendaryEventRunWindow(start)
    return {
      run: start.run,
      startMs: window?.startMs ?? null,
      guessed: window?.guessed ?? false,
      status: runStatus(window, nowMs),
    }
  })
}

export interface HubViewModel {
  active: HubCardViewModel[]
  /** Upcoming events whose next run has an announced start, soonest first. */
  upNext: HubCardViewModel[]
  /** Upcoming events with no announced start yet, by guessed start (unguessable last). */
  notAnnounced: HubCardViewModel[]
  archived: HubCardViewModel[]
}

/** The first run not yet over: the one an upcoming card counts down to. */
const nextRun = (card: HubCardViewModel) =>
  card.runs.find((run) => run.status !== "past")

const byNextStart = (a: HubCardViewModel, b: HubCardViewModel) =>
  (nextRun(a)?.startMs ?? Number.POSITIVE_INFINITY) -
  (nextRun(b)?.startMs ?? Number.POSITIVE_INFINITY)

/** Splits upcoming cards by whether their next run's start is announced. */
function splitUpcoming(
  cards: readonly HubCardViewModel[]
): Pick<HubViewModel, "upNext" | "notAnnounced"> {
  const announced = (card: HubCardViewModel) =>
    nextRun(card)?.status === "upcoming"
  return {
    upNext: cards.filter(announced).toSorted(byNextStart),
    notAnnounced: cards
      .filter((card) => !announced(card))
      .toSorted(byNextStart),
  }
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

/** Groups the catalog events for the hub (active; upcoming split into up next and not announced
 *  yet, each by start; archived by localized name)
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
      runs: hubRuns(event, lifecycle, events, nowMs),
    })
  return {
    active: groups.active.map(toCard(true)),
    ...splitUpcoming(groups.upcoming.map(toCard(false))),
    archived: groups.archived.map(toCard(false)),
  }
}
