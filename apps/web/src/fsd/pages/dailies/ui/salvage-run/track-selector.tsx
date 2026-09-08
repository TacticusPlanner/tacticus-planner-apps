import { useTranslation } from "react-i18next"
import { onslaughtAllianceIcon } from "@workspace/game-catalog"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

import { EntityIcon } from "@/shared/ui"

import {
  SALVAGE_TRACKS,
  type SalvageTrack,
} from "../../model/salvage-recommendations.types"

/**
 * The page-level Salvage Run alliance track switch — Imperial / Chaos / Xenos. Selecting a track
 * narrows every recommendation on the page to that alliance. Its value is persisted per browser by
 * the page's hook.
 */
export function AllianceTrackSelector({
  track,
  onTrackChange,
}: {
  track: SalvageTrack
  onTrackChange: (track: SalvageTrack) => void
}) {
  const { t } = useTranslation("salvageRun")

  return (
    <div className="space-y-1" data-testid="salvage-track-selector">
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
              data-testid={`salvage-track-${option.toLowerCase()}`}
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
