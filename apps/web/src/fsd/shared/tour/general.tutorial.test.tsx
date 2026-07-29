import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

import { useMobileTutorialSteps } from "./general.tutorial"

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
