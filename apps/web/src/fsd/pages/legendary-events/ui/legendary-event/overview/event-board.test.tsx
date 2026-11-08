import type { i18n as I18n } from "i18next"
import { beforeAll, describe, expect, it, vi } from "vitest"

import {
  RankShadingProvider,
  type LegendaryEventLaneId,
  type LegendaryEventPlan,
  type LegendaryEventRosterUnit,
  type LegendaryEventTeam,
} from "@/entities/legendary-event"
import { safeStorage } from "@/shared/lib"
import { legendaryEventCharacters } from "@/test/fixtures/legendary-event-characters"
import { lysanderEvent } from "@/test/fixtures/legendary-events"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { fireEvent, render, screen, within } from "@/test/render"

import type { TeamsSectionState } from "../teams/teams.view-model"
import { EventBoard } from "./event-board"

// Every member derives objective 0 only, so a team covers objective 0 when it stores it.
vi.mock("@/entities/legendary-event", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/legendary-event")>()),
  derivedTeamCoverage: () => [0],
}))

let i18n: I18n

const team = (
  id: string,
  laneId: LegendaryEventTeam["laneId"],
  name: string
): LegendaryEventTeam => ({
  id,
  laneId,
  name,
  sortOrder: 0,
  memberUnitIds: ["ultraCalgar", "ultraTigurius", "ultraTitus"],
  reserveUnitId: null,
  objectiveIndexes: [0],
  runDepths: [],
})

const plan: LegendaryEventPlan = {
  eventId: "astarLysander",
  revision: 1,
  catalogVersion: "1",
  notes: null,
  showPaidOptions: false,
  runs: [],
  annotations: [],
  teams: [team("a1", "alpha", "Alpha squad"), team("b1", "beta", "Beta squad")],
}

const ready: TeamsSectionState = {
  kind: "ready",
  plan,
  units: [],
  roster: undefined,
}

const rosterUnit = (unitId: string): LegendaryEventRosterUnit =>
  ({
    unitId,
    rank: "Gold2",
    progressionIndex: "Legendary:RedFourStars",
    abilities: [
      { abilityId: "active", level: 35 },
      { abilityId: "passive", level: 28 },
    ],
  }) as unknown as LegendaryEventRosterUnit

const withUnits: TeamsSectionState = {
  kind: "ready",
  plan,
  units: legendaryEventCharacters as never,
  roster: [rosterUnit("ultraCalgar")],
}

function renderBoard(
  teams: TeamsSectionState = ready,
  catalog: Parameters<typeof EventBoard>[0]["catalog"] = teams.kind === "ready"
    ? { units: teams.units, roster: teams.roster }
    : { units: "loading", roster: undefined },
  laneIds: readonly LegendaryEventLaneId[] = ["alpha", "beta", "gamma"]
) {
  const onAddTeam = vi.fn()
  // The page provides Rank shading around the board.
  const { unmount } = render(
    <RankShadingProvider>
      <EventBoard
        catalog={catalog}
        event={lysanderEvent}
        laneFigures={(laneId) => <p data-testid="lane-figures">{laneId}</p>}
        laneIds={laneIds}
        laneTeamsSection={(laneId) => (
          <p data-testid="lane-teams">{`${laneId} teams`}</p>
        )}
        onAddTeam={onAddTeam}
        progressGrid={{ kind: "unavailable" }}
        teams={teams}
        unitPower={null}
      />
    </RankShadingProvider>,
    { wrapper: i18nWrapper(i18n) }
  )
  return { onAddTeam, unmount }
}

const lane = (laneId: string) =>
  screen
    .getAllByTestId("event-board-lane")
    .find((column) => column.dataset.lane === laneId)!

describe("EventBoard", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })

  it("turns Rank shading off for every chip and keeps it off after a remount", () => {
    safeStorage.remove("legendaryEvents.unitChips.rankShading")
    const shaded = () =>
      screen
        .getAllByTestId("event-board-unit")
        .filter((chip) => chip.dataset.shaded === "true").length
    const { unmount } = renderBoard(withUnits)
    const toggle = screen.getByRole("switch", { name: "Rank shading" })
    expect(toggle).toBeChecked()
    expect(shaded()).toBeGreaterThan(0)

    fireEvent.click(toggle)
    expect(toggle).not.toBeChecked()
    expect(shaded()).toBe(0)

    unmount()
    renderBoard(withUnits)
    expect(
      screen.getByRole("switch", { name: "Rank shading" })
    ).not.toBeChecked()
    expect(shaded()).toBe(0)
    safeStorage.remove("legendaryEvents.unitChips.rankShading")
  }, 15_000)

  it("shows every given lane with its objectives, figures and Teams section", () => {
    renderBoard()
    expect(screen.getAllByTestId("event-board-lane")).toHaveLength(3)
    for (const laneId of ["alpha", "beta", "gamma"] as const) {
      const column = within(lane(laneId))
      expect(column.getAllByTestId("event-board-objective")).toHaveLength(
        lysanderEvent[laneId].unitsRestrictions.length
      )
      expect(column.getByTestId("lane-figures")).toHaveTextContent(laneId)
      expect(column.getByTestId("lane-teams")).toHaveTextContent(
        `${laneId} teams`
      )
    }
    expect(
      within(lane("alpha")).getByTestId("legendary-event-lane-label")
    ).toHaveTextContent("Alpha · No Xenos")
  })

  it("keeps the sticky heading row as wide as the columns so it scrolls sideways with them", () => {
    renderBoard(ready, undefined, ["alpha"])
    const table = within(lane("alpha")).getByTestId("event-board-table")
    const content = within(table).getByTestId("event-board-table-content")
    // The scroll box holds one content block at least as wide as the columns' minimum, and
    // the sticky heading row and the columns both sit inside it.
    expect(content.parentElement).toBe(table)
    // Sideways it always scrolls; up and down only from 768px (on a phone the page scrolls).
    expect(table).toHaveClass("overflow-x-auto", "md:overflow-y-auto")
    expect(content).toHaveClass("w-full")
    const columnCount = lysanderEvent.alpha.unitsRestrictions.length
    expect(content.style.minWidth).toContain(`${columnCount * 5.9}rem`)
    const heading = within(content).getByRole("group", { name: "Objectives" })
    expect(heading).toHaveClass("sticky")
    expect(content).toContainElement(
      within(content).getAllByTestId("event-board-column")[0]!
    )
  })

  it("renders only the shown lanes", () => {
    renderBoard(ready, undefined, ["beta"])
    expect(
      screen.getAllByTestId("event-board-lane").map((c) => c.dataset.lane)
    ).toEqual(["beta"])
  })

  it("marks the objectives no saved team covers", () => {
    renderBoard()
    const alpha = within(lane("alpha")).getAllByTestId("event-board-objective")
    const covered = alpha.filter((entry) => !entry.dataset.uncovered)
    expect(covered).toHaveLength(1)
    expect(
      within(lane("gamma"))
        .getAllByTestId("event-board-objective")
        .every((entry) => entry.dataset.uncovered === "true")
    ).toBe(true)
  })

  it("shows objectives without coverage marks while teams load", () => {
    renderBoard({ kind: "loading" })
    expect(
      screen
        .getAllByTestId("event-board-objective")
        .some((entry) => entry.dataset.uncovered === "true")
    ).toBe(false)
  })

  it("lists each objective's units and starts a team from one", () => {
    const { onAddTeam } = renderBoard(withUnits)
    const alpha = within(lane("alpha"))
    const columns = alpha.getAllByTestId("event-board-column")
    expect(columns).toHaveLength(lysanderEvent.alpha.unitsRestrictions.length)
    const [firstUnit] = within(columns[0]!).getAllByTestId(
      "event-board-add-team"
    )
    fireEvent.click(firstUnit!)
    const firstIndex = Math.min(
      ...lysanderEvent.alpha.unitsRestrictions.map(
        (objective) => objective.index
      )
    )
    const firstUnitId = within(firstUnit!)
      .getByTestId("event-board-unit")
      .getAttribute("data-unit-id")
    expect(onAddTeam).toHaveBeenCalledExactlyOnceWith(
      "alpha",
      [firstIndex],
      firstUnitId
    )
  })

  it("makes each unit table one Tab stop and moves between its units with the arrow keys", () => {
    renderBoard(withUnits)
    const alpha = within(lane("alpha"))
    const columns = alpha.getAllByTestId("event-board-column")
    const cells = columns.map((column) =>
      within(column).queryAllByTestId("event-board-add-team")
    )
    const all = cells.flat()
    expect(all.filter((cell) => cell.tabIndex === 0)).toEqual([cells[0]![0]])
    expect(
      alpha.getByRole("group", {
        description: "Use the arrow keys to move between units.",
      })
    ).toContainElement(cells[0]![0]!)

    const first = cells[0]![0]!
    first.focus()
    fireEvent.keyDown(first, { key: "ArrowDown" })
    expect(cells[0]![1]).toHaveFocus()
    fireEvent.keyDown(cells[0]![1]!, { key: "ArrowRight" })
    const right = cells.findIndex(
      (column, index) => index > 0 && column.length > 0
    )
    expect(cells[right]![Math.min(1, cells[right]!.length - 1)]).toHaveFocus()
    fireEvent.keyDown(document.activeElement!, { key: "End" })
    expect(cells[right]!.at(-1)).toHaveFocus()
    fireEvent.keyDown(document.activeElement!, { key: "Home" })
    expect(cells[right]![0]).toHaveFocus()

    // The focused unit is the table's Tab stop from now on.
    expect(all.filter((cell) => cell.tabIndex === 0)).toEqual([
      cells[right]![0],
    ])
  })

  it("lists each column's best seven and shows the rest on request", () => {
    renderBoard(withUnits)
    const columns = () =>
      within(lane("alpha")).getAllByTestId("event-board-column")
    const counts = () =>
      columns().map(
        (column) => within(column).queryAllByTestId("event-board-unit").length
      )
    expect(Math.max(...counts())).toBe(7)

    const showAll = within(lane("alpha")).getByTestId("event-board-show-all")
    expect(showAll).toHaveTextContent(/Show all units/)
    fireEvent.click(showAll)
    expect(Math.max(...counts())).toBeGreaterThan(7)
    expect(showAll).toHaveTextContent("Show the best 7")
  })

  it("merges the selected objectives into one column and clears them", () => {
    renderBoard(withUnits)
    const alpha = within(lane("alpha"))
    const count = alpha.getAllByTestId("event-board-column").length
    const [first, second] = alpha.getAllByTestId("event-board-objective")
    fireEvent.click(first!)
    fireEvent.click(second!)
    expect(alpha.getAllByTestId("event-board-column")).toHaveLength(count - 1)
    expect(
      alpha
        .getAllByTestId("event-board-objective")
        .filter((entry) => entry.getAttribute("aria-pressed") === "true")
    ).toHaveLength(2)
    fireEvent.click(alpha.getByRole("button", { name: "Clear selection" }))
    expect(alpha.getAllByTestId("event-board-column")).toHaveLength(count)
  }, 15_000) // Renders every lane's full unit table, which runs past 5s under a parallel run.

  it("lists units for a signed-out visitor, with ownership unknown", () => {
    renderBoard(
      { kind: "hidden" },
      { units: legendaryEventCharacters as never, roster: undefined }
    )
    const units = within(lane("alpha")).getAllByTestId("event-board-unit")
    expect(units.length).toBeGreaterThan(0)
    expect(units.every((unit) => unit.dataset.owned === undefined)).toBe(true)
    expect(screen.queryByTestId("lane-teams")).not.toBeInTheDocument()
  })
})
