import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"

import type { QuickAction, QuickActionId } from "./quick-actions"

/** The "Quick actions" result group shared by desktop search and the mobile Menu drawer. Rows are
 *  buttons (not links); a disabled row stays visible and shows why instead of its description. */
export function QuickActionsGroup({
  actions,
  onSelect,
  rowClassName,
}: {
  actions: QuickAction[]
  onSelect: (id: QuickActionId) => void
  rowClassName: string
}) {
  const { t } = useTranslation()

  if (!actions.length) return null

  return (
    <section
      aria-labelledby="quick-actions-heading"
      data-testid="quick-actions"
    >
      <h3
        className="px-3 pb-1 text-xs font-medium text-muted-foreground"
        id="quick-actions-heading"
      >
        {t("nav.quickActions.heading")}
      </h3>
      <div className="space-y-1">
        {actions.map((action) => (
          <button
            className={cn(
              rowClassName,
              "w-full text-left hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
            )}
            data-testid={`quick-action-${action.id}`}
            disabled={action.disabledReason !== undefined}
            key={action.id}
            onClick={() => onSelect(action.id)}
            type="button"
          >
            <action.icon aria-hidden="true" className="size-5 shrink-0" />
            <span className="flex min-w-0 flex-col">
              <span className="truncate">{action.label}</span>
              <span className="truncate text-xs font-normal text-muted-foreground group-hover/nav-row:text-accent-foreground">
                {action.disabledReason ?? action.description}
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
