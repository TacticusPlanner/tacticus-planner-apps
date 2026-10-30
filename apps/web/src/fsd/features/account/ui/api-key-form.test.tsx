import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { render, screen, waitFor } from "@/test/render"
import { ApiError } from "@/shared/api"

const updateTacticusIntegration = vi.fn()

// Spread the real module rather than replacing it: `@/shared/api` pulls in the i18n bootstrap,
// which needs the genuine `initReactI18next`.
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("@/entities/account", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/account")>()),
  updateTacticusIntegration: (...args: unknown[]) =>
    updateTacticusIntegration(...args),
}))

import { ApiKeyForm } from "./api-key-form"

describe("ApiKeyForm", () => {
  beforeEach(() => {
    updateTacticusIntegration.mockReset()
  })

  it("links out to where a key is obtained, opening in a new tab safely", () => {
    render(<ApiKeyForm onCompleted={vi.fn()} />)

    const link = screen.getByTestId("account-setup-get-key-link")
    expect(link).toHaveAttribute("href", "https://api.tacticusgame.com")
    expect(link).toHaveAttribute("target", "_blank")
    // noopener keeps the opened page from reaching back through window.opener.
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
  })

  it("completes setup when the key is accepted", async () => {
    updateTacticusIntegration.mockResolvedValue({})
    const onCompleted = vi.fn()
    const user = userEvent.setup()

    render(<ApiKeyForm onCompleted={onCompleted} />)
    await user.type(screen.getByTestId("account-setup-api-key-input"), "key-1")
    await user.click(screen.getByTestId("account-setup-api-key-submit"))

    await waitFor(() => expect(onCompleted).toHaveBeenCalledTimes(1))
  })

  it("keeps the user on the form with their values when the key is rejected", async () => {
    updateTacticusIntegration.mockRejectedValue(
      new ApiError(400, "The Tacticus API key could not be validated.")
    )
    const onCompleted = vi.fn()
    const user = userEvent.setup()

    render(<ApiKeyForm onCompleted={onCompleted} />)
    await user.type(
      screen.getByTestId("account-setup-api-key-input"),
      "bad-key"
    )
    await user.type(
      screen.getByTestId("account-setup-user-id-input"),
      "3f2504e0-4f89-11d3-9a0c-0305e82c3301"
    )
    await user.click(screen.getByTestId("account-setup-api-key-submit"))

    expect(
      await screen.findByTestId("account-setup-api-key-error")
    ).toHaveTextContent("The Tacticus API key could not be validated.")
    expect(onCompleted).not.toHaveBeenCalled()
    expect(screen.getByTestId("account-setup-api-key-input")).toHaveValue(
      "bad-key"
    )
    expect(screen.getByTestId("account-setup-user-id-input")).toHaveValue(
      "3f2504e0-4f89-11d3-9a0c-0305e82c3301"
    )
  })

  it("sends a null user id when the field is left empty, so a stored one is not cleared", async () => {
    updateTacticusIntegration.mockResolvedValue({})
    const user = userEvent.setup()

    render(<ApiKeyForm onCompleted={vi.fn()} />)
    await user.type(screen.getByTestId("account-setup-api-key-input"), "key-1")
    await user.click(screen.getByTestId("account-setup-api-key-submit"))

    await waitFor(() => expect(updateTacticusIntegration).toHaveBeenCalled())
    // react-query passes a mutation context as a second argument; only the payload matters here.
    expect(updateTacticusIntegration.mock.calls[0]?.[0]).toEqual({
      tacticusApiKey: "key-1",
      tacticusUserId: null,
    })
  })

  it("sends the user id when one is supplied", async () => {
    updateTacticusIntegration.mockResolvedValue({})
    const user = userEvent.setup()

    render(<ApiKeyForm onCompleted={vi.fn()} />)
    await user.type(screen.getByTestId("account-setup-api-key-input"), "key-1")
    await user.type(
      screen.getByTestId("account-setup-user-id-input"),
      " 3f2504e0-4f89-11d3-9a0c-0305e82c3301 "
    )
    await user.click(screen.getByTestId("account-setup-api-key-submit"))

    await waitFor(() => expect(updateTacticusIntegration).toHaveBeenCalled())
    expect(updateTacticusIntegration.mock.calls[0]?.[0]).toEqual({
      tacticusApiKey: "key-1",
      tacticusUserId: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
    })
  })

  it("flags a user id that is not a GUID under its field and does not submit", async () => {
    const user = userEvent.setup()

    render(<ApiKeyForm onCompleted={vi.fn()} />)
    await user.type(screen.getByTestId("account-setup-api-key-input"), "key-1")
    await user.type(
      screen.getByTestId("account-setup-user-id-input"),
      "player-123"
    )

    expect(screen.getByTestId("account-setup-user-id-error")).toHaveTextContent(
      "tacticusUserId.invalid"
    )
    expect(screen.getByTestId("account-setup-api-key-submit")).toBeDisabled()
    expect(updateTacticusIntegration).not.toHaveBeenCalled()
  })

  it("shows an already-linked user id (409 tacticusUserIdInUse) under the user id field", async () => {
    updateTacticusIntegration.mockRejectedValue(
      new ApiError(409, "This Tacticus user id is already linked.", {
        issueCode: "tacticusUserIdInUse",
      })
    )
    const user = userEvent.setup()

    render(<ApiKeyForm onCompleted={vi.fn()} />)
    await user.type(screen.getByTestId("account-setup-api-key-input"), "key-1")
    await user.type(
      screen.getByTestId("account-setup-user-id-input"),
      "3f2504e0-4f89-11d3-9a0c-0305e82c3301"
    )
    await user.click(screen.getByTestId("account-setup-api-key-submit"))

    expect(
      await screen.findByTestId("account-setup-user-id-error")
    ).toHaveTextContent("tacticusUserId.inUse")
    expect(
      screen.queryByTestId("account-setup-api-key-error")
    ).not.toBeInTheDocument()
  })
})
