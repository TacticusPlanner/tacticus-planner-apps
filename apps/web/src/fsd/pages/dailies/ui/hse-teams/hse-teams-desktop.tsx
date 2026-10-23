import { useTranslation } from "react-i18next"

import type { HseTeamRecommendations } from "@/features/team-recommendations"
import { HseEnemyHints } from "./hse-enemy-hints"
import { HseTeamCard } from "./hse-team-card"
import { hseTeamTestId } from "./hse-team-test-id"

/** Desktop layout (768px and up): one block per scoring mode — the Arena card, then a row of three
 * alliance cards for Onslaught and for Salvage Run — each under its mode name and hints. */
export function HseTeamsDesktop({
  recommendations,
}: {
  recommendations: HseTeamRecommendations
}) {
  const { t } = useTranslation("dailies")
  return (
    <div className="space-y-5" data-testid="hse-teams-desktop">
      {recommendations.modes.map(({ mode, hints, teams }) => (
        <div
          className="space-y-2"
          data-testid={`hse-teams-mode-${mode.toLowerCase()}`}
          key={mode}
        >
          <h3 className="text-sm font-semibold">
            {t(`hse.details.modes.${mode}`)}
          </h3>
          <HseEnemyHints hints={hints} mode={mode} />
          <div className="grid grid-cols-3 items-start gap-4">
            {teams.map((team) => (
              <HseTeamCard
                key={hseTeamTestId(mode, team)}
                mode={mode}
                team={team}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
