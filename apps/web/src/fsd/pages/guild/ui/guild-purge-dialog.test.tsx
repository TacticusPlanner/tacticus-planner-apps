import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const purgeGuild = vi.fn()

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}))

vi.mock("@/entities/guild", () => ({
  purgeGuild: (...args: unknown[]) => purgeGuild(...args),
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

import { GuildPurgeDialog } from "./guild-purge-dialog"

const account = { homeAccountId: "acc-1", username: "test@example.com" }
const instance = { getActiveAccount: () => account }

beforeEach(() => {
  purgeGuild.mockReset()
})

describe("GuildPurgeDialog", () => {
  it("keeps the submit button disabled until 'Confirm' is typed exactly", () => {
    render(
      <GuildPurgeDialog
        account={account as never}
        instance={instance as never}
        onOpenChange={vi.fn()}
        onPurged={vi.fn()}
        open
      />
    )

    const submit = screen.getByTestId("guild-purge-submit")
    const input = screen.getByTestId("guild-purge-confirmation-input")

    expect(submit).toBeDisabled()

    fireEvent.change(input, { target: { value: "confirm" } })
    expect(submit).toBeDisabled()

    fireEvent.change(input, { target: { value: "Confirm" } })
    expect(submit).toBeEnabled()
  })

  it("purges the guild, closes the dialog, and calls onPurged on success", async () => {
    purgeGuild.mockResolvedValue(undefined)
    const onOpenChange = vi.fn()
    const onPurged = vi.fn()
    const user = userEvent.setup()

    render(
      <GuildPurgeDialog
        account={account as never}
        instance={instance as never}
        onOpenChange={onOpenChange}
        onPurged={onPurged}
        open
      />
    )

    fireEvent.change(screen.getByTestId("guild-purge-confirmation-input"), {
      target: { value: "Confirm" },
    })
    await user.click(screen.getByTestId("guild-purge-submit"))

    await vi.waitFor(() => {
      expect(purgeGuild).toHaveBeenCalledWith(instance, account)
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onPurged).toHaveBeenCalledTimes(1)
  })

  it("shows an ApiError's message and does not close the dialog on failure", async () => {
    const { ApiError } = await import("@/shared/api")
    purgeGuild.mockRejectedValue(
      new ApiError(403, "Only the Leader can do that.")
    )
    const onOpenChange = vi.fn()
    const onPurged = vi.fn()
    const user = userEvent.setup()

    render(
      <GuildPurgeDialog
        account={account as never}
        instance={instance as never}
        onOpenChange={onOpenChange}
        onPurged={onPurged}
        open
      />
    )

    fireEvent.change(screen.getByTestId("guild-purge-confirmation-input"), {
      target: { value: "Confirm" },
    })
    await user.click(screen.getByTestId("guild-purge-submit"))

    expect(await screen.findByTestId("guild-purge-error")).toHaveTextContent(
      "Only the Leader can do that."
    )
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(onPurged).not.toHaveBeenCalled()
  })

  it("does not allow closing the dialog while a purge is in flight", async () => {
    let resolvePurge!: () => void
    purgeGuild.mockReturnValue(
      new Promise<void>((resolve) => {
        resolvePurge = resolve
      })
    )
    const onOpenChange = vi.fn()
    const user = userEvent.setup()

    render(
      <GuildPurgeDialog
        account={account as never}
        instance={instance as never}
        onOpenChange={onOpenChange}
        onPurged={vi.fn()}
        open
      />
    )

    fireEvent.change(screen.getByTestId("guild-purge-confirmation-input"), {
      target: { value: "Confirm" },
    })
    await user.click(screen.getByTestId("guild-purge-submit"))

    // Simulate the Dialog's own onOpenChange firing (e.g. Escape key) while submitting is in flight.
    fireEvent.keyDown(document.body, { key: "Escape" })
    expect(onOpenChange).not.toHaveBeenCalled()

    resolvePurge()
  })
})
