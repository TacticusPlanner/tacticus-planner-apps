import type { ReactNode } from "react"
import { Inbox, SearchX } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

import { hasNode } from "../lib"

/**
 * The one empty state (ui-style-guide copy rule 4: say what is missing, offer one way forward): a
 * dashed box with an icon, a title, one sentence and the actions, centered.
 *
 * - `variant="empty"`: nothing exists yet ("No goals yet" + "Create goal").
 * - `variant="no-match"`: the search or filters match nothing; pass "Clear filters" (or "Clear
 *   search" when only the search is set) as the action.
 *
 * It is a live region (`role="status"`), so a filter change that empties the list is announced.
 */
export function EmptyState({
  variant = "empty",
  icon,
  title,
  description,
  actions,
  className,
  testId,
}: {
  variant?: "empty" | "no-match"
  /** Overrides the variant's icon (an inbox, or a crossed-out magnifier). */
  icon?: LucideIcon
  title?: ReactNode
  description?: ReactNode
  /** Usually one outline button. */
  actions?: ReactNode
  className?: string
  testId?: string
}) {
  const Icon = icon ?? (variant === "no-match" ? SearchX : Inbox)
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-dashed px-4 py-10 text-center",
        className
      )}
      data-testid={testId}
      data-variant={variant}
      role="status"
    >
      <Icon aria-hidden className="size-8 text-muted-foreground" />
      {hasNode(title) || hasNode(description) ? (
        <div className="flex max-w-prose flex-col gap-1">
          {hasNode(title) ? <p className="font-semibold">{title}</p> : null}
          {hasNode(description) ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      ) : null}
      {hasNode(actions) ? (
        <div className="flex flex-wrap justify-center gap-2">{actions}</div>
      ) : null}
    </div>
  )
}
