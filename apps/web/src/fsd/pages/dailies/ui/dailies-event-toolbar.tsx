import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { ProjectSelect } from "@/entities/project"
import {
  RaidsFiltersTrigger,
  TodayQuickFilterChips,
} from "@/features/daily-raids"
import type { useTodayQuickFilters } from "@/features/daily-raids"
import { PageToolbar } from "@/shared/ui"

import type { DailiesOutletContext } from "./dailies-layout"

type QuickFilters = ReturnType<typeof useTodayQuickFilters>[0]

/** The raid list's own controls, shown only while the page has a raid list. */
export type DailiesEventRaidControls = {
  quickFilters: QuickFilters
  onQuickFiltersChange: (next: QuickFilters) => void
  /** Chips that change nothing on this page. */
  hiddenQuickFilters?: readonly QuickFilters[number][]
  /** Chips of this page's own, after Today's quick filters (HSE's "Ignore goals"). */
  extraChips?: ReactNode
}

/**
 * The page toolbar of the HSE and HRE pages (ui-style-guide rule 2). Find: the event picker, then,
 * while the event has a raid list, the Dailies-wide project selector (shared with Raids, so a
 * project picked on one page holds on the others) and Filters; Today's quick filter chips on the
 * row below. View: the page's view controls (HSE's Sort), behind one "View" button on mobile.
 */
export function DailiesEventToolbar({
  context,
  testIdPrefix,
  picker,
  raids,
  view,
}: {
  context: DailiesOutletContext
  /** `hse` or `hre`: the ids are `<prefix>-toolbar`, `-project-select`, `-raids-filters`. */
  testIdPrefix: string
  picker: ReactNode
  raids: DailiesEventRaidControls | null
  view?: ReactNode
}) {
  const { t } = useTranslation("dailies")

  return (
    <PageToolbar
      chips={
        raids ? (
          <TodayQuickFilterChips
            extra={raids.extraChips}
            hidden={raids.hiddenQuickFilters}
            onChange={raids.onQuickFiltersChange}
            value={raids.quickFilters}
          />
        ) : undefined
      }
      find={
        <>
          {picker}
          {raids ? (
            <>
              {/* Labelled on mobile too: no icon-only toolbar control (ui-style-guide). */}
              <ProjectSelect
                allowAll
                compact={false}
                onProjectIdChange={context.setProjectId}
                placeholder={t("project.placeholder")}
                projectId={context.projectId}
                projects={context.projects}
                testId={`${testIdPrefix}-project-select`}
              />
              <RaidsFiltersTrigger testId={`${testIdPrefix}-raids-filters`} />
            </>
          ) : null}
        </>
      }
      testId={`${testIdPrefix}-toolbar`}
      view={view}
      viewTestId={`${testIdPrefix}-toolbar-view`}
    />
  )
}
