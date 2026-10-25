import { useTranslation } from "react-i18next"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import {
  RunForecastSection,
  TokenPlanList,
} from "@/features/legendary-event-tokens"

import type { LegendaryEventLaneId } from "@/entities/legendary-event"

import type { PlanDraft } from "./use-plan-draft"
import type { PlanSource } from "./use-plan-source"

// The wizard remembers its own open state, apart from the event page's sections.
const TOKEN_PLAN_OPEN_KEY = "legendaryEvents.planWizard.tokenPlan.open"
const RUN_FORECAST_OPEN_KEY = "legendaryEvents.planWizard.runForecast.open"

/**
 * Step 4 (spec: runs and tokens step shows its content): the token plan and run forecast of the
 * draft teams on the run inputs chosen on the Target step, open by default and not reported as the
 * event page's expand events. The leftover-tokens line opens the Teams step on that lane.
 */
export function RunsStep({
  draft,
  source,
  onOpenTeams,
}: {
  draft: PlanDraft
  source: Extract<PlanSource, { status: "ready" }>
  onOpenTeams: (laneId: LegendaryEventLaneId) => void
}) {
  const { t } = useTranslation("legendaryEvents")
  const isMobile = useIsMobile()
  const { event } = source
  return (
    <section className="flex flex-col gap-6" data-testid="plan-wizard-runs">
      <h2 className="text-lg font-semibold">{t("planWizard.steps.runs")}</h2>
      <TokenPlanList
        event={event}
        eventId={event.id}
        defaultOpen
        isMobile={isMobile}
        openKey={TOKEN_PLAN_OPEN_KEY}
        trackExpand={false}
        view={draft.tokenView}
      />
      <RunForecastSection
        defaultOpen
        editInputs={null}
        eventId={event.id}
        isMobile={isMobile}
        onOpenTeams={(laneId) => onOpenTeams(laneId)}
        openKey={RUN_FORECAST_OPEN_KEY}
        trackExpand={false}
        view={draft.tokenView}
      />
    </section>
  )
}
