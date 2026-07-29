import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("@/shared/config", () => ({ isUiKitEnabled: true }))

import {
  useDesktopTutorialSteps,
  useMobileTutorialSteps,
} from "./general.tutorial"

describe("useDesktopTutorialSteps", () => {
  it("visits desktop actions and each top-level navigation destination", () => {
    const { result } = renderHook(() => useDesktopTutorialSteps())
    const targets = result.current.map((step) => step.target)

    expect(targets).toContain('[data-testid="desktop-create-goal-button"]')
    expect(targets).toContain('[data-testid="player-data-sync-button"]')
    expect(targets).toContain('[data-testid="desktop-navigation-search"]')
    expect(targets.slice(-7)).toEqual([
      '[data-testid="desktop-nav-home"]',
      '[data-testid="desktop-nav-lookup"]',
      '[data-testid="desktop-nav-goals"]',
      '[data-testid="desktop-nav-dailies"]',
      '[data-testid="desktop-nav-progress"]',
      '[data-testid="desktop-nav-guild"]',
      '[data-testid="desktop-nav-ui-kit"]',
    ])
  })
})

describe("useMobileTutorialSteps", () => {
  it("highlights the account drawer once and every bottom navigation item", () => {
    const { result } = renderHook(() => useMobileTutorialSteps(vi.fn()))
    const targets = result.current.map((step) => step.target)

    expect(targets).toContain(
      '[data-testid="auth-account-drawer"], [data-testid="mobile-guest-settings-content"]'
    )
    expect(targets).not.toContain('[data-testid="language-switcher"]')
    expect(targets).not.toContain('[data-testid="theme-switcher"]')
    expect(targets).not.toContain('[data-testid="tour-button"]')
    expect(targets.slice(-6)).toEqual([
      '[data-testid="mobile-nav-home"]',
      '[data-testid="mobile-nav-goals"]',
      '[data-testid="mobile-create-goal-button"]',
      '[data-testid="mobile-sync-button"]',
      '[data-testid="mobile-nav-dailies"]',
      '[data-testid="mobile-menu-trigger"]',
    ])
  })

  it("opens the account surface before its step and closes it afterwards", async () => {
    vi.useFakeTimers()
    const setMobileMenuForceOpen = vi.fn()
    const { result } = renderHook(() =>
      useMobileTutorialSteps(setMobileMenuForceOpen)
    )
    const accountDrawerStep = result.current[2]
    const opening = accountDrawerStep.before?.({} as never)

    await vi.advanceTimersByTimeAsync(300)
    await opening
    expect(setMobileMenuForceOpen).toHaveBeenCalledWith(true)

    accountDrawerStep.after?.({} as never)
    expect(setMobileMenuForceOpen).toHaveBeenLastCalledWith(false)
    vi.useRealTimers()
  })
})
