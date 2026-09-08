import { useTranslation } from "react-i18next"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

import type { TeamMode } from "../../model/team-recommendations.types"

/** The single page-level XP / Power switch shared by the Dailies team pages. Applies to every
 * category at once; its value is persisted per browser by the owning page's hook. */
export function TeamModeToggle({
  mode,
  onModeChange,
  testIdPrefix = "arena",
}: {
  mode: TeamMode
  onModeChange: (mode: TeamMode) => void
  testIdPrefix?: string
}) {
  const { t } = useTranslation("teamRecs")

  return (
    <div className="space-y-1" data-testid={`${testIdPrefix}-mode-toggle`}>
      <Tabs
        value={mode}
        onValueChange={(value) => onModeChange(value as TeamMode)}
      >
        <TabsList>
          <TabsTrigger value="xp">{t("mode.xp")}</TabsTrigger>
          <TabsTrigger value="power">{t("mode.power")}</TabsTrigger>
        </TabsList>
      </Tabs>
      <p className="text-xs text-muted-foreground">
        {mode === "xp" ? t("mode.xpHint") : t("mode.powerHint")}
      </p>
    </div>
  )
}
