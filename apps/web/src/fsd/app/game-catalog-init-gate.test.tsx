import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { GameCatalogContextValue } from "@/app/providers"

const status = vi.fn<() => GameCatalogContextValue>()
const account = { homeAccountId: "account-1" }
const instance = {}
const signOut = vi.fn().mockResolvedValue(undefined)

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("@/app/providers", () => ({
  useGameCatalogStatus: () => status(),
}))

vi.mock("@azure/msal-react", () => ({
  useMsal: () => ({ instance }),
}))

vi.mock("@/shared/auth", () => ({
  signOut: (...args: unknown[]) => signOut(...args),
  useActiveAccountId: () => account.homeAccountId,
}))

import { GameCatalogInitGate } from "./game-catalog-init-gate"

function setStatus(value: Partial<GameCatalogContextValue>) {
  status.mockReturnValue({
    status: "idle",
    progress: null,
    gameVersion: null,
    firstTime: false,
    error: null,
    retry: vi.fn(),
    ...value,
  })
}

describe("GameCatalogInitGate", () => {
  it("shows the blocking overlay while syncing", () => {
    setStatus({
      status: "syncing",
      firstTime: true,
      progress: { downloaded: 1, total: 7 },
    })

    render(
      <GameCatalogInitGate>
        <div data-testid="home-content" />
      </GameCatalogInitGate>
    )

    expect(screen.getByTestId("catalog-init-overlay")).toBeVisible()
    expect(screen.getByTestId("home-content")).toBeInTheDocument()
  })

  it("reveals the app without overlay while only the manifest is being checked", () => {
    // No dataset downloads have started yet (progress is still null) — e.g. a fast 304 on the
    // manifest — so the app shouldn't be blocked just because a sync is technically in flight.
    setStatus({ status: "syncing", progress: null })

    render(
      <GameCatalogInitGate>
        <div data-testid="home-content" />
      </GameCatalogInitGate>
    )

    expect(screen.queryByTestId("catalog-init-overlay")).not.toBeInTheDocument()
    expect(screen.getByTestId("home-content")).toBeVisible()
  })

  it("reveals the app without overlay when ready", () => {
    setStatus({ status: "ready" })

    render(
      <GameCatalogInitGate>
        <div data-testid="home-content" />
      </GameCatalogInitGate>
    )

    expect(screen.queryByTestId("catalog-init-overlay")).not.toBeInTheDocument()
    expect(screen.getByTestId("home-content")).toBeVisible()
  })

  it("offers retry on error", () => {
    setStatus({ status: "error", error: "boom" })

    render(
      <GameCatalogInitGate>
        <div data-testid="home-content" />
      </GameCatalogInitGate>
    )

    expect(screen.getByTestId("catalog-init-retry")).toBeVisible()
    expect(screen.getByTestId("catalog-init-sign-out")).toBeVisible()
  })

  it("signs out from the error overlay", () => {
    setStatus({ status: "error", error: "boom" })

    render(
      <GameCatalogInitGate>
        <div data-testid="home-content" />
      </GameCatalogInitGate>
    )

    fireEvent.click(screen.getByTestId("catalog-init-sign-out"))

    expect(signOut).toHaveBeenCalledWith(instance, account.homeAccountId)
  })
})
