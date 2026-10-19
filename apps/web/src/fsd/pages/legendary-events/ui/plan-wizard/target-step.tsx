import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

import { useAnalyticsActions } from "@/shared/analytics"

import type { StepVerdict } from "./plan-ceiling"
import type { PlanDraft } from "./use-plan-draft"
import type { PlanSource } from "./use-plan-source"

const VERDICT_CLASS: Record<StepVerdict["kind"], string> = {
  reachableNow: "border-transparent bg-success text-success-foreground",
  needsUpgrades: "border-transparent bg-info-bg",
  tooAmbitious: "border-destructive/40 bg-destructive/10 text-destructive",
}

/** Step 1 (spec: choose the target with a verdict per step): the deadline, then every step after
 *  the unit's progression with its points and verdict, and the highest step within reach. */
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
          {draft.options.options.map(({ target, verdict }) => {
            const checked = target.step === draft.target
            return (
              <label
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border p-3",
                  checked && "border-primary ring-1 ring-primary"
                )}
                data-step={target.step}
                data-testid="plan-wizard-target-option"
                data-verdict={verdict.kind}
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
                      verdict: verdict.kind,
                    })
                  }}
                  type="radio"
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-medium">
                    {t(`outlook.steps.${target.step}`)}
                  </span>
                  <span className="text-xs text-muted-foreground">
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
                <Badge
                  className={VERDICT_CLASS[verdict.kind]}
                  variant="outline"
                >
                  {t(`planWizard.target.verdicts.${verdict.kind}`)}
                </Badge>
              </label>
            )
          })}
        </div>
      )}
      <p className="text-sm" data-testid="plan-wizard-best-step">
        {exploring
          ? t("planWizard.target.estimating")
          : draft.options.best
            ? t("planWizard.target.bestStep", {
                step: t(`outlook.steps.${draft.options.best}`),
              })
            : t("planWizard.target.noStep")}
      </p>
    </section>
  )
}
