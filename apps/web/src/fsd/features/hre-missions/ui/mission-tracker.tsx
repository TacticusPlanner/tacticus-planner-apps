import { PartyPopper } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Card, CardContent } from "@workspace/ui/components/card"

import type { HreObjective } from "../model/hre-missions"
import { HRE_ALL_DONE, type HreProgress } from "../model/hre-progress"
import type { HreProgressActions } from "../model/use-hre-progress"
import { CurrentMissionCard } from "./current-mission-card"
import { MissionList } from "./mission-list"

/** The current mission card on a running event, or "All missions complete" once the Bonus is done. */
export function MissionTracker({
  state,
  actions,
  objectiveText,
}: {
  state: HreProgress
  actions: HreProgressActions
  objectiveText: (objective: HreObjective) => string
}) {
  const { t } = useTranslation("hre")
  if (state.mission >= HRE_ALL_DONE) {
    return (
      <Card data-testid="hre-all-done">
        <CardContent className="flex items-center gap-3 py-6">
          <PartyPopper aria-hidden="true" className="size-6 text-primary" />
          <p className="font-medium">{t("tracker.allDone")}</p>
        </CardContent>
      </Card>
    )
  }
  return (
    <CurrentMissionCard
      actions={actions}
      objectiveText={objectiveText}
      state={state}
    />
  )
}

/**
 * Every mission with done and locked marks; `current` null lists them read-only for a preview.
 * `collapsed` folds the list behind "All missions" (mobile).
 */
export function AllMissions({
  current,
  collapsed,
  objectiveText,
}: {
  current: number | null
  collapsed: boolean
  objectiveText: (objective: HreObjective) => string
}) {
  const { t } = useTranslation("hre")
  const list = <MissionList current={current} objectiveText={objectiveText} />
  return collapsed ? (
    <details data-testid="hre-all-missions">
      <summary
        className="cursor-pointer text-sm font-semibold"
        data-testid="hre-all-missions-toggle"
      >
        {t("tracker.allMissions")}
      </summary>
      <div className="mt-3">{list}</div>
    </details>
  ) : (
    <section className="space-y-2" data-testid="hre-all-missions">
      <h2 className="text-sm font-semibold">{t("tracker.allMissions")}</h2>
      {list}
    </section>
  )
}
