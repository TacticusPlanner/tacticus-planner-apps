import { useState } from "react"
import { useOutletContext } from "react-router"
import { useTranslation } from "react-i18next"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { HreRaidsSection, RaidsFiltersTrigger } from "@/features/daily-raids"
import {
  AllMissions,
  campaignObjectiveState,
  DEFAULT_HRE_PROGRESS,
  HreEventHeader,
  hrePaceFor,
  MissionTracker,
  missionName,
  nextCampaignMission,
  PaceCard,
  remainingCampaignBattles,
  selectRaidObjective,
  selectTeamObjective,
  tokenNeedRows,
  TokensNeededCard,
  useHreInstance,
  useHreProgress,
  useHreTokens,
  useObjectiveText,
} from "@/features/hre-missions"
import {
  PlanningSettingsDialog,
  PlanningSettingsTrigger,
} from "@/entities/planning-setting"
import { ProjectSelect } from "@/entities/project"

import { useHreTeamRecommendations } from "../model/use-hre-team-recommendations"
import type { DailiesOutletContext } from "./dailies-layout"
import { HreTeamCard } from "./hre/hre-team-card"
import { useHreTutorial } from "./hre-page.tutorial"

/**
 * Dailies > HRE: the running Hero Release Event (or the next one as a read-only preview). On a
 * running event: the current mission with its progress inputs and tips, campaign raid suggestions
 * for its campaign objective (or a mission team for a lineup objective), the tokens the remaining
 * missions need and the event pace. Every event lists all missions and the remaining-campaign
 * summary. Desktop: missions on the left, the rest on the right. Mobile: one column with the
 * mission list last, collapsed behind "All missions".
 */
export function HrePage() {
  const context = useOutletContext<DailiesOutletContext>()
  const { t } = useTranslation(["hre", "common", "characters", "dailies"])
  const isMobile = useIsMobile()
  const [settingsOpen, setSettingsOpen] = useState(false)
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
  const teamObjective = running ? selectTeamObjective(progress) : null
  const team = useHreTeamRecommendations({
    rule: teamObjective?.rule ?? null,
    alliance: hero?.alliance ?? null,
    featuredCharacterId: instance?.featuredCharacterId ?? null,
  })
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
    hasTeam: team.status !== "hidden",
    hasTokens: tokenRows.length > 0,
  })

  const notice = (() => {
    if (!running) return t("hre:raids.notice.preview")
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
      projectId={context.projectId}
      remainingBattles={remainingCampaignBattles(shown)}
      request={
        raidObjective
          ? {
              battlesToGo: raidObjective.battlesToGo,
              eventOnly: raidObjective.eventOnly,
              missionLabel: missionName(t, raidObjective.missionNumber),
            }
          : null
      }
    />
  ) : null
  const teamCard = (
    <HreTeamCard alliance={allianceName} hero={heroName} view={team} />
  )
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
          {running ? (
            <div
              className="ml-auto flex items-center gap-2"
              data-testid="hre-header-controls"
            >
              <ProjectSelect
                allowAll
                onProjectIdChange={context.setProjectId}
                placeholder={t("dailies:project.placeholder")}
                projectId={context.projectId}
                projects={context.projects}
                testId="hre-project-select"
              />
              <RaidsFiltersTrigger />
              <PlanningSettingsTrigger
                onClick={() => setSettingsOpen(true)}
                testId="hre-planning-settings"
              />
            </div>
          ) : null}
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
      {settingsOpen ? (
        <PlanningSettingsDialog
          onOpenChange={setSettingsOpen}
          open={settingsOpen}
        />
      ) : null}
    </section>
  )
}
