import { describe, expect, it } from "vitest"

import { lysanderEvent } from "@/test/fixtures/legendary-events"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { fireEvent, render, screen, within } from "@/test/render"

import { LaneOverview } from "./lane-overview"
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

async function renderLanes(
  laneIds: ("alpha" | "beta" | "gamma")[],
  lng: "en" | "de" = "en",
  {
    potentials = { alpha: READY_ALPHA, beta: LOADING, gamma: LOADING },
    isMobile = false,
  }: { potentials?: LanePotentialsViewModel; isMobile?: boolean } = {}
) {
  const i18n = await createTestI18n(lng, {
    // Only English game data is loaded; seed one German trait to show it is followed.
    de: { traits: { Resilient: "Widerstandsfähig" } },
  })
  return render(
    <LaneOverview
      event={lysanderEvent}
      isMobile={isMobile}
      laneIds={laneIds}
      potentials={potentials}
    />,
    { wrapper: i18nWrapper(i18n) }
  )
}

describe("LaneOverview", () => {
  it("renders Lysander's Alpha lane", async () => {
    await renderLanes(["alpha"])
    const alpha = within(screen.getByTestId("legendary-event-lane-panel"))

    expect(alpha.getByTestId("legendary-event-lane-label")).toHaveTextContent(
      "Alpha · No Xenos"
    )
    expect(
      alpha.getByTestId("legendary-event-lane-kill-points")
    ).toHaveTextContent("32 kill points per battle")
    expect(
      alpha
        .getAllByTestId("legendary-event-objective")
        .map((chip) => chip.textContent)
    ).toEqual([
      "Eviscerate75",
      "Suppressive Fire95",
      "Flying80",
      "≥Min 5 hits85",
      "No Resilient40",
    ])
    for (const chip of alpha.getAllByTestId("legendary-event-objective")) {
      expect(within(chip).getByTestId("objective-icon")).toBeInTheDocument()
    }
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
    await renderLanes(["alpha"])
    const summary = screen.getByTestId("roster-potential-summary")

    expect(summary).toHaveTextContent(
      "Roster reaches battle 6 · 1,386 of 8,745 points left"
    )
    expect(summary).toHaveTextContent(
      "Falls behind at battle 7 · no unit for Flying, No Resilient"
    )
  })

  it("draws each cell's state and names every state in the legend", async () => {
    await renderLanes(["alpha"])
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
    await renderLanes(["alpha"], "en", {
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
    await renderLanes(["beta"])

    expect(screen.getByTestId("roster-potential-loading")).toBeInTheDocument()
  })

  it("numbers every third battle on mobile", async () => {
    await renderLanes(["alpha"], "en", { isMobile: true })
    const numbers = screen
      .getAllByTestId("roster-potential-column")
      .map((column) => column.textContent?.trim())

    expect(numbers.slice(0, 4)).toEqual(["1", "", "", "4"])
  })

  it("renders one panel per lane it is given", async () => {
    await renderLanes(["alpha", "beta", "gamma"])

    expect(
      screen
        .getAllByTestId("legendary-event-lane-label")
        .map((label) => label.textContent)
    ).toEqual(["Alpha · No Xenos", "Beta · No Imperial", "Gamma · No Chaos"])
  })

  it("keeps the how-points disclosure collapsed until opened", async () => {
    await renderLanes(["alpha"])
    const disclosure = screen.getByTestId("legendary-event-how-points")

    expect(disclosure).not.toHaveAttribute("open")
    fireEvent.click(within(disclosure).getByText("How points work"))
    expect(disclosure).toHaveAttribute("open")
  })

  it("labels the No Resilient objective in German", async () => {
    await renderLanes(["alpha"], "de")

    const chips = screen
      .getAllByTestId("legendary-event-objective")
      .map((chip) => chip.textContent)
    expect(chips).toContain("Ohne Widerstandsfähig40")
    expect(chips).toContain("≥Mind. 5 Treffer85")
    expect(screen.getByTestId("legendary-event-lane-label")).toHaveTextContent(
      "Alpha · Ohne Xenos"
    )
  })
})
