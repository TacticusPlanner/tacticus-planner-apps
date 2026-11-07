import { useTranslation } from "react-i18next"

import { ProjectSelect } from "@/entities/project"
import {
  RaidsFiltersTrigger,
  TodayQuickFilterChips,
  type useTodayQuickFilters,
} from "@/features/daily-raids"

import type { DailiesOutletContext } from "./dailies-layout"

type QuickFilters = ReturnType<typeof useTodayQuickFilters>[0]

/**
 * The raid list controls of the HSE and HRE tabs: Today's quick filter chips (the same `quick` URL
 * state, so they carry with a shared link), then the Dailies-wide project selector (shared with
 * Today, so a project picked on one tab holds on the others) and the Raids Filters action (the one
 * persisted filter). The project narrows the goals the suggestions serve; the filters and the quick
 * filters narrow or reorder the locations.
 */
export function RaidsSectionControls({
  context,
  testIdPrefix,
  quickFilters,
  onQuickFiltersChange,
  hiddenQuickFilters,
}: {
  context: DailiesOutletContext
  /** `hse` or `hre`: the ids are `<prefix>-raids-controls`, `-project-select`, `-raids-filters`. */
  testIdPrefix: string
  quickFilters: QuickFilters
  onQuickFiltersChange: (next: QuickFilters) => void
  /** Chips that change nothing on this tab. */
  hiddenQuickFilters?: readonly QuickFilters[number][]
}) {
  const { t } = useTranslation("dailies")

  return (
    <div data-testid={`${testIdPrefix}-raids-controls`}>
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
              testId={`${testIdPrefix}-project-select`}
            />
            <RaidsFiltersTrigger testId={`${testIdPrefix}-raids-filters`} />
          </div>
        }
        value={quickFilters}
      />
    </div>
  )
}
