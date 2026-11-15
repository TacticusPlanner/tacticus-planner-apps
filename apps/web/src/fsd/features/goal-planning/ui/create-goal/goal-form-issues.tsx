import { useState } from "react"
import { useTranslation } from "react-i18next"
import { CircleAlert } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"

import type { GoalKind } from "@/entities/goal"
import type { GoalFormIssueView } from "../../model/goal-creation-form/use-goal-validation-state"
import { issueMessageId } from "./goal-form-issue-ids"

type Issues = readonly GoalFormIssueView[]

/** The messages of `field` in `kind`'s card, rendered under that control. */
export function FieldIssues({
  issues,
  kind,
  field,
}: {
  issues: Issues
  kind: GoalKind
  field: string
}) {
  return issues
    .filter((issue) => issue.kind === kind && issue.field === field)
    .map((issue, index) => (
      <p
        className="text-sm text-destructive"
        data-testid={
          issue.code === "slotConflict"
            ? "create-goal-slot-conflict"
            : `create-goal-issue-${kind}-${field}`
        }
        id={issueMessageId(kind, field, index)}
        key={index}
      >
        {issue.message}
      </p>
    ))
}

/** The open-problem count beside the submit button; each item expands its card and focuses its field. */
export function GoalFormIssueSummary({
  issues,
  onFollow,
  portalContainer,
}: {
  issues: Issues
  onFollow: (issue: GoalFormIssueView) => void
  portalContainer: HTMLElement | null
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  if (issues.length === 0) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          className="text-destructive"
          data-testid="create-goal-issue-summary"
          type="button"
          variant="ghost"
        >
          <CircleAlert />
          {t("goals.create.issues.summary", { count: issues.length })}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="grid w-[min(22rem,calc(100vw-2rem))] gap-1 p-2"
        container={portalContainer ?? undefined}
        // Focus goes to the issue's field, not back to this trigger.
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
          {t("goals.create.issues.title")}
        </p>
        <ul className="grid gap-0.5">
          {issues.map((issue, index) => (
            <li key={index}>
              <button
                className="w-full rounded-xl px-2 py-1.5 text-left text-sm hover:bg-muted"
                data-testid="create-goal-issue-summary-item"
                onClick={() => {
                  setOpen(false)
                  onFollow(issue)
                }}
                type="button"
              >
                <span className="font-medium">
                  {t(`goals.create.goalTypes.${issue.kind}`)}
                </span>
                {": "}
                {issue.message}
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
