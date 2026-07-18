import { fireEvent, render, screen } from "@/test/render"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { CurrentUserState } from "@/entities/account"
import type { PlayerDataStatus } from "./player-data-provider"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const logoutRedirect = vi.fn().mockResolvedValue(undefined)
const activeAccount = { homeAccountId: "acc-1", username: "test@example.com" }

vi.mock("@azure/msal-react", () => ({
  useMsal: () => ({
    instance: {
      getActiveAccount: () => activeAccount,
      logoutRedirect,
    },
  }),
}))

const useCurrentUser = vi.fn<() => { state: CurrentUserState }>(() => ({
  state: { status: "loading" },
}))

vi.mock("@/entities/account", () => ({
  useCurrentUser: () => useCurrentUser(),
}))

const isInteractionRequired = vi.fn<(error: unknown) => boolean>(() => false)
const requestApiAccess = vi.fn().mockResolvedValue(undefined)

vi.mock("@/shared/auth", () => ({
  isInteractionRequired: (error: unknown) => isInteractionRequired(error),
  requestApiAccess: (...args: unknown[]) => requestApiAccess(...args),
}))

const usePlayerDataStatusMock = vi.fn<
  () => { requiresReauth: boolean; status: PlayerDataStatus }
>(() => ({ requiresReauth: false, status: "idle" }))

vi.mock("./player-data-provider", () => ({
  usePlayerDataStatus: () => usePlayerDataStatusMock(),
}))

import { ReauthDialog } from "./reauth-dialog"

describe("ReauthDialog", () => {
  beforeEach(() => {
    isInteractionRequired.mockReturnValue(false)
    requestApiAccess.mockClear().mockResolvedValue(undefined)
    logoutRedirect.mockClear().mockResolvedValue(undefined)
    useCurrentUser.mockReturnValue({ state: { status: "loading" } })
    usePlayerDataStatusMock.mockReturnValue({
      requiresReauth: false,
      status: "idle",
    })
  })

  it("stays closed when nothing requires interaction", () => {
    render(<ReauthDialog />)

    expect(screen.queryByTestId("reauth-dialog")).not.toBeInTheDocument()
  })

  it("opens when the account query fails with an interaction-required error", () => {
    useCurrentUser.mockReturnValue({
      state: { status: "error", error: new Error("expired") },
    })
    isInteractionRequired.mockReturnValue(true)

    render(<ReauthDialog />)

    expect(screen.getByTestId("reauth-dialog")).toBeVisible()
  })

  it("opens when player-data sync fails and needs reauth", () => {
    usePlayerDataStatusMock.mockReturnValue({
      requiresReauth: true,
      status: "error",
    })

    render(<ReauthDialog />)

    expect(screen.getByTestId("reauth-dialog")).toBeVisible()
  })

  it("signs in via requestApiAccess when 'Sign in' is clicked", () => {
    usePlayerDataStatusMock.mockReturnValue({
      requiresReauth: true,
      status: "error",
    })

    render(<ReauthDialog />)
    fireEvent.click(screen.getByTestId("reauth-dialog-sign-in"))

    expect(requestApiAccess).toHaveBeenCalledTimes(1)
  })

  it("signs out via logoutRedirect when 'Sign out' is clicked", () => {
    usePlayerDataStatusMock.mockReturnValue({
      requiresReauth: true,
      status: "error",
    })

    render(<ReauthDialog />)
    fireEvent.click(screen.getByTestId("reauth-dialog-sign-out"))

    expect(logoutRedirect).toHaveBeenCalledWith({ account: activeAccount })
  })

  it("dismisses on close and does not reopen for the same failure", () => {
    usePlayerDataStatusMock.mockReturnValue({
      requiresReauth: true,
      status: "error",
    })

    render(<ReauthDialog />)
    expect(screen.getByTestId("reauth-dialog")).toBeVisible()

    fireEvent.keyDown(screen.getByTestId("reauth-dialog"), {
      key: "Escape",
      code: "Escape",
    })

    expect(screen.queryByTestId("reauth-dialog")).not.toBeInTheDocument()
  })
})
