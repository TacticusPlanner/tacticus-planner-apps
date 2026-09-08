import { useTranslation } from "react-i18next"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { useArenaRecommendations } from "../../model/use-arena-recommendations"
import { ArenaModeToggle } from "./arena-mode-toggle"
import { ArenaState } from "./arena-state"
import { ArenaDesktop } from "./desktop/arena-desktop"
import { ArenaMobile } from "./mobile/arena-mobile"
import { useArenaTutorial } from "./arena-page.tutorial"

/**
 * Dailies → Arena: recommends Arena team compositions from the player's active project, active
 * goals, and roster so daily Arena battles also advance the current plan. XP Mode (default) farms
 * XP; Power Mode fields the strongest team.
 */
export function ArenaPage() {
  const { t } = useTranslation("arena")
  const isMobile = useIsMobile()
  const view = useArenaRecommendations()
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
        <ArenaModeToggle mode={view.mode} onModeChange={view.setMode} />
        {isMobile ? (
          <ArenaMobile
            recommendations={view.recommendations}
            onRegenerate={view.regenerate}
          />
        ) : (
          <ArenaDesktop
            recommendations={view.recommendations}
            onRegenerate={view.regenerate}
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
