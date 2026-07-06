import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

// Long enough for the Popover's open animation to settle before the tour measures/spotlights the
// now-visible theme/language/tour-button targets inside it.
const MOBILE_MENU_OPEN_DELAY_MS = 300

/** The general layout/navigation tutorial - used for Home and as the fallback for any page (e.g.
 *  UI Kit) that doesn't register its own steps via useTourPageSteps. */
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
        target: '[data-testid="language-switcher"]',
        placement: "bottom-end",
        title: t("tour.steps.language.title"),
        content: t("tour.steps.language.content"),
      },
      {
        target: '[data-testid="theme-switcher"]',
        placement: "bottom-end",
        title: t("tour.steps.theme.title"),
        content: t("tour.steps.theme.content"),
      },
      {
        target: '[data-testid="tour-button"]',
        placement: "bottom-end",
        title: t("tour.steps.replay.title"),
        content: t("tour.steps.replay.content"),
      },
      {
        target: '[data-testid="primary-nav"]',
        placement: "right",
        title: t("tour.steps.navigation.title"),
        content: t("tour.steps.navigation.content"),
      },
    ],
    [t]
  )
}

/** On mobile the theme/language/tour-replay controls live inside a closed Popover (see
 *  AuthControl / MobileGuestSettings), so this tutorial first calls out the menu trigger, then
 *  auto-expands it (via `setMobileMenuForceOpen`, backing useTourControlledPopoverOpen) for the
 *  steps that spotlight the controls inside it, and closes it again before moving on to
 *  navigation. `setMobileMenuForceOpen` comes from TourProvider, which owns this hook's caller. */
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
          '[data-testid="auth-account-trigger"], [data-testid="mobile-guest-settings"]',
        placement: "bottom",
        title: t("tour.steps.userMenu.title"),
        content: t("tour.steps.userMenu.content"),
      },
      {
        target: '[data-testid="language-switcher"]',
        placement: "bottom",
        title: t("tour.steps.language.title"),
        content: t("tour.steps.language.content"),
        before: openMenu,
        // Joyride's focus trap moving focus while the Popover is open reads to Radix as focus
        // escaping the popover, closing it again right after `openMenu` opens it - see
        // https://react-joyride.com/docs/recipes (conditional/dynamic steps).
        disableFocusTrap: true,
      },
      {
        target: '[data-testid="theme-switcher"]',
        placement: "bottom",
        title: t("tour.steps.theme.title"),
        content: t("tour.steps.theme.content"),
        before: openMenu,
        disableFocusTrap: true,
      },
      {
        target: '[data-testid="tour-button"]',
        placement: "bottom",
        title: t("tour.steps.replay.title"),
        content: t("tour.steps.replay.content"),
        before: openMenu,
        after: closeMenu,
        disableFocusTrap: true,
      },
      {
        target: '[data-testid="primary-nav"]',
        placement: "top",
        title: t("tour.steps.navigation.title"),
        content: t("tour.steps.navigation.content"),
      },
    ],
    [t, openMenu, closeMenu]
  )
}
