import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { useTourPageSteps } from "@/shared/tour"

type StepKey = "mode" | "view" | "create" | "card" | "reorder"

/**
 * Joyride tour for the Teams page: the Mode select (and grouping), Create team, a team and Reorder.
 * The team step points at the first card, row or list row, whichever the layout shows, and is
 * skipped while no team is listed; the reorder step is skipped while fewer than two teams can move.
 * Desktop and mobile share the same targets.
 */
export function useTeamsTutorial({
  hasTeam,
  canReorder,
  teamTarget,
}: {
  hasTeam: boolean
  canReorder: boolean
  /** The test id of the element one team renders as in the current layout. */
  teamTarget: "team-card" | "team-row"
}) {
  const { t } = useTranslation("teams")

  const steps = useMemo(() => {
    const step = (target: string, key: StepKey): Step => ({
      target: `[data-testid="${target}"]`,
      title: t(`tour.teams.steps.${key}.title`),
      content: t(`tour.teams.steps.${key}.content`),
    })
    const shared: Step[] = [
      step("teams-mode-select", "mode"),
      // Group by and the layout: the View slot on desktop, the View button on a phone.
      step("teams-view", "view"),
      step("teams-create", "create"),
      ...(hasTeam ? [step(teamTarget, "card")] : []),
      ...(canReorder ? [step("team-card-drag", "reorder")] : []),
    ]
    return { desktop: shared, mobile: shared }
  }, [t, hasTeam, canReorder, teamTarget])

  useTourPageSteps(steps)
}
