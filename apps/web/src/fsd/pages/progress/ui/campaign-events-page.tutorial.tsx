import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"

type StepKey =
  "purpose" | "current" | "editor" | "summary" | "hideCompleted" | "save"

/**
 * Joyride tour for the Campaign Events progress page: its purpose, the current event and one of its
 * track editors (only when an event is active — list cards start collapsed, so their editors are not
 * visible), an event card's summary row, the hide-completed option, and the save hint standing in
 * for the unsaved-changes bar (which only renders once there are edits). Desktop and mobile share
 * the same targets; only the tracks' layout differs (columns vs stacked).
 */
export function useCampaignEventsTutorial({
  hasCurrentEvent,
  firstListEventId,
}: {
  hasCurrentEvent: boolean
  firstListEventId: string | undefined
}) {
  const { t } = useTranslation()

  const steps = useMemo(() => {
    const step = (target: string, key: StepKey): Step => ({
      target: `[data-testid="${target}"]`,
      title: t(`tour.campaignEvents.steps.${key}.title`),
      content: t(`tour.campaignEvents.steps.${key}.content`),
    })

    const shared: Step[] = [
      step("campaign-events-page", "purpose"),
      ...(hasCurrentEvent
        ? [
            step("current-event", "current"),
            step("current-event-track-Standard", "editor"),
          ]
        : []),
      ...(firstListEventId
        ? [step(`campaign-event-${firstListEventId}-trigger`, "summary")]
        : []),
      step("hide-completed-toggle", "hideCompleted"),
      step("campaign-events-save-hint", "save"),
    ]

    return { desktop: shared, mobile: shared }
  }, [t, hasCurrentEvent, firstListEventId])

  useTourPageSteps(steps)
}
