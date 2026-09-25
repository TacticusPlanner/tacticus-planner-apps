import { renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

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
  afterEach(() => {
    document
      .querySelectorAll(
        '[data-testid="auth-account-drawer"], [data-testid="mobile-guest-settings-content"]'
      )
      .forEach((element) => element.remove())
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  function insertTarget(testId = "auth-account-drawer") {
    const element = document.createElement("div")
    element.dataset.testid = testId
    document.body.append(element)
    return vi.spyOn(element, "getBoundingClientRect")
  }

  it("is a short tour: welcome, header, the account surface, and the bottom nav bar", () => {
    const { result } = renderHook(() => useMobileTutorialSteps(vi.fn()))
    const targets = result.current.map((step) => step.target)

    expect(targets).toEqual([
      "body",
      '[data-testid="mobile-header"]',
      '[data-testid="auth-account-drawer"], [data-testid="mobile-guest-settings-content"]',
      '[data-testid="primary-nav"]',
    ])
  })

  it("introduces the header before forcing the account menu open", () => {
    const { result } = renderHook(() => useMobileTutorialSteps(vi.fn()))
    const targets = result.current.map((step) => step.target)

    const headerIndex = targets.indexOf('[data-testid="mobile-header"]')
    const drawerIndex = targets.indexOf(
      '[data-testid="auth-account-drawer"], [data-testid="mobile-guest-settings-content"]'
    )
    expect(headerIndex).toBeGreaterThan(-1)
    expect(headerIndex).toBeLessThan(drawerIndex)
  })

  it("spotlights the bottom nav bar as one step, not each icon individually", () => {
    const { result } = renderHook(() => useMobileTutorialSteps(vi.fn()))
    const targets = result.current.map((step) => step.target)

    expect(targets).not.toContain('[data-testid="mobile-nav-home"]')
    expect(targets).not.toContain('[data-testid="mobile-create-goal-button"]')
    expect(targets).not.toContain('[data-testid="mobile-menu-trigger"]')
  })

  it.each(["auth-account-drawer", "mobile-guest-settings-content"])(
    "opens the account surface before its step and closes it afterwards (%s)",
    async (testId) => {
      vi.useFakeTimers()
      insertTarget(testId).mockReturnValue(new DOMRect(0, 100, 375, 400))
      const setMobileMenuForceOpen = vi.fn()
      const { result } = renderHook(() =>
        useMobileTutorialSteps(setMobileMenuForceOpen)
      )
      const accountDrawerStep = result.current[2]
      const opening = accountDrawerStep.before?.({} as never)

      const resolved = vi.fn()
      void opening?.then(resolved)
      vi.advanceTimersToNextFrame()
      await vi.advanceTimersByTimeAsync(0)
      expect(resolved).not.toHaveBeenCalled()
      vi.advanceTimersToNextFrame()
      await opening
      expect(resolved).toHaveBeenCalledOnce()
      expect(vi.getTimerCount()).toBe(0)
      expect(setMobileMenuForceOpen).toHaveBeenCalledWith(true)

      accountDrawerStep.after?.({} as never)
      expect(setMobileMenuForceOpen).toHaveBeenLastCalledWith(false)
    }
  )

  it("waits for two consecutive matching rects after movement", async () => {
    vi.useFakeTimers()
    insertTarget()
      .mockReturnValueOnce(new DOMRect(0, 500, 375, 400))
      .mockReturnValue(new DOMRect(0, 100, 375, 400))
    const { result } = renderHook(() => useMobileTutorialSteps(vi.fn()))
    const resolved = vi.fn()
    const opening = result.current[2].before?.({} as never)
    void opening?.then(resolved)

    vi.advanceTimersToNextFrame()
    vi.advanceTimersToNextFrame()
    await vi.advanceTimersByTimeAsync(0)
    expect(resolved).not.toHaveBeenCalled()
    vi.advanceTimersToNextFrame()
    await opening
    expect(resolved).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })

  it("waits for an active animation even when its rect temporarily matches", async () => {
    vi.useFakeTimers()
    insertTarget().mockReturnValue(new DOMRect(0, 100, 375, 400))
    const element = document.querySelector(
      '[data-testid="auth-account-drawer"]'
    )!
    const animation = { pending: true, playState: "running" }
    Object.defineProperty(element, "getAnimations", {
      value: () => [animation],
    })
    const { result } = renderHook(() => useMobileTutorialSteps(vi.fn()))
    const resolved = vi.fn()
    const opening = result.current[2].before?.({} as never)
    void opening?.then(resolved)

    await vi.advanceTimersByTimeAsync(320)
    expect(resolved).not.toHaveBeenCalled()
    animation.pending = false
    animation.playState = "finished"
    vi.advanceTimersToNextFrame()
    await vi.advanceTimersByTimeAsync(0)
    expect(resolved).not.toHaveBeenCalled()
    vi.advanceTimersToNextFrame()
    await opening
    expect(resolved).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })

  it.each(["missing", "moving", "animating"])(
    "stops waiting after the safety timeout when the target is %s",
    async (state) => {
      vi.useFakeTimers()
      if (state === "moving") {
        let y = 0
        insertTarget().mockImplementation(() => new DOMRect(0, y++, 375, 400))
      }
      if (state === "animating") {
        insertTarget().mockReturnValue(new DOMRect(0, 100, 375, 400))
        const element = document.querySelector(
          '[data-testid="auth-account-drawer"]'
        )!
        Object.defineProperty(element, "getAnimations", {
          value: () => [{ pending: false, playState: "running" }],
        })
      }
      const { result } = renderHook(() => useMobileTutorialSteps(vi.fn()))
      const resolved = vi.fn()
      const opening = result.current[2].before?.({} as never)
      void opening?.then(resolved)

      await vi.advanceTimersByTimeAsync(999)
      expect(resolved).not.toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(1)
      await opening
      expect(resolved).toHaveBeenCalledOnce()
      expect(vi.getTimerCount()).toBe(0)
    }
  )
})
