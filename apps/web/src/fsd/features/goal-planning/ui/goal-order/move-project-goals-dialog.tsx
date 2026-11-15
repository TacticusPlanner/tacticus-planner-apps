import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldContent, FieldLabel } from "@workspace/ui/components/field"
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Spinner } from "@workspace/ui/components/spinner"

import { ProjectColorDot } from "@/entities/project"
import type { ProjectSummary } from "@/entities/project"
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/ui"

import { moveGoalsChoices } from "../../model/goal-order/move-goals-choices"
import type { MoveGoalsChoice } from "../../model/goal-order/move-goals-choices"
import { useMoveProjectGoals } from "../../model/goal-order/use-move-project-goals"

const CHOICES: readonly MoveGoalsChoice[] = ["top", "before", "after"]
const CHOICE_KEY = {
  top: "toTop",
  before: "before",
  after: "after",
} as const satisfies Record<MoveGoalsChoice, string>

const isChoice = (value: string): value is MoveGoalsChoice =>
  (CHOICES as readonly string[]).includes(value)

/**
 * Move goals… (project-goal-moves): To the top, Before a project or After a project, the last two
 * with a project select. A centered dialog at or above 768px and a bottom sheet below. The move
 * commits as one order update with an Undo toast. Mount it only while open.
 */
export function MoveProjectGoalsDialog({
  project,
  projects,
  goals,
  onOpenChange,
}: {
  project: Pick<ProjectSummary, "projectId" | "name">
  /** Every project, to offer the ones Before and After can use. */
  projects: readonly ProjectSummary[]
  /** The non-archived goals list. */
  goals: readonly {
    goalId: string
    status: string
    globalPriority: number | null
    projectIds: readonly string[]
  }[]
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const { move, pending } = useMoveProjectGoals()
  const choices = moveGoalsChoices(project.projectId, projects, goals)
  const hasReferences = choices.references.length > 0
  const [choice, setChoice] = useState<MoveGoalsChoice>(() =>
    choices.topChanges || !hasReferences ? "top" : "before"
  )
  const [referenceId, setReferenceId] = useState<string | undefined>()
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null
  )
  const placement = choices.placementFor(choice, referenceId)
  const canMove = !pending && choices.changes(placement)

  const confirm = async () => {
    if (!placement) return
    await move(choices.movedIds, placement)
    onOpenChange(false)
  }

  return (
    <ResponsiveDialog
      contentRef={setPortalContainer}
      data-testid="move-project-goals-dialog"
      desktopClassName="sm:max-w-md"
      onOpenChange={onOpenChange}
      open
    >
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>
          {t("goals.order.projectMove.dialogTitle")}
        </ResponsiveDialogTitle>
        <p className="text-sm text-muted-foreground">
          {t("goals.order.projectMove.dialogDescription", {
            name: project.name,
          })}
        </p>
      </ResponsiveDialogHeader>
      <ResponsiveDialogBody className="flex flex-col gap-4 pb-3">
        <RadioGroup
          aria-label={t("goals.order.projectMove.dialogTitle")}
          disabled={pending}
          onValueChange={(value) => {
            if (isChoice(value)) setChoice(value)
          }}
          value={choice}
        >
          {CHOICES.map((option) => {
            const disabled =
              option === "top" ? !choices.topChanges : !hasReferences
            const id = `move-goals-choice-${option}`
            return (
              <Field key={option} orientation="horizontal">
                <RadioGroupItem
                  data-testid={id}
                  disabled={disabled}
                  id={id}
                  value={option}
                />
                <FieldContent>
                  <FieldLabel htmlFor={id}>
                    {t(`goals.order.projectMove.${CHOICE_KEY[option]}`)}
                  </FieldLabel>
                  {disabled ? (
                    <p className="text-xs text-muted-foreground">
                      {option === "top"
                        ? t("goals.order.projectMove.alreadyFirst")
                        : t("goals.order.projectMove.noReference")}
                    </p>
                  ) : null}
                </FieldContent>
              </Field>
            )
          })}
        </RadioGroup>
        {hasReferences ? (
          <Field>
            <FieldLabel htmlFor="move-goals-reference">
              {t("goals.order.projectMove.projectLabel")}
            </FieldLabel>
            <Select
              disabled={choice === "top" || pending}
              onValueChange={setReferenceId}
              value={referenceId ?? ""}
            >
              <SelectTrigger
                data-testid="move-goals-reference"
                id="move-goals-reference"
              >
                <SelectValue
                  placeholder={t("goals.order.projectMove.projectPlaceholder")}
                />
              </SelectTrigger>
              <SelectContent container={portalContainer}>
                {choices.references.map((reference) => (
                  <SelectItem
                    key={reference.projectId}
                    value={reference.projectId}
                  >
                    <ProjectColorDot color={reference.color} />
                    {reference.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        ) : null}
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        <Button onClick={() => onOpenChange(false)} variant="outline">
          {t("goals.order.projectMove.cancel")}
        </Button>
        <Button
          data-testid="move-goals-confirm"
          disabled={!canMove}
          onClick={() => void confirm()}
        >
          {pending ? <Spinner /> : null}
          {t("goals.order.projectMove.confirm")}
        </Button>
      </ResponsiveDialogFooter>
    </ResponsiveDialog>
  )
}
