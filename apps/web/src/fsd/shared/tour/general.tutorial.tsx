import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

const ACCOUNT_MENU_TARGET_SELECTOR =
  '[data-testid="auth-account-drawer"], [data-testid="mobile-guest-settings-content"]'

function waitForElementSettled(
  selector: string,
  { timeoutMs }: { timeoutMs: number }
): Promise<void> {
  return new Promise((resolve) => {
    let previousElement: Element | null = null
    let previousRect: DOMRect | undefined
    let frameId: number

    const finish = () => {
      cancelAnimationFrame(frameId)
      clearTimeout(timeoutId)
      resolve()
    }
    // Keep the deadline independent of rAF, which can pause in background tabs.
    const timeoutId = setTimeout(finish, timeoutMs)
    const check = () => {
      const element = document.querySelector(selector)
      const rect = element?.getBoundingClientRect()
      const isAnimating = element
        ?.getAnimations?.()
        .some(
          (animation) => animation.pending || animation.playState === "running"
        )

      if (
        !isAnimating &&
        element === previousElement &&
        rect &&
        previousRect &&
        rect.x === previousRect.x &&
        rect.y === previousRect.y &&
        rect.width === previousRect.width &&
        rect.height === previousRect.height
      ) {
        finish()
        return
      }

      previousElement = element
      // A transition can report an unchanged rect briefly before it finishes.
      previousRect = isAnimating ? undefined : rect
      frameId = requestAnimationFrame(check)
    }

    frameId = requestAnimationFrame(check)
  })
}

/** The general layout/navigation tutorial - used for Home and as the fallback for any page (e.g.
 *  UI Kit) that doesn't register its own steps via useTourPageSteps.
 *
 *  Kept short ("quick tour" per its own welcome copy): related controls are spotlighted as one
 *  group step (e.g. every sidebar nav item, or the header's theme/language/feedback icons)
 *  instead of walking each one individually - only genuinely distinct actions worth their own
 *  callout (Create Goal, Sync, Search) get a dedicated step. */
export function useDesktopTutorialSteps(): Step[] {
  const { t } = useTranslation()

  return useMemo<Step[]>(
    () => [
      {
        target: "body",
        placement: "center",
        title: t("tour.steps.welcome.title"),
        content: t("tour.steps.welcome.content"),
      },
      {
        target: '[data-testid="desktop-header-controls"]',
        placement: "bottom-end",
        title: t("tour.steps.headerControls.title"),
        content: t("tour.steps.headerControls.content"),
      },
      {
        target: '[data-testid="desktop-create-goal-button"]',
        placement: "right",
        title: t("tour.steps.bottomNavigation.addGoal.title"),
        content: t("tour.steps.bottomNavigation.addGoal.content"),
      },
      {
        target: '[data-testid="player-data-sync-button"]',
        placement: "right",
        title: t("tour.steps.bottomNavigation.sync.title"),
        content: t("tour.steps.bottomNavigation.sync.content"),
      },
      {
        target: '[data-testid="desktop-navigation-search"]',
        placement: "right",
        title: t("nav.search"),
        content: t("nav.navigationHint"),
      },
      {
        target: '[data-testid="primary-nav"]',
        placement: "right",
        title: t("tour.steps.navigation.title"),
        content: t("tour.steps.navigation.content"),
      },
      {
        target: '[data-testid="desktop-sidebar-footer"]',
        placement: "right",
        title: t("tour.steps.sidebarFooter.title"),
        content: t("tour.steps.sidebarFooter.content"),
      },
    ],
    [t]
  )
}

/** On mobile, group related controls into a few focused steps rather than walking every
 *  individual icon - see useDesktopTutorialSteps' doc comment for why. The account menu is
 *  introduced by its own header step before the tour forces the menu open, so the drawer doesn't
 *  appear out of nowhere. The bottom bar stays a single step: its destinations and its actions
 *  are deliberately interleaved (the Add Goal/Sync pair sits centered between them), so there is
 *  no contiguous element to split them into without changing that layout. */
export function useMobileTutorialSteps(
  setMobileMenuForceOpen: (open: boolean) => void
): Step[] {
  const { t } = useTranslation()

  const openMenu = useCallback(async (): Promise<void> => {
    setMobileMenuForceOpen(true)
    await waitForElementSettled(ACCOUNT_MENU_TARGET_SELECTOR, {
      timeoutMs: 1000,
    })
  }, [setMobileMenuForceOpen])

  const closeMenu = useCallback(() => {
    setMobileMenuForceOpen(false)
  }, [setMobileMenuForceOpen])

  return useMemo<Step[]>(
    () => [
      {
        target: "body",
        placement: "center",
        title: t("tour.steps.welcome.title"),
        content: t("tour.steps.welcome.content"),
      },
      {
        target: '[data-testid="mobile-header"]',
        placement: "bottom",
        title: t("tour.steps.mobileHeader.title"),
        content: t("tour.steps.mobileHeader.content"),
      },
      {
        target: ACCOUNT_MENU_TARGET_SELECTOR,
        placement: "bottom",
        // The fixed account surface can fill most of a short viewport. Allow
        // the callout to overlap it instead of overflowing above/below it.
        skipScroll: true,
        floatingOptions: { shiftOptions: { crossAxis: true, padding: 16 } },
        styles: {
          tooltip: {
            maxHeight: "calc(100dvh - 32px)",
            overflowY: "auto",
            // The modal drawer disables body pointer events. Its portaled tour
            // callout must remain interactive on the first click/tap.
            pointerEvents: "auto",
          },
        },
        title: t("tour.steps.accountDrawer.title"),
        content: t("tour.steps.accountDrawer.content"),
        before: openMenu,
        after: closeMenu,
        disableFocusTrap: true,
      },
      {
        target: '[data-testid="primary-nav"]',
        placement: "top",
        title: t("tour.steps.bottomNavigationGroup.title"),
        content: t("tour.steps.bottomNavigationGroup.content"),
      },
    ],
    [t, openMenu, closeMenu]
  )
}
