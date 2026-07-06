import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { CurrentUserState } from "@/entities/account"

const purgeAccount = vi.fn()
const updateTacticusIntegration = vi.fn()
const logoutRedirect = vi.fn().mockResolvedValue(undefined)
const refetch = vi.fn()

const successState: CurrentUserState = {
  status: "success",
  user: {
    applicationUserId: "user-1",
    displayName: "Test User",
    hasCompletedOnboarding: true,
    tacticusApiKeyMasked: "••••••••abcd",
    tacticusUserIdMasked: "••••••••1234",
  },
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}))

vi.mock("@azure/msal-react", () => ({
  useMsal: () => ({
    accounts: [{ homeAccountId: "acc-1", username: "test@example.com" }],
    instance: {
      getActiveAccount: () => ({
        homeAccountId: "acc-1",
        username: "test@example.com",
      }),
      logoutRedirect,
    },
  }),
}))

vi.mock("@/entities/account", () => ({
  purgeAccount: (...args: unknown[]) => purgeAccount(...args),
  updateTacticusIntegration: (...args: unknown[]) =>
    updateTacticusIntegration(...args),
  useCurrentUser: () => ({ refetch, state: successState }),
}))

vi.mock("@/shared/api", () => ({ ApiError: class ApiError extends Error {} }))

vi.mock("@/shared/player-data", () => ({
  usePlayerDataStatus: () => ({
    status: "idle",
    progress: null,
    lastSyncedAt: null,
    error: null,
    syncNow: vi.fn(),
  }),
}))

import { ManageAccountDialog } from "./manage-account-dialog"

describe("ManageAccountDialog", () => {
  it("keeps the purge action disabled until the confirmation word is typed exactly", async () => {
    purgeAccount.mockResolvedValue(undefined)

    const user = userEvent.setup()
    render(<ManageAccountDialog onOpenChange={vi.fn()} open />)

    await user.click(screen.getByTestId("manage-account-tab-account"))

    const submit = screen.getByTestId("manage-account-purge-submit")
    const input = screen.getByTestId("manage-account-purge-confirmation-input")

    expect(submit).toBeDisabled()

    fireEvent.change(input, { target: { value: "confirm" } })
    expect(submit).toBeDisabled()

    fireEvent.change(input, { target: { value: "Confirm" } })
    expect(submit).toBeEnabled()

    await user.click(submit)

    await vi.waitFor(() => {
      expect(purgeAccount).toHaveBeenCalledTimes(1)
    })
    expect(logoutRedirect).toHaveBeenCalledTimes(1)
  })

  it("shows the masked Tacticus integration values on the integration tab", () => {
    render(<ManageAccountDialog onOpenChange={vi.fn()} open />)

    expect(
      screen.getByTestId("manage-account-current-api-key")
    ).toHaveTextContent("••••••••abcd")
    expect(
      screen.getByTestId("manage-account-current-user-id")
    ).toHaveTextContent("••••••••1234")
  })
})
