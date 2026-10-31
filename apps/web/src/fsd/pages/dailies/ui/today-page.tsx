import { useState } from "react"
import { useOutletContext } from "react-router"

import {
  BattleProgressDialog,
  todayQuickFilterOptions,
  useDailyRaids,
  useRaidsFilters,
  useTodayQuickFilters,
} from "@/features/daily-raids"
import type { BattleId } from "@workspace/game-domain"

import { PlanningSettingsDialog } from "@/entities/planning-setting"
import { useFeatureFlag } from "@/shared/feature-flags"
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
  const [cantRaidBattleId, setCantRaidBattleId] = useState<BattleId | null>(
    null
  )
  const [quickFilters, setQuickFilters] = useTodayQuickFilters()
  const manualBattlesEnabled = useFeatureFlag("ManualBattles")
  const raids = useDailyRaids(context.projectId, {
    quickFilters: todayQuickFilterOptions(quickFilters),
  })
  const [raidsFilters] = useRaidsFilters()
  // "Raidable only" is offered only when today's plan raids a manual battle, or while it is on,
  // and never while manual battles are off (even from a shared `?quick=raidableOnly` link).
  const hiddenQuickFilters =
    manualBattlesEnabled &&
    ((raids.status === "ready" && raids.hasManualRaids) ||
      quickFilters.includes("raidableOnly"))
      ? []
      : (["raidableOnly"] as const)
  useTodayTutorial()
  // A new project or filter set is a new Bonus raids list, so the dashboard starts over: Bonus
  // raids opens on its top 3 again instead of keeping the previous list's expansion.
  const selectionKey = JSON.stringify([
    context.projectId ?? null,
    quickFilters,
    raidsFilters,
  ])

  return (
    <section className="space-y-3.5" data-testid="dailies-raids-layout">
      <TodayControls
        context={context}
        onOpenSettings={() => setSettingsOpen(true)}
        hiddenQuickFilters={hiddenQuickFilters}
        onQuickFiltersChange={setQuickFilters}
        quickFilters={quickFilters}
      />
      <TodayDashboard
        key={selectionKey}
        onCantRaid={manualBattlesEnabled ? setCantRaidBattleId : undefined}
        raids={raids}
      />
      {cantRaidBattleId ? (
        <BattleProgressDialog
          battleId={cantRaidBattleId}
          onOpenChange={(open) => {
            if (!open) setCantRaidBattleId(null)
          }}
          open
        />
      ) : null}
      {settingsOpen ? (
        <PlanningSettingsDialog
          onOpenChange={setSettingsOpen}
          open={settingsOpen}
        />
      ) : null}
    </section>
  )
}
