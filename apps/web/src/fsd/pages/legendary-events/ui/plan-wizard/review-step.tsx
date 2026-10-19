import { useId, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Check, CircleDashed, X } from "lucide-react"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { cn } from "@workspace/ui/lib/utils"

import type { LegendaryEventLaneId } from "@/entities/legendary-event"
import { useGoalLabels } from "@/features/legendary-event-goals"

import type { PlanWrites } from "./plan-create"
import type { CreateItem, usePlanCreate } from "./use-plan-create"
import { NEW_PROJECT, type PlanDestinationState } from "./use-plan-destination"
import type { PlanDraft } from "./use-plan-draft"

const STATUS_ICON = { pending: CircleDashed, done: Check, failed: X } as const

/**
 * Step 5 (spec: review and create): the project the goals go to, the goals by unit, each lane's
 * team changes, the run inputs and the final verdict. After Create, every item shows pending, done
 * or failed; Retry failed resends only the failed ones.
 */
export function ReviewStep({
  draft,
  writes,
  destination,
  create,
  exploring,
  locked,
}: {
  draft: PlanDraft
  writes: PlanWrites
  /** Recommendations are still being explored: Create waits. */
  exploring: boolean
  /** Create has run: the destination is fixed. */
  locked: boolean
  destination: PlanDestinationState
  create: ReturnType<typeof usePlanCreate>
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  const labels = useGoalLabels()
  const selectId = useId()
  const nameId = useId()
  const { chosenTarget, evaluation } = draft
  const ceiling = evaluation.ceiling ?? 0
  const lastRun = draft.runs.at(-1) ?? 3
  const nameOf = draft.inputs.nameOf

  const itemLabel = (item: CreateItem) => {
    switch (item.kind) {
      case "project":
        return t("planWizard.review.items.project")
      case "goals":
        return t("planWizard.review.items.goals", {
          name: nameOf(item.subject ?? ""),
        })
      case "teams":
        return t("planWizard.review.items.teams", {
          lane: t(`lanes.${item.subject as LegendaryEventLaneId}`),
        })
      case "runs":
        return t("planWizard.review.items.runs")
    }
  }

  return (
    <section className="flex flex-col gap-5" data-testid="plan-wizard-review">
      <div className="flex flex-col gap-2">
        <Label htmlFor={selectId}>{t("planWizard.review.project")}</Label>
        <select
          className="h-10 rounded-md border bg-background px-3 text-sm"
          data-testid="plan-wizard-destination"
          disabled={destination.loading || locked}
          id={selectId}
          onChange={(event) => destination.select(event.target.value)}
          value={destination.selected}
        >
          {destination.linked.map((project) => (
            <option key={project.projectId} value={project.projectId}>
              {project.name}
            </option>
          ))}
          <option value={NEW_PROJECT}>
            {t("planWizard.review.newProject")}
          </option>
        </select>
        {destination.selected === NEW_PROJECT ? (
          <>
            <Label className="sr-only" htmlFor={nameId}>
              {t("planWizard.review.newProjectNameLabel")}
            </Label>
            <Input
              data-testid="plan-wizard-project-name"
              disabled={locked}
              id={nameId}
              onChange={(event) => destination.rename(event.target.value)}
              value={destination.newName}
            />
          </>
        ) : null}
      </div>

      <Group title={t("planWizard.review.goals")}>
        {writes.goals.length === 0 ? (
          <Empty text={t("planWizard.review.noGoals")} />
        ) : (
          writes.goals.map((chain) => (
            <li data-testid="plan-wizard-review-goal" key={chain.unitId}>
              <span className="font-medium">{nameOf(chain.unitId)}</span>
              {": "}
              {chain.steps.map((step) => labels.step(step)).join(" → ")}
            </li>
          ))
        )}
      </Group>

      <Group title={t("planWizard.review.teams")}>
        {writes.lanes.length === 0 ? (
          <Empty text={t("planWizard.review.noTeams")} />
        ) : (
          writes.lanes.flatMap((lane) => {
            const name = t(`lanes.${lane.laneId}`)
            return [
              lane.remove.length > 0 ? (
                <li key={`${lane.laneId}:remove`}>
                  {t("planWizard.review.removeTeams", {
                    lane: name,
                    count: lane.remove.length,
                  })}
                </li>
              ) : null,
              lane.create.length > 0 ? (
                <li key={`${lane.laneId}:create`}>
                  {t("planWizard.review.createTeams", {
                    lane: name,
                    count: lane.create.length,
                  })}
                </li>
              ) : null,
            ]
          })
        )}
      </Group>

      <Group title={t("planWizard.review.runs")}>
        <Empty
          text={
            writes.runs.length > 0 || writes.showPaidOptions !== null
              ? t("planWizard.review.runsChanged")
              : t("planWizard.review.noRuns")
          }
        />
      </Group>

      {chosenTarget?.kind === "points" ? (
        <p className="font-medium" data-testid="plan-wizard-final-verdict">
          {ceiling >= chosenTarget.points
            ? t("planWizard.review.final", {
                run: lastRun,
                step: t(`outlook.steps.${chosenTarget.step}`),
                points: number.format(ceiling - chosenTarget.points),
              })
            : t("planWizard.review.finalShort", {
                run: lastRun,
                step: t(`outlook.steps.${chosenTarget.step}`),
                points: number.format(chosenTarget.points - ceiling),
              })}
        </p>
      ) : null}

      {exploring ? (
        <p
          className="text-sm text-muted-foreground"
          data-testid="plan-wizard-review-exploring"
          role="status"
        >
          {t("planWizard.upgrades.running")}
        </p>
      ) : null}

      {create.items.length > 0 ? (
        <ul
          className="flex flex-col gap-1.5"
          data-testid="plan-wizard-create-items"
        >
          {create.items.map((item) => {
            const Icon = STATUS_ICON[item.status]
            return (
              <li
                className={cn(
                  "flex items-start gap-2 text-sm",
                  item.status === "failed" && "text-destructive"
                )}
                data-status={item.status}
                data-testid="plan-wizard-create-item"
                key={item.key}
              >
                <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <span className="flex flex-col">
                  <span>
                    {itemLabel(item)}
                    <span className="sr-only">
                      {` ${t(`planWizard.review.status.${item.status}`)}`}
                    </span>
                  </span>
                  {item.error ? (
                    <span className="text-xs">{item.error}</span>
                  ) : null}
                </span>
              </li>
            )
          })}
        </ul>
      ) : null}
    </section>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="flex flex-col gap-1 text-sm">{children}</ul>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <li className="text-muted-foreground">{text}</li>
}
