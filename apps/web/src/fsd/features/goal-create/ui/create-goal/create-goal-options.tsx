import { useTranslation } from "react-i18next"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { cn } from "@workspace/ui/lib/utils"

import type { useCreateGoalForm } from "../../model/goal-creation-form/use-create-goal-form"
import { GoalEditPriorityField } from "../goal-edit/goal-edit-priority-field"

/**
 * "Create paused", "Create another goal" and where the new goals go in the priority order. In the
 * footer's left side at 768px and wider; in the body, directly above the review, below it.
 */
export function CreateGoalOptions({
  form,
  placement,
  portalContainer,
}: {
  form: ReturnType<typeof useCreateGoalForm>
  placement: "footer" | "body"
  portalContainer: HTMLElement | null
}) {
  const { t } = useTranslation()
  const footer = placement === "footer"

  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        footer && "md:mr-auto md:flex-row md:items-center md:gap-5"
      )}
      data-placement={placement}
      data-testid="create-goal-footer-options"
    >
      <Field
        className="min-h-11 md:min-h-0 md:w-auto"
        data-testid="create-goal-start-paused"
        orientation="horizontal"
      >
        <Checkbox
          checked={form.startPaused}
          data-testid="create-goal-start-paused-checkbox"
          id="create-goal-start-paused-checkbox"
          onCheckedChange={(checked) => form.setStartPaused(checked === true)}
        />
        <FieldLabel
          className="font-normal text-muted-foreground"
          htmlFor="create-goal-start-paused-checkbox"
          title={t("goals.create.startPausedHint")}
        >
          {t("goals.create.startPaused")}
        </FieldLabel>
      </Field>
      <Field className="min-h-11 md:min-h-0 md:w-auto" orientation="horizontal">
        <Checkbox
          checked={form.createAnother}
          id="create-goal-another"
          onCheckedChange={(checked) => form.setCreateAnother(checked === true)}
        />
        <FieldLabel
          className="font-normal text-muted-foreground"
          htmlFor="create-goal-another"
        >
          {t("goals.create.createAnother")}
        </FieldLabel>
      </Field>
      {form.entityId ? (
        <GoalEditPriorityField
          compact={footer}
          hint={t("goals.create.priorityHint")}
          lastLabel
          onChange={form.setPriorityPosition}
          portalContainer={portalContainer}
          position={form.priorityPosition}
          testIdPrefix="create-goal"
          total={form.priorityTotal}
        />
      ) : null}
    </div>
  )
}
