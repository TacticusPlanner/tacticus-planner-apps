import { useEffect, useState } from "react"
import { useOutletContext, useSearchParams } from "react-router"
import { useTranslation } from "react-i18next"

import {
  EventFarmSection,
  EventPreviewBanner,
  EventStatusLine,
  EventSwitcher,
  EventTopLocations,
  RaidsFiltersTrigger,
  resolveHomeScreenEventSelection,
  selectListTarget,
  useActiveHomeScreenEvent,
} from "@/features/daily-raids"
import {
  PlanningSettingsDialog,
  PlanningSettingsTrigger,
} from "@/entities/planning-setting"
import { ProjectSelect } from "@/entities/project"

import type { DailiesOutletContext } from "./dailies-layout"
import { useHseTutorial } from "./hse-page.tutorial"

/** The HSE tab's search parameter holding the selected instance key (HSE-only, never carried over). */
const EVENT_PARAM = "event"

/**
 * Dailies > HSE: one Home Screen Event instance at a time. By default the running event (or, with
 * none running, the next one as a labelled preview); the switcher opens any other upcoming or past
 * instance, held in the `event` URL parameter so it survives a reload. Only a running or upcoming
 * rule-bearing instance gets the farm list, the top-10 lists and the header controls (project
 * selector, Raids Filters, Planning Settings, as on Today); the lists honor the persisted Raids
 * Filters shared with Today. Stacked on mobile in the order farm list, overall top 10,
 * event-campaign top 10; on desktop the farm list sits beside a column holding both top-10 lists.
 */
export function HsePage() {
  const context = useOutletContext<DailiesOutletContext>()
  const { t } = useTranslation("dailies")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const state = useActiveHomeScreenEvent()

  const requestedKey = searchParams.get(EVENT_PARAM)
  const selection =
    state.status === "ready"
      ? resolveHomeScreenEventSelection(state.instances, state, requestedKey)
      : null
  const instance = selection?.instance ?? null
  // A running or upcoming rule-bearing instance has lists (live, or a labelled preview).
  const target = selectListTarget(instance)
  const ruleEventId = target?.entry.definitionId ?? null
  const stale = selection?.stale ?? false

  useHseTutorial({ hasSwitcher: state.status === "ready", hasLists: !!target })

  // A key that no longer resolves falls back to the default and leaves the URL, replacing the entry
  // so Back does not loop through it.
  useEffect(() => {
    if (!stale) return
    setSearchParams(
      (previous) => {
        const params = new URLSearchParams(previous)
        params.delete(EVENT_PARAM)
        return params
      },
      { replace: true }
    )
  }, [stale, setSearchParams])

  // Picking the default instance clears the parameter, so the plain tab always means "current".
  const selectInstance = (key: string) =>
    setSearchParams((previous) => {
      const params = new URLSearchParams(previous)
      if (key === selection?.defaultInstance?.key) params.delete(EVENT_PARAM)
      else params.set(EVENT_PARAM, key)
      return params
    })

  return (
    <section className="space-y-5" data-testid="hse-page">
      <div className="space-y-3">
        <div
          className="flex flex-wrap items-center gap-3"
          data-testid="hse-title-row"
        >
          <h1 className="text-lg font-semibold">{t("hse.title")}</h1>
          {state.status === "ready" ? (
            <EventSwitcher
              className="order-last md:order-none md:ml-auto"
              instances={state.instances}
              onSelect={selectInstance}
              selectedKey={instance?.key ?? null}
            />
          ) : null}
          {ruleEventId ? (
            <div
              className="ml-auto flex items-center gap-2 md:ml-0"
              data-testid="hse-header-controls"
            >
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
        <div data-testid="hse-status">
          <EventStatusLine instance={instance} state={state} />
        </div>
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
          <div data-testid="hse-top-lists">
            <EventTopLocations definitionId={ruleEventId} />
          </div>
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
