import { render, screen } from "@testing-library/react"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { beforeEach, describe, expect, it, vi } from "vitest"

const catalogStatus = vi.hoisted(() => ({
  value: {
    error: null as string | null,
    firstTime: false,
    gameVersion: null as string | null,
    progress: null as { downloaded: number; total: number } | null,
    retry: vi.fn(),
    status: "idle",
  },
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { done?: number; total?: number }) => {
      if (key === "catalog.badge.progress") {
        return `${opts?.done}/${opts?.total}`
      }

      return key
    },
  }),
}))

vi.mock("@/shared/game-catalog", () => ({
  useGameCatalogStatus: () => catalogStatus.value,
}))

import { CatalogSyncStatusBadge } from "./catalog-sync-status-badge"

describe("CatalogSyncStatusBadge", () => {
  beforeEach(() => {
    catalogStatus.value = {
      error: null,
      firstTime: false,
      gameVersion: null,
      progress: null,
      retry: vi.fn(),
      status: "idle",
    }
  })

  it("keeps sync progress understandable in the compact collapsed badge", () => {
    catalogStatus.value = {
      error: null,
      firstTime: true,
      gameVersion: null,
      progress: { downloaded: 2, total: 5 },
      retry: vi.fn(),
      status: "syncing",
    }

    render(
      <TooltipProvider>
        <CatalogSyncStatusBadge />
      </TooltipProvider>
    )

    expect(screen.getByTestId("catalog-sync-status")).toHaveTextContent(
      "catalog.badge.syncing 2/5"
    )
    expect(screen.getByTestId("catalog-sync-status-compact")).toHaveTextContent(
      "2/5"
    )
    expect(screen.getByTestId("catalog-sync-status-compact")).toHaveAttribute(
      "aria-label",
      "catalog.badge.syncing 2/5"
    )
  })
})
