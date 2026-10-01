import { useState } from "react"
import { useOutletContext } from "react-router"
import { useTranslation } from "react-i18next"

import {
  EventFarmSection,
  EventPreviewBanner,
  EventStatusLine,
  EventTopLocations,
  RaidsFiltersTrigger,
  selectHomeScreenEventListTarget,
  useActiveHomeScreenEvent,
} from "@/features/daily-raids"
import {
  PlanningSettingsDialog,
  PlanningSettingsTrigger,
} from "@/entities/planning-setting"
import { ProjectSelect } from "@/entities/project"

import type { DailiesOutletContext } from "./dailies-layout"

/**
 * Dailies > HSE: where to raid to earn points for the Home Screen Event that is running now, or, with
 * none running, a labelled preview for the next one. The event comes from the game-events calendar
 * (nothing to pick). The farm list is computed over the
 * whole schedule and the energy left today (Dailies project selector and Planning Settings, as on
 * Today); it and both top-10 lists honor the persisted Raids Filters shared with Today. Stacked on
 * mobile in the order farm list, overall top 10, event-campaign top 10; on desktop the farm list sits
 * beside a column holding both top-10 lists.
 */
export function HsePage() {
  const context = useOutletContext<DailiesOutletContext>()
  const { t } = useTranslation("dailies")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const state = useActiveHomeScreenEvent()
  // The running event, else the next one as a labelled preview; only a rule-bearing event has lists.
  const target =
    state.status === "ready" ? selectHomeScreenEventListTarget(state) : null
  const ruleEventId = target?.entry.definitionId ?? null

  return (
    <section className="space-y-5" data-testid="hse-page">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <h1 className="text-lg font-semibold">{t("hse.title")}</h1>
          <EventStatusLine state={state} />
        </div>
        {ruleEventId ? (
          <div className="flex items-center gap-2">
            <ProjectSelect
              allowAll
              onProjectIdChange={context.setProjectId}
              placeholder={t("project.placeholder")}
              projectId={context.projectId}
              projects={context.projects}
              testId="hse-project-select"
            />
            <RaidsFiltersTrigger />
            <PlanningSettingsTrigger
              onClick={() => setSettingsOpen(true)}
              testId="hse-planning-settings"
            />
          </div>
        ) : null}
      </div>
      {target && !target.live ? (
        <EventPreviewBanner entry={target.entry} />
      ) : null}
      {ruleEventId ? (
        <div
          className="space-y-5 md:grid md:grid-cols-2 md:items-start md:gap-6 md:space-y-0"
          data-testid="hse-sections"
        >
          <EventFarmSection
            definitionId={ruleEventId}
            projectId={context.projectId}
          />
          <EventTopLocations definitionId={ruleEventId} />
        </div>
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
