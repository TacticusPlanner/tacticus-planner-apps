import { useId, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

/**
 * One Group by section of the Goals list. The heading is a toggle that folds the section away, so a
 * long plan can be scanned a few groups at a time; the goal count stays visible while folded.
 */
export function GoalGroupSection({
  title,
  count,
  collapsed,
  onToggle,
  children,
}: {
  title: string
  count: number
  collapsed: boolean
  onToggle: () => void
  children: ReactNode
}) {
  const { t } = useTranslation()
  const contentId = useId()
  return (
    <section className="grid grid-cols-1 gap-2" data-testid="goal-group">
      <h2 className="text-lg font-semibold">
        <button
          aria-controls={contentId}
          aria-expanded={!collapsed}
          className="flex w-full items-center gap-2 rounded-md text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          onClick={onToggle}
          type="button"
        >
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "size-5 shrink-0 transition-transform",
              collapsed && "-rotate-90"
            )}
          />
          <span>{title}</span>{" "}
          <span className="text-sm font-normal text-muted-foreground tabular-nums">
            {t("goals.filters.groupCount", { count })}
          </span>
        </button>
      </h2>
      <div hidden={collapsed} id={contentId}>
        {collapsed ? null : children}
      </div>
    </section>
  )
}
