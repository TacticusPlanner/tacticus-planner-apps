import { useTranslation } from "react-i18next"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

import type { ArenaMode } from "../../model/arena-recommendations.types"

/** The single page-level XP / Power switch. Applies to every category at once and its value is
 * persisted per browser (see `usePersistedArenaMode`). */
export function ArenaModeToggle({
  mode,
  onModeChange,
}: {
  mode: ArenaMode
  onModeChange: (mode: ArenaMode) => void
}) {
  const { t } = useTranslation("arena")

  return (
    <div className="space-y-1" data-testid="arena-mode-toggle">
      <Tabs
        value={mode}
        onValueChange={(value) => onModeChange(value as ArenaMode)}
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
