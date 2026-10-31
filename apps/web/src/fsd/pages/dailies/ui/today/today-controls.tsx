import { useTranslation } from "react-i18next"

import { PlanningSettingsTrigger } from "@/entities/planning-setting"
import { ProjectSelect } from "@/entities/project"
import {
  RaidsFiltersTrigger,
  TodayQuickFilterChips,
  type useTodayQuickFilters,
} from "@/features/daily-raids"

import type { DailiesOutletContext } from "../dailies-layout"

type QuickFilters = ReturnType<typeof useTodayQuickFilters>[0]

/**
 * Today's one controls row: the quick filter chips, then the project selector, Raids Filters and
 * Planning settings. It wraps chips first when narrow; a quick filter's note sits under the row.
 */
export function TodayControls({
  context,
  hiddenQuickFilters,
  onOpenSettings,
  onQuickFiltersChange,
  quickFilters,
}: {
  context: DailiesOutletContext
  hiddenQuickFilters?: readonly QuickFilters[number][]
  onOpenSettings: () => void
  onQuickFiltersChange: (next: QuickFilters) => void
  quickFilters: QuickFilters
}) {
  const { t } = useTranslation("dailies")

  return (
    <div data-testid="today-controls">
      <TodayQuickFilterChips
        hidden={hiddenQuickFilters}
        layout="inline"
        onChange={onQuickFiltersChange}
        trailing={
          <div className="flex flex-wrap items-center gap-2">
            <ProjectSelect
              allowAll
              onProjectIdChange={context.setProjectId}
              placeholder={t("project.placeholder")}
              projectId={context.projectId}
              projects={context.projects}
              testId="raids-project-select"
            />
            <RaidsFiltersTrigger />
            <PlanningSettingsTrigger
              onClick={onOpenSettings}
              testId="raids-planning-settings"
            />
          </div>
        }
        value={quickFilters}
      />
    </div>
  )
}
