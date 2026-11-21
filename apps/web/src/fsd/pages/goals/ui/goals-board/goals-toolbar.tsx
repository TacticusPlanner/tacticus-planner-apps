import type { ReactNode } from "react"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { PageHeaderSettings, PageToolbar } from "@/shared/ui"

/** The Goals page toolbar (ui-style-guide rule 2, goals-navigation spec). Find: the project
 *  scope (the shared project select, first like on every page that scopes by project), the status
 *  and Type filters, Select goals and, on mobile, Reorder. View: Layout,
 *  Group by, Sort, Season fit and, while grouped, Collapse/Expand all; on mobile they sit in the
 *  View sheet. Actions: Create goal on desktop (mobile has the bottom nav's Add Goal, which
 *  preselects the same project scope). Planning settings is the page header's Settings button. The
 *  bulk actions live in the select bar while select mode is on. */
export function GoalsToolbar({
  projectScope,
  statusFilter,
  filters,
  seasonFit,
  createGoal,
  planningSettings,
  reorderToggle,
  selectToggle,
  layoutToggle,
  groupBy,
  sort,
  collapseToggle,
}: {
  projectScope: ReactNode
  statusFilter: ReactNode
  filters: ReactNode
  /** The Season fit select (goal-season-fit). */
  seasonFit: ReactNode
  createGoal: ReactNode
  planningSettings: ReactNode
  reorderToggle: ReactNode
  selectToggle: ReactNode
  layoutToggle: ReactNode
  groupBy: ReactNode
  sort: ReactNode
  collapseToggle?: ReactNode
}) {
  const isMobile = useIsMobile()

  return (
    <>
      <PageHeaderSettings>{planningSettings}</PageHeaderSettings>
      <PageToolbar
        actions={isMobile ? null : createGoal}
        find={
          <>
            {projectScope}
            {statusFilter}
            <div data-testid="goals-filter-group">{filters}</div>
            {isMobile ? reorderToggle : null}
            {selectToggle}
          </>
        }
        testId="goals-toolbar"
        viewTestId="goals-view-options"
        view={
          <>
            {layoutToggle}
            {groupBy}
            {sort}
            {seasonFit}
            {collapseToggle}
          </>
        }
      />
    </>
  )
}
