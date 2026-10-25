import { useTranslation } from "react-i18next"
import { characterIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { Badge } from "@workspace/ui/components/badge"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"

import { useGoalLabels } from "@/features/legendary-event-goals"
import { EntityIcon } from "@/shared/ui"

import type { PlanDraft } from "./use-plan-draft"

/**
 * Step 2 (spec: review the recommended upgrades): the recommendations in order with a tick each,
 * the points each adds, when it is ready and the run it helps from. The target's recommendations
 * start ticked; the line below says whether the ticked ones reach the target.
 */
export function UpgradesStep({ draft }: { draft: PlanDraft }) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium" })
  const labels = useGoalLabels()
  const { recommendations, chosenTarget, evaluation, syncedCeiling } = draft

  const header = (
    <div className="flex flex-col gap-1">
      <h2 className="text-lg font-semibold">
        {t("planWizard.upgrades.heading")}
      </h2>
      <p className="text-sm text-muted-foreground">
        {t("planWizard.upgrades.description")}
      </p>
    </div>
  )
  if (recommendations.status === "estimating") {
    return (
      <section
        className="flex flex-col gap-4"
        data-testid="plan-wizard-upgrades"
      >
        {header}
        <span className="sr-only">{t("planWizard.upgrades.estimating")}</span>
        <Skeleton className="h-40 w-full rounded-xl" />
      </section>
    )
  }
  if (recommendations.status === "unavailable") {
    return (
      <section
        className="flex flex-col gap-4"
        data-testid="plan-wizard-upgrades"
      >
        {header}
        <p className="text-sm text-muted-foreground">
          {t("planWizard.upgrades.unavailable")}
        </p>
      </section>
    )
  }

  const list = recommendations.recommendations
  const ceiling = evaluation.ceiling ?? 0
  const reachedNow =
    chosenTarget?.kind === "points" &&
    syncedCeiling !== null &&
    chosenTarget.points <= syncedCeiling
  let verdict: string | null = null
  if (reachedNow) verdict = t("planWizard.upgrades.notNeeded")
  else if (chosenTarget?.kind === "points") {
    verdict =
      ceiling >= chosenTarget.points
        ? t("planWizard.upgrades.verdictReachable", {
            points: number.format(ceiling - chosenTarget.points),
          })
        : t("planWizard.upgrades.verdictShort", {
            points: number.format(chosenTarget.points - ceiling),
          })
  }

  return (
    <section className="flex flex-col gap-4" data-testid="plan-wizard-upgrades">
      {header}
      {list.length === 0 && recommendations.status === "done" ? (
        <p className="text-sm text-muted-foreground">
          {t("planWizard.upgrades.none")}
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {list.map((recommendation, index) => {
            const checked = draft.ticked.has(index)
            const id = `plan-upgrade-${index}`
            return (
              <li
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3",
                  checked && "border-primary/60"
                )}
                data-testid="plan-wizard-upgrade"
                data-unit={recommendation.unitId}
                key={`${recommendation.unitId}:${index}`}
              >
                <Checkbox
                  checked={checked}
                  className="mt-2"
                  id={id}
                  onCheckedChange={() => draft.toggle(index)}
                />
                <EntityIcon
                  alt=""
                  className="size-9 shrink-0 rounded-full"
                  src={characterIcon(recommendation.unitId as UnitId)}
                />
                <label
                  className="flex min-w-0 flex-1 flex-col gap-0.5"
                  htmlFor={id}
                >
                  <span className="truncate font-medium">
                    {draft.inputs.nameOf(recommendation.unitId)}
                  </span>
                  <span className="text-sm">
                    {recommendation.steps
                      .map((step) => labels.step(step))
                      .join(" → ")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {[
                      t("planWizard.upgrades.ready", {
                        date: date.format(recommendation.readyMs),
                      }),
                      t("planWizard.upgrades.helps", {
                        run: recommendation.firstRun,
                      }),
                    ].join(" · ")}
                  </span>
                </label>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-sm font-medium tabular-nums">
                    {t("planWizard.upgrades.gain", {
                      points: number.format(recommendation.gain),
                    })}
                  </span>
                  {recommendation.alreadyPlanned ? (
                    <Badge variant="outline">
                      {t("planWizard.upgrades.alreadyPlanned")}
                    </Badge>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ol>
      )}
      {recommendations.status === "running" && !draft.targetSettled ? (
        <p className="text-sm text-muted-foreground" role="status">
          {t("planWizard.upgrades.running")}
        </p>
      ) : null}
      {verdict ? (
        <p
          className="text-sm font-medium"
          data-testid="plan-wizard-upgrades-verdict"
        >
          {verdict}
        </p>
      ) : null}
    </section>
  )
}
