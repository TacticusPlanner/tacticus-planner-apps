import { useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Check, CircleDashed, X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Label } from "@workspace/ui/components/label"
import { cn } from "@workspace/ui/lib/utils"
import { maxAbilityLevel } from "@workspace/game-domain"

import { MAX_GOALS_PER_TYPE, progressionLabel } from "@/entities/goal"
import { ProjectSelect } from "@/entities/project"
import {
  NumberStepper,
  ProgressionSelect,
  RankSelect,
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/ui"

import {
  bulkUnitKey,
  type BulkGoalUnit,
  type BulkPlannedGoal,
  type BulkUnitPlan,
} from "../../model/bulk-create/bulk-goal-plan"
import type { BulkUnitStatus } from "../../model/bulk-create/bulk-goal-submit"
import { useBulkGoalForm } from "../../model/bulk-create/use-bulk-goal-form"
import { useBulkGoalSubmit } from "../../model/bulk-create/use-bulk-goal-submit"

const STATUS_ICON = { pending: CircleDashed, done: Check, failed: X } as const

/**
 * Creates goals for every selected unit with one shared target (goal-creation-entry-points spec):
 * the targets and project, each unit's plan (goals and skips, removable), then each unit's status
 * with Retry failed. `onCreated` runs when the player closes it after every unit succeeded.
 */
export function BulkGoalDialog({
  open,
  onOpenChange,
  units,
  onRemoveUnit,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  units: readonly BulkGoalUnit[]
  onRemoveUnit: (key: string) => void
  onCreated: () => void
}) {
  const submit = useBulkGoalSubmit()
  // The plans as sent, with their project: the goals list refreshes after each run, which would
  // re-plan sent units as "already a goal".
  const [sent, setSent] = useState<{
    plans: readonly BulkUnitPlan[]
    projectId: string | undefined
  } | null>(null)
  const allDone = sent !== null && !submit.running && submit.failedCount === 0

  const close = () => {
    if (submit.running) return
    const created = allDone
    setSent(null)
    submit.reset()
    onOpenChange(false)
    if (created) onCreated()
  }

  return (
    <ResponsiveDialog
      data-testid="bulk-goal-dialog"
      desktopClassName="sm:max-w-2xl"
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      open={open}
      preventOutsideClose
    >
      {open ? (
        <BulkGoalDialogContent
          allDone={allDone}
          onClose={close}
          onCreate={(plans, projectId) => {
            setSent({ plans, projectId })
            void submit.submit(plans, projectId)
          }}
          onRemoveUnit={onRemoveUnit}
          sent={sent}
          submit={submit}
          units={units}
        />
      ) : null}
    </ResponsiveDialog>
  )
}

function BulkGoalDialogContent({
  units,
  sent,
  submit,
  allDone,
  onRemoveUnit,
  onCreate,
  onClose,
}: {
  units: readonly BulkGoalUnit[]
  sent: { plans: readonly BulkUnitPlan[]; projectId: string | undefined } | null
  submit: ReturnType<typeof useBulkGoalSubmit>
  allDone: boolean
  onRemoveUnit: (key: string) => void
  onCreate: (
    plans: readonly BulkUnitPlan[],
    projectId: string | undefined
  ) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const form = useBulkGoalForm(units)
  const plans = sent?.plans ?? form.plans
  // Counted from the rows shown: after a run the form re-plans sent units as "already a goal".
  const goalCount = plans.reduce((sum, plan) => sum + plan.specs.length, 0)
  const unitCount = plans.filter((plan) => plan.specs.length > 0).length

  return (
    <>
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>
          {t("goals.bulkCreate.title", { count: units.length })}
        </ResponsiveDialogTitle>
      </ResponsiveDialogHeader>
      <ResponsiveDialogBody className="gap-4 pb-4">
        {sent === null ? <TargetFields form={form} /> : null}
        <ul className="flex flex-col divide-y rounded-lg border">
          {plans.map((plan) => (
            <UnitRow
              key={bulkUnitKey(plan.unit)}
              onRemove={
                sent === null
                  ? () => onRemoveUnit(bulkUnitKey(plan.unit))
                  : undefined
              }
              plan={plan}
              status={submit.statuses.get(bulkUnitKey(plan.unit))}
            />
          ))}
        </ul>
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter className="flex-col items-stretch gap-2 md:flex-row md:items-center">
        <p
          aria-live="polite"
          className="text-sm text-muted-foreground md:mr-auto"
          data-testid="bulk-goal-summary"
        >
          {allDone && sent
            ? t("goals.bulkCreate.created", {
                count: sent.plans.reduce(
                  (sum, plan) => sum + plan.specs.length,
                  0
                ),
              })
            : t("goals.bulkCreate.summary", {
                count: goalCount,
                units: t("goals.bulkCreate.unitCount", {
                  count: unitCount,
                }),
              })}
        </p>
        {sent === null && form.overLimit.length > 0 ? (
          <p
            className="text-sm text-destructive"
            data-testid="bulk-goal-over-limit"
            role="alert"
          >
            {t("goals.bulkCreate.overLimit", {
              types: form.overLimit
                .map((type) => t(`goals.create.goalTypes.${type}`))
                .join(", "),
              max: MAX_GOALS_PER_TYPE,
            })}
          </p>
        ) : null}
        {sent === null ? (
          <>
            <Button onClick={onClose} variant="outline">
              {t("goals.bulkCreate.cancel")}
            </Button>
            <Button
              data-testid="bulk-goal-create"
              disabled={!form.canCreate}
              onClick={() => onCreate(form.plans, form.projectId)}
            >
              {t("goals.bulkCreate.submit", { count: form.goalCount })}
            </Button>
          </>
        ) : (
          <>
            {submit.failedCount > 0 && !submit.running ? (
              <Button
                data-testid="bulk-goal-retry"
                onClick={() =>
                  void submit.retryFailed(sent.plans, sent.projectId)
                }
                variant="outline"
              >
                {t("goals.bulkCreate.retryFailed", {
                  count: submit.failedCount,
                })}
              </Button>
            ) : null}
            <Button
              data-testid="bulk-goal-done"
              disabled={submit.running}
              onClick={onClose}
            >
              {t("goals.bulkCreate.done")}
            </Button>
          </>
        )}
      </ResponsiveDialogFooter>
    </>
  )
}

function TargetFields({ form }: { form: ReturnType<typeof useBulkGoalForm> }) {
  const { t } = useTranslation()
  return (
    <section className="grid gap-3" data-testid="bulk-goal-targets">
      {form.hasUnowned ? (
        <TargetToggle
          checked={form.unlock}
          id="bulk-goal-unlock"
          label={t("goals.bulkCreate.targets.unlock")}
          onCheckedChange={form.setUnlock}
        />
      ) : null}
      <TargetToggle
        checked={form.ascension.on}
        id="bulk-goal-ascension"
        label={t("goals.bulkCreate.targets.ascension")}
        onCheckedChange={(on) => form.setAscension({ ...form.ascension, on })}
      >
        <ProgressionSelect
          label={t("goals.bulkCreate.targets.ascensionTo")}
          onChange={(value) => form.setAscension({ on: true, value })}
          options={form.progressionOptions}
          value={form.ascension.value}
        />
      </TargetToggle>
      {form.hasCharacter ? (
        <TargetToggle
          checked={form.rank.on}
          id="bulk-goal-rank"
          label={t("goals.bulkCreate.targets.rank")}
          onCheckedChange={(on) => form.setRank({ ...form.rank, on })}
        >
          <RankSelect
            label={t("goals.bulkCreate.targets.rankTo")}
            onChange={(value) => form.setRank({ on: true, value })}
            options={form.rankOptions}
            value={form.rank.value}
          />
        </TargetToggle>
      ) : null}
      <TargetToggle
        checked={form.ability.on}
        id="bulk-goal-ability"
        label={t("goals.bulkCreate.targets.ability")}
        onCheckedChange={(on) => form.setAbility({ ...form.ability, on })}
      >
        <NumberStepper
          data-testid="bulk-goal-ability-level"
          labels={{
            value: t("goals.bulkCreate.targets.abilityTo"),
            decrease: t("goals.bulkCreate.targets.abilityDecrease"),
            increase: t("goals.bulkCreate.targets.abilityIncrease"),
          }}
          max={maxAbilityLevel}
          min={1}
          onChange={(value) =>
            form.setAbility({ on: true, value: value ?? form.ability.value })
          }
          value={form.ability.value}
        />
      </TargetToggle>
      <div className="grid gap-1.5">
        <Label className="text-xs text-muted-foreground">
          {t("goals.bulkCreate.project")}
        </Label>
        <ProjectSelect
          compact={false}
          onProjectIdChange={form.setProjectId}
          projectId={form.projectId}
          projects={form.projects}
          testId="bulk-goal-project"
        />
      </div>
    </section>
  )
}

function TargetToggle({
  id,
  label,
  checked,
  onCheckedChange,
  children,
}: {
  id: string
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  children?: ReactNode
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[12rem_1fr] sm:items-end">
      <div className="flex min-h-11 items-center gap-2 md:min-h-9">
        <Checkbox
          checked={checked}
          data-testid={`${id}-toggle`}
          id={id}
          onCheckedChange={(value) => onCheckedChange(value === true)}
        />
        <Label className="font-normal" htmlFor={id}>
          {label}
        </Label>
      </div>
      {checked ? children : null}
    </div>
  )
}

function UnitRow({
  plan,
  status,
  onRemove,
}: {
  plan: BulkUnitPlan
  status: BulkUnitStatus | undefined
  onRemove: (() => void) | undefined
}) {
  const { t } = useTranslation()
  const Icon = status ? STATUS_ICON[status.status] : null
  return (
    <li
      className={cn(
        "flex items-start gap-2 px-3 py-2 text-sm",
        status?.status === "failed" && "text-destructive"
      )}
      data-status={status?.status}
      data-testid="bulk-goal-unit"
    >
      {Icon ? (
        <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-medium">
          {plan.unit.name}
          {status ? (
            <span className="sr-only">
              {` ${t(`goals.bulkCreate.status.${status.status}`)}`}
            </span>
          ) : null}
        </span>
        {plan.goals.length > 0 ? (
          <span className="text-muted-foreground">
            {plan.goals.map((goal) => plannedGoalLabel(t, goal)).join(" · ")}
          </span>
        ) : null}
        {plan.skipped.map((skip) => (
          <span className="text-xs text-muted-foreground" key={skip.goalType}>
            {t("goals.bulkCreate.skipped", {
              type: t(`goals.create.goalTypes.${skip.goalType}`),
              reason: t(`goals.bulkCreate.skipReasons.${skip.reason}`),
            })}
          </span>
        ))}
        {plan.specs.length === 0 ? (
          <span className="text-xs text-muted-foreground">
            {t("goals.bulkCreate.nothingToCreate")}
          </span>
        ) : null}
        {status?.status === "failed" && status.error ? (
          <span className="text-xs">{status.error}</span>
        ) : null}
      </div>
      {onRemove ? (
        <Button
          aria-label={t("goals.bulkCreate.removeUnit", {
            name: plan.unit.name,
          })}
          className="size-8 shrink-0"
          data-testid="bulk-goal-remove-unit"
          onClick={onRemove}
          size="icon"
          variant="ghost"
        >
          <X aria-hidden />
        </Button>
      ) : null}
    </li>
  )
}

function plannedGoalLabel(
  t: ReturnType<typeof useTranslation>["t"],
  goal: BulkPlannedGoal
): string {
  const type = t(`goals.create.goalTypes.${goal.goalType}`)
  switch (goal.goalType) {
    case "Unlock":
      return type
    case "Ascension":
      return t(
        goal.added
          ? "goals.bulkCreate.goal.ascensionAdded"
          : "goals.bulkCreate.goal.range",
        {
          type,
          start: progressionLabel(t, goal.start),
          end: progressionLabel(t, goal.end),
        }
      )
    case "Rank":
      return t("goals.bulkCreate.goal.range", {
        type,
        start: t(`ranks.${goal.start}`, {
          ns: "progression",
          defaultValue: goal.start,
        }),
        end: t(`ranks.${goal.end}`, {
          ns: "progression",
          defaultValue: goal.end,
        }),
      })
    case "Ability":
      return t("goals.bulkCreate.goal.range", {
        type,
        start: `${goal.activeStart}/${goal.passiveStart}`,
        end: `${goal.activeEnd}/${goal.passiveEnd}`,
      })
  }
}
