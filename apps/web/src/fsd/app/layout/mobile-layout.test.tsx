import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("@azure/msal-react", () => ({
  useMsal: () => ({ instance: { loginRedirect: () => Promise.resolve() } }),
}))

vi.mock("@/shared/auth", () => ({ loginRequest: { scopes: ["api"] } }))

// Mirrors desktop-layout.test.tsx's reasoning: nav-items.ts reads `isUiKitEnabled` from the real
// `@/shared/config` module, which also calls `initReactI18next` at import time.
vi.mock("@/shared/config", () => ({ isUiKitEnabled: true }))

vi.mock("../providers/auth-control", () => ({ AuthControl: () => null }))
vi.mock("../providers/language-switcher", () => ({
  LanguageSwitcher: () => null,
}))
vi.mock("../providers/theme-switcher", () => ({ ThemeSwitcher: () => null }))
vi.mock("@/shared/tour", () => ({
  TourButton: () => null,
  useTourControlledPopoverOpen: () => [false, vi.fn()] as const,
}))

const { usePlayerDataSyncStatusMock } = vi.hoisted(() => ({
  usePlayerDataSyncStatusMock: vi.fn(() => ({
    status: "idle",
    isSyncing: false,
    statusText: "Up to date",
    syncNow: vi.fn(),
  })),
}))

vi.mock("../providers/player-data-sync-button", () => ({
  usePlayerDataSyncStatus: () => usePlayerDataSyncStatusMock(),
}))

import { MobileShell } from "./mobile-layout"
import type { NavItem } from "./nav-items"
import { navItems } from "./nav-items"

function renderShell(onCreateGoal = vi.fn()) {
  return render(
    <MemoryRouter>
      <MobileShell
        isAuthenticated={false}
        visibleItems={navItems as NavItem[]}
        pageTitle="Home"
        onCreateGoal={onCreateGoal}
      />
    </MemoryRouter>
  )
}

describe("MobileBottomNav actions", () => {
  it("renders Create Goal and Sync with Tacticus as distinct action buttons, not nav links", () => {
    renderShell()

    const createGoal = screen.getByTestId("mobile-create-goal-button")
    const sync = screen.getByTestId("mobile-sync-button")

    // Actual <button> elements (not <a>/<Link>s like the regular nav items), and visually filled/
    // circular rather than the plain text style used by ordinary nav links.
    expect(createGoal.tagName).toBe("BUTTON")
    expect(sync.tagName).toBe("BUTTON")
    expect(createGoal.className).toContain("rounded-full")
    expect(sync.className).toContain("rounded-full")
  })

  it("triggers the global Create Goal action", () => {
    const onCreateGoal = vi.fn()
    renderShell(onCreateGoal)

    fireEvent.click(screen.getByTestId("mobile-create-goal-button"))
    expect(onCreateGoal).toHaveBeenCalledTimes(1)
  })

  it("triggers a sync on click when idle, and is not disabled", () => {
    const syncNow = vi.fn()
    usePlayerDataSyncStatusMock.mockReturnValue({
      status: "idle",
      isSyncing: false,
      statusText: "Up to date",
      syncNow,
    })
    renderShell()

    const syncButton = screen.getByTestId("mobile-sync-button")
    expect(syncButton).not.toBeDisabled()

    fireEvent.click(syncButton)

    expect(syncNow).toHaveBeenCalledTimes(1)
  })

  it("spins the icon and disables the sync button while a sync is in progress", () => {
    usePlayerDataSyncStatusMock.mockReturnValue({
      status: "syncing",
      isSyncing: true,
      statusText: "Syncing…",
      syncNow: vi.fn(),
    })
    renderShell()

    const syncButton = screen.getByTestId("mobile-sync-button")
    expect(syncButton).toBeDisabled()
    expect(syncButton.querySelector("svg")).toHaveClass(
      "motion-safe:animate-spin"
    )
  })
})
