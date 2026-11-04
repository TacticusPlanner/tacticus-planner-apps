import { useTranslation } from "react-i18next"

import {
  eventMissions,
  type LegendaryEvent,
  type LegendaryEventRun,
} from "@/entities/legendary-event"

import { missionTickPatch } from "../model/run-inputs-patches"
import { useRunInputs } from "../model/use-run-inputs"
import { MissionChecklist } from "./mission-checklist"

/**
 * The Next token card's mission ticks in Missions order (spec: Next token card Points / Missions
 * switch): one run's Regular (and, with Show paid options on, Premium) missions with their Done
 * ticks and Plan to complete counts, saved like the run inputs drawer. Nothing while the plan is
 * loading or failed.
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
        missions={eventMissions(event, "regular")}
        onCountChange={(count) =>
          inputs.change(run, { regularMissions: count })
        }
        onTick={(index, done) =>
          inputs.change(run, missionTickPatch(values, "regular", index, done))
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
          missions={eventMissions(event, "premium")}
          onCountChange={(count) =>
            inputs.change(run, { premiumMissions: count })
          }
          onTick={(index, done) =>
            inputs.change(run, missionTickPatch(values, "premium", index, done))
          }
          run={run}
          testId="quick-missions-premium"
          touch={touch}
        />
      ) : null}
    </section>
  )
}
