import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"
import type { TourPageSteps } from "@/shared/tour"

type StepKey =
  | "picker"
  | "header"
  | "summary"
  | "battles"
  | "entry"
  | "detail"
  | "rewards"
  | "tokens"
  | "team"
  | "estimate"

/**
 * Joyride tour for Dailies > Quest: the quest picker (once the catalog has quests), the header, then (with battle data) the summary on a current
 * quest, the battle list and, on desktop, the selected battle's score inputs and detail, then the
 * token plan and the rewards. Mobile points
 * at the first tier disclosure instead, since the inputs and detail open in a bottom sheet. The flags
 * gate steps whose targets are not rendered, since react-joyride cannot recover from a missing one.
 */
export function useQuestTutorial({
  hasPicker = false,
  hasBattles,
  editable,
  browsing,
  hasTokens,
  hasEstimate,
}: {
  /** The quest picker renders (the catalog has quests). */
  hasPicker?: boolean
  hasBattles: boolean
  editable: boolean
  browsing: boolean
  hasTokens: boolean
  hasEstimate: boolean
}) {
  const { t } = useTranslation("dailies")

  const steps = useMemo<TourPageSteps>(() => {
    const step = (target: string, key: StepKey): Step => ({
      target: `[data-testid="${target}"]`,
      title: t(`tour.quest.steps.${key}.title`),
      content: t(`tour.quest.steps.${key}.content`),
    })
    const summary =
      hasBattles && !browsing ? [step("quest-summary", "summary")] : []
    const tokens = hasTokens ? [step("quest-tokens", "tokens")] : []
    const rewards = hasBattles ? [step("quest-rewards", "rewards")] : []
    const picker = hasPicker ? [step("quest-picker", "picker")] : []
    return {
      desktop: [
        ...picker,
        step("quest-status", "header"),
        ...summary,
        ...(hasBattles
          ? [
              step("quest-battle-list", "battles"),
              ...(editable ? [step("quest-score-entry", "entry")] : []),
              step("quest-team", "team"),
              ...(hasEstimate ? [step("quest-estimate", "estimate")] : []),
              step("quest-battle-detail", "detail"),
            ]
          : []),
        ...tokens,
        ...rewards,
      ],
      mobile: [
        ...picker,
        step("quest-status", "header"),
        ...summary,
        ...tokens,
        ...rewards,
        ...(hasBattles ? [step("quest-tier-toggle", "battles")] : []),
      ],
    }
  }, [t, hasPicker, hasBattles, editable, browsing, hasTokens, hasEstimate])

  useTourPageSteps(steps)
}
