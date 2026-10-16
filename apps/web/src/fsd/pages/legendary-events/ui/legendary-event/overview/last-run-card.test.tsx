import { useEffect, useState } from "react"
import type { i18n as I18n } from "i18next"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import type {
  LegendaryEventRosterUnit,
  LegendaryEventRunRecord,
  LegendaryEventLifecycleState,
  RunHistory,
} from "@/entities/legendary-event"
import {
  rosterAfterRun1,
  utharRun1Record,
  utharRun2Record,
} from "@/test/fixtures/legendary-event-run-records"
import { utharEvent } from "@/test/fixtures/legendary-events"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { act, fireEvent, render, screen, within } from "@/test/render"
import { setViewportWidth } from "@/test/viewport"

import { LastRunCard } from "./last-run-card"
import {
  buildLastRunViewModel,
  type LastRunViewModel,
} from "./last-run.view-model"

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: <T,>(querier: () => Promise<T>) => {
    const [value, setValue] = useState<T>()
    useEffect(() => {
      void querier().then(setValue)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return value
  },
}))
vi.mock("@workspace/game-catalog/queries", () => ({
  getCharactersMap: async () => new Map(),
  getMowsMap: async () => new Map(),
}))

let i18n: I18n

const roster = rosterAfterRun1 as unknown as LegendaryEventRosterUnit[]
const run3Record: LegendaryEventRunRecord = {
  ...utharRun2Record,
  id: "record-run-3",
  run: 3,
}

function readyView(
  records: LegendaryEventRunRecord[],
  {
    lifecycle = "archived",
    currentRoster = roster,
  }: {
    lifecycle?: LegendaryEventLifecycleState
    currentRoster?: LegendaryEventRosterUnit[] | "error"
  } = {}
): LastRunViewModel {
  return buildLastRunViewModel({
    enabled: true,
    records: { status: "ready", data: records, retry: () => {} },
    lifecycle,
    progress: undefined,
    roster: currentRoster,
    event: utharEvent,
  })
}

function Harness({
  lastRun,
  onViewed,
  onEarlierExpanded,
}: {
  lastRun: LastRunViewModel
  onViewed: (history: RunHistory) => void
  onEarlierExpanded: (recordCount: number) => void
}) {
  const isMobile = useIsMobile()
  return (
    <LastRunCard
      isMobile={isMobile}
      lastRun={lastRun}
      onEarlierExpanded={onEarlierExpanded}
      onViewed={onViewed}
    />
  )
}

function renderCard(lastRun: LastRunViewModel, width = 1280) {
  setViewportWidth(width)
  const onViewed = vi.fn()
  const onEarlierExpanded = vi.fn()
  const view = render(
    <Harness
      lastRun={lastRun}
      onEarlierExpanded={onEarlierExpanded}
      onViewed={onViewed}
    />,
    { wrapper: i18nWrapper(i18n) }
  )
  return { onViewed, onEarlierExpanded, view }
}

const card = () => screen.getByTestId("legendary-event-last-run")
const laneSummaries = () =>
  screen
    .getAllByTestId("last-run-lane-summary")
    .map((element) => element.textContent)
const teamLines = () =>
  screen.getAllByTestId("last-run-team").map((team) => ({
    name: team.dataset.team,
    cleared: within(team).getByTestId("last-run-team-cleared").textContent,
    members: within(team)
      .getAllByRole("listitem")
      .map((member) => member.dataset.unit),
  }))
const deltaLines = () =>
  Object.fromEntries(
    screen.getAllByTestId("last-run-delta").map((delta) => [
      delta.dataset.unit,
      within(delta)
        .getAllByRole("listitem")
        .map((line) => line.textContent),
    ])
  )
const follows = (first: HTMLElement, second: HTMLElement) =>
  Boolean(
    first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING
  )
const localDate = (iso: string) =>
  new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(iso))

const FORMS = [
  { form: "desktop", width: 1280 },
  { form: "mobile", width: 390 },
] as const

describe("LastRunCard", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("desktop: run, date, points, three lanes side by side with teams, then Since last run", () => {
    renderCard(readyView([utharRun1Record], { lifecycle: "active" }))
    expect(screen.getByTestId("last-run-run")).toHaveTextContent("Run 1 of 3")
    expect(screen.getByTestId("last-run-date")).toHaveTextContent(
      localDate(utharRun1Record.progressAt)
    )
    expect(screen.getByTestId("last-run-points")).toHaveTextContent(
      "2,410 event points"
    )
    expect(screen.getByTestId("last-run-lanes")).toHaveAttribute(
      "data-layout",
      "columns"
    )
    expect(laneSummaries()).toEqual([
      "Alpha: battle 4 · 1,002 points",
      "Beta: no battle cleared · 0 points",
      "Gamma: no battle cleared · 0 points",
    ])
    // Teams show without a toggle, with portraits and "cleared up to" (planned depth when stored).
    expect(screen.queryByTestId("last-run-lane-teams-toggle")).toBeNull()
    expect(teamLines()).toEqual([
      {
        name: "team-ultras",
        cleared: "cleared up to battle 2 · planned 6",
        members: ["ultraCalgar", "ultraTigurius"],
      },
      {
        name: "team-melee",
        cleared: "cleared up to battle 3",
        members: ["ultraCalgar"],
      },
    ])
    const since = screen.getByTestId("last-run-since")
    expect(since).toHaveTextContent("Since last run")
    expect(follows(screen.getByTestId("last-run-lanes"), since)).toBe(true)
    expect(deltaLines()).toEqual({
      ultraCalgar: [
        "Rank Diamond I → Diamond III",
        "Stars Red Five Stars → One Blue Star",
        "Active ability 40 → 45",
      ],
      ultraTigurius: ["Unlocked since last run"],
    })
    // An active event shows only the Last run card.
    expect(screen.queryByTestId("legendary-event-earlier-runs")).toBeNull()
  })

  it("mobile: lanes stacked, each lane's teams behind a Teams (N) toggle, then Since last run", () => {
    renderCard(readyView([utharRun1Record], { lifecycle: "active" }), 390)
    expect(screen.getByTestId("last-run-lanes")).toHaveAttribute(
      "data-layout",
      "stacked"
    )
    expect(screen.queryByTestId("last-run-team")).toBeNull()
    // Only Alpha has teams, so only Alpha has a toggle.
    const toggles = screen.getAllByTestId("last-run-lane-teams-toggle")
    expect(toggles).toHaveLength(1)
    expect(toggles[0]).toHaveTextContent("Teams (2)")
    expect(toggles[0]).toHaveAttribute("aria-expanded", "false")
    fireEvent.click(toggles[0]!)
    expect(toggles[0]).toHaveAttribute("aria-expanded", "true")
    expect(teamLines().map((team) => team.cleared)).toEqual([
      "cleared up to battle 2 · planned 6",
      "cleared up to battle 3",
    ])
    expect(
      follows(
        screen.getByTestId("last-run-lanes"),
        screen.getByTestId("last-run-since")
      )
    ).toBe(true)
    // Nothing is laid out wider than the column.
    expect(screen.getByTestId("last-run-lanes")).toHaveClass("grid-cols-1")
  })

  describe.each(FORMS)("data states ($form)", ({ width }) => {
    it("shows a skeleton while the records load", () => {
      renderCard({ kind: "loading" }, width)
      expect(card()).toHaveAttribute("data-state", "loading")
      expect(screen.getByTestId("last-run-loading")).toBeInTheDocument()
    })

    it("shows History unavailable with Retry when the read failed", () => {
      const retry = vi.fn()
      renderCard({ kind: "error", retry }, width)
      expect(screen.getByTestId("last-run-error")).toHaveTextContent(
        "History unavailable"
      )
      fireEvent.click(screen.getByRole("button", { name: "Retry" }))
      expect(retry).toHaveBeenCalledOnce()
    })

    it("shows the one-line note in the card's place when there are no records", () => {
      renderCard(readyView([]), width)
      expect(
        screen.getByTestId("legendary-event-history-note")
      ).toHaveTextContent("History starts with your next synced run")
      expect(screen.queryByTestId("legendary-event-last-run")).toBeNull()
    })

    it("shows nothing on an active event's first recorded run", () => {
      const { view } = renderCard({ kind: "hidden" }, width)
      expect(view.container).toBeEmptyDOMElement()
    })

    it("says no teams were planned, without a Since last run list", () => {
      renderCard(readyView([{ ...utharRun1Record, teams: [] }]), width)
      expect(screen.getByTestId("last-run-no-teams")).toHaveTextContent(
        "No teams were planned for this run"
      )
      expect(screen.queryByTestId("last-run-since")).toBeNull()
      expect(screen.queryByTestId("last-run-lane-teams-toggle")).toBeNull()
    })

    it("replaces the list when the record has no roster snapshot", () => {
      renderCard(
        readyView([{ ...utharRun1Record, rosterSnapshot: null }]),
        width
      )
      expect(screen.getByTestId("last-run-no-snapshot")).toHaveTextContent(
        "Roster at the time is unavailable"
      )
      expect(screen.queryByTestId("last-run-deltas")).toBeNull()
    })

    it("asks for a roster sync when the roster cannot be read", () => {
      renderCard(
        readyView([utharRun1Record], { currentRoster: "error" }),
        width
      )
      expect(screen.getByTestId("last-run-no-roster")).toHaveTextContent(
        "Sync your roster to compare"
      )
      expect(screen.queryByTestId("last-run-deltas")).toBeNull()
    })

    it("shows a lane's cleared battle but no points after catalog drift", () => {
      const tooMany = Array.from({ length: 40 }, () => ({
        objectivesCleared: [0],
        highScore: 1,
      }))
      renderCard(
        readyView([
          {
            ...utharRun1Record,
            lanes: { ...utharRun1Record.lanes, beta: tooMany },
          },
        ]),
        width
      )
      expect(laneSummaries()[1]).toBe("Beta: battle 40")
    })

    it("lists earlier runs collapsed on an archived event, each expandable", () => {
      const { onEarlierExpanded } = renderCard(
        readyView([run3Record, utharRun2Record, utharRun1Record]),
        width
      )
      expect(screen.getByTestId("last-run-run")).toHaveTextContent("Run 3 of 3")
      const toggle = screen.getByTestId("last-run-earlier-toggle")
      expect(toggle).toHaveTextContent("Earlier runs (2)")
      expect(toggle).toHaveAttribute("aria-expanded", "false")
      expect(screen.queryByTestId("legendary-event-earlier-run")).toBeNull()

      fireEvent.click(toggle)
      const entries = screen.getAllByTestId("legendary-event-earlier-run")
      expect(entries.map((entry) => entry.dataset.record)).toEqual([
        "record-run-2",
        "record-run-1",
      ])
      expect(entries[1]).toHaveTextContent(
        `Run 1 of 3 · ${localDate(utharRun1Record.progressAt)}`
      )
      expect(onEarlierExpanded).toHaveBeenCalledExactlyOnceWith(2)

      const entry = within(entries[1]!)
      expect(entry.queryByTestId("last-run-body")).toBeNull()
      fireEvent.click(entry.getByTestId("last-run-earlier-entry-toggle"))
      expect(entry.getByTestId("last-run-body")).toBeInTheDocument()
      expect(entry.getByTestId("last-run-since")).toHaveTextContent(
        "Since this run"
      )
      expect(
        entry
          .getAllByTestId("last-run-lane-summary")
          .map((summary) => summary.textContent)[0]
      ).toBe("Alpha: battle 4 · 1,002 points")

      // Closing and reopening records the expansion only once.
      fireEvent.click(toggle)
      fireEvent.click(toggle)
      expect(onEarlierExpanded).toHaveBeenCalledOnce()
    })
  })

  describe("legendary_event_last_run_viewed", () => {
    it("reports the card once on mount where IntersectionObserver is unavailable", () => {
      const { onViewed, view } = renderCard(readyView([utharRun1Record]))
      expect(onViewed).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ run: 1, teamCount: 2 })
      )
      view.rerender(
        <Harness
          lastRun={readyView([utharRun1Record])}
          onEarlierExpanded={vi.fn()}
          onViewed={onViewed}
        />
      )
      expect(onViewed).toHaveBeenCalledOnce()
    })

    it("waits until the card is first visible", () => {
      const callbacks: IntersectionObserverCallback[] = []
      const disconnect = vi.fn()
      vi.stubGlobal(
        "IntersectionObserver",
        class {
          constructor(callback: IntersectionObserverCallback) {
            callbacks.push(callback)
          }
          observe() {}
          disconnect = disconnect
        }
      )
      setViewportWidth(1280)
      const onViewed = vi.fn()
      render(
        <Harness
          lastRun={readyView([utharRun1Record])}
          onEarlierExpanded={vi.fn()}
          onViewed={onViewed}
        />,
        { wrapper: i18nWrapper(i18n) }
      )
      expect(onViewed).not.toHaveBeenCalled()
      act(() => {
        callbacks[0]!(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          {} as IntersectionObserver
        )
      })
      expect(onViewed).toHaveBeenCalledOnce()
      expect(disconnect).toHaveBeenCalled()
    })
  })
})
