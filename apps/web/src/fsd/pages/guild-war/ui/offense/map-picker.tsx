import { useTranslation } from "react-i18next"
import { guildWarBoardImage } from "@workspace/game-catalog"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

import type { GuildWarSeason } from "../../lib/season"

/**
 * The map of an attack, picked from the season's map pool by its board picture (any lineup can be
 * on any pool board: maps are not tied to a zone). Optional: tapping the picked board again clears
 * it. A board with no picture shipped yet shows its number.
 */
export function MapPicker({
  season,
  value,
  onChange,
}: {
  season: GuildWarSeason
  value: string | null
  onChange: (boardId: string | null) => void
}) {
  const { t } = useTranslation("guildWar")
  return (
    <ToggleGroup
      aria-label={t("enemy.map")}
      className="grid w-full grid-cols-3 gap-2 @md:grid-cols-5"
      data-testid="guild-war-enemy-map"
      onValueChange={(next) => onChange(next === "" ? null : next)}
      spacing={2}
      type="single"
      value={value ?? ""}
    >
      {season.maps.map((map, index) => {
        const label = t("enemy.mapOption", { number: index + 1 })
        const image = guildWarBoardImage(map.boardId)
        return (
          <ToggleGroupItem
            aria-label={label}
            className="relative aspect-square h-auto w-full overflow-hidden rounded-lg border-2 border-transparent p-0 data-[state=on]:border-primary data-[state=on]:bg-transparent"
            data-board={map.boardId}
            key={map.boardId}
            value={map.boardId}
          >
            {image ? (
              <img
                alt=""
                className="size-full object-cover"
                decoding="async"
                loading="lazy"
                src={image}
              />
            ) : (
              <span className="flex size-full items-center justify-center bg-muted text-sm text-muted-foreground tabular-nums">
                {index + 1}
              </span>
            )}
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}
