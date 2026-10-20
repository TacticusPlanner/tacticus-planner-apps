import { useTranslation } from "react-i18next"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { HreRaidsSection } from "@/features/daily-raids"
import {
  AllMissions,
  campaignObjectiveState,
  DEFAULT_HRE_PROGRESS,
  HreEventHeader,
  hreDaysLeft,
  hrePaceFor,
  MissionTracker,
  missionName,
  nextCampaignMission,
  PaceCard,
  remainingCampaignBattles,
  selectRaidObjective,
  selectTeamPlans,
  tokenNeedRows,
  TokensNeededCard,
  useHreInstance,
  useHreProgress,
  useHreTokens,
  useObjectiveText,
} from "@/features/hre-missions"

import { useHreTeamRecommendations } from "../model/use-hre-team-recommendations"
import { useRunningHse } from "../model/use-running-hse"
import { HreTeamCard } from "./hre/hre-team-card"
import { useHreTutorial } from "./hre-page.tutorial"

/**
 * Dailies > HRE: the running Hero Release Event (or the next one as a read-only preview). On a
 * running event: the current mission with its progress inputs and tips, campaign raid suggestions
 * for its campaign, all-alliance or alliance-ability objective, a mission team (Arena, Salvage Run,
 * Onslaught or battle) for a lineup objective (led by a running HSE's scoring units), the tokens the remaining
 * missions need and the event pace. Every event lists all missions and the remaining-campaign
 * summary. Desktop: missions on the left, the rest on the right. Mobile: one column with the
 * mission list last, collapsed behind "All missions".
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
  const state = useHreInstance()
  const ready = state.status === "ready" ? state : null
  const instance = ready?.instance ?? null
  const hero = ready?.hero ?? null
  const running = instance?.status === "running"
  const [progress, actions] = useHreProgress(running ? instance.key : null)
  const shown = running ? progress : DEFAULT_HRE_PROGRESS
  const objectiveText = useObjectiveText(
    hero,
    instance?.featuredCharacterId ?? null
  )
  const tokens = useHreTokens()

  const heroName = hero
    ? t(`characters:${hero.id}`, { defaultValue: hero.name })
    : (instance?.featuredCharacterId ?? "")
  const allianceName = hero
    ? (t(`common:alliances.${hero.alliance}` as never, {
        defaultValue: hero.alliance,
      }) as string)
    : null
  const raidObjective = running ? selectRaidObjective(progress) : null
  const teamPlans = running ? selectTeamPlans(progress) : []
  const hse = useRunningHse()
  const teams = useHreTeamRecommendations({
    plans: teamPlans,
    alliance: hero?.alliance ?? null,
    featuredCharacterId: instance?.featuredCharacterId ?? null,
    hseTrackers: hse?.trackers ?? null,
  })
  const firstTeam = teams.findIndex((view) => view.status !== "hidden")
  const pace =
    instance && ready
      ? hrePaceFor({
          running,
          startUtc: instance.entry.startUtc,
          endUtc: instance.entry.endUtc,
          nowMs: ready.nowMs,
          points: progress.points,
          rank: progress.rank,
          target: progress.target,
          startRarity: hero?.initialRarity ?? null,
        })
      : null

  const tokenRows = running
    ? tokenNeedRows(progress, {
        arena: tokens?.arena ?? null,
        guildRaid: tokens?.guildRaid ?? null,
        onslaught: tokens?.onslaught ?? null,
        salvageRun: tokens?.salvageRun ?? null,
      })
    : []

  useHreTutorial({
    hasEvent: !!instance,
    running,
    hasTeam: firstTeam >= 0,
    hasTokens: tokenRows.length > 0,
  })

  const notice = (() => {
    if (!running) return t("hre:raids.notice.preview")
    if (raidObjective?.allianceNodes && !hero)
      return t("hre:raids.notice.noHero")
    if (campaignObjectiveState(progress) === "met")
      return t("hre:raids.notice.met")
    const next = nextCampaignMission(progress)
    return next
      ? t("hre:raids.notice.next", {
          mission: missionName(t, next.missionNumber),
          objective: objectiveText(next.objective),
        })
      : t("hre:raids.notice.noneLeft")
  })()

  const raids = instance ? (
    <HreRaidsSection
      notice={notice}
      daysLeft={
        ready
          ? hreDaysLeft({
              running,
              startUtc: instance.entry.startUtc,
              endUtc: instance.entry.endUtc,
              nowMs: ready.nowMs,
            })
          : 0
      }
      remainingBattles={remainingCampaignBattles(shown)}
      request={
        // Alliance-restricted nodes wait for the featured hero's alliance, so they can be filtered
        // to where that alliance deploys.
        raidObjective && (!raidObjective.allianceNodes || hero)
          ? {
              battlesToGo: raidObjective.battlesToGo,
              eventOnly: raidObjective.eventOnly,
              slots: raidObjective.slots,
              kind: raidObjective.kind,
              allianceTeam: raidObjective.allianceTeam ? allianceName : null,
              alliance: raidObjective.allianceNodes
                ? hero?.alliance
                : undefined,
              allianceNodes: raidObjective.allianceNodes ? allianceName : null,
              enemyFaction: raidObjective.enemyFaction ?? undefined,
              enemyFactionName: raidObjective.enemyFaction
                ? (t(
                    `factions:${raidObjective.enemyFaction.faction}` as never,
                    { defaultValue: raidObjective.enemyFaction.faction }
                  ) as string)
                : null,
              missionLabel: missionName(t, raidObjective.missionNumber),
            }
          : null
      }
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
  const paceCard = running ? (
    <PaceCard
      actions={actions}
      pace={pace}
      startRarity={hero?.initialRarity ?? null}
      state={progress}
    />
  ) : null
  const tracker = running ? (
    <div data-testid="hre-tracker">
      <MissionTracker
        actions={actions}
        objectiveText={objectiveText}
        state={progress}
      />
    </div>
  ) : null
  const missions = instance ? (
    <AllMissions
      collapsed={isMobile}
      current={running ? progress.mission : null}
      objectiveText={objectiveText}
    />
  ) : null

  return (
    <section className="space-y-5" data-testid="hre-page">
      <div className="space-y-3">
        <div
          className="flex flex-wrap items-center gap-3"
          data-testid="hre-title-row"
        >
          <h1 className="text-lg font-semibold">{t("hre:title")}</h1>
        </div>
        <div data-testid="hre-status">
          <HreEventHeader state={state} />
        </div>
        {instance && !running ? (
          <p
            className="text-sm text-muted-foreground"
            data-testid="hre-preview-note"
          >
            {t("hre:status.previewNote")}
          </p>
        ) : null}
      </div>
      {instance ? (
        isMobile ? (
          <div className="space-y-5" data-testid="hre-sections">
            {tracker}
            {raids}
            {teamCard}
            {tokensCard}
            {paceCard}
            {missions}
          </div>
        ) : (
          <div
            className="grid grid-cols-2 items-start gap-6"
            data-testid="hre-sections"
          >
            <div className="space-y-5">
              {tracker}
              {missions}
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
