import { useTranslation } from "react-i18next"
import { useOutletContext } from "react-router"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { ProjectSelect } from "@/entities/project"

import { useArenaRecommendations } from "../../model/use-arena-recommendations"
import type { DailiesOutletContext } from "../dailies-layout"
import { ArenaModeToggle } from "./arena-mode-toggle"
import { ArenaState } from "./arena-state"
import { ArenaTeamSize } from "./arena-team-size"
import { ArenaDesktop } from "./desktop/arena-desktop"
import { ArenaMobile } from "./mobile/arena-mobile"
import { useArenaTutorial } from "./arena-page.tutorial"

/**
 * Dailies → Arena: recommends Arena team compositions from the player's selected project, active
 * goals, and roster so daily Arena battles also advance the current plan. One page-level control
 * each for mode (XP / Power), the driving project, and team size (3–5).
 */
export function ArenaPage() {
  const { t } = useTranslation("arena")
  const isMobile = useIsMobile()
  const context = useOutletContext<DailiesOutletContext>()
  const view = useArenaRecommendations(context.projectId)
  useArenaTutorial()

  let body: React.ReactNode
  if (view.status === "loading") {
    body = <ArenaState state="loading" />
  } else if (view.status === "error") {
    body = <ArenaState state="error" onRetry={view.retry} />
  } else if (view.status === "no-characters") {
    body = <ArenaState state="no-characters" />
  } else {
    body = (
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <ArenaModeToggle mode={view.mode} onModeChange={view.setMode} />
          <ProjectSelect
            projects={context.projects}
            projectId={context.projectId}
            onProjectIdChange={context.setProjectId}
            placeholder={t("project.label")}
            testId="arena-project-select"
            compact={false}
          />
          <ArenaTeamSize
            value={view.teamSize}
            availableSizes={view.availableSizes}
            onValueChange={view.setTeamSize}
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
