import { useTranslation } from "react-i18next"
import { characterIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"

import { useGoalLabels } from "@/features/legendary-event-goals"
import { EntityIcon } from "@/shared/ui"

import { upgradeGroups } from "./upgrades-step.model"
import type { PlanDraft } from "./use-plan-draft"
import { getDeviceLocale } from "@/shared/lib"

/**
 * Step 2 (spec: upgrades step groups by run with quick actions): the recommendations grouped by the
 * first run they help, each with a tick, the points it adds, the ceiling after it against the
 * target and when it is ready. Just enough, All and None set the ticks; the target's
 * recommendations start ticked and new finds are ticked until the user ticks by hand. The line
 * below says whether the ticked ones reach the target.
 */
export function UpgradesStep({ draft }: { draft: PlanDraft }) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  const date = new Intl.DateTimeFormat(getDeviceLocale(), {
    dateStyle: "medium",
  })
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
  const targetPoints =
    chosenTarget?.kind === "points" ? chosenTarget.points : null
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
        <>
          <div
            className="flex flex-wrap gap-2"
            data-testid="plan-wizard-upgrades-actions"
            role="group"
          >
            <Button onClick={draft.tickJustEnough} size="sm" variant="outline">
              {t("planWizard.upgrades.quick.justEnough")}
            </Button>
            <Button onClick={draft.tickAll} size="sm" variant="outline">
              {t("planWizard.upgrades.quick.all")}
            </Button>
            <Button onClick={draft.tickNone} size="sm" variant="outline">
              {t("planWizard.upgrades.quick.none")}
            </Button>
          </div>
          {draft.newSuggestions > 0 ? (
            <p
              className="flex flex-wrap items-center gap-x-2 text-sm"
              data-testid="plan-wizard-upgrades-new"
              role="status"
            >
              {t("planWizard.upgrades.newSuggestions", {
                count: draft.newSuggestions,
              })}
              <Button
                className="h-auto px-0"
                onClick={draft.tickNew}
                variant="link"
              >
                {t("planWizard.upgrades.tickNew")}
              </Button>
            </p>
          ) : null}
          {targetPoints !== null ? (
            <p className="text-xs text-muted-foreground">
              {t("planWizard.upgrades.ceilingNote")}
            </p>
          ) : null}
          {upgradeGroups(list).map((group) => (
            <section
              className="flex flex-col gap-2"
              data-run={group.run}
              data-testid="plan-wizard-upgrade-group"
              key={group.run}
            >
              <h3 className="text-sm font-semibold">
                {t("planWizard.upgrades.group", { run: group.run })}
              </h3>
              <ol className="flex flex-col gap-2">
                {group.indexes.map((index) => {
                  const recommendation = list[index]!
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
                          {t("planWizard.upgrades.ready", {
                            date: date.format(recommendation.readyMs),
                          })}
                        </span>
                      </label>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-sm font-medium tabular-nums">
                          {t("planWizard.upgrades.gain", {
                            points: number.format(recommendation.gain),
                          })}
                        </span>
                        <span
                          className="text-xs text-muted-foreground tabular-nums"
                          data-testid="plan-wizard-upgrade-ceiling"
                        >
                          {targetPoints === null
                            ? t("planWizard.upgrades.ceilingAfter", {
                                ceiling: number.format(
                                  recommendation.ceilingAfter
                                ),
                              })
                            : t("planWizard.upgrades.ceilingAfterTarget", {
                                ceiling: number.format(
                                  recommendation.ceilingAfter
                                ),
                                points: number.format(targetPoints),
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
            </section>
          ))}
        </>
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
