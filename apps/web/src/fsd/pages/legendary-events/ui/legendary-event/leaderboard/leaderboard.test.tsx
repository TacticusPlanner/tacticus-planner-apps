import { useState } from "react"
import type { i18n as I18n } from "i18next"
import { beforeAll, describe, expect, it } from "vitest"

import {
  buildLanePointsModel,
  buildSyncedLaneProgress,
  objectiveFilterKey,
  type LegendaryEventLaneId,
} from "@/entities/legendary-event"
import { legendaryEventCharacters } from "@/test/fixtures/legendary-event-characters"
import { lysanderEvent } from "@/test/fixtures/legendary-events"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { act, fireEvent, render, screen, within } from "@/test/render"

import {
  buildLeaderboardRows,
  type LeaderboardRowsViewModel,
  type ProgressGridViewModel,
} from "../legendary-event-page.view-model"
import { LeaderboardSection } from "./leaderboard-section"

let i18n: I18n

const owned = [
  {
    unitId: "bloodDante",
    rank: "Diamond1",
    progressionIndex: "Legendary:RedFiveStars",
  },
  {
    unitId: "ultraCalgar",
    rank: "Gold2",
    progressionIndex: "Epic:RedTwoStars",
  },
] as never[]

// Alpha: battles 1–5 fully cleared (Dante then has 152 × 13 = 1,976 remaining), the rest empty.
const fiveCleared: ProgressGridViewModel = {
  kind: "ready",
  lanes: {
    alpha: buildSyncedLaneProgress(buildLanePointsModel(lysanderEvent.alpha), {
      encounters: Array.from({ length: 5 }, () => ({
        objectivesCleared: [0, 1, 2, 3, 4, 5],
        highScore: 30,
        encounterPoints: 30,
      })),
    }),
    beta: buildSyncedLaneProgress(
      buildLanePointsModel(lysanderEvent.beta),
      undefined
    ),
    gamma: buildSyncedLaneProgress(
      buildLanePointsModel(lysanderEvent.gamma),
      undefined
    ),
  },
}
const untouched: ProgressGridViewModel = {
  kind: "ready",
  lanes: {
    alpha: buildSyncedLaneProgress(
      buildLanePointsModel(lysanderEvent.alpha),
      undefined
    ),
    beta: fiveCleared.lanes.beta,
    gamma: fiveCleared.lanes.gamma,
  },
}

function Harness({
  rows,
  layout,
  laneId = "alpha",
}: {
  rows: LeaderboardRowsViewModel
  layout: "table" | "list"
  laneId?: LegendaryEventLaneId
}) {
  const [onlyUnlocked, setOnlyUnlocked] = useState(false)
  const [deductScored, setDeductScored] = useState(true)
  const [selectedObjectives, setSelectedObjectives] = useState<
    ReadonlySet<string>
  >(new Set())
  return (
    <LeaderboardSection
      event={lysanderEvent}
      laneId={laneId}
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

function renderLeaderboard(
  props: Partial<Parameters<typeof Harness>[0]> = {},
  progress: ProgressGridViewModel = fiveCleared
) {
  return render(
    <Harness
      layout="table"
      rows={buildLeaderboardRows(
        lysanderEvent,
        legendaryEventCharacters,
        owned,
        progress
      )}
      {...props}
    />,
    { wrapper: i18nWrapper(i18n) }
  )
}

const rows = () => screen.queryAllByTestId("leaderboard-row")
const units = () => rows().map((row) => row.dataset.unit)
const row = (unit: string) =>
  rows().find((entry) => entry.dataset.unit === unit)!
const figure = (entry: HTMLElement) =>
  Number(
    within(entry)
      .getByTestId("leaderboard-points")
      .textContent!.replaceAll(/\D/g, "")
  )
const objectivesCount = (entry: HTMLElement) =>
  Number(
    within(entry)
      .getByTestId("leaderboard-objectives")
      .textContent!.replaceAll(/\D/g, "")
  )
const chip = (key: string) =>
  screen
    .getAllByTestId("leaderboard-objective-chip")
    .find((element) => element.dataset.objective === key)!
const flyingKey = objectiveFilterKey({
  kind: "Trait",
  target: "Flying",
  exclude: false,
})
const noResilientKey = objectiveFilterKey({
  kind: "Trait",
  target: "Resilient",
  exclude: true,
})
const eviscerateKey = objectiveFilterKey({
  kind: "DamageType",
  target: "Eviscerate",
  exclude: false,
})

describe("LeaderboardSection", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })

  it("lists every allowed unit by remaining points, then objectives, then name, with no sort control", () => {
    renderLeaderboard()
    expect(rows()).toHaveLength(lysanderEvent.alpha.availableUnitIds.length)
    const values = rows().map((entry) => [
      figure(entry),
      objectivesCount(entry),
    ])
    const sorted = [...values].sort((a, b) => b[0]! - a[0]! || b[1]! - a[1]!)
    expect(values).toEqual(sorted)
    expect(screen.queryByTestId("leaderboard-sort")).toBeNull()
    expect(screen.queryByRole("button", { name: /sort/i })).toBeNull()
    expect(screen.getByTestId("leaderboard-figure-head")).toHaveTextContent(
      "Remaining"
    )
    // Dante: 152 per battle × 13 uncleared battles = 1,976 remaining, 2 objectives.
    const dante = row("bloodDante")
    expect(within(dante).getByTestId("leaderboard-points")).toHaveTextContent(
      "1,976"
    )
    expect(objectivesCount(dante)).toBe(2)
  })

  it("renders objective icons as indicators, muted when not met, with no glyphs", () => {
    renderLeaderboard()
    const dante = row("bloodDante")
    const indicators = within(dante).getAllByTestId("leaderboard-objective")
    expect(indicators.map((cell) => cell.dataset.met)).toEqual([
      "false",
      "false",
      "true",
      "false",
      "true",
    ])
    expect(within(dante).getByText("No Resilient: met")).toBeInTheDocument()
    expect(within(dante).getByText("Eviscerate: not met")).toBeInTheDocument()
    for (const [index, cell] of indicators.entries()) {
      const icon = within(cell).getByTestId("objective-icon")
      expect(icon.querySelector("img")).not.toBeNull()
      expect(icon.hasAttribute("data-muted")).toBe(index !== 2 && index !== 4)
      expect(cell.querySelector("svg.lucide-check")).toBeNull()
      expect(cell.querySelector("svg.lucide-minus")).toBeNull()
    }
    // The table heads its objective columns with the same icons.
    expect(screen.getAllByTestId("leaderboard-objective-head")).toHaveLength(5)
  })

  it("shows the owned unit's rarity and rank and the locked marker for the rest", () => {
    renderLeaderboard()
    const dante = row("bloodDante")
    const lysander = row("astarLysander")

    expect(dante.dataset.ownership).toBe("owned")
    expect(within(dante).getByTestId("leaderboard-rarity")).toHaveAttribute(
      "data-rarity",
      "Legendary"
    )
    expect(within(dante).getByTestId("leaderboard-rank")).toHaveAttribute(
      "data-rank",
      "Diamond1"
    )
    expect(within(dante).queryByTestId("leaderboard-locked")).toBeNull()

    expect(lysander.dataset.ownership).toBe("locked")
    expect(
      within(lysander).getByTestId("leaderboard-locked")
    ).toHaveTextContent("Locked")
    expect(within(lysander).queryByTestId("leaderboard-rarity")).toBeNull()
    expect(within(lysander).queryByTestId("leaderboard-rank")).toBeNull()
  })

  it("turns Deduct scored points off to show and order by points per battle", () => {
    renderLeaderboard()
    const toggle = screen.getByTestId("leaderboard-deduct-scored")
    expect(toggle).toHaveAttribute("aria-checked", "true")

    act(() => fireEvent.click(toggle))
    expect(screen.getByTestId("leaderboard-figure-head")).toHaveTextContent(
      "Per battle"
    )
    expect(figure(row("bloodDante"))).toBe(152)
    const values = rows().map((entry) => figure(entry))
    expect(values).toEqual([...values].sort((a, b) => b - a))
  })

  it("re-orders by remaining points on a partly cleared lane", () => {
    // Untouched: every figure is per battle × 18, so the order matches per battle.
    renderLeaderboard({}, untouched)
    expect(figure(row("bloodDante"))).toBe(2736)
  })

  it("hides locked units with Only unlocked", () => {
    renderLeaderboard()
    act(() => {
      fireEvent.click(screen.getByTestId("leaderboard-only-unlocked"))
    })
    expect(units()).toEqual(["bloodDante", "ultraCalgar"])
  })

  it("shows the no-unlocked body on a lane none of the owned units can play", () => {
    renderLeaderboard({ laneId: "beta" })
    act(() => {
      fireEvent.click(screen.getByTestId("leaderboard-only-unlocked"))
    })
    expect(rows()).toHaveLength(0)
    expect(screen.getByTestId("leaderboard-no-unlocked")).toBeInTheDocument()
  })

  it("narrows the rows to units satisfying every selected objective", () => {
    renderLeaderboard()
    const before = rows().length
    act(() => fireEvent.click(chip(flyingKey)))
    expect(rows().length).toBeLessThan(before)
    expect(units()).toContain("bloodDante")
    expect(chip(flyingKey)).toHaveAttribute("data-state", "on")

    act(() => fireEvent.click(chip(noResilientKey)))
    expect(units()).toContain("bloodDante")
    for (const entry of rows()) {
      const met = within(entry)
        .getAllByTestId("leaderboard-objective")
        .map((cell) => cell.dataset.met)
      expect(met[2]).toBe("true")
      expect(met[4]).toBe("true")
    }
  })

  it("shows the empty body with a clear action when no unit matches", () => {
    renderLeaderboard()
    // No fixture unit both flies and deals Eviscerate damage.
    act(() => fireEvent.click(chip(flyingKey)))
    act(() => fireEvent.click(chip(eviscerateKey)))
    expect(rows()).toHaveLength(0)
    expect(screen.getByTestId("leaderboard-none-match")).toHaveTextContent(
      "No unit satisfies these objectives."
    )

    act(() => fireEvent.click(screen.getByTestId("leaderboard-clear-filter")))
    expect(rows().length).toBeGreaterThan(0)
    expect(
      screen
        .getAllByTestId("leaderboard-objective-chip")
        .every((element) => element.dataset.state === "off")
    ).toBe(true)
  })

  it("shows unknown ownership with the toggle disabled when the roster is unavailable", () => {
    renderLeaderboard({
      rows: buildLeaderboardRows(
        lysanderEvent,
        legendaryEventCharacters,
        undefined,
        fiveCleared
      ),
    })
    expect(
      screen.getByTestId("leaderboard-roster-not-synced")
    ).toHaveTextContent("Your roster hasn't synced yet")
    expect(screen.getByTestId("leaderboard-only-unlocked")).toBeDisabled()
    expect(screen.queryAllByTestId("leaderboard-locked")).toHaveLength(0)
    expect(screen.queryAllByTestId("leaderboard-rank")).toHaveLength(0)
    expect(rows().every((entry) => entry.dataset.ownership === "unknown")).toBe(
      true
    )
  })

  it("treats a failed roster read like an unsynced roster", () => {
    renderLeaderboard({
      rows: buildLeaderboardRows(
        lysanderEvent,
        legendaryEventCharacters,
        "error",
        fiveCleared
      ),
    })
    expect(
      screen.getByTestId("leaderboard-roster-not-synced")
    ).toBeInTheDocument()
    expect(rows().length).toBeGreaterThan(0)
  })

  it("deducts nothing and says so when the progress read failed", () => {
    renderLeaderboard({
      rows: buildLeaderboardRows(
        lysanderEvent,
        legendaryEventCharacters,
        owned,
        { kind: "unavailable" }
      ),
    })
    expect(
      screen.getByTestId("leaderboard-progress-unavailable")
    ).toHaveTextContent("Synced progress unavailable")
    expect(figure(row("bloodDante"))).toBe(2736)
  })

  it("shows the no-eligible body for a lane that allows nobody", () => {
    renderLeaderboard({
      rows: buildLeaderboardRows(
        lysanderEvent,
        legendaryEventCharacters.filter((unit) => unit.alliance === "Xenos"),
        owned,
        fiveCleared
      ),
    })
    expect(screen.getByTestId("leaderboard-no-eligible")).toHaveTextContent(
      "No unit can play in this lane."
    )
  })

  it("renders row cards with the figure label and Objectives: N on the list layout", () => {
    renderLeaderboard({ layout: "list" })
    expect(screen.getByTestId("leaderboard-list")).toBeInTheDocument()
    expect(screen.queryByTestId("leaderboard-table")).toBeNull()
    const dante = row("bloodDante")
    expect(within(dante).getByTestId("leaderboard-points")).toHaveTextContent(
      "1,976 remaining"
    )
    expect(
      within(dante).getByTestId("leaderboard-objectives")
    ).toHaveTextContent("Objectives: 2")

    act(() => fireEvent.click(screen.getByTestId("leaderboard-deduct-scored")))
    expect(within(dante).getByTestId("leaderboard-points")).toHaveTextContent(
      "152 per battle"
    )
  })
})
