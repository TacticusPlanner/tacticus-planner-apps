import { render, waitFor } from "@testing-library/react"
import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { PlanningSettingsProvider } from "./planning-settings-provider"

const mocks = vi.hoisted(() => ({
  getPlanningSettings: vi.fn(),
  updatePlanningSettings: vi.fn(),
}))

const account = (): AccountInfo =>
  ({
    homeAccountId: "account-1",
    localAccountId: "local-1",
    environment: "login.example.com",
    tenantId: "tenant-1",
    username: "planner@example.com",
  }) as AccountInfo

const instance = {
  getActiveAccount: () => account(),
  getAllAccounts: () => [account()],
} as unknown as IPublicClientApplication

vi.mock("@azure/msal-react", () => ({
  useMsal: () => ({ instance, accounts: [account()] }),
}))

vi.mock("../api/planning-settings.api", () => ({
  getPlanningSettings: mocks.getPlanningSettings,
  updatePlanningSettings: mocks.updatePlanningSettings,
}))

describe("PlanningSettingsProvider", () => {
  beforeEach(() => {
    mocks.getPlanningSettings.mockReset().mockResolvedValue({
      dailyEnergy: 288,
      revision: 1,
    })
    mocks.updatePlanningSettings.mockReset()
  })

  it("does not reload when MSAL returns a new account object for the same account", async () => {
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
})
