import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const updateTacticusIntegration = vi.fn()
const refetch = vi.fn()

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const { mockAccounts, mockInstance } = vi.hoisted(() => {
  const account = { homeAccountId: "acc-1", username: "test@example.com" }
  return {
    mockAccounts: [account],
    mockInstance: { getActiveAccount: () => account },
  }
})

vi.mock("@azure/msal-react", () => ({
  useMsal: () => ({ accounts: mockAccounts, instance: mockInstance }),
}))

vi.mock("@/entities/account", () => ({
  updateTacticusIntegration: (...args: unknown[]) =>
    updateTacticusIntegration(...args),
  useCurrentUser: () => ({ refetch }),
}))

vi.mock("@/shared/api", () => ({
  ApiError: class ApiError extends Error {
    status: number
    constructor(status: number, message: string) {
      super(message)
      this.status = status
    }
  },
}))

import { GuildTacticusUserIdCard } from "./guild-tacticus-user-id-card"

beforeEach(() => {
  updateTacticusIntegration.mockReset()
  refetch.mockReset()
})

describe("GuildTacticusUserIdCard", () => {
  it("keeps submit disabled until a user id is entered", () => {
    render(<GuildTacticusUserIdCard onSaved={vi.fn()} />)

    const submit = screen.getByTestId("guild-tacticus-user-id-submit")
    expect(submit).toBeDisabled()

    fireEvent.change(screen.getByTestId("guild-tacticus-user-id-input"), {
      target: { value: "abc-123" },
    })
    expect(submit).toBeEnabled()
  })

  it("submits the trimmed user id and refetches the current user + calls onSaved on success", async () => {
    updateTacticusIntegration.mockResolvedValue(undefined)
    const onSaved = vi.fn()
    const user = userEvent.setup()

    render(<GuildTacticusUserIdCard onSaved={onSaved} />)

    fireEvent.change(screen.getByTestId("guild-tacticus-user-id-input"), {
      target: { value: "  abc-123  " },
    })
    await user.click(screen.getByTestId("guild-tacticus-user-id-submit"))

    await vi.waitFor(() => {
      expect(onSaved).toHaveBeenCalledTimes(1)
    })
    expect(updateTacticusIntegration).toHaveBeenCalledWith(
      mockInstance,
      mockAccounts[0],
      { tacticusUserId: "abc-123" }
    )
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it("shows an ApiError's message on failure without calling onSaved", async () => {
    const { ApiError } = await import("@/shared/api")
    updateTacticusIntegration.mockRejectedValue(
      new ApiError(400, "Invalid user id.")
    )
    const onSaved = vi.fn()
    const user = userEvent.setup()

    render(<GuildTacticusUserIdCard onSaved={onSaved} />)

    fireEvent.change(screen.getByTestId("guild-tacticus-user-id-input"), {
      target: { value: "abc-123" },
    })
    await user.click(screen.getByTestId("guild-tacticus-user-id-submit"))

    expect(
      await screen.findByTestId("guild-tacticus-user-id-error")
    ).toHaveTextContent("Invalid user id.")
    expect(onSaved).not.toHaveBeenCalled()
  })
})
