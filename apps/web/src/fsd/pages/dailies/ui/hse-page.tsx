import { useEffect } from "react"
import { useSearchParams } from "react-router"
import { useTranslation } from "react-i18next"

import {
  EventFarmSection,
  EventPreviewBanner,
  EventStatusLine,
  EventSwitcher,
  EventTopLocations,
  resolveHomeScreenEventSelection,
  selectListTarget,
  useActiveHomeScreenEvent,
  useHomeScreenEventName,
} from "@/features/daily-raids"
import {
  EventDetails,
  hseSectionsShown,
  PointsProjection,
  useHseProjection,
} from "@/features/home-screen-event-points"

import { useHseTeamRecommendations } from "@/features/team-recommendations"
import { useHseTutorial } from "./hse-page.tutorial"
import { HseTeamsSection } from "./hse-teams/hse-teams-section"

/** The HSE tab's search parameter holding the selected instance key (HSE-only, never carried over). */
const EVENT_PARAM = "event"

/**
 * Dailies > HSE: one Home Screen Event instance at a time. By default the running event (or, with
 * none running, the next one as a labelled preview); the switcher opens any other upcoming or past
 * instance, held in the `event` URL parameter so it survives a reload. Every instance with scoring
 * data gets its event details (tier, description, milestones) and, when running or upcoming and
 * personal, its points projection and event teams for Arena, Onslaught and Salvage Run. Only a
 * running or upcoming rule-bearing instance also gets the farm list and the top-10 lists, which
 * cover every active goal and honor the Raids Filters and Planning Settings chosen on Today.
 * Order: status line, details, projection, event teams, then the raid lists. Stacked on mobile
 * (farm list, overall top 10, event-campaign top 10); on desktop details and projection share a
 * row above the teams and the farm list, which sits beside a column holding both top-10 lists.
 */
export function HsePage() {
  const { t } = useTranslation("dailies")
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
  const eventName = useHomeScreenEventName()
  const points = useHseProjection(instance)
  const shown = hseSectionsShown(points)
  const teams = useHseTeamRecommendations(instance, points)

  useHseTutorial({
    hasSwitcher: state.status === "ready",
    hasDetails: shown.details,
    hasMilestones: shown.milestones,
    hasProjection: shown.projection,
    hasTeams: teams.status !== "hidden",
    hasLists: !!target,
  })

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
        </div>
        <div data-testid="hse-status">
          <EventStatusLine instance={instance} state={state} />
        </div>
      </div>
      {instance && shown.details ? (
        <div
          className={
            shown.projection
              ? "space-y-5 md:grid md:grid-cols-2 md:items-start md:gap-6 md:space-y-0"
              : undefined
          }
          data-testid="hse-event-row"
        >
          <EventDetails eventName={eventName(instance.entry)} state={points} />
          <PointsProjection hasRaidLists={!!ruleEventId} state={points} />
        </div>
      ) : null}
      <HseTeamsSection view={teams} />
      {target && !target.live ? (
        <EventPreviewBanner entry={target.entry} />
      ) : null}
      {ruleEventId ? (
        <div
          className="space-y-5 md:grid md:grid-cols-2 md:items-start md:gap-6 md:space-y-0"
          data-testid="hse-sections"
        >
          <EventFarmSection definitionId={ruleEventId} />
          <div data-testid="hse-top-lists">
            <EventTopLocations definitionId={ruleEventId} />
          </div>
        </div>
      ) : null}
    </section>
  )
}
