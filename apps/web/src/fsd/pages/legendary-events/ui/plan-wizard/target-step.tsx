import { useDeferredValue, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

import { RunInputsForm } from "@/features/legendary-event-plan"
import { useAnalyticsActions } from "@/shared/analytics"

import { RosterPotentialMap } from "../legendary-event/roster-potential-map"
import type { StepVerdict } from "./plan-ceiling"
import { planPotentials } from "./plan-potential"
import type { PlanDraft } from "./use-plan-draft"
import type { PlanSource } from "./use-plan-source"

const VERDICT_CLASS: Record<StepVerdict["kind"], string> = {
  reachableNow: "border-transparent bg-success text-success-foreground",
  needsUpgrades: "border-transparent bg-info-bg",
  tooAmbitious: "border-destructive/40 bg-destructive/10 text-destructive",
}

/** Step 1 (spec: choose the target with a verdict per step): the deadline, then every step after
 *  the unit's progression with its points and verdict, the highest step within reach, the run
 *  inputs (missions and paid options change the points, so the verdicts follow them), and every
 *  lane's roster potential with the battles the target's goals add. */
export function TargetStep({
  draft,
  source,
}: {
  draft: PlanDraft
  source: Extract<PlanSource, { status: "ready" }>
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium" })
  const { captureEvent } = useAnalyticsActions()
  const { runDates } = source
  const name = source.inputs.nameOf(source.event.id)
  const shards = source.inputs.progress?.currentShards
  const exploring =
    draft.recommendations.status === "estimating" ||
    draft.recommendations.status === "running"
  // Run-input edits not yet planned, or a search in progress: verdicts are being rechecked.
  const busy = exploring || draft.settling
  const lastVerdicts = useMemo(
    () =>
      new Map(
        draft.lastSettledOptions.options.map((option) => [
          option.target.step,
          option.verdict,
        ])
      ),
    [draft.lastSettledOptions]
  )
  const isMobile = useIsMobile()
  const { inputs, runs } = draft
  // The potential maps follow the ticks at deferred priority.
  const evaluation = useDeferredValue(draft.evaluation)
  const potentials = useMemo(
    () => planPotentials(inputs, evaluation, runs),
    [inputs, evaluation, runs]
  )

  let deadline: string
  if (runDates.deadlineMs === null) {
    deadline = t("planWizard.target.deadlineUnknown")
  } else {
    deadline = t(
      runDates.deadlineEstimated
        ? "planWizard.target.deadlineEstimated"
        : "planWizard.target.deadline",
      { date: date.format(runDates.deadlineMs) }
    )
  }

  return (
    <section className="flex flex-col gap-4" data-testid="plan-wizard-target">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">
          {t("planWizard.target.heading", { name })}
        </h2>
        <p
          className="text-sm text-muted-foreground"
          data-testid="plan-wizard-deadline"
        >
          {deadline}
        </p>
        {shards !== undefined ? (
          <p className="text-sm text-muted-foreground">
            {t("planWizard.target.shards", {
              name,
              shards: number.format(shards),
            })}
          </p>
        ) : null}
      </div>
      <div
        className="flex flex-col gap-2 rounded-xl border p-3"
        data-testid="plan-wizard-run-inputs"
      >
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold">{t("planWizard.runs.heading")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("planWizard.runs.description")}
          </p>
        </div>
        <div className="flex flex-col [&>div]:px-0">
          <RunInputsForm
            event={source.event}
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
      {draft.options.options.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("planWizard.target.noTargets")}
        </p>
      ) : (
        <div
          aria-label={t("planWizard.steps.target")}
          className="flex flex-col gap-2"
          role="radiogroup"
        >
          {draft.options.options.map(({ target, verdict: current }) => {
            const checked = target.step === draft.target
            // Upgrades only raise the ceiling, so a step reachable now stays settled while the
            // search runs; anything else shows its last settled verdict, dimmed, until rechecked.
            const rechecking =
              busy && (draft.settling || current.kind !== "reachableNow")
            const verdict = rechecking
              ? (lastVerdicts.get(target.step) ?? current)
              : current
            return (
              <label
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border p-3",
                  checked && "border-primary ring-1 ring-primary"
                )}
                data-step={target.step}
                data-testid="plan-wizard-target-option"
                data-verdict={current.kind}
                key={target.step}
              >
                <input
                  checked={checked}
                  className="size-4 accent-(--primary)"
                  name="plan-target"
                  onChange={() => {
                    draft.chooseTarget(target.step)
                    captureEvent({
                      type: "legendary_event_plan_target_chosen",
                      eventId: source.event.id,
                      step: target.step,
                      verdict: current.kind,
                    })
                  }}
                  type="radio"
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-medium">
                    {t(`outlook.steps.${target.step}`)}
                  </span>
                  <span
                    className={cn(
                      "text-xs text-muted-foreground",
                      rechecking && "opacity-60"
                    )}
                    data-testid="plan-wizard-verdict-detail"
                  >
                    {target.kind === "points"
                      ? t("planWizard.target.points", {
                          points: number.format(target.points),
                        })
                      : t("planWizard.target.unreachable")}
                    {verdict.kind === "reachableNow"
                      ? ` · ${t("planWizard.target.spare", { points: number.format(verdict.spare) })}`
                      : null}
                    {verdict.kind !== "reachableNow" && verdict.short !== null
                      ? ` · ${t("planWizard.target.short", { points: number.format(verdict.short) })}`
                      : null}
                  </span>
                </span>
                {rechecking ? (
                  <Badge data-testid="plan-wizard-verdict" variant="outline">
                    {t("planWizard.target.verdicts.checking")}
                  </Badge>
                ) : (
                  <Badge
                    className={VERDICT_CLASS[verdict.kind]}
                    data-testid="plan-wizard-verdict"
                    variant="outline"
                  >
                    {t(`planWizard.target.verdicts.${verdict.kind}`)}
                  </Badge>
                )}
              </label>
            )
          })}
        </div>
      )}
      <p className="text-sm" data-testid="plan-wizard-best-step">
        {busy
          ? t("planWizard.target.estimating")
          : draft.options.best
            ? t("planWizard.target.bestStep", {
                step: t(`outlook.steps.${draft.options.best}`),
              })
            : t("planWizard.target.noStep")}
      </p>
      <div className="flex flex-col gap-3" data-testid="plan-wizard-potential">
        <h3 className="font-semibold">{t("laneOverview.potential.title")}</h3>
        <div className="grid min-w-0 gap-4 md:grid-cols-3">
          {inputs.lanes.map(({ laneId, lane }) => (
            <div className="flex min-w-0 flex-col gap-1" key={laneId}>
              <h4 className="text-sm font-medium">{t(`lanes.${laneId}`)}</h4>
              <RosterPotentialMap
                isMobile={isMobile}
                lane={lane}
                view={potentials[laneId]}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
