import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@/test/render"
import userEvent from "@testing-library/user-event"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

import { GoalFilters } from "./goal-filters"

function renderFilters(
  overrides: Partial<Parameters<typeof GoalFilters>[0]> = {}
) {
  return render(
    <GoalFilters
      goalType="all"
      group="none"
      onGoalTypeChange={vi.fn()}
      onGroupChange={vi.fn()}
      {...overrides}
    />
  )
}

describe("GoalFilters", () => {
  it("keeps filter control names stable while exposing the selected value", async () => {
    const user = userEvent.setup()
    renderFilters()

    const group = screen.getByTestId("goals-group-by")
    expect(group).toHaveAccessibleName("goals.filters.groupByLabel")
    expect(
      document.getElementById("goals-group-value")
    ).not.toBeEmptyDOMElement()

    await user.click(group)
    await user.click(
      screen.getByRole("option", { name: "goals.filters.groupByType" })
    )
    expect(group).toHaveAccessibleName("goals.filters.groupByLabel")
  })

  it("calls onGoalTypeChange and onGroupChange", async () => {
    const user = userEvent.setup()
    const onGoalTypeChange = vi.fn()
    const onGroupChange = vi.fn()
    renderFilters({ onGoalTypeChange, onGroupChange })

    await user.click(screen.getByTestId("goals-type-filter"))
    await user.click(
      screen.getByRole("option", { name: "goals.create.goalTypes.Rank" })
    )
    expect(onGoalTypeChange).toHaveBeenCalledWith("Rank")

    await user.click(screen.getByTestId("goals-group-by"))
    await user.click(
      screen.getByRole("option", { name: "goals.filters.groupByUnit" })
    )
    expect(onGroupChange).toHaveBeenCalledWith("unit")
  })

  it("renders Type and Group by default", () => {
    renderFilters()

    expect(screen.getByTestId("goals-type-filter")).toBeInTheDocument()
    expect(screen.getByTestId("goals-group-by")).toBeInTheDocument()
  })

  it("hides Type when showTypeFilter is false", () => {
    render(
      <GoalFilters
        group="none"
        onGroupChange={vi.fn()}
        showTypeFilter={false}
      />
    )

    expect(screen.queryByTestId("goals-type-filter")).not.toBeInTheDocument()
    expect(screen.getByTestId("goals-group-by")).toBeInTheDocument()
  })

  it("renders every Group option by default", async () => {
    const user = userEvent.setup()
    renderFilters()

    await user.click(screen.getByTestId("goals-group-by"))
    expect(
      screen.getByRole("option", { name: "goals.filters.groupNone" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("option", { name: "goals.filters.groupByUnit" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("option", { name: "goals.filters.groupByType" })
    ).toBeInTheDocument()
  })

  it("restricts Group options to groupOptions when supplied (relayout-project-detail-controls)", async () => {
    const user = userEvent.setup()
    renderFilters({ groupOptions: ["none", "type"] })

    await user.click(screen.getByTestId("goals-group-by"))
    expect(
      screen.getByRole("option", { name: "goals.filters.groupNone" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("option", { name: "goals.filters.groupByType" })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("option", { name: "goals.filters.groupByUnit" })
    ).not.toBeInTheDocument()
  })
})
