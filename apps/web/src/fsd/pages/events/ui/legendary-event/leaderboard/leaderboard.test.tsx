import { useState } from "react"
import type { i18n as I18n } from "i18next"
import { beforeAll, describe, expect, it } from "vitest"

import {
  DEFAULT_LEADERBOARD_SORT,
  LEGENDARY_EVENT_LANE_IDS,
  type LeaderboardSort,
  type LegendaryEventLaneId,
} from "@/entities/legendary-event"
import { legendaryEventCharacters } from "@/test/fixtures/legendary-event-characters"
import { lysanderEvent } from "@/test/fixtures/legendary-events"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { act, fireEvent, render, screen, within } from "@/test/render"

import {
  buildLeaderboardRows,
  type LeaderboardRowsViewModel,
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

function Harness({
  rows,
  layout,
  laneIds = LEGENDARY_EVENT_LANE_IDS,
}: {
  rows: LeaderboardRowsViewModel
  layout: "table" | "list"
  laneIds?: readonly LegendaryEventLaneId[]
}) {
  const [sort, setSort] = useState<LeaderboardSort>(DEFAULT_LEADERBOARD_SORT)
  const [onlyUnlocked, setOnlyUnlocked] = useState(false)
  return (
    <LeaderboardSection
      event={lysanderEvent}
      laneIds={laneIds}
      layout={layout}
      leaderboard={{
        ...rows,
        sort,
        onSortChange: setSort,
        onlyUnlocked,
        onOnlyUnlockedChange: setOnlyUnlocked,
      }}
    />
  )
}

function renderLeaderboard(props: Partial<Parameters<typeof Harness>[0]> = {}) {
  return render(
    <Harness
      layout="table"
      rows={buildLeaderboardRows(
        lysanderEvent,
        legendaryEventCharacters,
        owned
      )}
      {...props}
    />,
    { wrapper: i18nWrapper(i18n) }
  )
}

const lane = (laneId: LegendaryEventLaneId) =>
  screen
    .getAllByTestId("leaderboard-lane")
    .find((element) => element.dataset.lane === laneId)!
const rowsIn = (laneId: LegendaryEventLaneId) =>
  within(lane(laneId)).queryAllByTestId("leaderboard-row")
const unitsIn = (laneId: LegendaryEventLaneId) =>
  rowsIn(laneId).map((row) => row.dataset.unit)
const points = (row: HTMLElement) =>
  Number(
    within(row)
      .getByTestId("leaderboard-points")
      .textContent!.replaceAll(/\D/g, "")
  )

describe("LeaderboardSection", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })

  it("lists every allowed unit in the default order: points, then slots, then name", () => {
    renderLeaderboard()
    const alpha = rowsIn("alpha")
    expect(alpha).toHaveLength(lysanderEvent.alpha.availableUnitIds.length)
    const values = alpha.map((row) => [
      points(row),
      Number(within(row).getByTestId("leaderboard-slots").textContent),
    ])
    const sorted = [...values].sort((a, b) => b[0]! - a[0]! || b[1]! - a[1]!)
    expect(values).toEqual(sorted)
    // Dante: 32 + 80 (Flying) + 40 (No Resilient) = 152 with Flying and No Resilient met.
    const dante = alpha.find((row) => row.dataset.unit === "bloodDante")!
    expect(points(dante)).toBe(152)
    expect(
      within(dante)
        .getAllByTestId("leaderboard-objective")
        .map((cell) => cell.dataset.met)
    ).toEqual(["false", "false", "true", "false", "true"])
    expect(within(dante).getByText("No Resilient: met")).toBeInTheDocument()
  })

  it("shows the owned unit's rarity and rank and the locked marker for the rest", () => {
    renderLeaderboard()
    const alpha = rowsIn("alpha")
    const dante = alpha.find((row) => row.dataset.unit === "bloodDante")!
    const lysander = alpha.find((row) => row.dataset.unit === "astarLysander")!

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

  it("hides locked units in every lane with Only unlocked", () => {
    renderLeaderboard()
    act(() => {
      fireEvent.click(screen.getByTestId("leaderboard-only-unlocked"))
    })
    // Dante and Calgar are Imperial: Alpha and Gamma allow them, Beta (No Imperial) does not.
    expect(unitsIn("alpha")).toEqual(["bloodDante", "ultraCalgar"])
    expect(unitsIn("gamma").sort()).toEqual(["bloodDante", "ultraCalgar"])
    expect(rowsIn("beta")).toHaveLength(0)
    expect(
      within(lane("beta")).getByTestId("leaderboard-no-unlocked")
    ).toBeInTheDocument()
  })

  it("shows unknown ownership with the toggle disabled when the roster is unavailable", () => {
    renderLeaderboard({
      rows: buildLeaderboardRows(
        lysanderEvent,
        legendaryEventCharacters,
        undefined
      ),
    })
    expect(
      screen.getByTestId("leaderboard-roster-not-synced")
    ).toHaveTextContent("Your roster hasn't synced yet")
    expect(screen.getByTestId("leaderboard-only-unlocked")).toBeDisabled()
    expect(screen.queryAllByTestId("leaderboard-locked")).toHaveLength(0)
    expect(screen.queryAllByTestId("leaderboard-rank")).toHaveLength(0)
    expect(
      rowsIn("alpha").every((row) => row.dataset.ownership === "unknown")
    ).toBe(true)
  })

  it("treats a failed roster read like an unsynced roster", () => {
    renderLeaderboard({
      rows: buildLeaderboardRows(
        lysanderEvent,
        legendaryEventCharacters,
        "error"
      ),
    })
    expect(
      screen.getByTestId("leaderboard-roster-not-synced")
    ).toBeInTheDocument()
    expect(rowsIn("alpha").length).toBeGreaterThan(0)
  })

  it("shows the no-eligible body for a lane that allows nobody", () => {
    const rows = buildLeaderboardRows(
      lysanderEvent,
      legendaryEventCharacters.filter((unit) => unit.alliance === "Xenos"),
      owned
    )
    renderLeaderboard({ rows })
    expect(
      within(lane("alpha")).getByTestId("leaderboard-no-eligible")
    ).toHaveTextContent("No unit can play in this lane.")
  })

  it("sorts the table from its column headers", () => {
    renderLeaderboard()
    const header = (key: string) =>
      screen.getAllByTestId(`leaderboard-sort-header-${key}`)[0]!
    expect(header("points").closest("th")).toHaveAttribute(
      "aria-sort",
      "descending"
    )

    act(() => fireEvent.click(header("name")))
    const names = rowsIn("alpha").map(
      (row) => within(row).getByTestId("leaderboard-unit-name").textContent!
    )
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "en")))
    expect(header("name").closest("th")).toHaveAttribute(
      "aria-sort",
      "ascending"
    )
    // Shared across lanes: Beta is sorted by name too.
    const betaNames = rowsIn("beta").map(
      (row) => within(row).getByTestId("leaderboard-unit-name").textContent!
    )
    expect(betaNames).toEqual(
      [...betaNames].sort((a, b) => a.localeCompare(b, "en"))
    )

    act(() => fireEvent.click(header("name")))
    expect(header("name").closest("th")).toHaveAttribute(
      "aria-sort",
      "descending"
    )

    act(() => fireEvent.click(header("slots")))
    const slots = rowsIn("alpha").map((row) =>
      Number(within(row).getByTestId("leaderboard-slots").textContent)
    )
    expect(slots).toEqual([...slots].sort((a, b) => b - a))
  })

  it("renders row cards with the compact sort bar on the list layout", () => {
    renderLeaderboard({ layout: "list", laneIds: ["alpha"] })
    expect(screen.getByTestId("leaderboard-list")).toBeInTheDocument()
    expect(screen.queryByTestId("leaderboard-table")).toBeNull()
    expect(screen.getByTestId("leaderboard-sort")).toBeInTheDocument()

    act(() => fireEvent.click(screen.getByTestId("leaderboard-sort-slots")))
    const slotsText = rowsIn("alpha").map(
      (row) => within(row).getByTestId("leaderboard-slots").textContent!
    )
    const slots = slotsText.map((text) => Number(text.replaceAll(/\D/g, "")))
    expect(slots).toEqual([...slots].sort((a, b) => b - a))

    act(() => fireEvent.click(screen.getByTestId("leaderboard-sort-direction")))
    const ascending = rowsIn("alpha").map((row) =>
      Number(
        within(row)
          .getByTestId("leaderboard-slots")
          .textContent!.replaceAll(/\D/g, "")
      )
    )
    expect(ascending).toEqual([...ascending].sort((a, b) => a - b))
    // The table's sortable headers are desktop-only.
    expect(screen.queryByTestId("leaderboard-sort-header-points")).toBeNull()
  })
})
