import { describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

import { goalTypeIcon } from "../model/goal-type-icon"
import { GoalTypeBadge } from "./goal-type-badge"

describe("GoalTypeBadge", () => {
  it("renders the goal type's icon and label", () => {
    const { container } = render(<GoalTypeBadge type="Unlock" />)

    expect(
      screen.getByText("goals.create.goalTypes.Unlock")
    ).toBeInTheDocument()
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      goalTypeIcon("Unlock")
    )
  })
})
