import type { GoalKind } from "@/entities/goal"
import type { GoalFormIssueView } from "../../model/goal-creation-form/use-goal-validation-state"

type Issues = readonly GoalFormIssueView[]

/** The DOM id of the control a creation-form issue sits under. */
export const goalFieldId = (kind: GoalKind, field: string) =>
  `create-goal-field-${kind}-${field}`

export const goalCardHeaderId = (kind: GoalKind) =>
  `create-goal-card-header-${kind}`

export const issueMessageId = (kind: GoalKind, field: string, index: number) =>
  `${goalFieldId(kind, field)}-issue-${index}`

const issuesFor = (issues: Issues, kind: GoalKind, field: string) =>
  issues.filter((issue) => issue.kind === kind && issue.field === field)

/** `id`, `aria-invalid` and `aria-describedby` for the control `field` of `kind`'s card. */
export function fieldIssueProps(issues: Issues, kind: GoalKind, field: string) {
  const mine = issuesFor(issues, kind, field)
  return {
    id: goalFieldId(kind, field),
    "aria-invalid": mine.length > 0 ? true : undefined,
    "aria-describedby":
      mine.length > 0
        ? mine.map((_, index) => issueMessageId(kind, field, index)).join(" ")
        : undefined,
  }
}

/** Moves to an issue's control: the card is expanded first by the caller, then this scrolls and
 *  focuses the control once it is rendered (falling back to the card's header). */
export function focusGoalField(kind: GoalKind, field: string) {
  setTimeout(() => {
    const target =
      document.getElementById(goalFieldId(kind, field)) ??
      document.getElementById(goalCardHeaderId(kind))
    target?.scrollIntoView?.({ block: "center" })
    // A target ladder is a radio group: focus its one tab stop.
    const focusable =
      target?.getAttribute("role") === "radiogroup"
        ? target.querySelector<HTMLElement>('[tabindex="0"]')
        : target
    focusable?.focus()
  }, 0)
}
