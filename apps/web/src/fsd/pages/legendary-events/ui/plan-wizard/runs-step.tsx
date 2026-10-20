import { useTranslation } from "react-i18next"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import {
  RunForecastSection,
  TokenPlanList,
} from "@/features/legendary-event-tokens"

import type { PlanDraft } from "./use-plan-draft"
import type { PlanSource } from "./use-plan-source"

/**
 * Step 4 (spec: review the token plan): the token plan and run forecast of the draft teams on the
 * run inputs chosen on the Target step.
 */
export function RunsStep({
  draft,
  source,
}: {
  draft: PlanDraft
  source: Extract<PlanSource, { status: "ready" }>
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
        isMobile={isMobile}
        view={draft.tokenView}
      />
      <RunForecastSection
        editInputs={null}
        eventId={event.id}
        isMobile={isMobile}
        onOpenTeams={() => undefined}
        view={draft.tokenView}
      />
    </section>
  )
}
