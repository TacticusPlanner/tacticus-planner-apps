import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@/test/render"
import userEvent from "@testing-library/user-event"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

import { StatusFilterSelect } from "./status-filter-select"

describe("StatusFilterSelect", () => {
  it("defaults to Unfulfilled and shows per-option counts", async () => {
    const user = userEvent.setup()
    render(
      <StatusFilterSelect
        counts={{ toReach: 2, reached: 0, archived: 1 }}
        onValueChange={vi.fn()}
        value="toReach"
      />
    )

    expect(screen.getByTestId("goals-status-filter")).toHaveTextContent(
      "goals.tabs.toReach"
    )

    await user.click(screen.getByTestId("goals-status-filter"))
    expect(
      screen.getByRole("option", { name: "goals.tabs.reached (0)" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("option", { name: "goals.tabs.archived (1)" })
    ).toBeInTheDocument()
  })

  it("calls onValueChange when a different status is selected", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <StatusFilterSelect
        counts={{ toReach: 2, reached: 1, archived: 0 }}
        onValueChange={onValueChange}
        value="toReach"
      />
    )

    await user.click(screen.getByTestId("goals-status-filter"))
    await user.click(
      screen.getByRole("option", { name: "goals.tabs.reached (1)" })
    )

    expect(onValueChange).toHaveBeenCalledWith("reached")
  })

  it("shows the reached indicator when reached goals exist and aren't being viewed", () => {
    const { rerender } = render(
      <StatusFilterSelect
        counts={{ toReach: 2, reached: 1, archived: 0 }}
        onValueChange={vi.fn()}
        value="toReach"
      />
    )
    expect(
      screen.getByTestId("goals-status-filter-reached-indicator")
    ).toBeInTheDocument()

    rerender(
      <StatusFilterSelect
        counts={{ toReach: 2, reached: 1, archived: 0 }}
        onValueChange={vi.fn()}
        value="reached"
      />
    )
    expect(
      screen.queryByTestId("goals-status-filter-reached-indicator")
    ).not.toBeInTheDocument()
  })

  it("hides the reached indicator when there are no reached goals", () => {
    render(
      <StatusFilterSelect
        counts={{ toReach: 2, reached: 0, archived: 0 }}
        onValueChange={vi.fn()}
        value="toReach"
      />
    )
    expect(
      screen.queryByTestId("goals-status-filter-reached-indicator")
    ).not.toBeInTheDocument()
  })

  it("supports a caller-provided testId for multiple instances on one page", () => {
    render(
      <StatusFilterSelect
        counts={{ toReach: 0, reached: 0, archived: 0 }}
        onValueChange={vi.fn()}
        testId="projects-status-filter"
        value="toReach"
      />
    )
    expect(screen.getByTestId("projects-status-filter")).toBeInTheDocument()
  })
})
