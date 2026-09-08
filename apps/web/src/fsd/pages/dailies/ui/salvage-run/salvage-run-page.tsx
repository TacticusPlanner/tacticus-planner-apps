import { useTranslation } from "react-i18next"
import { useOutletContext } from "react-router"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { ProjectSelect } from "@/entities/project"

import type { SalvageTrack } from "../../model/salvage-recommendations.types"
import { useSalvageRecommendations } from "../../model/use-salvage-recommendations"
import { TeamModeToggle } from "../team-recs/mode-toggle"
import { PreferenceControls } from "../team-recs/preference-controls"
import { TeamRecsState } from "../team-recs/team-recs-state"
import { TeamSizeControl } from "../team-recs/team-size"
import { TrackShortfall } from "../team-recs/track-shortfall"
import type { DailiesOutletContext } from "../dailies-layout"
import { SalvageDesktop } from "./desktop/salvage-desktop"
import { SalvageMobile } from "./mobile/salvage-mobile"
import { AllianceTrackSelector } from "./track-selector"
import { useSalvageRunTutorial } from "./salvage-run-page.tutorial"

/**
 * Dailies → Salvage Run: recommends Salvage Run team compositions one alliance track at a time
 * (Imperial / Chaos / Xenos). Every recommendation is narrowed to the selected track's alliance
 * before any project / goal / XP / power prioritization. Otherwise it is the Arena page: a Plan
 * Team and a Random Team, an XP / Power toggle, the shared project selector, a Team size control,
 * and preferred trait / damage type controls.
 */
export function SalvageRunPage() {
  const { t } = useTranslation(["salvageRun", "teamRecs"])
  const isMobile = useIsMobile()
  const context = useOutletContext<DailiesOutletContext>()
  const view = useSalvageRecommendations(context.projectId)
  useSalvageRunTutorial()

  let body: React.ReactNode
  if (view.status === "loading") {
    body = <TeamRecsState state="loading" testIdPrefix="salvage" />
  } else if (view.status === "error") {
    body = (
      <TeamRecsState
        state="error"
        onRetry={view.retry}
        testIdPrefix="salvage"
      />
    )
  } else {
    const trackControl = (
      <AllianceTrackSelector track={view.track} onTrackChange={view.setTrack} />
    )

    if (view.status === "insufficient-track") {
      body = (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">{trackControl}</div>
          <TrackShortfall
            trackLabel={t(
              `track.${view.track.toLowerCase() as Lowercase<SalvageTrack>}`
            )}
            ownedCount={view.ownedCount}
            needed={view.needed}
            eligible={view.eligible}
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
              testIdPrefix="salvage"
            />
            <ProjectSelect
              projects={context.projects}
              projectId={context.projectId}
              onProjectIdChange={context.setProjectId}
              placeholder={t("teamRecs:project.label")}
              testId="salvage-project-select"
              compact={false}
            />
            <TeamSizeControl
              value={view.teamSize}
              availableSizes={view.availableSizes}
              onValueChange={view.setTeamSize}
              testIdPrefix="salvage"
            />
            <PreferenceControls
              preferences={view.preferences}
              availableTraits={view.availableTraits}
              availableDamageTypes={view.availableDamageTypes}
              onChange={view.setPreferences}
              testIdPrefix="salvage"
            />
          </div>
          {isMobile ? (
            <SalvageMobile
              recommendations={view.recommendations}
              onRegenerate={view.regenerate}
              onToggleLock={view.toggleRandomLock}
            />
          ) : (
            <SalvageDesktop
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
    <div className="space-y-5 md:space-y-7" data-testid="salvage-run-page">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      {body}
    </div>
  )
}
