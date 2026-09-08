import { useTranslation } from "react-i18next"
import { useOutletContext } from "react-router"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { ProjectSelect } from "@/entities/project"

import type { SalvageTrack } from "../../model/salvage-recommendations.types"
import { useOnslaughtRecommendations } from "../../model/use-onslaught-recommendations"
import { AllianceTrackSelector } from "../team-recs/track-selector"
import { TeamModeToggle } from "../team-recs/mode-toggle"
import { PreferenceControls } from "../team-recs/preference-controls"
import { TeamRecsState } from "../team-recs/team-recs-state"
import { TeamSizeControl } from "../team-recs/team-size"
import { TrackShortfall } from "../team-recs/track-shortfall"
import type { DailiesOutletContext } from "../dailies-layout"
import { OnslaughtDesktop } from "./desktop/onslaught-desktop"
import { OnslaughtMobile } from "./mobile/onslaught-mobile"
import { ShardRecipientPanel } from "./shard-recipient-panel"
import { useOnslaughtTutorial } from "./onslaught-page.tutorial"

/**
 * Dailies → Onslaught: recommends Onslaught team compositions one alliance track at a time
 * (Imperial / Chaos / Xenos), with the characters being ascended via Onslaught shard farming
 * leading the Plan Team, plus a separate post-battle shard recipient (character or Machine of War).
 * Every recommendation is narrowed to the selected track's alliance before any other prioritization.
 */
export function OnslaughtPage() {
  const { t } = useTranslation(["onslaught", "teamRecs"])
  const isMobile = useIsMobile()
  const context = useOutletContext<DailiesOutletContext>()
  const view = useOnslaughtRecommendations(context.projectId)
  useOnslaughtTutorial()

  const selectedProjectName = context.projects.find(
    (project) => project.projectId === context.projectId
  )?.name

  let body: React.ReactNode
  if (view.status === "loading") {
    body = <TeamRecsState state="loading" testIdPrefix="onslaught" />
  } else if (view.status === "error") {
    body = (
      <TeamRecsState
        state="error"
        onRetry={view.retry}
        testIdPrefix="onslaught"
      />
    )
  } else {
    const trackControl = (
      <AllianceTrackSelector
        track={view.track}
        onTrackChange={view.setTrack}
        namespace="onslaught"
        testIdPrefix="onslaught"
      />
    )
    const shardRecipient = (
      <ShardRecipientPanel
        result={view.shardRecipient}
        projectName={
          view.shardRecipient.status === "ready" &&
          view.shardRecipient.recipient.projectId
            ? selectedProjectName
            : undefined
        }
        testIdPrefix="onslaught"
      />
    )

    if (view.status === "insufficient-track") {
      body = (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">{trackControl}</div>
          {shardRecipient}
          <TrackShortfall
            trackLabel={t(
              `track.${view.track.toLowerCase() as Lowercase<SalvageTrack>}`
            )}
            ownedCount={view.ownedCount}
            needed={view.needed}
            eligible={view.eligible}
            testIdPrefix="onslaught"
          />
        </div>
      )
    } else {
      body = (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            {trackControl}
            <TeamModeToggle
              mode={view.mode}
              onModeChange={view.setMode}
              testIdPrefix="onslaught"
            />
            <ProjectSelect
              projects={context.projects}
              projectId={context.projectId}
              onProjectIdChange={context.setProjectId}
              placeholder={t("teamRecs:project.label")}
              testId="onslaught-project-select"
              compact={false}
            />
            <TeamSizeControl
              value={view.teamSize}
              availableSizes={view.availableSizes}
              onValueChange={view.setTeamSize}
              testIdPrefix="onslaught"
            />
            <PreferenceControls
              preferences={view.preferences}
              availableTraits={view.availableTraits}
              availableDamageTypes={view.availableDamageTypes}
              onChange={view.setPreferences}
              testIdPrefix="onslaught"
            />
          </div>
          {shardRecipient}
          {isMobile ? (
            <OnslaughtMobile
              recommendations={view.recommendations}
              onRegenerate={view.regenerate}
              onToggleLock={view.toggleRandomLock}
            />
          ) : (
            <OnslaughtDesktop
              recommendations={view.recommendations}
              onRegenerate={view.regenerate}
              onToggleLock={view.toggleRandomLock}
            />
          )}
        </div>
      )
    }
  }

  return (
    <div className="space-y-5 md:space-y-7" data-testid="onslaught-page">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      {body}
    </div>
  )
}
