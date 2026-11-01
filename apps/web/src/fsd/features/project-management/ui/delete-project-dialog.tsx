import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@workspace/ui/components/field"
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group"
import { Spinner } from "@workspace/ui/components/spinner"

const GOAL_ACTIONS = ["move", "delete"] as const
type GoalAction = (typeof GOAL_ACTIONS)[number]

const isGoalAction = (value: string): value is GoalAction =>
  (GOAL_ACTIONS as readonly string[]).includes(value)

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  pending: boolean
  /** `deleteGoals`: also delete the goals whose only project this is (otherwise they move to Default). */
  onConfirm: (deleteGoals: boolean) => void
  projectName: string
}

/**
 * Hard-delete confirmation for a project. The user picks what happens to the goals that are only in this
 * project: move them to the Default project (the default, non-destructive choice) or delete them too. Goals in
 * another project are always kept. Mirrors `DeleteGoalDialog`'s destructive confirm without a type-to-confirm
 * gate.
 */
export function DeleteProjectDialog({
  open,
  onOpenChange,
  pending,
  onConfirm,
  projectName,
}: Props) {
  const { t } = useTranslation()
  const [goalAction, setGoalAction] = useState<GoalAction>("move")

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return
        if (!next) setGoalAction("move")
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("goals.project.deleteTitle", { name: projectName })}
          </DialogTitle>
          <DialogDescription>
            {t("goals.project.deleteDescription")}
          </DialogDescription>
        </DialogHeader>
        <FieldSet>
          <FieldLegend variant="label">
            {t("goals.project.deleteGoalsLabel")}
          </FieldLegend>
          <RadioGroup
            aria-label={t("goals.project.deleteGoalsLabel")}
            disabled={pending}
            value={goalAction}
            onValueChange={(value) => {
              if (isGoalAction(value)) setGoalAction(value)
            }}
          >
            {GOAL_ACTIONS.map((option) => {
              const key = option === "move" ? "Move" : "Delete"
              return (
                <Field key={option} orientation="horizontal">
                  <RadioGroupItem
                    id={`delete-project-goals-${option}`}
                    value={option}
                  />
                  <FieldContent>
                    <FieldLabel htmlFor={`delete-project-goals-${option}`}>
                      {t(`goals.project.deleteGoals${key}`)}
                    </FieldLabel>
                    <FieldDescription>
                      {t(`goals.project.deleteGoals${key}Description`)}
                    </FieldDescription>
                  </FieldContent>
                </Field>
              )
            })}
          </RadioGroup>
        </FieldSet>
        <DialogFooter>
          <Button
            disabled={pending}
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("goals.project.cancel")}
          </Button>
          <Button
            disabled={pending}
            variant="destructive"
            onClick={() => onConfirm(goalAction === "delete")}
          >
            {pending ? <Spinner /> : null}
            {t("goals.project.deleteConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
