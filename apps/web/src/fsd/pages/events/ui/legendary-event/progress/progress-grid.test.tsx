import type { i18n as I18n } from "i18next"
import { beforeAll, describe, expect, it } from "vitest"

import {
  LEGENDARY_EVENT_LANE_IDS,
  type LegendaryEventLaneId,
  type LegendaryEventProgress,
} from "@/entities/legendary-event"
import { lysanderEvent } from "@/test/fixtures/legendary-events"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { render, screen, within } from "@/test/render"

import {
  buildProgressGridViewModel,
  type ReadValue,
} from "../legendary-event-page.view-model"
import { ProgressSection } from "./progress-section"

let i18n: I18n

const encounter = (
  objectivesCleared: number[],
  highScore: number,
  encounterPoints: number
) => ({ objectivesCleared, highScore, encounterPoints })

// Alpha: seven synced battles summing to 3,410 points; battle 1 partly cleared, battle 4 complete.
const alphaEncounters = [
  encounter([0, 2, 3], 31, 238),
  encounter([0], 0, 300),
  encounter([0, 1], 12, 410),
  encounter([0, 1, 2, 3, 4, 5], 37, 486),
  encounter([0, 1, 2], 20, 520),
  encounter([0, 1, 2, 3], 25, 700),
  encounter([0, 1, 2, 3, 5], 30, 756),
]
const entry = {
  id: "astarLysander",
  alpha: { encounters: alphaEncounters },
  beta: { encounters: [] },
  gamma: null,
} as unknown as LegendaryEventProgress

function renderProgress(
  progress: ReadValue<LegendaryEventProgress | undefined>,
  layout: "grid" | "rows" = "grid",
  laneIds: readonly LegendaryEventLaneId[] = LEGENDARY_EVENT_LANE_IDS
) {
  return render(
    <ProgressSection
      event={lysanderEvent}
      laneIds={laneIds}
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

  it("heads each lane with points earned of the maximum and a bar", () => {
    renderProgress(entry)
    expect(
      within(lane("alpha")).getByTestId("progress-lane-total")
    ).toHaveTextContent("3,410 / 9,000")
    const bar = within(lane("alpha")).getByTestId("progress-lane-bar")
    // 3,410 / 9,000 ≈ 37.9 %.
    expect(Number(bar.getAttribute("aria-valuenow"))).toBe(38)
  })

  it("maps a partly cleared battle: 238 / 471 and high score 31", () => {
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
      "238 / 471"
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
      /^486 \//
    )
  })

  it("leaves battles beyond the synced encounters uncleared at 0 points", () => {
    renderProgress(entry)
    const rows = rowsIn("alpha")
    expect(rows).toHaveLength(18)
    for (const row of rows.slice(7)) {
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
    renderProgress(entry)
    const gamma = lane("gamma")
    expect(within(gamma).getByTestId("progress-no-lane")).toHaveTextContent(
      "No progress in this lane."
    )
    expect(within(gamma).getByTestId("progress-lane-total")).toHaveTextContent(
      /^0 \//
    )
    expect(within(gamma).queryByTestId("progress-grid")).toBeNull()
  })

  it("shows every lane's no-synced-progress body with its maximum when the event is absent", () => {
    renderProgress(undefined)
    for (const laneId of LEGENDARY_EVENT_LANE_IDS) {
      expect(
        within(lane(laneId)).getByTestId("progress-no-event")
      ).toHaveTextContent("No synced progress for this event yet.")
      expect(
        within(lane(laneId)).getByTestId("progress-lane-total")
      ).toHaveTextContent(/^0 \/ [\d,]+$/)
    }
  })

  it("reports a failed read", () => {
    renderProgress("error")
    expect(screen.getByTestId("progress-unavailable")).toBeInTheDocument()
  })

  it("renders compact rows with a sticky icon header on mobile", () => {
    renderProgress(entry, "rows", ["alpha"])
    expect(screen.queryByTestId("progress-grid")).toBeNull()
    const header = screen.getByTestId("progress-rows-header")
    expect(header).toHaveClass("sticky")
    expect(screen.getAllByTestId("progress-row")).toHaveLength(18)
    expect(
      within(screen.getAllByTestId("progress-row")[0]!).getByTestId(
        "progress-row-points"
      )
    ).toHaveTextContent("238 / 471")
  })
})
