import { useTranslation } from "react-i18next"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { RunInputsForm } from "@/features/legendary-event-run-inputs"
import {
  RunForecastSection,
  TokenPlanList,
} from "@/features/legendary-event-tokens"

import type { PlanDraft } from "./use-plan-draft"
import type { PlanSource } from "./use-plan-source"

/**
 * Step 4 (spec: review the token plan): the draft's run inputs (missions with their ticks, and the
 * paid options), then the token plan and run forecast of the draft teams on those inputs. Edits
 * stay in the draft until Create.
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
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">
            {t("planWizard.runs.heading")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("planWizard.runs.description")}
          </p>
        </div>
        <div className="flex flex-col [&>div]:px-0">
          <RunInputsForm
            event={event}
            inputs={{
              loading: false,
              failed: false,
              showPaidOptions: draft.economy.showPaidOptions,
              values: draft.runValues,
              change: draft.changeRun,
              setShowPaidOptions: draft.setShowPaidOptions,
            }}
            runs={source.inputs.resolution}
            touch={isMobile}
          />
        </div>
      </div>
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
