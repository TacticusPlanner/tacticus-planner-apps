import { useState } from "react"
import type { i18n as I18n } from "i18next"
import { beforeAll, describe, expect, it } from "vitest"

import {
  objectiveFilterKey,
  type CrossLaneLeaderboardRow,
  type LegendaryEventProgress,
} from "@/entities/legendary-event"
import {
  fixtureCharacter,
  legendaryEventCharacters,
} from "@/test/fixtures/legendary-event-characters"
import { lysanderEvent } from "@/test/fixtures/legendary-events"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { act, fireEvent, render, screen, within } from "@/test/render"

import {
  buildProgressGridViewModel,
  type LeaderboardRowsViewModel,
  type ProgressGridViewModel,
} from "../legendary-event-page.view-model"
import { CrossLaneLeaderboard } from "./cross-lane-leaderboard"

let i18n: I18n

const dante = fixtureCharacter("bloodDante")
const row = (
  unit: CrossLaneLeaderboardRow["unit"],
  lanes: CrossLaneLeaderboardRow["lanes"],
  satisfiedKeys: string[] = []
): CrossLaneLeaderboardRow => ({
  unit,
  ownership: "owned",
  satisfiedKeys,
  lanes,
})
// The spec's example: Dante 2,736 on Alpha, 1,200 on Beta, not allowed on Gamma (sum 3,936).
const danteRow = row(dante, {
  alpha: { pointsPerBattle: 152, remainingPoints: 2736 },
  beta: { pointsPerBattle: 100, remainingPoints: 1200 },
  gamma: undefined,
})
const otherRow = row(
  { ...dante, id: "other" as never, name: "Other" },
  {
    alpha: { pointsPerBattle: 300, remainingPoints: 3000 },
    beta: undefined,
    gamma: undefined,
  }
)
const flying = objectiveFilterKey({
  kind: "Trait",
  target: "Flying",
  exclude: false,
})
const noResilient = objectiveFilterKey({
  kind: "Trait",
  target: "Resilient",
  exclude: true,
})
// Alpha clears Flying (id 3) in 3 of 18 battles; Beta and Gamma have no record.
const progress: ProgressGridViewModel = buildProgressGridViewModel(
  lysanderEvent,
  {
    id: "astarLysander",
    alpha: {
      encounters: Array.from({ length: 3 }, () => ({
        objectivesCleared: [0, 3],
        highScore: 30,
        encounterPoints: 30,
      })),
    },
    beta: null,
    gamma: null,
  } as unknown as LegendaryEventProgress
)
const ready: LeaderboardRowsViewModel = {
  kind: "ready",
  rowsByLane: { alpha: [], beta: [], gamma: [] },
  crossLaneRows: [otherRow, danteRow],
  rosterAvailable: true,
  progressAvailable: true,
}

function Harness({
  rows,
  layout,
  progressGrid = progress,
}: {
  rows: LeaderboardRowsViewModel
  layout: "table" | "list"
  progressGrid?: ProgressGridViewModel
}) {
  const [onlyUnlocked, setOnlyUnlocked] = useState(false)
  const [deductScored, setDeductScored] = useState(true)
  const [selectedObjectives, setSelectedObjectives] = useState<
    ReadonlySet<string>
  >(new Set())
  return (
    <CrossLaneLeaderboard
      event={lysanderEvent}
      layout={layout}
      leaderboard={{
        ...rows,
        onlyUnlocked,
        onOnlyUnlockedChange: setOnlyUnlocked,
        deductScored,
        onDeductScoredChange: setDeductScored,
        selectedObjectives,
        onSelectedObjectivesChange: setSelectedObjectives,
      }}
      progressGrid={progressGrid}
    />
  )
}

const renderOverview = (
  layout: "table" | "list" = "table",
  rows = ready,
  progressGrid = progress
) =>
  render(<Harness layout={layout} progressGrid={progressGrid} rows={rows} />, {
    wrapper: i18nWrapper(i18n),
  })
const units = () =>
  screen.getAllByTestId("leaderboard-row").map((r) => r.dataset.unit)
const laneFigures = (unit: string) =>
  within(
    screen
      .getAllByTestId("leaderboard-row")
      .find((r) => r.dataset.unit === unit)!
  )
    .getAllByTestId("leaderboard-lane-points")
    .map((cell) => cell.textContent)

describe("CrossLaneLeaderboard", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })

  it("shows one figure per lane, — for a disallowed lane, ordered by the sum", () => {
    renderOverview()
    expect(screen.getByTestId("cross-lane-table")).toBeInTheDocument()
    expect(units()).toEqual(["bloodDante", "other"])
    expect(laneFigures("bloodDante")).toEqual(["2,736", "1,200", "—"])
    const cells = within(
      screen.getAllByTestId("leaderboard-row")[0]!
    ).getAllByTestId("leaderboard-lane-points")
    expect(cells[0]).toHaveAttribute("aria-label", "Alpha: 2,736")
    expect(cells[2]).toHaveAttribute("aria-label", "Gamma: not allowed")
    expect(
      screen.getByRole("columnheader", { name: "Alpha" })
    ).toBeInTheDocument()
    expect(screen.getByTestId("leaderboard-figure-head")).toHaveTextContent(
      "Remaining"
    )
  })

  it("re-orders by points per battle when Deduct scored points is off", () => {
    renderOverview()
    act(() => fireEvent.click(screen.getByTestId("leaderboard-deduct-scored")))
    expect(units()).toEqual(["other", "bloodDante"])
    expect(laneFigures("bloodDante")).toEqual(["152", "100", "—"])
  })

  it("renders row cards with one labelled line per lane on mobile", () => {
    renderOverview("list")
    expect(screen.getByTestId("cross-lane-list")).toBeInTheDocument()
    expect(screen.queryByTestId("cross-lane-table")).toBeNull()
    expect(laneFigures("bloodDante")).toEqual(["2,736", "1,200", "—"])
    const lines = within(
      screen
        .getAllByTestId("leaderboard-row")
        .find((r) => r.dataset.unit === "bloodDante")!
    ).getAllByTestId("leaderboard-lane-cell")
    expect(lines.map((line) => line.dataset.lane)).toEqual([
      "alpha",
      "beta",
      "gamma",
    ])
    expect(lines[0]).toHaveTextContent(/^Alpha/)
    expect(
      within(lines[0]!).getAllByTestId("leaderboard-objective")
    ).toHaveLength(5)
  })

  it("groups the chips per lane under Alpha, Beta and Gamma with cleared counts", () => {
    renderOverview()
    const groups = screen.getAllByTestId("leaderboard-objective-group")
    expect(groups.map((group) => group.dataset.lane)).toEqual([
      "alpha",
      "beta",
      "gamma",
    ])
    expect(
      groups.map(
        (group) =>
          within(group).getByTestId("leaderboard-objective-group-label")
            .textContent
      )
    ).toEqual(["Alpha objectives", "Beta objectives", "Gamma objectives"])
    const chips = screen.getAllByTestId("leaderboard-objective-chip")
    expect(chips).toHaveLength(15)
    expect(chips.map((chip) => chip.textContent)).toEqual(
      expect.arrayContaining(["Flying3 / 18", "Orks0 / 18", "Healer0 / 18"])
    )
    expect(
      within(groups[0]!)
        .getAllByTestId("leaderboard-objective-count")
        .map((count) => count.textContent)
    ).toEqual(["0 / 18", "0 / 18", "3 / 18", "0 / 18", "0 / 18"])
  })

  it("shows no counts when the progress read failed", () => {
    renderOverview("table", ready, { kind: "unavailable" })
    expect(screen.getAllByTestId("leaderboard-objective-chip")).toHaveLength(15)
    expect(screen.queryAllByTestId("leaderboard-objective-count")).toEqual([])
  })

  it("shows each lane's objective indicators above the figure, none for a disallowed lane", () => {
    renderOverview("table", {
      ...ready,
      crossLaneRows: [
        otherRow,
        { ...danteRow, satisfiedKeys: [flying, noResilient] },
      ],
    })
    const cells = within(
      screen
        .getAllByTestId("leaderboard-row")
        .find((r) => r.dataset.unit === "bloodDante")!
    ).getAllByTestId("leaderboard-lane-cell")
    const met = (cell: HTMLElement) =>
      within(cell)
        .queryAllByTestId("leaderboard-objective")
        .map((indicator) => indicator.dataset.met)
    expect(met(cells[0]!)).toEqual(["false", "false", "true", "false", "true"])
    expect(met(cells[1]!)).toHaveLength(
      lysanderEvent.beta.unitsRestrictions.length
    )
    expect(met(cells[2]!)).toEqual([])
    expect(within(cells[0]!).getByText("Flying: met")).toBeInTheDocument()
  })

  it("filters by objective across lanes and offers to clear an empty result", () => {
    const rows: LeaderboardRowsViewModel = {
      ...ready,
      crossLaneRows: [otherRow, { ...danteRow, satisfiedKeys: [flying] }],
    }
    renderOverview("table", rows)
    const chip = screen
      .getAllByTestId("leaderboard-objective-chip")
      .find((element) => element.dataset.objective === flying)!
    act(() => fireEvent.click(chip))
    expect(units()).toEqual(["bloodDante"])

    const healer = screen
      .getAllByTestId("leaderboard-objective-chip")
      .find((element) => element.dataset.objective === "Trait:Healer:is")!
    act(() => fireEvent.click(healer))
    expect(screen.getByTestId("leaderboard-none-match")).toBeInTheDocument()
    act(() => fireEvent.click(screen.getByTestId("leaderboard-clear-filter")))
    expect(units()).toEqual(["bloodDante", "other"])
  })

  it("builds real rows from the catalog: Farsight only on Beta", () => {
    renderOverview("table", {
      ...ready,
      crossLaneRows: [],
    })
    expect(screen.getByTestId("leaderboard-no-eligible")).toBeInTheDocument()
    expect(legendaryEventCharacters.length).toBeGreaterThan(0)
  })
})
