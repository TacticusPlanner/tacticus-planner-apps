import { describe, expect, it } from "vitest"

import { fireEvent, render, screen } from "@/test/render"

import { UnitGoalBadge } from "./unit-goal-badge"

describe("UnitGoalBadge", () => {
  it("names one goal", () => {
    render(<UnitGoalBadge label="Goals" lines={["Rank to Gold II"]} />)
    expect(
      screen.getByRole("button", { name: "Goals: Rank to Gold II" })
    ).toBeInTheDocument()
  })

  it("lists several goals", () => {
    render(
      <UnitGoalBadge
        label="Goals"
        lines={["Rank to Gold II", "Ascension to Legendary Red Three Stars"]}
      />
    )
    expect(
      screen.getByRole("button", {
        name: "Goals: Rank to Gold II; Ascension to Legendary Red Three Stars",
      })
    ).toBeInTheDocument()
  })

  it("renders nothing without goals", () => {
    render(<UnitGoalBadge label="Goals" lines={[]} />)
    expect(screen.queryByTestId("unit-goal-badge")).not.toBeInTheDocument()
  })

  it("is a plain named mark, hover only, without a focusable tooltip", async () => {
    render(<UnitGoalBadge label="Goals" lines={["Unlock"]} tooltip={false} />)
    const badge = screen.getByRole("img", { name: "Goals: Unlock" })
    expect(badge).not.toHaveAttribute("tabindex")
    fireEvent.pointerMove(badge, { pointerType: "mouse" })
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Unlock")
  })
})
