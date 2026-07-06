import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

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

/** On mobile, the language/theme/replay controls live inside a closed popover (see AuthControl /
 *  MobileGuestSettings) so they aren't valid spotlight targets there - only welcome and navigation
 *  carry over from the desktop tutorial. */
export function useMobileTutorialSteps(): Step[] {
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
        target: '[data-testid="primary-nav"]',
        placement: "top",
        title: t("tour.steps.navigation.title"),
        content: t("tour.steps.navigation.content"),
      },
    ],
    [t]
  )
}
