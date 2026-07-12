import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { SidebarProvider } from "@workspace/ui/components/sidebar"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

import type { PlayerDataStatus } from "./player-data-provider"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const { usePlayerDataStatusMock } = vi.hoisted(() => ({
  usePlayerDataStatusMock: vi.fn(),
}))

vi.mock("./player-data-provider", () => ({
  usePlayerDataStatus: () => usePlayerDataStatusMock(),
}))

import { PlayerDataSyncButton } from "./player-data-sync-button"

function mockStatus(
  status: PlayerDataStatus,
  overrides: Partial<{
    error: string | null
    progress: { downloaded: number; total: number } | null
    syncNow: () => void
  }> = {}
) {
  usePlayerDataStatusMock.mockReturnValue({
    status,
    progress: overrides.progress ?? null,
    lastSyncedAt: null,
    error: overrides.error ?? null,
    syncNow: overrides.syncNow ?? vi.fn(),
  })
}

function renderButton() {
  return render(
    <TooltipProvider>
      <SidebarProvider>
        <PlayerDataSyncButton />
      </SidebarProvider>
    </TooltipProvider>
  )
}

describe("PlayerDataSyncButton", () => {
  it("triggers a sync on click and is enabled while idle", () => {
    const syncNow = vi.fn()
    mockStatus("idle", { syncNow })
    renderButton()

    const button = screen.getByTestId("player-data-sync-button")
    expect(button).not.toBeDisabled()

    fireEvent.click(button)

    expect(syncNow).toHaveBeenCalledTimes(1)
  })

  it("spins the icon and disables the button while a sync is in progress", () => {
    mockStatus("syncing", { progress: { downloaded: 2, total: 5 } })
    renderButton()

    const button = screen.getByTestId("player-data-sync-button")
    expect(button).toBeDisabled()
    expect(button.querySelector("svg")).toHaveClass("motion-safe:animate-spin")
  })

  it("does not spin or disable the button once a sync has completed", () => {
    mockStatus("ready")
    renderButton()

    const button = screen.getByTestId("player-data-sync-button")
    expect(button).not.toBeDisabled()
    expect(button.querySelector("svg")).not.toHaveClass(
      "motion-safe:animate-spin"
    )
  })
})
