import { useTranslation } from "react-i18next"

import { ProjectSelect } from "@/entities/project"
import {
  RaidGroupingSwitch,
  RaidsFiltersTrigger,
  TodayQuickFilterChips,
} from "@/features/daily-raids"
import type { useTodayQuickFilters } from "@/features/daily-raids"
import {
  PageHeaderSettings,
  PageSettingsButton,
  PageToolbar,
} from "@/shared/ui"

import type { DailiesOutletContext } from "../dailies-layout"

type QuickFilters = ReturnType<typeof useTodayQuickFilters>[0]

/**
 * Today's page toolbar (ui-style-guide rule 2). Find: the project selector and Filters (Raids
 * Filters); the quick filter chips on the row below, each chip that is on adding its note. View:
 * Group by (the only place the raid grouping is picked; every raid list follows it). Planning
 * settings is the page header's Settings button.
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
    <>
      <PageHeaderSettings>
        <PageSettingsButton
          onClick={onOpenSettings}
          testId="raids-planning-settings"
        />
      </PageHeaderSettings>
      <PageToolbar
        chips={
          <TodayQuickFilterChips
            hidden={hiddenQuickFilters}
            onChange={onQuickFiltersChange}
            value={quickFilters}
          />
        }
        find={
          <>
            <ProjectSelect
              allowAll
              onProjectIdChange={context.setProjectId}
              placeholder={t("project.placeholder")}
              projectId={context.projectId}
              projects={context.projects}
              testId="raids-project-select"
            />
            <RaidsFiltersTrigger />
          </>
        }
        testId="today-controls"
        view={<RaidGroupingSwitch />}
      />
    </>
  )
}
