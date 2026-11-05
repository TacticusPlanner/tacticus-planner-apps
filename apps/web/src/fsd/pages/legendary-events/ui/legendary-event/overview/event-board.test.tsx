import type { i18n as I18n } from "i18next"
import { beforeAll, describe, expect, it, vi } from "vitest"

import type {
  LegendaryEventLaneId,
  LegendaryEventPlan,
  LegendaryEventRosterUnit,
  LegendaryEventTeam,
} from "@/entities/legendary-event"
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
  render(
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
    />,
    { wrapper: i18nWrapper(i18n) }
  )
  return { onAddTeam }
}

const lane = (laneId: string) =>
  screen
    .getAllByTestId("event-board-lane")
    .find((column) => column.dataset.lane === laneId)!

describe("EventBoard", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })

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
    // The scroll box holds one content block sized to the columns (w-max, at least the box), and
    // the sticky heading row and the columns both sit inside it.
    expect(content.parentElement).toBe(table)
    expect(content).toHaveClass("w-max", "min-w-full")
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
  })

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
