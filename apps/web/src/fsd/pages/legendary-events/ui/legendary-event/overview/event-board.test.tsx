import type { i18n as I18n } from "i18next"
import { beforeAll, describe, expect, it, vi } from "vitest"

import type {
  LegendaryEventPlan,
  LegendaryEventTeam,
} from "@/entities/legendary-event"
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

function renderBoard(teams: TeamsSectionState = ready) {
  const onOpenLane = vi.fn()
  const onOpenTeam = vi.fn()
  render(
    <EventBoard
      event={lysanderEvent}
      onOpenLane={onOpenLane}
      onOpenTeam={onOpenTeam}
      progressGrid={{ kind: "unavailable" }}
      teams={teams}
    />,
    { wrapper: i18nWrapper(i18n) }
  )
  return { onOpenLane, onOpenTeam }
}

const lane = (laneId: string) =>
  screen
    .getAllByTestId("event-board-lane")
    .find((column) => column.dataset.lane === laneId)!

describe("EventBoard", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
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

  it("opens the team editor from a team and the lane tab from its heading", () => {
    const { onOpenLane, onOpenTeam } = renderBoard()
    fireEvent.click(
      within(lane("beta")).getByRole("button", { name: "Edit Beta squad" })
    )
    expect(onOpenTeam).toHaveBeenCalledWith("beta", plan.teams[1])
    fireEvent.click(screen.getByRole("button", { name: "Open the Gamma tab" }))
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
})
