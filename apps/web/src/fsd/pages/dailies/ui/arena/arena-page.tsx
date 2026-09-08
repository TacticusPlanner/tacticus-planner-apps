import { useTranslation } from "react-i18next"
import { useOutletContext } from "react-router"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { ProjectSelect } from "@/entities/project"

import { useArenaRecommendations } from "../../model/use-arena-recommendations"
import { TeamModeToggle } from "../team-recs/mode-toggle"
import { PreferenceControls } from "../team-recs/preference-controls"
import { TeamRecsState } from "../team-recs/team-recs-state"
import { TeamSizeControl } from "../team-recs/team-size"
import type { DailiesOutletContext } from "../dailies-layout"
import { ArenaDesktop } from "./desktop/arena-desktop"
import { ArenaMobile } from "./mobile/arena-mobile"
import { useArenaTutorial } from "./arena-page.tutorial"

/**
 * Dailies → Arena: recommends Arena team compositions from the player's selected project, active
 * goals, and roster so daily Arena battles also advance the current plan. Page-level controls for
 * mode (XP / Power), the driving project, team size (3–5), and a preferred trait / damage type.
 */
export function ArenaPage() {
  const { t } = useTranslation(["arena", "teamRecs"])
  const isMobile = useIsMobile()
  const context = useOutletContext<DailiesOutletContext>()
  const view = useArenaRecommendations(context.projectId)
  useArenaTutorial()

  let body: React.ReactNode
  if (view.status === "loading") {
    body = <TeamRecsState state="loading" />
  } else if (view.status === "error") {
    body = <TeamRecsState state="error" onRetry={view.retry} />
  } else if (view.status === "no-characters") {
    body = <TeamRecsState state="no-characters" />
  } else {
    body = (
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <TeamModeToggle mode={view.mode} onModeChange={view.setMode} />
          <ProjectSelect
            projects={context.projects}
            projectId={context.projectId}
            onProjectIdChange={context.setProjectId}
            placeholder={t("teamRecs:project.label")}
            testId="arena-project-select"
            compact={false}
          />
          <TeamSizeControl
            value={view.teamSize}
            availableSizes={view.availableSizes}
            onValueChange={view.setTeamSize}
          />
          <PreferenceControls
            preferences={view.preferences}
            availableTraits={view.availableTraits}
            availableDamageTypes={view.availableDamageTypes}
            onChange={view.setPreferences}
          />
        </div>
        {isMobile ? (
          <ArenaMobile
            recommendations={view.recommendations}
            onRegenerate={view.regenerate}
            onToggleLock={view.toggleRandomLock}
          />
        ) : (
          <ArenaDesktop
            recommendations={view.recommendations}
            onRegenerate={view.regenerate}
            onToggleLock={view.toggleRandomLock}
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5 md:space-y-7" data-testid="arena-page">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      {body}
    </div>
  )
}
