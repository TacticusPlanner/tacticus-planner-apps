import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

import type {
  HseTeamMode,
  HseTeamRecommendations,
} from "../../model/hse-team-recommendations.types"
import { HseEnemyHints } from "./hse-enemy-hints"
import { HseTeamCard } from "./hse-team-card"
import { hseTeamTestId } from "./hse-team-test-id"

/** Mobile layout (below 768px): a segmented control over the modes the event scores in, defaulting
 * to the first, with the chosen mode's hints and teams stacked under it. The choice is local state
 * and resets on navigation. */
export function HseTeamsMobile({
  recommendations,
}: {
  recommendations: HseTeamRecommendations
}) {
  const { t } = useTranslation("dailies")
  const [chosen, setChosen] = useState<HseTeamMode | null>(null)
  const modes = recommendations.modes
  const selected =
    modes.find((entry) => entry.mode === chosen) ?? modes[0] ?? null
  if (!selected) return null

  return (
    <div className="space-y-3" data-testid="hse-teams-mobile">
      <Tabs
        onValueChange={(value) => setChosen(value as HseTeamMode)}
        value={selected.mode}
      >
        <TabsList
          aria-label={t("hse.teams.modeLabel")}
          className="w-full"
          data-testid="hse-teams-mode-control"
        >
          {modes.map(({ mode }) => (
            <TabsTrigger
              className="flex-1"
              data-testid={`hse-teams-mode-option-${mode.toLowerCase()}`}
              key={mode}
              value={mode}
            >
              {t(`hse.details.modes.${mode}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div
        className="space-y-3"
        data-testid={`hse-teams-mode-${selected.mode.toLowerCase()}`}
      >
        <HseEnemyHints hints={selected.hints} mode={selected.mode} />
        {selected.teams.map((team) => (
          <HseTeamCard
            key={hseTeamTestId(selected.mode, team)}
            mode={selected.mode}
            team={team}
          />
        ))}
      </div>
    </div>
  )
}
