import type { ReactNode } from "react"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

/** goals-navigation spec: desktop has an actions row (Create goal first, the bulk actions, Planning
 *  Settings at the far right) above a filters row (status, Type/Group, order hint); mobile keeps the
 *  status filter in its own row and compresses the rest to icon-only triggers in a second row. */
export function GoalsToolbar({
  projectScope,
  statusFilter,
  filters,
  createGoal,
  bulkActions,
  planningSettings,
  orderHint,
  reorderToggle,
  selectToggle,
}: {
  projectScope: ReactNode
  statusFilter: ReactNode
  filters: ReactNode
  createGoal: ReactNode
  bulkActions: (compact: boolean) => ReactNode
  planningSettings: ReactNode
  orderHint: ReactNode
  reorderToggle: ReactNode
  selectToggle: ReactNode
}) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <>
        <div className="flex items-center gap-2">
          {projectScope}
          {statusFilter}
        </div>
        <div
          className="flex items-center gap-2"
          data-testid="goals-filter-group"
        >
          {filters}
          {reorderToggle}
          {selectToggle}
          {orderHint}
          {createGoal}
          {planningSettings}
        </div>
      </>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className="flex flex-wrap items-center gap-2"
        data-testid="goals-actions-row"
      >
        {createGoal}
        {bulkActions(false)}
        <div className="ml-auto">{planningSettings}</div>
      </div>
      <div
        className="flex flex-wrap items-center gap-2"
        data-testid="goals-filters-row"
      >
        {projectScope}
        {statusFilter}
        <div
          className="flex items-center gap-2"
          data-testid="goals-filter-group"
        >
          {filters}
          {orderHint}
        </div>
      </div>
    </div>
  )
}
