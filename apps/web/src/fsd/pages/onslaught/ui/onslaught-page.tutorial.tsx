import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"

type StepKey = "alliances" | "save"

/**
 * Joyride tour for the Onslaught progress page: the alliance cards (with how sector and tier work),
 * then a centred step on saving, since the unsaved-changes bar only renders once there are edits.
 * On desktop the three cards sit in one row and are highlighted together; on mobile they stack, so
 * the first card stands in.
 */
export function useOnslaughtTutorial() {
  const { t } = useTranslation()

  const steps = useMemo(() => {
    const step = (target: string, key: StepKey): Step => ({
      target: `[data-testid="${target}"]`,
      title: t(`tour.onslaught.steps.${key}.title`),
      content: t(`tour.onslaught.steps.${key}.content`),
    })

    const save: Step = {
      target: "body",
      placement: "center",
      title: t("tour.onslaught.steps.save.title"),
      content: t("tour.onslaught.steps.save.content"),
    }

    return {
      desktop: [step("onslaught-alliance-cards", "alliances"), save],
      mobile: [step("imperial-onslaught-card", "alliances"), save],
    }
  }, [t])

  useTourPageSteps(steps)
}
