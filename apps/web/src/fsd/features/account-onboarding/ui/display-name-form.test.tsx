import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { render, screen, waitFor } from "@/test/render"

const mutateAsync = vi.fn()

vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("@/entities/account", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/account")>()),
  useUpdateDisplayName: () => ({ isPending: false, mutateAsync }),
}))

import { DisplayNameForm } from "./display-name-form"

describe("DisplayNameForm", () => {
  beforeEach(() => {
    mutateAsync.mockReset()
  })

  it("prefills a suggestion without saving it", () => {
    render(
      <DisplayNameForm onCompleted={vi.fn()} suggestion="ada@example.com" />
    )

    expect(screen.getByTestId("account-setup-name-input")).toHaveValue(
      "ada@example.com"
    )
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  it("saves the trimmed name and reports completion", async () => {
    mutateAsync.mockResolvedValue({})
    const onCompleted = vi.fn()
    const user = userEvent.setup()

    render(<DisplayNameForm onCompleted={onCompleted} suggestion="Provider" />)
    await user.clear(screen.getByTestId("account-setup-name-input"))
    await user.type(screen.getByTestId("account-setup-name-input"), "  Ada  ")
    await user.click(screen.getByTestId("account-setup-name-submit"))

    await waitFor(() => expect(onCompleted).toHaveBeenCalledTimes(1))
    expect(mutateAsync).toHaveBeenCalledWith("Ada")
  })

  it("lets the suggestion be confirmed as-is by an explicit submit", async () => {
    mutateAsync.mockResolvedValue({})
    const user = userEvent.setup()

    render(<DisplayNameForm onCompleted={vi.fn()} suggestion="Ragnar42" />)
    await user.click(screen.getByTestId("account-setup-name-submit"))

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith("Ragnar42"))
  })

  it("never overwrites a draft the user typed with a later suggestion", async () => {
    const user = userEvent.setup()
    const { rerender } = render(<DisplayNameForm onCompleted={vi.fn()} />)

    await user.type(screen.getByTestId("account-setup-name-input"), "Mine")
    rerender(<DisplayNameForm onCompleted={vi.fn()} suggestion="Late" />)

    expect(screen.getByTestId("account-setup-name-input")).toHaveValue("Mine")
  })

  it("keeps the draft and offers a retry when the save fails", async () => {
    mutateAsync.mockRejectedValueOnce(new Error("offline"))
    mutateAsync.mockResolvedValueOnce({})
    const onCompleted = vi.fn()
    const user = userEvent.setup()

    render(<DisplayNameForm onCompleted={onCompleted} />)
    await user.type(screen.getByTestId("account-setup-name-input"), "Ada")
    await user.click(screen.getByTestId("account-setup-name-submit"))

    expect(await screen.findByTestId("account-setup-name-error")).toBeVisible()
    expect(screen.getByTestId("account-setup-name-input")).toHaveValue("Ada")
    expect(onCompleted).not.toHaveBeenCalled()

    await user.click(screen.getByTestId("account-setup-name-submit"))

    await waitFor(() => expect(onCompleted).toHaveBeenCalledTimes(1))
    expect(screen.queryByTestId("account-setup-name-error")).toBeNull()
  })

  it("blocks an empty name and explains an over-long or control-character one", async () => {
    const user = userEvent.setup()

    render(<DisplayNameForm onCompleted={vi.fn()} />)
    expect(screen.getByTestId("account-setup-name-submit")).toBeDisabled()

    await user.type(screen.getByTestId("account-setup-name-input"), "   ")
    expect(screen.getByTestId("account-setup-name-submit")).toBeDisabled()

    await user.clear(screen.getByTestId("account-setup-name-input"))
    await user.click(screen.getByTestId("account-setup-name-input"))
    await user.paste("a".repeat(81))

    expect(screen.getByTestId("account-setup-name-problem")).toBeVisible()
    expect(screen.getByTestId("account-setup-name-submit")).toBeDisabled()
    expect(mutateAsync).not.toHaveBeenCalled()
  })
})
