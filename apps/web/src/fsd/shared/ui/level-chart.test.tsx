import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { LevelChart } from "./level-chart"
import {
  chartScale,
  describeSeries,
  formatCompact,
  niceStep,
} from "./level-chart.model"

const levels = Array.from({ length: 10 }, (_, index) => `Lv ${index + 1}`)
const rising = levels.map((_, index) => [(index + 1) * 100])
const band = levels.map((_, index) => [(index + 1) * 100, (index + 1) * 120])

describe("level chart scale", () => {
  it("rounds steps up to 1, 2, 2.5 or 5 × 10^n", () => {
    expect(niceStep(3)).toBe(5)
    expect(niceStep(180)).toBe(200)
    expect(niceStep(2400)).toBe(2500)
    expect(niceStep(0)).toBe(1)
  })

  it("starts at zero with a nice max at or above the data", () => {
    expect(chartScale(rising, true)).toEqual({ min: 0, mid: 500, max: 1000 })
  })

  it("snaps a non-zero axis around the data so a small change stays visible", () => {
    const relic = [[295], [330], [370], [439]]
    const scale = chartScale(relic, false)
    expect(scale.min).toBeGreaterThan(0)
    expect(scale.min).toBeLessThanOrEqual(295)
    expect(scale.max).toBeGreaterThanOrEqual(439)
  })

  it("formats ticks compactly and summarises a band", () => {
    expect(formatCompact(1200, "en")).toBe("1.2K")
    expect(describeSeries(band, "en")).toEqual({
      from: "100–120",
      to: "1,000–1,200",
    })
  })
})

describe("LevelChart", () => {
  it("draws a band as a filled area between two lines", () => {
    const { container } = render(
      <LevelChart
        title="Damage"
        points={band}
        xLabels={levels}
        xTicks={[0, 9]}
        caption="Damage grows"
      />
    )
    const paths = container.querySelectorAll("path")
    expect(paths).toHaveLength(3)
    expect(paths[0].getAttribute("fill")).toBe("var(--chart-1)")
  })

  it("marks the selected index and reads it out", () => {
    render(
      <LevelChart
        title="Damage"
        points={rising}
        xLabels={levels}
        xTicks={[0, 9]}
        markerIndex={3}
        readoutSuffix=" (yours)"
        caption="Damage grows"
        data-testid="chart"
      />
    )
    expect(screen.getByTestId("chart-marker")).toHaveAttribute(
      "data-index",
      "3"
    )
    expect(screen.getByTestId("chart-readout")).toHaveTextContent(
      "Lv 4: 400 (yours)"
    )
  })

  it("reads out the hovered column and reports a click", () => {
    const onSelect = vi.fn()
    render(
      <LevelChart
        title="Damage"
        points={rising}
        xLabels={levels}
        xTicks={[0, 9]}
        markerIndex={0}
        onSelect={onSelect}
        caption="Damage grows"
        data-testid="chart"
      />
    )
    const column = screen.getByTestId("chart-column-6")
    fireEvent.mouseEnter(column)
    expect(screen.getByTestId("chart-readout")).toHaveTextContent("Lv 7: 700")
    fireEvent.click(column)
    expect(onSelect).toHaveBeenCalledWith(6)
  })

  it("names the figure by its caption and hides the plot", () => {
    render(
      <LevelChart
        title="Damage"
        points={rising}
        xLabels={levels}
        xTicks={[0, 9]}
        caption="Damage grows from 100 at level 1 to 1,000 at level 10."
      />
    )
    expect(
      screen.getByRole("figure", {
        name: "Damage grows from 100 at level 1 to 1,000 at level 10.",
      })
    ).toBeInTheDocument()
  })
})
