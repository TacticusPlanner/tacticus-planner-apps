import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { GameCatalogContextValue } from "@workspace/game-catalog"

const status = vi.fn<() => GameCatalogContextValue>()

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("@workspace/game-catalog", () => ({
  useGameCatalogStatus: () => status(),
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
  })
})
