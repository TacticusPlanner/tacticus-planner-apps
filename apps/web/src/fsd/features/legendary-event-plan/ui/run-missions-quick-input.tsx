import { useTranslation } from "react-i18next"

import {
  eventMissions,
  type LegendaryEvent,
  type LegendaryEventRun,
} from "@/entities/legendary-event"

import { missionDonePatch } from "../model/run-inputs-patches"
import { useRunInputs } from "../model/use-run-inputs"
import { MissionChecklist } from "./mission-checklist"

/**
 * The Next token card's missions in Missions order (spec: Next token card Points / Missions
 * switch): one run's Regular (and, with Show paid options on, Premium) missions with their Done
 * and Plan to complete counts, saved like the run inputs drawer. Nothing while the plan is loading
 * or failed.
 */
export function RunMissionsQuickInput({
  event,
  run,
  touch,
}: {
  event: Pick<LegendaryEvent, "id" | "regularMissions" | "premiumMissions">
  run: LegendaryEventRun
  touch: boolean
}) {
  const { t } = useTranslation("legendaryEvents")
  const inputs = useRunInputs(event.id)
  if (!inputs.enabled || inputs.loading || inputs.failed) return null
  const values = inputs.values(run)
  const regular = eventMissions(event, "regular")
  const premium = eventMissions(event, "premium")
  return (
    <section
      aria-label={t("runInputs.run", { run })}
      className="flex flex-col gap-3"
      data-run={run}
      data-testid="run-missions-quick-input"
    >
      <MissionChecklist
        completed={values.completedRegularMissions}
        count={values.regularMissions}
        defaultOpen
        field={t("runInputs.regularMissions")}
        missions={regular}
        onCountChange={(count) =>
          inputs.change(run, { regularMissions: count })
        }
        onDoneChange={(done) =>
          inputs.change(run, missionDonePatch(values, "regular", regular, done))
        }
        run={run}
        testId="quick-missions-regular"
        touch={touch}
      />
      {inputs.showPaidOptions ? (
        <MissionChecklist
          completed={values.completedPremiumMissions}
          count={values.premiumMissions}
          defaultOpen={false}
          field={t("runInputs.premiumMissions")}
          missions={premium}
          onCountChange={(count) =>
            inputs.change(run, { premiumMissions: count })
          }
          onDoneChange={(done) =>
            inputs.change(
              run,
              missionDonePatch(values, "premium", premium, done)
            )
          }
          run={run}
          testId="quick-missions-premium"
          touch={touch}
        />
      ) : null}
    </section>
  )
}
