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

  return useMemo<Step[]>(() => {
    const navigationSteps: Step[] = [
      { target: "home", title: t("nav.home") },
      { target: "lookup", title: t("nav.lookup") },
      { target: "goals", title: t("nav.goals") },
      { target: "dailies", title: t("nav.dailies") },
      { target: "progress", title: t("nav.progress") },
      { target: "guild", title: t("nav.guild") },
      { target: "ui-kit", title: t("nav.uiKit") },
    ].map(({ target, title }) => ({
      target: `[data-testid="desktop-nav-${target}"]`,
      placement: "right" as const,
      title,
      content: t("tour.steps.navigation.content"),
    }))

    return [
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
      ...navigationSteps,
    ]
  }, [t])
}

/** On mobile, present the account controls as one surface rather than walking every setting.
 *  The remaining steps spotlight each persistent bottom-navigation destination/action in order. */
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
        target: '[data-testid="mobile-nav-home"]',
        placement: "top",
        title: t("tour.steps.bottomNavigation.home.title"),
        content: t("tour.steps.bottomNavigation.home.content"),
      },
      {
        target: '[data-testid="mobile-nav-goals"]',
        placement: "top",
        title: t("tour.steps.bottomNavigation.goals.title"),
        content: t("tour.steps.bottomNavigation.goals.content"),
      },
      {
        target: '[data-testid="mobile-create-goal-button"]',
        placement: "top",
        title: t("tour.steps.bottomNavigation.addGoal.title"),
        content: t("tour.steps.bottomNavigation.addGoal.content"),
      },
      {
        target: '[data-testid="mobile-sync-button"]',
        placement: "top",
        title: t("tour.steps.bottomNavigation.sync.title"),
        content: t("tour.steps.bottomNavigation.sync.content"),
      },
      {
        target: '[data-testid="mobile-nav-dailies"]',
        placement: "top",
        title: t("tour.steps.bottomNavigation.dailies.title"),
        content: t("tour.steps.bottomNavigation.dailies.content"),
      },
      {
        target: '[data-testid="mobile-menu-trigger"]',
        placement: "top",
        title: t("tour.steps.bottomNavigation.menu.title"),
        content: t("tour.steps.bottomNavigation.menu.content"),
      },
    ],
    [t, openMenu, closeMenu]
  )
}
