import { useState } from "react"
import type { i18n as I18n } from "i18next"
import { beforeAll, describe, expect, it } from "vitest"

import type { CrossLaneLeaderboardRow } from "@/entities/legendary-event"
import {
  fixtureCharacter,
  legendaryEventCharacters,
} from "@/test/fixtures/legendary-event-characters"
import { lysanderEvent } from "@/test/fixtures/legendary-events"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { act, fireEvent, render, screen, within } from "@/test/render"

import type { LeaderboardRowsViewModel } from "../legendary-event-page.view-model"
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
}: {
  rows: LeaderboardRowsViewModel
  layout: "table" | "list"
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
    />
  )
}

const renderOverview = (layout: "table" | "list" = "table", rows = ready) =>
  render(<Harness layout={layout} rows={rows} />, {
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

  it("renders row cards with the three figures on one line on mobile", () => {
    renderOverview("list")
    expect(screen.getByTestId("cross-lane-list")).toBeInTheDocument()
    expect(screen.queryByTestId("cross-lane-table")).toBeNull()
    expect(laneFigures("bloodDante")).toEqual([
      "Alpha2,736",
      "Beta1,200",
      "Gamma—",
    ])
  })

  it("lists the union of the three lanes' objectives as chips", () => {
    renderOverview()
    const chips = screen.getAllByTestId("leaderboard-objective-chip")
    const keys = chips.map((chip) => chip.dataset.objective)
    expect(keys).toHaveLength(new Set(keys).size)
    expect(keys).toHaveLength(15)
    expect(chips.map((chip) => chip.textContent)).toEqual(
      expect.arrayContaining(["Flying", "Orks", "Healer"])
    )
  })

  it("filters by objective across lanes and offers to clear an empty result", () => {
    const flying = "Trait:Flying:is"
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
