import { fireEvent, render, screen } from "@/test/render"
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

vi.mock("@/entities/goal", () => ({
  goalQueries: { all: () => ["goals"] },
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
  it("triggers a sync on click and is enabled while idle", async () => {
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

  it("shows the platform shortcut hint next to its label", () => {
    mockStatus("idle")
    renderButton()

    expect(screen.getByTestId("player-data-sync-button")).toHaveTextContent(
      "Ctrl+Shift+S"
    )
  })

  it("starts a sync on Ctrl/Cmd+Shift+S when not already syncing", () => {
    const syncNow = vi.fn()
    mockStatus("idle", { syncNow })
    renderButton()

    fireEvent.keyDown(window, { key: "S", ctrlKey: true, shiftKey: true })

    expect(syncNow).toHaveBeenCalledTimes(1)
  })

  it("is a no-op while a sync is already in progress", () => {
    const syncNow = vi.fn()
    mockStatus("syncing", { syncNow })
    renderButton()

    fireEvent.keyDown(window, { key: "S", ctrlKey: true, shiftKey: true })

    expect(syncNow).not.toHaveBeenCalled()
  })
})
