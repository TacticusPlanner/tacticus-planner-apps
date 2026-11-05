import { useEffect, useMemo, useRef } from "react"
import { useOutletContext, useSearchParams } from "react-router"
import { useTranslation } from "react-i18next"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import {
  HreRaidsSection,
  todayQuickFilterOptions,
  useTodayQuickFilters,
} from "@/features/daily-raids"
import {
  AllMissions,
  arenaSurplus,
  campaignObjectiveState,
  DEFAULT_HRE_PROGRESS,
  HreEventHeader,
  HreEventSwitcher,
  hreObjectiveIcon,
  hreDaysLeft,
  hrePaceFor,
  MissionTracker,
  missionName,
  nextCampaignMission,
  PaceCard,
  PaceSummary,
  remainingCampaignBattles,
  selectCampaignPlan,
  selectTeamPlans,
  tokenNeedRows,
  TokensNeededCard,
  useHreInstance,
  useHreProgress,
  useHreTokens,
  useObjectiveText,
  type HreMission,
} from "@/features/hre-missions"

import { useHreTeamRecommendations } from "@/features/team-recommendations"
import { useRunningHse } from "../model/use-running-hse"
import type { DailiesOutletContext } from "./dailies-layout"
import { HreCampaignTeams } from "./hre/hre-campaign-teams"
import { HreTeamCard } from "./hre/hre-team-card"
import { useHreTutorial } from "./hre-page.tutorial"
import { RaidsSectionControls } from "./raids-section-controls"

const NO_MISSIONS: readonly HreMission[] = []
/** The raids count battles, so "Fewer raids" changes nothing here. */
const HRE_HIDDEN_QUICK_FILTERS = ["fewerRaids"] as const
/** The HRE tab's search parameter holding the selected instance key (HRE-only, never carried over). */
const EVENT_PARAM = "event"

/**
 * Dailies > HRE: one Hero Release Event at a time. By default the running one (or the next one as a
 * read-only preview); the switcher opens any other upcoming or past event, held in the `event` URL
 * parameter so it survives a reload. A past event shows its header and mission list only. On a
 * running event: the current mission with its progress inputs and tips, the campaign battles to
 * fight by hand for its manual objectives and the raids for its campaign objective, the mission's
 * teams (one per campaign of the battles to fight by hand, and one per token mode it plays; each led by a running HSE's scoring
 * units), the tokens the remaining missions need and the event pace. Every event lists all missions and the remaining-campaign
 * summary. The raids follow the Dailies project and the Raids Filters, picked in the raids section.
 * Desktop: missions on the left, the rest on the right. Mobile: one column with the mission list
 * last, collapsed behind "All missions".
 */
export function HrePage() {
  const { t } = useTranslation([
    "hre",
    "common",
    "characters",
    "dailies",
    "factions",
  ])
  const isMobile = useIsMobile()
  const context = useOutletContext<DailiesOutletContext>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [quickFilters, setQuickFilters] = useTodayQuickFilters()
  const state = useHreInstance(searchParams.get(EVENT_PARAM))
  const ready = state.status === "ready" ? state : null
  const stale = ready?.stale ?? false
  const defaultKey = ready?.defaultKey ?? null
  const instance = ready?.instance ?? null
  const hero = ready?.hero ?? null
  const rules = ready?.rules ?? null
  const missions = rules?.missions ?? NO_MISSIONS
  // Without the served rules the event shows only its header and a notice.
  const event = rules ? instance : null
  const running = event?.status === "running"
  const past = event?.status === "past"
  const [progress, actions] = useHreProgress(
    running ? event.key : null,
    missions
  )
  const shown = running ? progress : DEFAULT_HRE_PROGRESS
  const objectiveText = useObjectiveText(
    hero,
    instance?.featuredCharacterId ?? null
  )
  const objectiveIcon = (objective: Parameters<typeof hreObjectiveIcon>[0]) =>
    hreObjectiveIcon(objective, hero?.alliance ?? null)
  const tokens = useHreTokens()
  const paceRef = useRef<HTMLDivElement>(null)

  const heroName = hero
    ? t(`characters:${hero.id}`, { defaultValue: hero.name })
    : (instance?.featuredCharacterId ?? "")
  const allianceName = hero
    ? (t(`common:alliances.${hero.alliance}` as never, {
        defaultValue: hero.alliance,
      }) as string)
    : null
  const surplus = running
    ? arenaSurplus(progress, missions, tokens?.arena ?? null)
    : 0
  // Only the mission and its objective progress shape the raids request: typing points, rank or a
  // target keeps the request (and the raids engine below) as it was.
  const mission = progress.mission
  const [firstProgress, secondProgress] = progress.progress
  const campaignPlan = useMemo(
    () =>
      running
        ? selectCampaignPlan(
            {
              ...DEFAULT_HRE_PROGRESS,
              mission,
              progress: [firstProgress, secondProgress],
            },
            missions,
            surplus
          )
        : null,
    [running, mission, firstProgress, secondProgress, missions, surplus]
  )
  const allTeamPlans = running
    ? selectTeamPlans(progress, missions, surplus)
    : []
  // The campaign team plays the battles to fight by hand: it is built per campaign under that list.
  const battlePlan = allTeamPlans.find((plan) => plan.mode === "battle") ?? null
  const teamPlans = allTeamPlans.filter((plan) => plan.mode !== "battle")
  const hse = useRunningHse()
  const teams = useHreTeamRecommendations({
    plans: teamPlans,
    alliance: hero?.alliance ?? null,
    featuredCharacterId: instance?.featuredCharacterId ?? null,
    hseTrackers: hse?.trackers ?? null,
  })
  const firstTeam = teams.findIndex((view) => view.status !== "hidden")
  const pace =
    instance && ready && rules
      ? hrePaceFor(rules.rewards, {
          running,
          startUtc: instance.entry.startUtc,
          endUtc: instance.entry.endUtc,
          nowMs: ready.nowMs,
          points: progress.points,
          rank: progress.rank,
          rankAt: progress.rankAt,
          mission: progress.mission,
          owned: progress.owned,
          target: progress.target,
          startRarity: hero?.initialRarity ?? null,
        })
      : null

  const tokenRows = running
    ? tokenNeedRows(progress, missions, {
        arena: tokens?.arena ?? null,
        guildRaid: tokens?.guildRaid ?? null,
        onslaught: tokens?.onslaught ?? null,
        salvageRun: tokens?.salvageRun ?? null,
      })
    : []

  useHreTutorial({
    hasSwitcher: !!ready,
    hasEvent: !!event,
    hasRaids: !!event && !past,
    running,
    hasTeam: firstTeam >= 0,
    hasTokens: tokenRows.length > 0,
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
      if (key === defaultKey) params.delete(EVENT_PARAM)
      else params.set(EVENT_PARAM, key)
      return params
    })

  const notice = (() => {
    if (!running) return t("hre:raids.notice.preview")
    if (campaignObjectiveState(progress, missions) === "met")
      return t("hre:raids.notice.met")
    const next = nextCampaignMission(progress, missions)
    return next
      ? t("hre:raids.notice.next", {
          mission: missionName(t, next.missionNumber, missions),
          objective: objectiveText(next.objective),
        })
      : t("hre:raids.notice.noneLeft")
  })()

  const heroAlliance = hero?.alliance
  const heroFaction = hero?.faction
  const hasHero = !!hero
  const request = useMemo(
    () =>
      campaignPlan
        ? {
            missionLabel: missionName(t, campaignPlan.missionNumber, missions),
            raids: campaignPlan.raids,
            // Alliance-restricted nodes wait for the featured hero's alliance.
            manual:
              campaignPlan.battles &&
              (!campaignPlan.battles.alliance || hasHero)
                ? {
                    needs: campaignPlan.battles.needs,
                    slots: campaignPlan.battles.slots,
                    alliance: campaignPlan.battles.alliance
                      ? heroAlliance
                      : undefined,
                    heroFaction: campaignPlan.battles.featured
                      ? heroFaction
                      : undefined,
                    faction: campaignPlan.battles.faction ?? undefined,
                    preferLightning: campaignPlan.battles.preferLightning,
                    countsAsRaids: campaignPlan.battles.countsAsWins,
                    allianceName: campaignPlan.battles.alliance
                      ? allianceName
                      : null,
                    heroFactionName:
                      campaignPlan.battles.featured && heroFaction
                        ? (t(`factions:${heroFaction}` as never, {
                            defaultValue: heroFaction,
                          }) as string)
                        : null,
                    factionName: campaignPlan.battles.faction
                      ? (t(
                          `factions:${campaignPlan.battles.faction}` as never,
                          { defaultValue: campaignPlan.battles.faction }
                        ) as string)
                      : null,
                  }
                : null,
            manualNotice:
              campaignPlan.battles?.alliance && !hasHero
                ? t("hre:raids.notice.noHero")
                : null,
          }
        : null,
    [
      campaignPlan,
      heroAlliance,
      heroFaction,
      hasHero,
      allianceName,
      missions,
      t,
    ]
  )
  const raids =
    event && !past ? (
      <HreRaidsSection
        controls={
          <RaidsSectionControls
            context={context}
            hiddenQuickFilters={HRE_HIDDEN_QUICK_FILTERS}
            onQuickFiltersChange={setQuickFilters}
            quickFilters={quickFilters}
            testIdPrefix="hre"
          />
        }
        notice={notice}
        projectId={context.projectId}
        quickFilters={todayQuickFilterOptions(quickFilters)}
        daysLeft={
          ready
            ? hreDaysLeft({
                running,
                startUtc: event.entry.startUtc,
                endUtc: event.entry.endUtc,
                nowMs: ready.nowMs,
              })
            : 0
        }
        remainingBattles={remainingCampaignBattles(shown, missions)}
        renderTeams={
          battlePlan
            ? (groups) => (
                <HreCampaignTeams
                  alliance={hero?.alliance ?? null}
                  allianceName={allianceName}
                  featuredCharacterId={instance?.featuredCharacterId ?? null}
                  groups={groups}
                  hero={heroName}
                  hse={hse}
                  missions={missions}
                  plan={battlePlan}
                />
              )
            : undefined
        }
        request={request}
      />
    ) : null
  const teamCard = teams.map((view, index) => {
    // The first shown card keeps the `hre-team` id the tutorial points at.
    const plan = teamPlans[index] ?? null
    return (
      <HreTeamCard
        alliance={allianceName}
        hero={heroName}
        hseEvent={hse?.name ?? null}
        key={plan?.mode ?? index}
        missions={missions}
        plan={plan}
        testId={
          index === firstTeam ? "hre-team" : `hre-team-${plan?.mode ?? index}`
        }
        tokens={
          plan && plan.mode !== "battle" ? (tokens?.[plan.mode] ?? null) : null
        }
        view={view}
      />
    )
  })
  const tokensCard =
    tokenRows.length > 0 ? (
      <TokensNeededCard rows={tokenRows} synced={!!tokens} />
    ) : null
  const paceCard =
    running && rules ? (
      <div
        className="scroll-mt-[calc(var(--mobile-header-height)+3rem)] md:scroll-mt-4"
        data-testid="hre-pace-section"
        ref={paceRef}
      >
        <PaceCard
          actions={actions}
          factionId={hero?.faction ?? null}
          pace={pace}
          rules={rules.rewards}
          startRarity={hero?.initialRarity ?? null}
          state={progress}
        />
      </div>
    ) : null
  // Mobile only (design D4): the pace card sits far below, so its summary follows the tracker.
  const paceSummary =
    running && isMobile ? (
      <PaceSummary
        onDetails={() => {
          const reduced = window.matchMedia?.(
            "(prefers-reduced-motion: reduce)"
          ).matches
          paceRef.current?.scrollIntoView({
            behavior: reduced ? "auto" : "smooth",
            block: "start",
          })
        }}
        pace={pace}
        points={progress.points}
      />
    ) : null
  const tracker = running ? (
    <div data-testid="hre-tracker">
      <MissionTracker
        actions={actions}
        missions={missions}
        objectiveText={objectiveText}
        objectiveIcon={objectiveIcon}
        state={progress}
      />
    </div>
  ) : null
  const missionList = event ? (
    <AllMissions
      collapsed={isMobile}
      current={running ? progress.mission : null}
      missions={missions}
      objectiveText={objectiveText}
      objectiveIcon={objectiveIcon}
    />
  ) : null

  return (
    <section className="space-y-5" data-testid="hre-page">
      <div className="space-y-3">
        <div
          className="flex flex-wrap items-center gap-3"
          data-testid="hre-title-row"
        >
          <h2 className="text-lg font-semibold">{t("hre:title")}</h2>
          {ready ? (
            <HreEventSwitcher
              className="order-last md:order-none md:ml-auto"
              heroes={ready.heroes}
              instances={ready.instances}
              onSelect={selectInstance}
              selectedKey={instance?.key ?? null}
            />
          ) : null}
        </div>
        <div data-testid="hre-status">
          <HreEventHeader state={state} />
        </div>
        {instance && !rules ? (
          <p
            className="text-sm text-muted-foreground"
            data-testid="hre-rules-missing"
          >
            {t("hre:status.error")}
          </p>
        ) : null}
        {event && past ? (
          <p
            className="text-sm text-muted-foreground"
            data-testid="hre-past-note"
          >
            {t("hre:status.pastNote")}
          </p>
        ) : event && !running ? (
          <p
            className="text-sm text-muted-foreground"
            data-testid="hre-preview-note"
          >
            {t("hre:status.previewNote")}
          </p>
        ) : null}
      </div>
      {event ? (
        isMobile ? (
          <div className="space-y-5" data-testid="hre-sections">
            {tracker}
            {paceSummary}
            {raids}
            {teamCard}
            {tokensCard}
            {paceCard}
            {missionList}
          </div>
        ) : (
          <div
            className="grid grid-cols-2 items-start gap-6"
            data-testid="hre-sections"
          >
            <div className="space-y-5">
              {tracker}
              {missionList}
            </div>
            <div className="space-y-5">
              {raids}
              {teamCard}
              {tokensCard}
              {paceCard}
            </div>
          </div>
        )
      ) : null}
    </section>
  )
}
