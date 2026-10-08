import type { i18n as I18n } from "i18next"
import { beforeAll, describe, expect, it, vi } from "vitest"

import type { LegendaryEventProgress } from "@/entities/legendary-event"
import { lysanderEvent } from "@/test/fixtures/legendary-events"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { fireEvent, render, screen, within } from "@/test/render"

import { buildProgressGridViewModel } from "../legendary-event-page.view-model"
import { LaneSummary } from "./lane-summary"

let i18n: I18n

const complete = { objectivesCleared: [0, 1, 2, 3, 4, 5], highScore: 37 }
// Alpha: the 7 progress-grid.test.tsx encounters (3,410) plus 6 more complete ones (444 each),
// so 7 of 13 battles are fully cleared and 6,074 points are earned.
const alphaEncounters = [
  { objectivesCleared: [0, 2, 3], highScore: 31 },
  { objectivesCleared: [0], highScore: 268 },
  { objectivesCleared: [0, 1], highScore: 303 },
  complete,
  { objectivesCleared: [0, 1, 2], highScore: 318 },
  { objectivesCleared: [0, 1, 2, 3], highScore: 418 },
  { objectivesCleared: [0, 1, 2, 3, 5], highScore: 476 },
  ...Array.from({ length: 6 }, () => complete),
].map((encounter) => ({ ...encounter, encounterPoints: encounter.highScore }))
const entry = {
  id: "astarLysander",
  alpha: { encounters: alphaEncounters },
  beta: { encounters: [] },
  gamma: null,
} as unknown as LegendaryEventProgress

function renderSummary(
  progress: LegendaryEventProgress | undefined | "error",
  onJumpToLane = vi.fn()
) {
  render(
    <LaneSummary
      event={lysanderEvent}
      onJumpToLane={onJumpToLane}
      progressGrid={buildProgressGridViewModel(lysanderEvent, progress)}
    />,
    { wrapper: i18nWrapper(i18n) }
  )
  return onJumpToLane
}

const row = (lane: string) =>
  screen
    .getAllByTestId("lane-summary-row")
    .find((r) => r.dataset.lane === lane)!

describe("LaneSummary", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })

  it("shows each lane's earned points of its maximum, a bar and the cleared battles", () => {
    renderSummary(entry)
    expect(screen.getAllByTestId("lane-summary-row")).toHaveLength(3)
    const alpha = row("alpha")
    expect(within(alpha).getByTestId("lane-summary-points")).toHaveTextContent(
      "6,074 / 9,000"
    )
    expect(within(alpha).getByTestId("lane-summary-battles")).toHaveTextContent(
      "7 / 18 battles"
    )
    const bar = within(alpha).getByTestId("lane-summary-bar")
    expect(bar.querySelector('[data-slot="progress-indicator"]')).toHaveStyle({
      transform: `translateX(-${100 - (6074 / 9000) * 100}%)`,
    })
    expect(
      within(row("beta")).getByTestId("lane-summary-battles")
    ).toHaveTextContent("0 / 18 battles")
    expect(
      within(row("gamma")).getByTestId("lane-summary-points")
    ).toHaveTextContent(/^0 \//)
    expect(
      within(row("gamma")).getByTestId("lane-summary-battles")
    ).toHaveTextContent("No progress in this lane")
  })

  it("shows one cleared count per lane objective", () => {
    renderSummary(entry)
    const alpha = within(row("alpha")).getAllByTestId("lane-summary-objective")
    expect(alpha).toHaveLength(5)
    expect(alpha.map((item) => item.textContent)).toEqual([
      "Eviscerate: 11 / 18 cleared11 / 18",
      "Suppressive Fire: 11 / 18 cleared11 / 18",
      "Flying: 10 / 18 cleared10 / 18",
      "≥Min 5 hits: 7 / 18 cleared7 / 18",
      "No Resilient: 8 / 18 cleared8 / 18",
    ])
    expect(
      within(alpha[0]!)
        .getByTestId("lane-summary-objective-bar")
        .querySelector('[data-slot="progress-indicator"]')
    ).toHaveStyle({ transform: `translateX(-${100 - (11 / 18) * 100}%)` })
    expect(
      within(row("gamma"))
        .getAllByTestId("lane-summary-objective")
        .map((item) => item.textContent)
    ).toEqual(
      expect.arrayContaining([expect.stringMatching(/: 0 \/ 18 cleared/)])
    )
  })

  it("shows 0 of the maximum for every lane without a synced entry", () => {
    renderSummary(undefined)
    for (const lane of ["alpha", "beta", "gamma"]) {
      expect(
        within(row(lane)).getByTestId("lane-summary-points")
      ).toHaveTextContent(/^0 \/ [\d,]+$/)
    }
  })

  it("shows synced data unavailable, still activatable, when the read failed", () => {
    const onJumpToLane = renderSummary("error")
    expect(
      within(row("alpha")).getByTestId("lane-summary-unavailable")
    ).toHaveTextContent("Synced data unavailable")
    expect(
      within(row("alpha")).queryByTestId("lane-summary-objectives")
    ).toBeNull()
    fireEvent.click(row("alpha"))
    expect(onJumpToLane).toHaveBeenCalledWith("alpha")
  })

  it("activating Beta asks the page to jump to the Beta grid", () => {
    const onJumpToLane = renderSummary(entry)
    fireEvent.click(row("beta"))
    expect(onJumpToLane).toHaveBeenCalledWith("beta")
    expect(row("beta")).toHaveAccessibleName("Open the Beta progress grid")
  })
})
