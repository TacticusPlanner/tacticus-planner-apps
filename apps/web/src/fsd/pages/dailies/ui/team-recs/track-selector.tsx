import { useTranslation } from "react-i18next"
import { onslaughtAllianceIcon } from "@workspace/game-catalog"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

import { EntityIcon } from "@/shared/ui"

import {
  SALVAGE_TRACKS,
  type SalvageTrack,
} from "../../model/salvage-recommendations.types"

/**
 * The page-level alliance track switch — Imperial / Chaos / Xenos — shared by the Salvage Run and
 * Onslaught pages. Selecting a track narrows every recommendation on the page to that alliance. Its
 * value is persisted per browser by the page's hook. The owning page supplies its i18n namespace
 * (both `salvageRun` and `onslaught` carry the same `track.{label,imperial,chaos,xenos}` keys) and a
 * test-id prefix so the two pages get distinct selectors.
 */
export function AllianceTrackSelector({
  track,
  onTrackChange,
  namespace,
  testIdPrefix,
}: {
  track: SalvageTrack
  onTrackChange: (track: SalvageTrack) => void
  namespace: "salvageRun" | "onslaught"
  testIdPrefix: string
}) {
  const { t } = useTranslation(namespace)

  return (
    <div className="space-y-1" data-testid={`${testIdPrefix}-track-selector`}>
      <p className="text-xs font-normal text-muted-foreground">
        {t("track.label")}
      </p>
      <Tabs
        value={track}
        onValueChange={(value) => onTrackChange(value as SalvageTrack)}
      >
        <TabsList>
          {SALVAGE_TRACKS.map((option) => (
            <TabsTrigger
              key={option}
              value={option}
              className="gap-2"
              data-testid={`${testIdPrefix}-track-${option.toLowerCase()}`}
            >
              <EntityIcon
                src={onslaughtAllianceIcon(option)}
                alt=""
                className="size-4 shrink-0"
              />
              {t(`track.${option.toLowerCase() as Lowercase<SalvageTrack>}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}
