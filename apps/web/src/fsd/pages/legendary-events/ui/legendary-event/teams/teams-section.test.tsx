import { useEffect, useState } from "react"
import userEvent from "@testing-library/user-event"
import type { i18n as I18n } from "i18next"
import { beforeAll, describe, expect, it, vi } from "vitest"

import type {
  LegendaryEvent,
  LegendaryEventPlan,
  LegendaryEventRosterUnit,
  LegendaryEventTeam,
} from "@/entities/legendary-event"
import {
  teamLane,
  teamUnitList,
  teamUnits,
} from "@/test/fixtures/legendary-event-teams"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { render, screen, waitFor, within } from "@/test/render"

import type { ClearEstimatesViewModel } from "../legendary-event-page.view-model"

import { TeamEditorHost } from "./team-editor-host"
import { useTeamEditorLauncher } from "./team-editor-launcher"
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
  memberUnitIds: [teamUnits.a.id, teamUnits.b.id, teamUnits.c.id],
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

vi.mock("@/shared/analytics", () => ({
  useAnalyticsActions: () => ({ captureEvent: vi.fn() }),
}))

// Gold1 / Epic:RedOneStar / 3 upgrades / 20 / 15: combat power 8,792 each.
const rosterUnit = (unitId: string) =>
  ({
    unitId,
    rank: "Gold1",
    progressionIndex: "Epic:RedOneStar",
    appliedUpgradeSlots: [0, 1, 2],
    abilities: [
      { abilityId: "active", level: 20 },
      { abilityId: "passive", level: 15 },
    ],
  }) as LegendaryEventRosterUnit
const estimator = {
  team: () => null,
  unit: () => null,
  inputs: {
    battlePowers: [1000, 4000, 30000],
    roster: new Map(
      [teamUnits.a.id, teamUnits.b.id, teamUnits.c.id, teamUnits.r.id].map(
        (unitId) => [unitId, rosterUnit(unitId)]
      )
    ),
    config: { powerRatio: 0.5, calibrated: true, hordeMultipliers: new Map() },
  },
}
const readyEstimates: ClearEstimatesViewModel = {
  kind: "ready",
  byLane: { alpha: estimator, beta: estimator, gamma: estimator },
}

const lanes = {
  alpha: teamLane,
  beta: teamLane,
  gamma: teamLane,
} as unknown as Pick<LegendaryEvent, "alpha" | "beta" | "gamma">

/** The Teams section with the page's single editor beside it (design D4). */
function SectionWithEditor({
  teams,
  laneId,
  isMobile,
}: {
  teams: TeamsViewModel
  laneId: "alpha" | "beta" | "gamma"
  isMobile: boolean
}) {
  const launcher = useTeamEditorLauncher()
  return (
    <>
      <TeamsSection
        editor={launcher}
        isMobile={isMobile}
        lane={teamLane}
        laneId={laneId}
        teams={teams}
      />
      <TeamEditorHost
        event={lanes}
        launcher={launcher}
        onlyUnlocked={false}
        teams={teams}
      />
    </>
  )
}

function renderSection(
  state: TeamsSectionState,
  {
    isMobile = false,
    laneId = "alpha",
    estimates = { kind: "hidden" },
    lastRunClears,
    run = 1,
  }: {
    run?: TeamsViewModel["run"]
    isMobile?: boolean
    laneId?: "alpha" | "beta" | "gamma"
    estimates?: ClearEstimatesViewModel
    lastRunClears?: TeamsViewModel["lastRunClears"]
  } = {}
) {
  const actions = {
    createTeam: vi.fn().mockResolvedValue("saved"),
    updateTeam: vi.fn(),
    deleteTeam: vi.fn(),
    reorderLane: vi.fn().mockResolvedValue("saved"),
    setDepth: vi.fn(),
    restoreEstimate: vi.fn(),
  }
  const teams: TeamsViewModel = {
    eventId: "astarLysander",
    state,
    run,
    actions,
    estimates,
    progressByLane: undefined,
    lastRunClears,
    goals: {
      goalLines: () => [],
      goalUnitIds: new Set(),
      pickerPreview: () => ({
        enabled: false,
        available: false,
        roster: undefined,
        previewed: new Set(),
      }),
    },
  }
  const view = render(
    <SectionWithEditor isMobile={isMobile} laneId={laneId} teams={teams} />,
    { wrapper: i18nWrapper(i18n) }
  )
  const rerender = (next: TeamsSectionState) =>
    view.rerender(
      <SectionWithEditor
        isMobile={isMobile}
        laneId={laneId}
        teams={{ ...teams, state: next }}
      />
    )
  return Object.assign(actions, { rerender })
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

  it("shows the last-run line only on teams of the previous run on the same lane", () => {
    renderSection(ready(), {
      lastRunClears: new Map([
        ["melee", { laneId: "alpha" as const, clearedBattle: 3 }],
        // Same id recorded on another lane: no line on Alpha.
        ["flyers", { laneId: "beta" as const, clearedBattle: 5 }],
      ]),
    })
    const lines = screen
      .getAllByTestId("legendary-event-team-card")
      .map(
        (card) =>
          within(card).queryByTestId("team-card-last-run")?.textContent ?? null
      )
    expect(lines).toEqual(["Last run: cleared up to battle 3", null])
  })

  it("shows no last-run line while the run records load or failed", () => {
    renderSection(ready(), { lastRunClears: undefined })
    expect(screen.queryByTestId("team-card-last-run")).toBeNull()
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

  it("returns focus to Add team after the editor closes", async () => {
    renderSection(ready())
    const user = userEvent.setup()
    const addTeam = screen.getByTestId("legendary-event-add-team")
    await user.click(addTeam)
    const editor = await screen.findByTestId("team-editor")
    await user.click(within(editor).getByRole("button", { name: "Cancel" }))
    expect(screen.queryByTestId("team-editor")).toBeNull()
    await waitFor(() => expect(addTeam).toHaveFocus())
  })

  it("keeps the editor open after Save and add another and lists the new team behind it", async () => {
    const actions = renderSection(ready())
    const user = userEvent.setup()
    await user.click(screen.getByTestId("legendary-event-add-team"))
    const editor = await screen.findByTestId("team-editor")
    for (const unitId of [teamUnits.a.id, teamUnits.b.id, teamUnits.c.id]) {
      const tile = within(editor)
        .getAllByTestId("team-picker-tile")
        .find((element) => element.dataset.unit === unitId)!
      await user.click(within(tile).getByTestId("team-picker-toggle"))
    }
    await user.click(within(editor).getByTestId("team-editor-save-another"))
    expect(actions.createTeam).toHaveBeenCalledWith(
      "alpha",
      expect.objectContaining({
        memberUnitIds: [teamUnits.a.id, teamUnits.b.id, teamUnits.c.id],
      }),
      expect.anything(),
      undefined
    )
    actions.rerender(
      ready({
        ...plan,
        teams: [...plan.teams, team("new", "Melee · Min 5 hits", "alpha", 2)],
      })
    )
    expect(screen.getByTestId("team-editor")).toBeInTheDocument()
    expect(
      within(screen.getByTestId("team-editor")).queryAllByTestId(
        "team-picker-selected-unit"
      )
    ).toHaveLength(0)
    expect(cardNames()).toEqual(["Melee", "Flyers", "Melee · Min 5 hits"])
  })

  it("disables Suggest teams with the reason when estimates are unavailable", () => {
    renderSection(ready())
    const button = screen.getByTestId("legendary-event-suggest-teams")
    expect(button).toBeDisabled()
    expect(button).toHaveAccessibleDescription("Needs clear estimates")
  })

  it("opens a suggestion in the editor as a new team, and returns to the suggestions on cancel", async () => {
    const user = userEvent.setup()
    const actions = renderSection(ready(), {
      laneId: "gamma",
      estimates: readyEstimates,
    })
    await user.click(
      within(screen.getByTestId("legendary-event-teams-empty")).getByTestId(
        "legendary-event-suggest-teams-empty"
      )
    )
    const proposals = await screen.findAllByTestId("team-suggestion")
    expect(proposals.length).toBeGreaterThan(0)
    const members = within(proposals[0]!)
      .getAllByTestId("team-suggestion-member")
      .map((element) => element.dataset.unit)

    await user.click(within(proposals[0]!).getByTestId("team-suggestion-use"))
    const editor = await screen.findByTestId("team-editor")
    expect(
      within(editor)
        .getAllByTestId("team-picker-selected-unit")
        .map((element) => element.dataset.unit)
    ).toEqual(members)
    expect(screen.queryByTestId("team-suggestions")).toBeNull()

    await user.click(within(editor).getByRole("button", { name: "Cancel" }))
    expect(await screen.findByTestId("team-suggestions")).toBeInTheDocument()
    expect(actions.createTeam).not.toHaveBeenCalled()

    await user.click(
      within(screen.getAllByTestId("team-suggestion")[0]!).getByTestId(
        "team-suggestion-use"
      )
    )
    await user.click(await screen.findByTestId("team-editor-save"))
    expect(actions.createTeam).toHaveBeenCalledWith(
      "gamma",
      expect.objectContaining({ memberUnitIds: members }),
      expect.anything(),
      { source: "suggestion", suggestionRank: 1 }
    )
  })

  it("keeps an incomplete team listed and lets Edit complete it, restoring its depth", async () => {
    const user = userEvent.setup()
    // Two members with a stored depth of 5 for run 2 (Uthar's imported team, synthetic units).
    const short: LegendaryEventTeam = {
      ...team("short", "Short", "alpha", 1),
      memberUnitIds: [teamUnits.a.id, teamUnits.b.id],
      runDepths: [
        {
          run: 2,
          expectedBattleClears: 5,
          expectedBattleClearsSource: "manual",
          recordedAt: "2026-10-01T00:00:00Z",
        },
      ],
    }
    const withShort = { ...plan, teams: [plan.teams[1]!, short] }
    const actions = renderSection(ready(withShort), { run: 2 })
    expect(cardNames()).toEqual(["Melee", "Short"])
    const shortCard = () =>
      screen.getAllByTestId("legendary-event-team-card")[1]!
    expect(
      within(shortCard()).getByTestId("team-card-incomplete")
    ).toHaveTextContent("Needs at least 3 characters")
    expect(within(shortCard()).queryByTestId("team-card-depth")).toBeNull()

    await user.click(within(shortCard()).getByTestId("team-card-menu"))
    await user.click(await screen.findByTestId("team-card-edit"))
    const editor = await screen.findByTestId("team-editor")
    expect(
      within(editor)
        .getAllByTestId("team-picker-selected-unit")
        .map((element) => element.dataset.unit)
    ).toEqual([teamUnits.a.id, teamUnits.b.id])
    expect(within(editor).getByTestId("team-editor-save")).toBeDisabled()

    const tile = within(editor)
      .getAllByTestId("team-picker-tile")
      .find((element) => element.dataset.unit === teamUnits.c.id)!
    await user.click(within(tile).getByTestId("team-picker-toggle"))
    expect(within(editor).getByTestId("team-editor-save")).toBeEnabled()
    actions.updateTeam.mockResolvedValue("saved")
    await user.click(within(editor).getByTestId("team-editor-save"))
    expect(actions.updateTeam).toHaveBeenCalledWith(
      short,
      expect.objectContaining({
        memberUnitIds: [teamUnits.a.id, teamUnits.b.id, teamUnits.c.id],
        expectedBattleClears: 5,
      }),
      expect.anything()
    )

    actions.rerender(
      ready({
        ...withShort,
        teams: [
          plan.teams[1]!,
          {
            ...short,
            memberUnitIds: [teamUnits.a.id, teamUnits.b.id, teamUnits.c.id],
          },
        ],
      })
    )
    expect(within(shortCard()).queryByTestId("team-card-incomplete")).toBeNull()
    expect(
      within(within(shortCard()).getByTestId("team-card-depth")).getByTestId(
        "number-stepper-input"
      )
    ).toHaveValue(5)
  })
})
