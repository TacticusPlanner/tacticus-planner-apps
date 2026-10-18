import { useTranslation } from "react-i18next"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import type { HseTeamsViewModel } from "../../model/hse-team-recommendations.types"
import { TeamRecsState } from "../team-recs/team-recs-state"
import { HseTeamsDesktop } from "./hse-teams-desktop"
import { HseTeamsMobile } from "./hse-teams-mobile"

/**
 * Dailies > HSE event teams: Power-mode teams for the Arena, Onslaught and Salvage Run the event
 * scores in, led by the units that score. Loading and a failed roster read use the shared team
 * states; nothing renders when the event gets no teams (past, Global, no scoring data).
 */
export function HseTeamsSection({ view }: { view: HseTeamsViewModel }) {
  const { t } = useTranslation("dailies")
  const isMobile = useIsMobile()
  if (view.status === "hidden") return null

  return (
    <section
      className="space-y-3 rounded-xl border p-4"
      data-testid="hse-teams"
    >
      <div className="space-y-1">
        <h2 className="font-semibold">{t("hse.teams.title")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("hse.teams.description")}
        </p>
      </div>
      {view.status === "loading" ? (
        <TeamRecsState state="loading" testIdPrefix="hse-teams" />
      ) : view.status === "error" ? (
        <TeamRecsState
          onRetry={view.retry}
          state="error"
          testIdPrefix="hse-teams"
        />
      ) : isMobile ? (
        <HseTeamsMobile recommendations={view.recommendations} />
      ) : (
        <HseTeamsDesktop recommendations={view.recommendations} />
      )}
    </section>
  )
}
