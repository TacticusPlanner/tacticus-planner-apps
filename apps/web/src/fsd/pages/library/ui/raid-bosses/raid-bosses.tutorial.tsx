import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { type TourPageSteps } from "@/shared/tour"

function useSharedSteps() {
  const { t } = useTranslation("library")

  return useMemo(
    () => ({
      bosses: {
        target: '[data-testid="raid-boss-list-bosses"]',
        title: t("raidBosses.tour.steps.bosses.title"),
        content: t("raidBosses.tour.steps.bosses.content"),
      } satisfies Step,
      primes: {
        target: '[data-testid="raid-boss-list-primes"]',
        title: t("raidBosses.tour.steps.primes.title"),
        content: t("raidBosses.tour.steps.primes.content"),
      } satisfies Step,
      progression: {
        target: '[data-testid="raid-boss-progression"]',
        title: t("raidBosses.tour.steps.progression.title"),
        content: t("raidBosses.tour.steps.progression.content"),
      } satisfies Step,
      encounters: {
        target: '[data-testid="raid-boss-encounters"]',
        title: t("raidBosses.tour.steps.encounters.title"),
        content: t("raidBosses.tour.steps.encounters.content"),
      } satisfies Step,
    }),
    [t]
  )
}

export function useRaidBossesTutorial(): TourPageSteps {
  const { bosses, primes, progression, encounters } = useSharedSteps()

  const desktop = useMemo<Step[]>(
    () => [
      { ...bosses, placement: "right" },
      { ...primes, placement: "right" },
      { ...progression, placement: "bottom" },
      { ...encounters, placement: "left" },
    ],
    [bosses, primes, progression, encounters]
  )

  const mobile = useMemo<Step[]>(
    () => [
      { ...bosses, placement: "bottom" },
      { ...primes, placement: "bottom" },
      { ...progression, placement: "bottom" },
      { ...encounters, placement: "top" },
    ],
    [bosses, primes, progression, encounters]
  )

  return useMemo<TourPageSteps>(() => ({ desktop, mobile }), [desktop, mobile])
}
