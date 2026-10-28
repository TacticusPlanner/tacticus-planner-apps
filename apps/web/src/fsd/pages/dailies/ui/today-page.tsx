import { useState } from "react"
import { useOutletContext } from "react-router"

import {
  todayQuickFilterOptions,
  useDailyRaids,
  useTodayQuickFilters,
} from "@/features/daily-raids"
import { PlanningSettingsDialog } from "@/entities/planning-setting"
import type { DailiesOutletContext } from "./dailies-layout"
import { TodayControls } from "./today/today-controls"
import { TodayDashboard } from "./today/today-dashboard"
import { useTodayTutorial } from "./today.tutorial"

/**
 * Dailies > Raids is the Today page itself (the multi-day plan is Plan > Schedule): one controls row
 * (quick filters, the Dailies-wide project selector, Raids Filters, the shared Planning Settings
 * dialog), then the dashboard of glance tiles and cards. Raids Filters and the quick filters (URL
 * state) change Today's plan and Bonus raids only.
 */
export function TodayPage() {
  const context = useOutletContext<DailiesOutletContext>()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [quickFilters, setQuickFilters] = useTodayQuickFilters()
  const raids = useDailyRaids(context.projectId, {
    quickFilters: todayQuickFilterOptions(quickFilters),
  })
  useTodayTutorial()

  return (
    <section className="space-y-3.5" data-testid="dailies-raids-layout">
      <TodayControls
        context={context}
        onOpenSettings={() => setSettingsOpen(true)}
        onQuickFiltersChange={setQuickFilters}
        quickFilters={quickFilters}
      />
      <TodayDashboard raids={raids} />
      {settingsOpen ? (
        <PlanningSettingsDialog
          onOpenChange={setSettingsOpen}
          open={settingsOpen}
        />
      ) : null}
    </section>
  )
}
