import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const importV1Profile = vi.fn()
const refetch = vi.fn()
const onOpenChange = vi.fn()
const account = { homeAccountId: "account-1" }
const instance = { getActiveAccount: () => account }

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("@azure/msal-react", () => ({
  useMsal: () => ({ instance, accounts: [account] }),
}))

vi.mock("@/entities/account", () => ({
  importV1Profile: (...args: unknown[]) => importV1Profile(...args),
  useCurrentUser: () => ({ refetch }),
}))

vi.mock("@/shared/api", () => ({
  ApiError: class ApiError extends Error {},
}))

import { ImportV1Dialog } from "./import-v1-dialog"

describe("ImportV1Dialog", () => {
  beforeEach(() => {
    importV1Profile.mockReset().mockResolvedValue({
      personalTacticusApiKey: { status: "Imported" },
      tacticusUserId: { status: "Imported" },
      guildApiToken: { status: "Skipped" },
      goals: { status: "Imported" },
      goalsImported: 2,
      goalsReplaced: 1,
      goalsSkipped: 3,
      goalIssues: [],
    })
    refetch.mockReset()
    onOpenChange.mockReset()
  })

  it("submits credentials with the user's selected import parts", async () => {
    render(<ImportV1Dialog open onOpenChange={onOpenChange} />)

    fireEvent.change(screen.getByTestId("v1-import-username"), {
      target: { value: "  legacy-user  " },
    })
    fireEvent.change(screen.getByTestId("v1-import-password"), {
      target: { value: "secret" },
    })
    fireEvent.click(screen.getByTestId("v1-import-guildApiToken"))
    fireEvent.click(screen.getByTestId("v1-import-submit"))

    await waitFor(() => {
      expect(importV1Profile).toHaveBeenCalledWith(instance, account, {
        username: "legacy-user",
        password: "secret",
        import: {
          personalTacticusApiKey: true,
          tacticusUserId: true,
          guildApiToken: false,
          goals: true,
        },
      })
    })
    expect(await screen.findByTestId("v1-import-result")).toHaveTextContent(
      "Imported"
    )
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it("shows an import failure without refreshing account state", async () => {
    importV1Profile.mockRejectedValue(new Error("network"))
    render(<ImportV1Dialog open onOpenChange={onOpenChange} />)

    fireEvent.change(screen.getByTestId("v1-import-username"), {
      target: { value: "legacy-user" },
    })
    fireEvent.change(screen.getByTestId("v1-import-password"), {
      target: { value: "secret" },
    })
    fireEvent.click(screen.getByTestId("v1-import-submit"))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "goals.v1Import.error"
    )
    expect(refetch).not.toHaveBeenCalled()
  })
})
