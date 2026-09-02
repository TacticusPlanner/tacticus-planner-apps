import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { type TourPageSteps } from "@/shared/tour"

function useSharedSteps() {
  const { t } = useTranslation()

  return useMemo(
    () => ({
      character: {
        target: '[data-testid="lookup-character-select"]',
        title: t("tour.lookup.steps.character.title"),
        content: t("tour.lookup.steps.character.content"),
      } satisfies Step,
      apply: {
        target: '[data-testid="lookup-apply-button"]',
        title: t("tour.lookup.steps.apply.title"),
        content: t("tour.lookup.steps.apply.content"),
      } satisfies Step,
      results: {
        target: '[data-testid="lookup-results"]',
        title: t("tour.lookup.steps.results.title"),
        content: t("tour.lookup.steps.results.content"),
      } satisfies Step,
      share: {
        target: '[data-testid="lookup-share-button"]',
        title: t("tour.lookup.steps.share.title"),
        content: t("tour.lookup.steps.share.content"),
      } satisfies Step,
    }),
    [t]
  )
}

export function useCharacterLookupTutorial(): TourPageSteps {
  const { character, apply, results, share } = useSharedSteps()

  const desktop = useMemo<Step[]>(
    () => [
      { ...character, placement: "right" },
      { ...apply, placement: "right" },
      { ...results, placement: "left" },
      { ...share, placement: "bottom-end" },
    ],
    [character, apply, results, share]
  )

  const mobile = useMemo<Step[]>(
    () => [
      { ...character, placement: "bottom" },
      { ...apply, placement: "top" },
      { ...results, placement: "top" },
      { ...share, placement: "bottom" },
    ],
    [character, apply, results, share]
  )

  return useMemo<TourPageSteps>(() => ({ desktop, mobile }), [desktop, mobile])
}
