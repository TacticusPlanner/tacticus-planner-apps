import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const registerGuild = vi.fn()

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

vi.mock("@/entities/guild", () => ({
  registerGuild: (...args: unknown[]) => registerGuild(...args),
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

import { GuildRegistrationForm } from "./guild-registration-form"

beforeEach(() => {
  registerGuild.mockReset()
})

describe("GuildRegistrationForm", () => {
  it("keeps submit disabled until a token is entered", () => {
    render(<GuildRegistrationForm onRegistered={vi.fn()} />)

    const submit = screen.getByTestId("guild-register-submit")
    expect(submit).toBeDisabled()

    fireEvent.change(screen.getByTestId("guild-api-token-input"), {
      target: { value: "   " },
    })
    expect(submit).toBeDisabled()

    fireEvent.change(screen.getByTestId("guild-api-token-input"), {
      target: { value: "a-token" },
    })
    expect(submit).toBeEnabled()
  })

  it("submits the trimmed token, clears it, and calls onRegistered on success", async () => {
    registerGuild.mockResolvedValue(undefined)
    const onRegistered = vi.fn()
    const user = userEvent.setup()

    render(<GuildRegistrationForm onRegistered={onRegistered} />)

    const input = screen.getByTestId("guild-api-token-input")
    fireEvent.change(input, { target: { value: "  my-token  " } })
    await user.click(screen.getByTestId("guild-register-submit"))

    await vi.waitFor(() => {
      expect(onRegistered).toHaveBeenCalledTimes(1)
    })
    expect(registerGuild).toHaveBeenCalledWith(mockInstance, mockAccounts[0], {
      guildApiToken: "my-token",
    })
    expect(input).toHaveValue("")
  })

  it("shows an ApiError's message and leaves the token in place on failure", async () => {
    const { ApiError } = await import("@/shared/api")
    registerGuild.mockRejectedValue(
      new ApiError(403, "Only the Leader can do that.")
    )
    const user = userEvent.setup()

    render(<GuildRegistrationForm onRegistered={vi.fn()} />)

    fireEvent.change(screen.getByTestId("guild-api-token-input"), {
      target: { value: "my-token" },
    })
    await user.click(screen.getByTestId("guild-register-submit"))

    expect(
      await screen.findByTestId("guild-registration-error")
    ).toHaveTextContent("Only the Leader can do that.")
    expect(screen.getByTestId("guild-api-token-input")).toHaveValue("my-token")
  })

  it("falls back to the generic error copy for a non-ApiError failure", async () => {
    registerGuild.mockRejectedValue(new Error("network exploded"))
    const user = userEvent.setup()

    render(<GuildRegistrationForm onRegistered={vi.fn()} />)

    fireEvent.change(screen.getByTestId("guild-api-token-input"), {
      target: { value: "my-token" },
    })
    await user.click(screen.getByTestId("guild-register-submit"))

    expect(
      await screen.findByTestId("guild-registration-error")
    ).toHaveTextContent("guild.unregistered.genericError")
  })
})
