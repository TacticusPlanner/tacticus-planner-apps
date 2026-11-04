import type { i18n as I18n } from "i18next"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import type {
  LegendaryEventPlan,
  LegendaryEventRosterUnit,
  LegendaryEventTeam,
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
    : { units: "loading", roster: undefined }
) {
  const onOpenLane = vi.fn()
  const onOpenTeam = vi.fn()
  const onAddTeam = vi.fn()
  const view = render(
    <EventBoard
      catalog={catalog}
      event={lysanderEvent}
      onAddTeam={onAddTeam}
      onOpenLane={onOpenLane}
      onOpenTeam={onOpenTeam}
      progressGrid={{ kind: "unavailable" }}
      teams={teams}
      unitPower={null}
    />,
    { wrapper: i18nWrapper(i18n) }
  )
  return { onOpenLane, onOpenTeam, onAddTeam, unmount: view.unmount }
}

const lane = (laneId: string) =>
  screen
    .getAllByTestId("event-board-lane")
    .find((column) => column.dataset.lane === laneId)!

describe("EventBoard", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })
  beforeEach(() => {
    safeStorage.remove("legendaryEvents.eventBoard.lanes")
  })

  it("shows all three lanes with their objectives and saved teams", () => {
    renderBoard()
    expect(screen.getAllByTestId("event-board-lane")).toHaveLength(3)
    for (const laneId of ["alpha", "beta", "gamma"] as const) {
      expect(
        within(lane(laneId)).getAllByTestId("event-board-objective")
      ).toHaveLength(lysanderEvent[laneId].unitsRestrictions.length)
    }
    expect(
      within(lane("alpha")).getByRole("button", { name: "Edit Alpha squad" })
    ).toBeInTheDocument()
    expect(within(lane("beta")).getByText("1 team")).toBeInTheDocument()
    expect(within(lane("gamma")).getByText("No teams yet.")).toBeInTheDocument()
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

  it("opens the team editor from a team and the Lanes tab from a lane heading", () => {
    const { onOpenLane, onOpenTeam } = renderBoard()
    fireEvent.click(
      within(lane("beta")).getByRole("button", { name: "Edit Beta squad" })
    )
    expect(onOpenTeam).toHaveBeenCalledWith("beta", plan.teams[1])
    fireEvent.click(
      screen.getByRole("button", { name: "Open Gamma in the Lanes tab" })
    )
    expect(onOpenLane).toHaveBeenCalledWith("gamma")
  })

  it("shows objectives without coverage marks while teams load", () => {
    renderBoard({ kind: "loading" })
    expect(
      screen
        .getAllByTestId("event-board-objective")
        .some((entry) => entry.dataset.uncovered === "true")
    ).toBe(false)
    expect(screen.queryByTestId("event-board-team")).not.toBeInTheDocument()
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

  it("shows saved members with their rank and ability levels", () => {
    renderBoard(withUnits)
    const team = within(lane("alpha")).getByRole("button", {
      name: "Edit Alpha squad",
    })
    const [member] = within(team).getAllByRole("img", {
      name: /^Calgar/,
    })
    expect(member).toHaveAttribute("data-rank", "Gold2")
    expect(member!.getAttribute("aria-label")).toContain(
      "Active ability level 35, passive ability level 28"
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

  it("hides a lane switched off, remembers it and keeps the last one shown", () => {
    const { unmount } = renderBoard()
    fireEvent.click(screen.getByRole("switch", { name: "Gamma" }))
    expect(
      screen.getAllByTestId("event-board-lane").map((c) => c.dataset.lane)
    ).toEqual(["alpha", "beta"])
    unmount()
    renderBoard()
    expect(
      screen.getAllByTestId("event-board-lane").map((c) => c.dataset.lane)
    ).toEqual(["alpha", "beta"])
    fireEvent.click(screen.getByRole("switch", { name: "Beta" }))
    expect(screen.getByRole("switch", { name: "Alpha" })).toBeDisabled()
  })

  it("lists units for a signed-out visitor, with ownership unknown", () => {
    renderBoard(
      { kind: "hidden" },
      { units: legendaryEventCharacters as never, roster: undefined }
    )
    const units = within(lane("alpha")).getAllByTestId("event-board-unit")
    expect(units.length).toBeGreaterThan(0)
    expect(units.every((unit) => unit.dataset.owned === undefined)).toBe(true)
    expect(screen.queryByTestId("event-board-team")).not.toBeInTheDocument()
  })
})
