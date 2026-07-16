import { useContext } from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { PlanningSettingsProvider } from "./planning-settings-provider"
import { PlanningSettingsContext } from "./planning-settings-context"

const mocks = vi.hoisted(() => ({
  getPlanningSettings: vi.fn(),
  updatePlanningSettings: vi.fn(),
}))

vi.mock("@azure/msal-react", () => ({
  useIsAuthenticated: () => true,
}))

vi.mock("../api/planning-settings.api", () => ({
  getPlanningSettings: mocks.getPlanningSettings,
  updatePlanningSettings: mocks.updatePlanningSettings,
}))

function Consumer() {
  const { save } = useContext(PlanningSettingsContext)
  return (
    <button
      onClick={() => void save({ dailyEnergy: 378, revision: 2 })}
      type="button"
    >
      Save settings
    </button>
  )
}

describe("PlanningSettingsProvider", () => {
  beforeEach(() => {
    mocks.getPlanningSettings.mockReset().mockResolvedValue({
      dailyEnergy: 288,
      revision: 1,
    })
    mocks.updatePlanningSettings.mockReset()
  })

  it("does not reload on rerender", async () => {
    const view = render(
      <PlanningSettingsProvider>
        <div>content</div>
      </PlanningSettingsProvider>
    )

    await waitFor(() =>
      expect(mocks.getPlanningSettings).toHaveBeenCalledOnce()
    )

    view.rerender(
      <PlanningSettingsProvider>
        <div>content</div>
      </PlanningSettingsProvider>
    )

    expect(mocks.getPlanningSettings).toHaveBeenCalledOnce()
  })

  it("saves settings through the provider", async () => {
    mocks.updatePlanningSettings.mockResolvedValue({
      dailyEnergy: 378,
      revision: 3,
    })
    render(
      <PlanningSettingsProvider>
        <Consumer />
      </PlanningSettingsProvider>
    )

    fireEvent.click(screen.getByText("Save settings"))

    await waitFor(() =>
      expect(mocks.updatePlanningSettings).toHaveBeenCalledWith({
        dailyEnergy: 378,
        revision: 2,
      })
    )
  })

  it("provides a no-op default save function", async () => {
    render(<Consumer />)

    fireEvent.click(screen.getByText("Save settings"))

    await Promise.resolve()
    expect(mocks.updatePlanningSettings).not.toHaveBeenCalled()
  })
})
