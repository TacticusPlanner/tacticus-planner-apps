import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { Checkbox } from "@workspace/ui/components/checkbox"

/** One goal in the membership editor: its current membership, any pending add/remove, and the reasons it
 * cannot be ticked (a client-side slot pre-check) or was named by a rejected save. */
export function MembershipGoalRow({
  goalId,
  title,
  globalPriority,
  isMember,
  checked,
  pending,
  blockedReason,
  conflictMessage,
  disabled,
  onToggle,
}: {
  goalId: string
  title: string
  /** Position in the account-wide order; null for a completed goal. */
  globalPriority: number | null
  isMember: boolean
  checked: boolean
  pending: "add" | "remove" | null
  blockedReason: string | null
  conflictMessage: string | null
  disabled: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation()
  return (
    <li
      className="grid gap-1 rounded-xl border p-2 data-[pending=true]:border-primary"
      data-pending={pending !== null}
      data-testid={`add-goals-row-${goalId}`}
    >
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={checked}
          data-testid={`add-goals-check-${goalId}`}
          disabled={disabled || blockedReason !== null}
          onCheckedChange={onToggle}
        />
        <span className="min-w-0 flex-1 truncate">
          {title}
          {globalPriority !== null ? (
            <span className="ml-1 text-xs text-muted-foreground">
              #{globalPriority}
            </span>
          ) : null}
        </span>
        {isMember ? (
          <Badge data-testid={`add-goals-member-${goalId}`} variant="secondary">
            {t("goals.project.addGoalsMember")}
          </Badge>
        ) : null}
        {pending === "add" ? (
          <Badge data-testid={`add-goals-pending-add-${goalId}`}>
            {t("goals.project.assemblyPendingAdd")}
          </Badge>
        ) : null}
        {pending === "remove" ? (
          <Badge
            data-testid={`add-goals-pending-remove-${goalId}`}
            variant="destructive"
          >
            {t("goals.project.assemblyPendingRemove")}
          </Badge>
        ) : null}
      </label>
      {blockedReason ? (
        <p
          className="text-xs text-destructive"
          data-testid={`add-goals-blocked-${goalId}`}
        >
          {blockedReason}
        </p>
      ) : null}
      {conflictMessage ? (
        <p
          className="text-xs text-destructive"
          data-testid={`add-goals-conflict-${goalId}`}
        >
          {conflictMessage}
        </p>
      ) : null}
    </li>
  )
}
