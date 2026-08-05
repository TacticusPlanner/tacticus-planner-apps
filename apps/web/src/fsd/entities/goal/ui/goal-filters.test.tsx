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
      onSortChange={vi.fn()}
      sort="updated"
      {...overrides}
    />
  )
}

describe("GoalFilters", () => {
  it("keeps filter control names stable while exposing the selected value", async () => {
    const user = userEvent.setup()
    renderFilters()

    const sort = screen.getByTestId("goals-sort")
    expect(sort).toHaveAccessibleName("goals.filters.sortByLabel")
    expect(
      document.getElementById("goals-sort-value")
    ).not.toBeEmptyDOMElement()

    await user.click(sort)
    await user.click(
      screen.getByRole("option", { name: "goals.filters.sort.status" })
    )
    expect(sort).toHaveAccessibleName("goals.filters.sortByLabel")
  })

  it("calls onGoalTypeChange, onSortChange, and onGroupChange", async () => {
    const user = userEvent.setup()
    const onGoalTypeChange = vi.fn()
    const onSortChange = vi.fn()
    const onGroupChange = vi.fn()
    renderFilters({ onGoalTypeChange, onSortChange, onGroupChange })

    await user.click(screen.getByTestId("goals-type-filter"))
    await user.click(
      screen.getByRole("option", { name: "goals.create.goalTypes.Rank" })
    )
    expect(onGoalTypeChange).toHaveBeenCalledWith("Rank")

    await user.click(screen.getByTestId("goals-sort"))
    await user.click(
      screen.getByRole("option", { name: "goals.filters.sort.status" })
    )
    expect(onSortChange).toHaveBeenCalledWith("status")

    await user.click(screen.getByTestId("goals-group-by"))
    await user.click(
      screen.getByRole("option", { name: "goals.filters.groupByUnit" })
    )
    expect(onGroupChange).toHaveBeenCalledWith("unit")
  })
})
