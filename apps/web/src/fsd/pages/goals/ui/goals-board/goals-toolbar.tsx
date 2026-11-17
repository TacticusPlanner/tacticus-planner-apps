import type { ReactNode } from "react"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { PageHeaderSettings, PageToolbar } from "@/shared/ui"

/** The Goals page toolbar (ui-style-guide rule 2, goals-navigation spec), under the project scope
 *  chip row. Find: the status and Type filters and the order hint, plus the reorder and select
 *  mode toggles on mobile. View: Layout, Group by, Season fit and, while grouped, Collapse/Expand
 *  all; on mobile they sit in the View sheet. Actions: Create goal on desktop (mobile has the bottom
 *  nav's Add Goal, which preselects the same project scope). Planning settings is the page
 *  header's Settings button. The bulk actions show in their own row only while goals are selected
 *  (desktop; mobile has its select bar). */
export function GoalsToolbar({
  projectScope,
  statusFilter,
  filters,
  seasonFit,
  createGoal,
  bulkActions,
  bulkActive,
  planningSettings,
  orderHint,
  reorderToggle,
  selectToggle,
  layoutToggle,
  groupBy,
  collapseToggle,
}: {
  projectScope: ReactNode
  statusFilter: ReactNode
  filters: ReactNode
  /** The Season fit select (goal-season-fit). */
  seasonFit: ReactNode
  createGoal: ReactNode
  bulkActions: (compact: boolean) => ReactNode
  /** Whether any goal is selected, so the bulk actions row is shown. */
  bulkActive: boolean
  planningSettings: ReactNode
  orderHint: ReactNode
  reorderToggle: ReactNode
  selectToggle: ReactNode
  layoutToggle: ReactNode
  groupBy: ReactNode
  collapseToggle?: ReactNode
}) {
  const isMobile = useIsMobile()

  return (
    <>
      <PageHeaderSettings>{planningSettings}</PageHeaderSettings>
      {/* The project scope chips stay the one row above the toolbar (goals-navigation): they
          scope the page rather than filter it. */}
      <div className="flex flex-col gap-3">
        {projectScope}
        <PageToolbar
          actions={isMobile ? null : createGoal}
          below={
            !isMobile && bulkActive ? (
              <div
                className="flex flex-wrap items-center gap-2"
                data-testid="goals-actions-row"
              >
                {bulkActions(false)}
              </div>
            ) : null
          }
          find={
            <>
              {statusFilter}
              <div
                className="flex items-center gap-2"
                data-testid="goals-filter-group"
              >
                {filters}
                {orderHint}
              </div>
              {isMobile ? (
                <>
                  {reorderToggle}
                  {selectToggle}
                </>
              ) : null}
            </>
          }
          testId="goals-toolbar"
          viewTestId="goals-view-options"
          view={
            <>
              {layoutToggle}
              {groupBy}
              {seasonFit}
              {collapseToggle}
            </>
          }
        />
      </div>
    </>
  )
}
