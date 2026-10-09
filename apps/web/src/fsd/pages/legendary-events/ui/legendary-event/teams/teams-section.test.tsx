import { useEffect, useState } from "react"
import userEvent from "@testing-library/user-event"
import type { i18n as I18n } from "i18next"
import { beforeAll, describe, expect, it, vi } from "vitest"

import type {
  LegendaryEventPlan,
  LegendaryEventTeam,
} from "@/entities/legendary-event"
import {
  teamLane,
  teamUnitList,
  teamUnits,
} from "@/test/fixtures/legendary-event-teams"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { render, screen } from "@/test/render"

import { TeamsSection, type TeamsViewModel } from "./teams-section"
import type { TeamsSectionState } from "./teams.view-model"

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
  getCharactersMap: async () =>
    new Map(Object.values(teamUnits).map((unit) => [unit.id, unit])),
  getMowsMap: async () => new Map(),
}))

let i18n: I18n

const team = (
  id: string,
  name: string,
  laneId: LegendaryEventTeam["laneId"],
  sortOrder: number
): LegendaryEventTeam => ({
  id,
  laneId,
  name,
  sortOrder,
  memberUnitIds: [teamUnits.a.id],
  reserveUnitId: null,
  objectiveIndexes: [0],
  runDepths: [],
})

const plan: LegendaryEventPlan = {
  eventId: "astarLysander",
  revision: 3,
  catalogVersion: "1",
  notes: null,
  showPaidOptions: false,
  // Stored order: Flyers sorts after Melee on Alpha whatever the array order.
  teams: [
    team("flyers", "Flyers", "alpha", 1),
    team("melee", "Melee", "alpha", 0),
    team("beta-1", "Psykers", "beta", 0),
  ],
}

function renderSection(
  state: TeamsSectionState,
  { isMobile = false, laneId = "alpha" as const } = {}
) {
  const actions = {
    createTeam: vi.fn(),
    updateTeam: vi.fn(),
    deleteTeam: vi.fn(),
    reorderLane: vi.fn().mockResolvedValue("saved"),
    setDepth: vi.fn(),
  }
  const teams: TeamsViewModel = { state, run: 1, actions }
  render(
    <TeamsSection
      isMobile={isMobile}
      lane={teamLane}
      laneId={laneId}
      onlyUnlocked={false}
      teams={teams}
    />,
    { wrapper: i18nWrapper(i18n) }
  )
  return actions
}

const ready = (value = plan): TeamsSectionState => ({
  kind: "ready",
  plan: value,
  units: teamUnitList,
  roster: undefined,
})
const cardNames = () =>
  screen.getAllByTestId("team-card-name").map((name) => name.textContent)

describe("TeamsSection", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })

  it("lists the lane's teams once each in stored order, with Add team", () => {
    renderSection(ready())
    expect(cardNames()).toEqual(["Melee", "Flyers"])
    expect(screen.getByTestId("legendary-event-add-team")).toHaveTextContent(
      "Add team"
    )
  })

  it("names the lane when it has no team", () => {
    renderSection(ready({ ...plan, teams: [] }))
    expect(screen.getByTestId("legendary-event-teams-empty")).toHaveTextContent(
      "No teams on Alpha yet."
    )
    expect(screen.getByTestId("legendary-event-add-team")).toBeInTheDocument()
  })

  it("shows a skeleton while loading", () => {
    renderSection({ kind: "loading" })
    expect(
      screen.getByTestId("legendary-event-teams-loading")
    ).toBeInTheDocument()
    expect(screen.queryByTestId("legendary-event-add-team")).toBeNull()
  })

  it("shows an inline error with Retry", async () => {
    const retry = vi.fn()
    renderSection({ kind: "error", retry })
    expect(screen.getByTestId("legendary-event-teams-error")).toHaveTextContent(
      "Your teams could not be loaded."
    )
    await userEvent.setup().click(screen.getByRole("button", { name: "Retry" }))
    expect(retry).toHaveBeenCalledTimes(1)
  })

  it("renders nothing when signed out", () => {
    renderSection({ kind: "hidden" })
    expect(screen.queryByTestId("legendary-event-teams")).toBeNull()
  })

  it("offers drag handles on desktop and no move items", async () => {
    renderSection(ready())
    expect(screen.getAllByTestId("team-card-drag-handle")).toHaveLength(2)
    const user = userEvent.setup()
    await user.click(screen.getAllByTestId("team-card-menu")[0]!)
    expect(await screen.findByTestId("team-card-edit")).toBeInTheDocument()
    expect(screen.queryByTestId("team-card-move-up")).toBeNull()
    expect(screen.queryByTestId("team-card-move-down")).toBeNull()
  })

  it("moves down on mobile, hiding Move up on the first card and Move down on the last", async () => {
    const actions = renderSection(ready(), { isMobile: true })
    expect(screen.queryByTestId("team-card-drag-handle")).toBeNull()
    const user = userEvent.setup()

    await user.click(screen.getAllByTestId("team-card-menu")[1]!)
    expect(await screen.findByTestId("team-card-move-up")).toBeInTheDocument()
    expect(screen.queryByTestId("team-card-move-down")).toBeNull()
    await user.keyboard("{Escape}")

    await user.click(screen.getAllByTestId("team-card-menu")[0]!)
    expect(screen.queryByTestId("team-card-move-up")).toBeNull()
    await user.click(await screen.findByTestId("team-card-move-down"))
    expect(actions.reorderLane).toHaveBeenCalledWith("alpha", [
      "flyers",
      "melee",
    ])
  })

  it("confirms before deleting a team", async () => {
    const actions = renderSection(ready())
    const user = userEvent.setup()
    await user.click(screen.getAllByTestId("team-card-menu")[0]!)
    await user.click(await screen.findByTestId("team-card-delete"))
    expect(actions.deleteTeam).not.toHaveBeenCalled()
    await user.click(screen.getByTestId("confirmation-dialog-confirm"))
    expect(actions.deleteTeam).toHaveBeenCalledWith(
      expect.objectContaining({ id: "melee" })
    )
  })

  it("opens the editor from Add team only", async () => {
    renderSection(ready())
    expect(screen.queryByTestId("team-editor")).toBeNull()
    await userEvent
      .setup()
      .click(screen.getByTestId("legendary-event-add-team"))
    expect(await screen.findByTestId("team-editor")).toBeInTheDocument()
  })
})
