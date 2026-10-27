import { useState } from "react"
import type { i18n as I18n } from "i18next"
import userEvent from "@testing-library/user-event"
import { beforeAll, describe, expect, it, vi } from "vitest"

import type {
  LegendaryEventAnnotation,
  LegendaryEventAnnotationStatus,
  LegendaryEventLaneId,
  LegendaryEventProgress,
} from "@/entities/legendary-event"
import { lysanderEvent } from "@/test/fixtures/legendary-events"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { render, screen, within } from "@/test/render"

import {
  buildProgressGridViewModel,
  type ReadValue,
} from "../legendary-event-page.view-model"
import { buildMarksByLane, type ProgressMarksViewModel } from "./progress-marks"
import { ProgressSection } from "./progress-section"

let i18n: I18n

// The game reports `encounterPoints` (the kill score) equal to `highScore`; earned points are the
// kill score plus the high score plus the cleared scores.
const encounter = (objectivesCleared: number[], highScore: number) => ({
  objectivesCleared,
  highScore,
  encounterPoints: highScore,
})

// Alpha: synced battles 1–7 (defeat-all 32; Eviscerate 75, Suppressive Fire 95, Flying 80, Min 5
// hits 85, No Resilient 40; battlesPoints 32, 28, 33, 37, 44, 48, 45); battle 1 partly cleared,
// battle 4 complete.
const alphaEncounters = [
  encounter([0, 2, 3], 31), // 31 + 31 + 32 + 95 + 80 = 269
  encounter([0], 28), // 28 + 28 + 32 = 88
  encounter([0, 1], 33), // 33 + 33 + 32 + 75 = 173
  encounter([0, 1, 2, 3, 4, 5], 37), // 37 + 37 + 32 + 375 = 481
  encounter([0, 1, 2], 44), // 44 + 44 + 202 = 290
  encounter([0, 1, 2, 3], 48), // 48 + 48 + 282 = 378
  encounter([0, 1, 2, 3, 5], 45), // 45 + 45 + 322 = 412
]
// Battles 1–10, summing to 3,410 points: battles 1–7 (2,091), then battles 8 and 9 complete at full
// scores (battlesPoints 48 and 44) and battle 10 partly cleared.
const syncedEncounters = [
  ...alphaEncounters,
  encounter([0, 1, 2, 3, 4, 5], 48), // 48 + 48 + 407 = 503
  encounter([0, 1, 2, 3, 4, 5], 44), // 44 + 44 + 407 = 495
  encounter([0, 2, 3, 5], 37), // 37 + 37 + 32 + 95 + 80 + 40 = 321
]
const entry = {
  id: "astarLysander",
  alpha: { encounters: syncedEncounters },
  beta: { encounters: [] },
  gamma: null,
} as unknown as LegendaryEventProgress

function renderProgress(
  progress: ReadValue<LegendaryEventProgress | undefined>,
  layout: "grid" | "rows" = "grid",
  laneId: LegendaryEventLaneId = "alpha"
) {
  return render(
    <ProgressSection
      event={lysanderEvent}
      laneId={laneId}
      layout={layout}
      progressGrid={buildProgressGridViewModel(lysanderEvent, progress)}
    />,
    { wrapper: i18nWrapper(i18n) }
  )
}

const lane = (laneId: LegendaryEventLaneId) =>
  screen
    .getAllByTestId("progress-lane")
    .find((element) => element.dataset.lane === laneId)!
const rowsIn = (laneId: LegendaryEventLaneId) =>
  within(lane(laneId)).getAllByTestId("progress-row")
const clearedFlags = (row: HTMLElement) =>
  within(row)
    .getAllByTestId("progress-cell")
    .map((cell) => cell.dataset.cleared === "true")

describe("ProgressSection", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })

  it("heads the lane with points earned of the maximum, a bar and the stable heading id", () => {
    renderProgress(entry)
    expect(
      within(lane("alpha")).getByTestId("progress-lane-total")
    ).toHaveTextContent("3,410 / 9,000")
    const bar = within(lane("alpha")).getByTestId("progress-lane-bar")
    // 3,410 / 9,000 ≈ 37.9 %.
    expect(Number(bar.getAttribute("aria-valuenow"))).toBe(38)
    expect(document.getElementById("legendary-event-progress-alpha")).toBe(
      within(lane("alpha")).getByRole("heading", { level: 3 })
    )
  })

  it("heads the defeat-all column with its asset and the objectives with theirs", () => {
    renderProgress(entry)
    const columns = screen.getAllByTestId("progress-column")
    expect(columns).toHaveLength(6)
    expect(columns[0]!.querySelector("img")).toHaveAttribute(
      "src",
      expect.stringContaining("defeat-all")
    )
    expect(columns[0]!.querySelector("svg")).toBeNull()
    expect(columns[4]!.querySelector("img")).toHaveAttribute(
      "src",
      expect.stringContaining("ui_icon_stat_hit_01")
    )
    expect(
      within(columns[4]!).getByTestId("objective-icon-badge-min")
    ).toBeInTheDocument()
  })

  it("maps a partly cleared battle: 269 / 471 and high score 31", () => {
    renderProgress(entry)
    const [first] = rowsIn("alpha")
    // defeat-all, Eviscerate, Suppressive Fire, Flying, Min 5 hits, No Resilient
    expect(clearedFlags(first!)).toEqual([
      true,
      false,
      true,
      true,
      false,
      false,
    ])
    expect(within(first!).getByTestId("progress-row-points")).toHaveTextContent(
      "269 / 471"
    )
    expect(
      within(first!).getByTestId("progress-row-high-score")
    ).toHaveTextContent("High score 31")
    expect(first!.dataset.complete).toBe("false")
  })

  it("marks the complete battle", () => {
    renderProgress(entry)
    const fourth = rowsIn("alpha")[3]!
    expect(clearedFlags(fourth).every(Boolean)).toBe(true)
    expect(fourth.dataset.complete).toBe("true")
    expect(within(fourth).getByTestId("progress-row-points")).toHaveTextContent(
      "481 / 481"
    )
  })

  it("leaves battles beyond the synced encounters uncleared at 0 points", () => {
    renderProgress(entry)
    const rows = rowsIn("alpha")
    expect(rows).toHaveLength(18)
    for (const row of rows.slice(10)) {
      expect(clearedFlags(row).some(Boolean)).toBe(false)
      expect(within(row).getByTestId("progress-row-points")).toHaveTextContent(
        /^0 \//
      )
      expect(within(row).queryByTestId("progress-row-high-score")).toBeNull()
    }
  })

  it("exposes cleared and not-cleared text on every cell", () => {
    renderProgress(entry)
    const [first] = rowsIn("alpha")
    expect(within(first!).getByText("Defeat all: cleared")).toBeInTheDocument()
    expect(
      within(first!).getByText("Suppressive Fire: cleared")
    ).toBeInTheDocument()
    expect(
      within(first!).getByText("Min 5 hits: not cleared")
    ).toBeInTheDocument()
  })

  it("shows a null lane as no progress with 0 of its maximum", () => {
    renderProgress(entry, "grid", "gamma")
    const gamma = lane("gamma")
    expect(within(gamma).getByTestId("progress-no-lane")).toHaveTextContent(
      "No progress in this lane."
    )
    expect(within(gamma).getByTestId("progress-lane-total")).toHaveTextContent(
      /^0 \//
    )
    expect(within(gamma).queryByTestId("progress-grid")).toBeNull()
  })

  it("shows the no-synced-progress body with the lane maximum when the event is absent", () => {
    renderProgress(undefined, "grid", "beta")
    expect(
      within(lane("beta")).getByTestId("progress-no-event")
    ).toHaveTextContent("No synced progress for this event yet.")
    expect(
      within(lane("beta")).getByTestId("progress-lane-total")
    ).toHaveTextContent(/^0 \/ [\d,]+$/)
  })

  it("explains that earned points count the kill score and the high score", () => {
    renderProgress(entry)
    const disclosure = screen.getByTestId("progress-how-points")
    expect(disclosure).not.toHaveAttribute("open")
    expect(disclosure).toHaveTextContent(
      "Each battle's earned points are its kill score plus its high score, plus the defeat-all bonus and the score of every objective you cleared in it."
    )
  })

  it("reports a failed read", () => {
    renderProgress("error")
    expect(screen.getByTestId("progress-unavailable")).toBeInTheDocument()
  })

  it("renders compact rows with a sticky icon header on mobile", () => {
    renderProgress(entry, "rows")
    expect(screen.queryByTestId("progress-grid")).toBeNull()
    const header = screen.getByTestId("progress-rows-header")
    expect(header).toHaveClass("sticky")
    expect(screen.getAllByTestId("progress-row")).toHaveLength(18)
    expect(
      within(screen.getAllByTestId("progress-row")[0]!).getByTestId(
        "progress-row-points"
      )
    ).toHaveTextContent("269 / 471")
  })
})

// Alpha for the marks scenarios: battle 4 complete, battle 7 with defeat-all cleared and Flying not,
// battle 9 with only Suppressive Fire cleared.
const markedEncounters = [
  ...alphaEncounters.slice(0, 6),
  encounter([0], 120), // battle 7
  encounter([], 0), // battle 8
  encounter([2], 50), // battle 9
]
const markedEntry = {
  ...entry,
  alpha: { encounters: markedEncounters },
} as unknown as LegendaryEventProgress

const annotation = (
  battleIndex: number,
  objectiveId: number,
  status: LegendaryEventAnnotationStatus
): LegendaryEventAnnotation => ({
  laneId: "alpha",
  battleIndex,
  objectiveId,
  status,
  updatedAt: "2026-10-10T00:00:00Z",
})

/** The page's wiring in miniature: annotations held in state, shown at once, every write spied. */
function MarkedProgress({
  progress,
  initial = [],
  layout = "grid",
  writes,
}: {
  progress: LegendaryEventProgress
  initial?: LegendaryEventAnnotation[]
  layout?: "grid" | "rows"
  writes: {
    cell: ProgressMarksViewModel["onMarkCell"]
    battle: ProgressMarksViewModel["onMarkBattle"]
  }
}) {
  const [annotations, setAnnotations] = useState(initial)
  const apply = (
    battleIndex: number,
    objectiveIds: number[],
    status: LegendaryEventAnnotationStatus | null
  ) =>
    setAnnotations((current) => [
      ...current.filter(
        (item) =>
          item.battleIndex !== battleIndex ||
          !objectiveIds.includes(item.objectiveId)
      ),
      ...(status === null
        ? []
        : objectiveIds.map((id) => annotation(battleIndex, id, status))),
    ])
  const marks: ProgressMarksViewModel = {
    editable: true,
    byLane: buildMarksByLane(annotations, progress),
    onMarkCell: (laneId, battleIndex, objectiveId, status) => {
      writes.cell(laneId, battleIndex, objectiveId, status)
      apply(battleIndex, [objectiveId], status)
    },
    onMarkBattle: (laneId, battle, status) => {
      writes.battle(laneId, battle, status)
      const ids = battle.cleared.flatMap((cleared, id) => (cleared ? [] : [id]))
      apply(battle.index, ids, status)
    },
  }
  return (
    <ProgressSection
      event={lysanderEvent}
      laneId="alpha"
      layout={layout}
      marks={marks}
      progressGrid={buildProgressGridViewModel(lysanderEvent, progress)}
    />
  )
}

function renderMarked(
  progress: LegendaryEventProgress,
  options: {
    initial?: LegendaryEventAnnotation[]
    layout?: "grid" | "rows"
  } = {}
) {
  const writes = {
    cell: vi.fn<ProgressMarksViewModel["onMarkCell"]>(),
    battle: vi.fn<ProgressMarksViewModel["onMarkBattle"]>(),
  }
  render(<MarkedProgress progress={progress} writes={writes} {...options} />, {
    wrapper: i18nWrapper(i18n),
  })
  return writes
}

const marksOf = (row: HTMLElement) =>
  within(row)
    .getAllByTestId("progress-cell")
    .map(
      (cell) =>
        cell.dataset.mark ??
        (cell.dataset.cleared === "true" ? "cleared" : "plain")
    )

describe("ProgressSection marks", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })

  it("marks one cell Stop here at once with one cell write", async () => {
    const user = userEvent.setup()
    const writes = renderMarked(markedEntry)
    const battle7 = rowsIn("alpha")[6]!

    await user.click(
      within(battle7).getByRole("button", { name: "Flying: not cleared" })
    )
    await user.click(screen.getByRole("menuitemradio", { name: "Stop here" }))

    expect(writes.cell).toHaveBeenCalledTimes(1)
    expect(writes.cell).toHaveBeenCalledWith("alpha", 6, 3, "stopHere")
    expect(
      within(rowsIn("alpha")[6]!).getByRole("button", {
        name: "Flying: not cleared, marked Stop here",
      })
    ).toHaveAttribute("data-mark", "stopHere")
  })

  it("marks a whole battle's not-cleared cells from its row action, leaving the cleared cell", async () => {
    const user = userEvent.setup()
    const writes = renderMarked(markedEntry)

    await user.click(screen.getByRole("button", { name: "Mark battle 9" }))
    await user.click(screen.getByRole("menuitem", { name: "Maybe clear" }))

    expect(writes.battle).toHaveBeenCalledTimes(1)
    expect(writes.battle).toHaveBeenCalledWith(
      "alpha",
      expect.objectContaining({
        index: 8,
        cleared: [false, false, true, false, false, false],
      }),
      "maybeClear"
    )
    expect(marksOf(rowsIn("alpha")[8]!)).toEqual([
      "maybeClear",
      "maybeClear",
      "cleared",
      "maybeClear",
      "maybeClear",
      "maybeClear",
    ])
  })

  it("renders a cell sync has cleared as cleared, with no mark, no control and no write", () => {
    const writes = renderMarked(entry, {
      initial: [annotation(6, 3, "stopHere")],
    })
    const battle7 = rowsIn("alpha")[6]!

    expect(within(battle7).getByText("Flying: cleared")).toBeInTheDocument()
    expect(within(battle7).queryByText(/marked Stop here/)).toBeNull()
    expect(marksOf(battle7)[3]).toBe("cleared")
    expect(writes.cell).not.toHaveBeenCalled()
    expect(writes.battle).not.toHaveBeenCalled()
  })

  it("gives a complete battle six cleared cells, no mark and no row action", () => {
    renderMarked(markedEntry, { initial: [annotation(3, 0, "maybeClear")] })
    const battle4 = rowsIn("alpha")[3]!

    expect(marksOf(battle4)).toEqual(Array(6).fill("cleared"))
    expect(within(battle4).queryByTestId("progress-row-action")).toBeNull()
    expect(
      within(rowsIn("alpha")[6]!).getByTestId("progress-row-action")
    ).toBeInTheDocument()
  })

  it("leaves the lane total and the row points unchanged by marks", () => {
    const figures = () => [
      within(lane("alpha")).getByTestId("progress-lane-total").textContent,
      within(rowsIn("alpha")[8]!).getByTestId("progress-row-points")
        .textContent,
    ]
    const { unmount } = renderProgress(markedEntry)
    const unmarked = figures()
    unmount()

    renderMarked(markedEntry, {
      initial: [0, 1, 3, 4, 5].map((id) => annotation(8, id, "maybeClear")),
    })
    expect(figures()).toEqual(unmarked)
  })

  it("explains the two marks in a legend, only while marks are editable", () => {
    renderMarked(markedEntry)
    const legend = screen.getByTestId("progress-marks-legend")
    expect(legend).toHaveTextContent("Maybe clear: worth a try")
    expect(legend).toHaveTextContent("Stop here: not worth your tokens.")
  })

  it("has no legend, cell controls or row actions without marks", () => {
    renderProgress(markedEntry)
    expect(screen.queryByTestId("progress-marks-legend")).toBeNull()
    expect(screen.queryByTestId("progress-row-action")).toBeNull()
    expect(
      within(rowsIn("alpha")[6]!).queryByRole("button", {
        name: "Flying: not cleared",
      })
    ).toBeNull()
  })

  it("makes the battle number of an incomplete mobile row its 40px row action", async () => {
    const user = userEvent.setup()
    const writes = renderMarked(markedEntry, { layout: "rows" })
    const rows = screen.getAllByTestId("progress-row")
    const action = within(rows[8]!).getByRole("button", {
      name: "Mark battle 9",
    })

    expect(action).toHaveTextContent("9")
    expect(action).toHaveClass("size-10")
    expect(within(rows[3]!).queryByTestId("progress-row-action")).toBeNull()
    expect(
      within(rows[6]!).getByRole("button", { name: "Flying: not cleared" })
    ).toHaveClass("size-10")

    await user.click(action)
    await user.click(screen.getByRole("menuitem", { name: "Stop here" }))
    expect(writes.battle).toHaveBeenCalledWith(
      "alpha",
      expect.objectContaining({ index: 8 }),
      "stopHere"
    )
  })
})
