import { fireEvent, render, screen } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { CurrentUserState } from "@/entities/account"

const purgeAccount = vi.fn()
const updateTacticusIntegration = vi.fn()
const logoutRedirect = vi.fn().mockResolvedValue(undefined)
const signOut = vi.fn().mockResolvedValue(undefined)
const refetch = vi.fn()
const currentUserState = vi.fn<() => CurrentUserState>()

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

vi.mock("@/shared/auth", () => ({
  signOut: (...args: unknown[]) => signOut(...args),
}))

vi.mock("@/entities/account", () => ({
  purgeAccount: (...args: unknown[]) => purgeAccount(...args),
  updateTacticusIntegration: (...args: unknown[]) =>
    updateTacticusIntegration(...args),
  useCurrentUser: () => ({ refetch, state: currentUserState() }),
}))

vi.mock("@/shared/api", () => ({ ApiError: class ApiError extends Error {} }))

import { ManageAccountDialog } from "./manage-account-dialog"

describe("ManageAccountDialog", () => {
  beforeEach(() => {
    currentUserState.mockReturnValue(successState)
    purgeAccount.mockReset()
    updateTacticusIntegration.mockReset()
    logoutRedirect.mockClear()
    signOut.mockClear()
    refetch.mockClear()
  })

  it("renders nothing when there is no account or the current user hasn't loaded yet", () => {
    currentUserState.mockReturnValue({ status: "loading" })
    const { container } = render(
      <ManageAccountDialog onOpenChange={vi.fn()} open />
    )

    expect(container).toBeEmptyDOMElement()
  })

  it("saves the Tacticus integration and calls onSaved on success", async () => {
    updateTacticusIntegration.mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<ManageAccountDialog onOpenChange={vi.fn()} open />)

    await user.type(
      screen.getByTestId("manage-account-api-key-input"),
      " new-key "
    )
    await user.click(screen.getByTestId("manage-account-integration-submit"))

    await vi.waitFor(() => {
      expect(updateTacticusIntegration).toHaveBeenCalledWith(
        {
          clearTacticusUserId: false,
          tacticusApiKey: "new-key",
          tacticusUserId: undefined,
        },
        expect.anything()
      )
    })
    expect(refetch).toHaveBeenCalledTimes(1)
    expect(
      screen.getByTestId("manage-account-integration-success")
    ).toBeVisible()
  })

  it("shows an error message when saving the Tacticus integration fails", async () => {
    updateTacticusIntegration.mockRejectedValue(new Error("boom"))
    const user = userEvent.setup()
    render(<ManageAccountDialog onOpenChange={vi.fn()} open />)

    await user.click(screen.getByTestId("manage-account-integration-submit"))

    await vi.waitFor(() => {
      expect(
        screen.getByTestId("manage-account-integration-error")
      ).toHaveTextContent("manageAccount.integration.genericError")
    })
    expect(refetch).not.toHaveBeenCalled()
  })

  it("disables and clears the user id field when 'remove user id' is checked, and sends clearTacticusUserId", async () => {
    updateTacticusIntegration.mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<ManageAccountDialog onOpenChange={vi.fn()} open />)

    await user.type(screen.getByTestId("manage-account-user-id-input"), "1234")
    await user.click(screen.getByTestId("manage-account-remove-user-id"))
    expect(screen.getByTestId("manage-account-user-id-input")).toBeDisabled()

    await user.click(screen.getByTestId("manage-account-integration-submit"))

    await vi.waitFor(() => {
      expect(updateTacticusIntegration).toHaveBeenCalledWith(
        {
          clearTacticusUserId: true,
          tacticusApiKey: undefined,
          tacticusUserId: undefined,
        },
        expect.anything()
      )
    })
  })

  it("shows an error message when the purge itself fails", async () => {
    purgeAccount.mockRejectedValue(new Error("purge boom"))
    const user = userEvent.setup()
    render(<ManageAccountDialog onOpenChange={vi.fn()} open />)

    await user.click(screen.getByTestId("manage-account-tab-account"))
    fireEvent.change(
      screen.getByTestId("manage-account-purge-confirmation-input"),
      { target: { value: "Confirm" } }
    )
    await user.click(screen.getByTestId("manage-account-purge-submit"))

    await vi.waitFor(() => {
      expect(
        screen.getByTestId("manage-account-purge-error")
      ).toHaveTextContent("manageAccount.account.purgeGenericError")
    })
    expect(logoutRedirect).not.toHaveBeenCalled()
  })

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
    expect(signOut).toHaveBeenCalledTimes(1)
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
