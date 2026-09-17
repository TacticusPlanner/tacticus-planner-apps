import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

// Long enough for the Popover's open animation to settle before the tour measures/spotlights the
// now-visible theme/language/tour-button targets inside it.
const MOBILE_MENU_OPEN_DELAY_MS = 300

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

/** On mobile, present the account controls and the bottom nav bar as one spotlighted group each,
 *  rather than walking every individual icon - see useDesktopTutorialSteps' doc comment for why. */
export function useMobileTutorialSteps(
  setMobileMenuForceOpen: (open: boolean) => void
): Step[] {
  const { t } = useTranslation()

  const openMenu = useCallback((): Promise<void> => {
    setMobileMenuForceOpen(true)
    return new Promise((resolve) =>
      setTimeout(resolve, MOBILE_MENU_OPEN_DELAY_MS)
    )
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
        target:
          '[data-testid="auth-account-drawer"], [data-testid="mobile-guest-settings-content"]',
        placement: "bottom",
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
