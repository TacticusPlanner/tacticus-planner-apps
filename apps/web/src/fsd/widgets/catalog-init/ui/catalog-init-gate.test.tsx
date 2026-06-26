import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { CatalogContextValue } from "@workspace/game-catalog"

const status = vi.fn<() => CatalogContextValue>()

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("@workspace/game-catalog", () => ({
  useCatalogStatus: () => status(),
}))

import { CatalogInitGate } from "./catalog-init-gate"

function setStatus(value: Partial<CatalogContextValue>) {
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

describe("CatalogInitGate", () => {
  it("shows the blocking overlay while syncing", () => {
    setStatus({
      status: "syncing",
      firstTime: true,
      progress: { downloaded: 1, total: 7 },
    })

    render(
      <CatalogInitGate>
        <div data-testid="home-content" />
      </CatalogInitGate>
    )

    expect(screen.getByTestId("catalog-init-overlay")).toBeVisible()
    expect(screen.getByTestId("home-content")).toBeInTheDocument()
  })

  it("reveals the app without overlay when ready", () => {
    setStatus({ status: "ready" })

    render(
      <CatalogInitGate>
        <div data-testid="home-content" />
      </CatalogInitGate>
    )

    expect(screen.queryByTestId("catalog-init-overlay")).not.toBeInTheDocument()
    expect(screen.getByTestId("home-content")).toBeVisible()
  })

  it("offers retry on error", () => {
    setStatus({ status: "error", error: "boom" })

    render(
      <CatalogInitGate>
        <div data-testid="home-content" />
      </CatalogInitGate>
    )

    expect(screen.getByTestId("catalog-init-retry")).toBeVisible()
  })
})
