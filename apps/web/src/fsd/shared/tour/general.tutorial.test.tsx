import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

import {
  useDesktopTutorialSteps,
  useMobileTutorialSteps,
} from "./general.tutorial"

describe("useDesktopTutorialSteps", () => {
  it("is a short tour: welcome, distinct actions, and two group spotlights", () => {
    const { result } = renderHook(() => useDesktopTutorialSteps())
    const targets = result.current.map((step) => step.target)

    expect(targets).toEqual([
      "body",
      '[data-testid="desktop-header-controls"]',
      '[data-testid="desktop-create-goal-button"]',
      '[data-testid="player-data-sync-button"]',
      '[data-testid="desktop-navigation-search"]',
      '[data-testid="primary-nav"]',
      '[data-testid="desktop-sidebar-footer"]',
    ])
  })

  it("spotlights the whole nav list as one step, not each destination individually", () => {
    const { result } = renderHook(() => useDesktopTutorialSteps())
    const targets = result.current.map((step) => step.target)

    expect(targets).not.toContain('[data-testid="desktop-nav-home"]')
    expect(targets).not.toContain('[data-testid="desktop-nav-goals"]')
  })

  it("spotlights theme/language/feedback as one group, not each icon individually", () => {
    const { result } = renderHook(() => useDesktopTutorialSteps())
    const targets = result.current.map((step) => step.target)

    expect(targets).not.toContain('[data-testid="language-switcher"]')
    expect(targets).not.toContain('[data-testid="theme-switcher"]')
    expect(targets).not.toContain('[data-testid="userjot-feedback-button"]')
  })
})

describe("useMobileTutorialSteps", () => {
  it("is a short tour: welcome, the account surface, and the bottom nav bar", () => {
    const { result } = renderHook(() => useMobileTutorialSteps(vi.fn()))
    const targets = result.current.map((step) => step.target)

    expect(targets).toEqual([
      "body",
      '[data-testid="auth-account-drawer"], [data-testid="mobile-guest-settings-content"]',
      '[data-testid="primary-nav"]',
    ])
  })

  it("spotlights the bottom nav bar as one step, not each icon individually", () => {
    const { result } = renderHook(() => useMobileTutorialSteps(vi.fn()))
    const targets = result.current.map((step) => step.target)

    expect(targets).not.toContain('[data-testid="mobile-nav-home"]')
    expect(targets).not.toContain('[data-testid="mobile-create-goal-button"]')
    expect(targets).not.toContain('[data-testid="mobile-menu-trigger"]')
  })

  it("opens the account surface before its step and closes it afterwards", async () => {
    vi.useFakeTimers()
    const setMobileMenuForceOpen = vi.fn()
    const { result } = renderHook(() =>
      useMobileTutorialSteps(setMobileMenuForceOpen)
    )
    const accountDrawerStep = result.current[1]
    const opening = accountDrawerStep.before?.({} as never)

    await vi.advanceTimersByTimeAsync(300)
    await opening
    expect(setMobileMenuForceOpen).toHaveBeenCalledWith(true)

    accountDrawerStep.after?.({} as never)
    expect(setMobileMenuForceOpen).toHaveBeenLastCalledWith(false)
    vi.useRealTimers()
  })
})
