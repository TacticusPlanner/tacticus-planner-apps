import { describe, expect, it } from "vitest"

import { lysanderEvent } from "@/test/fixtures/legendary-events"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { fireEvent, render, screen, within } from "@/test/render"

import { HowPointsDisclosure, LaneOverviewFigures } from "./lane-overview"
import type {
  LanePotentialViewModel,
  LanePotentialsViewModel,
} from "./lane-potential.view-model"

type Cell = "cleared" | "teams" | "roster" | "out"

// Alpha: battle 1 defeat-all cleared, battles 1–4 reached by teams on defeat-all and Eviscerate,
// battles 5–6 by the roster only, nothing after; Flying and No Resilient covered by no unit.
const alphaCells: Cell[][] = Array.from({ length: 18 }, (_, battle) => {
  if (battle === 0) return ["cleared", "teams", "out", "out", "out", "out"]
  if (battle < 4) return ["teams", "teams", "roster", "out", "out", "out"]
  if (battle < 6) return ["roster", "roster", "out", "out", "out", "out"]
  return ["out", "out", "out", "out", "out", "out"]
})
const READY_ALPHA: LanePotentialViewModel = {
  kind: "ready",
  cells: alphaCells,
  potential: {
    defeatAllDepth: 6,
    objectiveDepths: [6, 4, 0, 0, 0],
    pointsLeft: 1386,
    lanePointsLeft: 8745,
    fallsBehindBattle: 7,
    uncoveredObjectiveIndexes: [2, 4],
  },
}
const LOADING: LanePotentialViewModel = { kind: "loading" }

async function renderFigures(
  laneId: "alpha" | "beta" | "gamma" = "alpha",
  {
    potentials = { alpha: READY_ALPHA, beta: LOADING, gamma: LOADING },
    isMobile = false,
  }: { potentials?: LanePotentialsViewModel; isMobile?: boolean } = {}
) {
  const i18n = await createTestI18n("en")
  return render(
    <>
      <LaneOverviewFigures
        isMobile={isMobile}
        lane={lysanderEvent[laneId]}
        laneId={laneId}
        potential={potentials[laneId]}
      />
      <HowPointsDisclosure />
    </>,
    { wrapper: i18nWrapper(i18n) }
  )
}

describe("LaneOverviewFigures", () => {
  it("renders Lysander's Alpha lane figures", async () => {
    await renderFigures()
    const alpha = within(screen.getByTestId("legendary-event-lane-figures"))

    expect(
      alpha.getByTestId("legendary-event-lane-kill-points")
    ).toHaveTextContent("32 kill points per battle")
    expect(alpha.getByTestId("legendary-event-lane-battles")).toHaveTextContent(
      "18 battles"
    )

    const columns = alpha.getAllByTestId("roster-potential-column")
    expect(columns).toHaveLength(18)
    expect(columns[0]).toHaveAccessibleName(
      "Battle 1 · 32 points · Defeat all: Cleared · Eviscerate: Teams reach · Suppressive Fire: Out of reach · Flying: Out of reach · Min 5 hits: Out of reach · No Resilient: Out of reach"
    )
    expect(columns[17]).toHaveAccessibleName(
      expect.stringContaining("Battle 18 · 57 points")
    )
  })

  it("summarises how far the roster gets and where it falls behind", async () => {
    await renderFigures()
    const summary = screen.getByTestId("roster-potential-summary")

    expect(summary).toHaveTextContent(
      "Roster reaches battle 6 · 1,386 of 8,745 points left"
    )
    expect(summary).toHaveTextContent(
      "Falls behind at battle 7 · no unit for Flying, No Resilient"
    )
  })

  it("draws each cell's state and names every state in the legend", async () => {
    await renderFigures()
    const states = screen
      .getAllByTestId("roster-potential-column")
      .map((column) =>
        within(column)
          .getAllByTestId("roster-potential-cell")
          .map((cell) => cell.dataset.state)
      )

    expect(states[0]).toEqual(alphaCells[0])
    expect(states[5]).toEqual(alphaCells[5])
    expect(
      within(screen.getByTestId("roster-potential-legend"))
        .getAllByRole("listitem")
        .map((item) => item.textContent)
    ).toEqual(["Cleared", "Teams reach", "Roster can reach", "Out of reach"])
  })

  it("asks for clear estimates when the potential is unavailable", async () => {
    await renderFigures("alpha", {
      potentials: {
        alpha: { kind: "unavailable", cells: alphaCells },
        beta: LOADING,
        gamma: LOADING,
      },
    })

    expect(screen.getByTestId("roster-potential-summary")).toHaveTextContent(
      "Roster potential needs clear estimates"
    )
  })

  it("shows a skeleton while the potential loads", async () => {
    await renderFigures("beta")

    expect(screen.getByTestId("roster-potential-loading")).toBeInTheDocument()
  })

  it("numbers every third battle on mobile", async () => {
    await renderFigures("alpha", { isMobile: true })
    const numbers = screen
      .getAllByTestId("roster-potential-column")
      .map((column) => column.textContent?.trim())

    expect(numbers.slice(0, 4)).toEqual(["1", "", "", "4"])
  })

  it("keeps the how-points disclosure collapsed until opened", async () => {
    await renderFigures()
    const disclosure = screen.getByTestId("legendary-event-how-points")

    expect(disclosure).not.toHaveAttribute("open")
    fireEvent.click(within(disclosure).getByText("How points work"))
    expect(disclosure).toHaveAttribute("open")
  })
})
