import { describe, expect, it } from "vitest"

import { lysanderEvent } from "@/test/fixtures/legendary-events"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { fireEvent, render, screen, within } from "@/test/render"

import { LaneOverview } from "./lane-overview"

async function renderLanes(
  laneIds: ("alpha" | "beta" | "gamma")[],
  lng: "en" | "de" = "en"
) {
  const i18n = await createTestI18n(lng, {
    // Game-data namespaces ship English-only; seed one German trait to show it is followed.
    de: { traits: { Resilient: "Widerstandsfähig" } },
  })
  return render(<LaneOverview event={lysanderEvent} laneIds={laneIds} />, {
    wrapper: i18nWrapper(i18n),
  })
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

    const bars = alpha
      .getAllByTestId("legendary-event-ladder-bar")
      .map((bar) => Number(bar.dataset.points))
    expect(bars).toHaveLength(18)
    expect(bars.slice(0, 3)).toEqual([32, 28, 33])
    expect(bars.slice(-2)).toEqual([64, 57])
    expect(
      alpha.getAllByTestId("legendary-event-ladder-bar")[0]
    ).toHaveAccessibleName("Battle 1: 32 points")
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
