import { useEffect, useMemo } from "react"
import type { ReactNode } from "react"
import { useOutletContext, useSearchParams } from "react-router"
import { useTranslation } from "react-i18next"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import {
  HreBattlesDetails,
  HreBattlesSummary,
  HreCampaignOutlook,
  HreRaidsDetails,
  HreRaidsSummary,
  RaidState,
  todayQuickFilterOptions,
  useHreRaids,
  useTodayQuickFilters,
} from "@/features/daily-raids"
import type { HreRaidsRequest } from "@/features/daily-raids"
import {
  AllMissions,
  HreEventHeader,
  HreEventSwitcher,
  hreObjectiveIcon,
  MissionTracker,
  missionName,
  ObjectiveDetails,
  PaceCard,
  TokensNeededCard,
  useHreInstance,
  useHreProgress,
  useHreTokens,
  useObjectiveHint,
  useObjectiveText,
} from "@/features/hre-missions"
import type {
  ObjectiveSuggestion,
  ObjectiveSuggestions,
} from "@/features/hre-missions"
import {
  campaignObjectiveState,
  DEFAULT_HRE_PROGRESS,
  hreAllDone,
  hreDaysLeft,
  hreMission,
  hrePaceFor,
  nextCampaignMission,
  remainingCampaignBattles,
  selectCampaignPlan,
  selectTeamPlans,
  spareTokens,
  tokenNeedRows,
} from "@/entities/hre-mission"
import type { HreMission, HreObjective } from "@/entities/hre-mission"

import { useHreTeamRecommendations } from "@/features/team-recommendations"
import {
  CampaignBattleDialogHost,
  useCampaignBattleDialog,
} from "@/widgets/battle-preview"
import { useAnalyticsActions } from "@/shared/analytics"
import { hreObjectiveSlots } from "../model/hre-objective-slots"
import { hreTeamHints } from "../model/hre-team-hints"
import { hseStatBoostFor, runningHseFor } from "../model/running-hse"
import { useHreTabViewed } from "../model/use-hre-tab-viewed"
import { useRunningHses } from "../model/use-running-hse"
import type { DailiesOutletContext } from "./dailies-layout"
import { HreCampaignTeams } from "./hre/hre-campaign-teams"
import { HreTeamCard } from "./hre/hre-team-card"
import { HreTeamSummary } from "./hre/hre-team-summary"
import { DailiesEventToolbar } from "./dailies-event-toolbar"
import { useHreTutorial } from "./hre-page.tutorial"

const NO_MISSIONS: readonly HreMission[] = []
/** The raids count battles, so "Fewer raids" changes nothing here. */
const HRE_HIDDEN_QUICK_FILTERS = ["fewerRaids"] as const
/** The HRE tab's search parameter holding the selected instance key (HRE-only, never carried over). */
const EVENT_PARAM = "event"

/**
 * Dailies > HRE: one Hero Release Event at a time. By default the running one (or the next one as a
 * read-only preview); the switcher opens any other upcoming or past event, held in the `event` URL
 * parameter so it survives a reload. A past event shows its header and mission list only. On a
 * running event: the current mission with its progress inputs, an 'i' per objective, and a row per
 * suggestion under each objective: the raids for its campaign objective, the battles to fight by
 * hand for its manual objectives with a team per campaign, a token objective's team, and a team per
 * spare-token mode for the manual objectives (each led by the units of the running personal HSE
 * that scores in its mode). A row scrolls to its details card, in the suggestions section right
 * after the event pace. Beside it the event pace, the suggestions, the tokens the remaining missions
 * need and the campaign outlook; a preview shows the tokens and the outlook for the whole
 * event. Every event lists all missions. The raids follow the Dailies project, Filters and the
 * quick filters ("CE nodes first" among them), picked in the page toolbar with the event picker.
 * Desktop: missions on the left, the rest on the right, the pace first, then the suggestions.
 * Mobile: one column in the same order, the mission list last, collapsed behind "All missions".
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
  // The battle dialog's open state lives outside this page, so a location's info button
  // re-renders only the dialog.
  const battleDialog = useCampaignBattleDialog()
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
  const objectiveHint = useObjectiveHint(
    hero,
    instance?.featuredCharacterId ?? null
  )
  const objectiveIcon = (objective: Parameters<typeof hreObjectiveIcon>[0]) =>
    hreObjectiveIcon(objective, hero?.alliance ?? null)
  const tokens = useHreTokens()
  const { captureEvent } = useAnalyticsActions()

  const heroName = hero
    ? t(`characters:${hero.id}`, { defaultValue: hero.name })
    : (instance?.featuredCharacterId ?? "")
  const allianceName = hero
    ? (t(`common:alliances.${hero.alliance}` as never, {
        defaultValue: hero.alliance,
      }) as string)
    : null
  const tokenCounts = {
    arena: tokens?.arena ?? null,
    guildRaid: tokens?.guildRaid ?? null,
    onslaught: tokens?.onslaught ?? null,
    salvageRun: tokens?.salvageRun ?? null,
  }
  const spare = running ? spareTokens(progress, missions, tokenCounts) : {}
  const spareArena = spare.arena ? spare.arena.held - spare.arena.need : 0
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
            spareArena
          )
        : null,
    [running, mission, firstProgress, secondProgress, missions, spareArena]
  )
  const allTeamPlans = running ? selectTeamPlans(progress, missions, spare) : []
  // The campaign team plays the battles to fight by hand: it is built per campaign in that fold.
  const battlePlan = allTeamPlans.find((plan) => plan.mode === "battle") ?? null
  const teamPlans = allTeamPlans.filter((plan) => plan.mode !== "battle")
  const hses = useRunningHses()
  const teams = useHreTeamRecommendations({
    plans: teamPlans,
    alliance: hero?.alliance ?? null,
    featuredCharacterId: instance?.featuredCharacterId ?? null,
    hseTrackersFor: (mode) => runningHseFor(hses, mode)?.trackers ?? null,
  })
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

  // A preview counts the whole event's need.
  const tokenRows =
    event && !past ? tokenNeedRows(shown, missions, tokenCounts) : []

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
  const selectInstance = (key: string) => {
    setSearchParams((previous) => {
      const params = new URLSearchParams(previous)
      if (key === defaultKey) params.delete(EVENT_PARAM)
      else params.set(EVENT_PARAM, key)
      return params
    })
    const picked = ready?.instances.find((item) => item.key === key)
    if (picked) {
      captureEvent({ type: "hre_event_switched", eventState: picked.status })
    }
  }

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
    (): HreRaidsRequest | null =>
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
  const raids = useHreRaids({
    request: event && !past ? request : null,
    projectId: context.projectId,
    quickFilters: todayQuickFilterOptions(quickFilters),
    onShowLocation: (target) => {
      battleDialog.show(target)
      captureEvent({ type: "hre_location_opened" })
    },
  })
  const campaignTeams = (
    groups: Parameters<typeof HreCampaignTeams>[0]["groups"]
  ) =>
    battlePlan ? (
      <HreCampaignTeams
        alliance={hero?.alliance ?? null}
        allianceName={allianceName}
        featuredCharacterId={instance?.featuredCharacterId ?? null}
        groups={groups}
        hero={heroName}
        hses={hses}
        missions={missions}
        plan={battlePlan}
      />
    ) : null
  // A raids or battles suggestion's details card; a team's details are its team card.
  const detailCard = (
    testId: string,
    title: string,
    objective: HreObjective,
    content: ReactNode
  ) => (
    <Card data-testid={testId}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{objectiveText(objective)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">{content}</CardContent>
    </Card>
  )
  const objectiveSuggestions = (
    objective: HreObjective,
    index: number
  ): ObjectiveSuggestions | null => {
    const items: ObjectiveSuggestion[] = []
    let note: string | null = null
    for (const slot of hreObjectiveSlots(objective, campaignPlan, teamPlans)) {
      if (slot.kind === "raids" && request?.raids) {
        items.push({
          id: "raids",
          suggestion: "raids",
          summary: (
            <HreRaidsSummary
              battlesToGo={request.raids.battlesToGo}
              raids={raids}
            />
          ),
          detail: detailCard(
            "hre-raids-card",
            t("hre:raids.raidsTitle"),
            objective,
            <HreRaidsDetails
              eventOnly={request.raids.eventOnly}
              raids={raids}
            />
          ),
        })
      } else if (slot.kind === "battles") {
        if (request?.manual) {
          items.push({
            id: "battles",
            suggestion: "battles",
            summary: <HreBattlesSummary raids={raids} />,
            detail: detailCard(
              "hre-battles-card",
              t("hre:raids.battles.title"),
              objective,
              <HreBattlesDetails
                manual={request.manual}
                raids={raids}
                renderTeams={battlePlan ? campaignTeams : undefined}
              />
            ),
          })
        } else if (request?.manualNotice) {
          note = request.manualNotice
        }
      } else if (slot.kind === "sharedBattles") {
        note = t("hre:raids.battles.shared")
      } else if (slot.kind === "team") {
        const plan = teamPlans[slot.planIndex]
        const view = teams[slot.planIndex]
        if (!plan || plan.mode === "battle" || view?.status === "hidden") {
          continue
        }
        const hse = runningHseFor(hses, plan.mode)
        const battles = plan.spare
          ? plan.spare.held - plan.spare.need
          : objective.target - (progress.progress[index] ?? 0)
        const testId = `hre-team-${plan.mode}`
        items.push({
          id: plan.mode,
          suggestion: plan.mode,
          spare: !!plan.spare,
          summary: (
            <HreTeamSummary
              battles={battles}
              plan={{ ...plan, mode: plan.mode }}
              testId={`${testId}-summary`}
              view={view}
            />
          ),
          detail: view ? (
            <HreTeamCard
              alliance={allianceName}
              hero={heroName}
              hints={hreTeamHints(plan)}
              hseEvent={hse?.name ?? null}
              missions={missions}
              plan={plan}
              statBoost={hse ? hseStatBoostFor(hse, plan.mode) : null}
              testId={testId}
              tokens={tokens?.[plan.mode] ?? null}
              view={view}
            />
          ) : null,
        })
      }
    }
    return items.length > 0 || note ? { items, note } : null
  }
  const campaignShown =
    request !== null &&
    (request.raids !== null ||
      request.manual !== null ||
      Boolean(request.manualNotice))
  const campaignCard =
    event && !past ? (
      <section className="space-y-3" data-testid="hre-raids">
        <h2 className="text-lg font-semibold">{t("hre:raids.titleNone")}</h2>
        {raids.status === "ready" ? null : <RaidState state={raids.status} />}
        {campaignShown ? null : (
          <div
            className="text-sm text-muted-foreground"
            data-testid="hre-raids-notice"
          >
            {notice}
          </div>
        )}
        {raids.status === "ready" ? (
          <HreCampaignOutlook
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
            plan={raids.plan}
            remainingBattles={remainingCampaignBattles(shown, missions)}
          />
        ) : null}
      </section>
    ) : null
  const tokensCard =
    tokenRows.length > 0 ? (
      <TokensNeededCard rows={tokenRows} synced={!!tokens} />
    ) : null
  const paceCard =
    running && rules ? (
      <div data-testid="hre-pace-section">
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
  const tracker = running ? (
    <div data-testid="hre-tracker">
      <MissionTracker
        actions={actions}
        missions={missions}
        objectiveText={objectiveText}
        objectiveIcon={objectiveIcon}
        objectiveHint={objectiveHint}
        objectiveSuggestions={objectiveSuggestions}
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
      objectiveHint={objectiveHint}
    />
  ) : null

  // Each open objective's suggestions: rows under it, details below the pace.
  const objectives =
    running && progress.mission < hreAllDone(missions)
      ? hreMission(missions, progress.mission).objectives
      : []
  const openSuggestions = objectives.flatMap((objective, index) => {
    if ((progress.progress[index] ?? 0) >= objective.target) return []
    const suggestions = objectiveSuggestions(objective, index)
    return suggestions && suggestions.items.length > 0
      ? [{ index, suggestions }]
      : []
  })
  const detailsSection =
    openSuggestions.length > 0 ? (
      <ObjectiveDetails objectives={openSuggestions} />
    ) : null
  // The tour points at the first objective with a suggestion.
  const suggestionsIndex = openSuggestions[0]?.index ?? -1
  useHreTutorial({
    hasSwitcher: !!ready,
    hasEvent: !!event,
    hasRaids: !!event && !past,
    running,
    suggestionsTarget:
      suggestionsIndex >= 0
        ? `hre-objective-${suggestionsIndex}-suggestions`
        : null,
    hasTokens: tokenRows.length > 0,
  })
  useHreTabViewed(
    event && ready ? (past ? "past" : running ? "running" : "upcoming") : null,
    running ? progress.mission : null,
    instance?.key ?? null
  )

  return (
    <section className="space-y-5" data-testid="hre-page">
      <DailiesEventToolbar
        context={context}
        picker={
          ready ? (
            <HreEventSwitcher
              heroes={ready.heroes}
              instances={ready.instances}
              onSelect={selectInstance}
              selectedKey={instance?.key ?? null}
            />
          ) : null
        }
        raids={
          event && !past
            ? {
                quickFilters,
                onQuickFiltersChange: setQuickFilters,
                // "CE nodes first" only while a campaign event with reached nodes runs, or while on.
                hiddenQuickFilters:
                  raids.hasActiveEventBattles ||
                  quickFilters.includes("preferEvent")
                    ? HRE_HIDDEN_QUICK_FILTERS
                    : [...HRE_HIDDEN_QUICK_FILTERS, "preferEvent"],
              }
            : null
        }
        testIdPrefix="hre"
      />
      <div className="space-y-3">
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
            {paceCard}
            {detailsSection}
            {tokensCard}
            {campaignCard}
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
              {paceCard}
              {detailsSection}
              {tokensCard}
              {campaignCard}
            </div>
          </div>
        )
      ) : null}
      <CampaignBattleDialogHost dialog={battleDialog} />
    </section>
  )
}
