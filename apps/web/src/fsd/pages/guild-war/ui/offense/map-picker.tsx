import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react"
import {
  guildWarBoardImage,
  guildWarBoardImageLarge,
} from "@workspace/game-catalog"
import { Button } from "@workspace/ui/components/button"
import { IconButton } from "@workspace/ui/components/icon-button"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/ui"

import type { GuildWarSeason } from "../../lib/season"
import { boardOverlay } from "../../model/board-overlay"
import { BoardLegend, BoardPicture } from "./board-picture"

/**
 * One board at full dialog width (a full-screen sheet on phones), from the 1080 px art cropped to
 * its battle grid with the deployment and blocked hexes marked (and what they mean), with the
 * previous and next board of the pool and Pick this map (Picked once it is the attack's).
 */
function MapViewer({
  season,
  index,
  onIndexChange,
  value,
  onPick,
  onClose,
}: {
  season: GuildWarSeason
  index: number
  onIndexChange: (index: number) => void
  value: string | null
  onPick: (boardId: string) => void
  onClose: () => void
}) {
  const { t } = useTranslation("guildWar")
  const count = season.maps.length
  const map = season.maps[index]
  const large = map ? guildWarBoardImageLarge(map.boardId) : undefined
  if (!map || !large) return null
  const picked = map.boardId === value
  const step = (by: number) => onIndexChange((index + by + count) % count)
  return (
    <ResponsiveDialog
      data-testid="guild-war-map-viewer"
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      open
      width="wide"
    >
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>
          {t("enemy.mapOption", { number: index + 1 })}
        </ResponsiveDialogTitle>
      </ResponsiveDialogHeader>
      <ResponsiveDialogBody>
        <BoardPicture
          alt={t("enemy.mapOption", { number: index + 1 })}
          board={map.board}
          className="aspect-square w-full rounded-lg"
          fit="contain"
          src={large}
        />
        {map.board && boardOverlay(map.board) ? (
          <BoardLegend
            labels={{
              attacker: t("enemy.mapHexes.attacker"),
              defender: t("enemy.mapHexes.defender"),
              blocked: t("enemy.mapHexes.blocked"),
            }}
          />
        ) : null}
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        <IconButton
          label={t("enemy.previousMap")}
          onClick={() => step(-1)}
          variant="outline"
        >
          <ChevronLeft />
        </IconButton>
        <IconButton
          label={t("enemy.nextMap")}
          onClick={() => step(1)}
          variant="outline"
        >
          <ChevronRight />
        </IconButton>
        <span className="flex-1" />
        <Button
          disabled={picked}
          onClick={() => {
            onPick(map.boardId)
            onClose()
          }}
        >
          {picked ? <Check data-icon="inline-start" /> : null}
          {picked ? t("enemy.mapPicked") : t("enemy.pickMap")}
        </Button>
      </ResponsiveDialogFooter>
    </ResponsiveDialog>
  )
}

/**
 * The map of an attack, picked from the season's map pool by its board picture (any lineup can be
 * on any pool board: maps are not tied to a zone). Optional: tapping the picked board again clears
 * it. Each board shows its art cropped to the battle grid with the deployment hexes marked, as the
 * game's deploy screen does. Its magnifier opens it large (`MapViewer`), where it can be picked too.
 * A board with no picture shipped yet shows its number.
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
  const [viewing, setViewing] = useState<number | null>(null)
  return (
    <>
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
            // The magnifier sits beside the board's toggle, never inside it (no button in a button).
            <div className="relative" key={map.boardId}>
              <ToggleGroupItem
                aria-label={label}
                className="relative aspect-square h-auto w-full overflow-hidden rounded-lg border-2 border-transparent p-0 data-[state=on]:border-primary data-[state=on]:bg-transparent"
                data-board={map.boardId}
                value={map.boardId}
              >
                {image ? (
                  <BoardPicture
                    alt=""
                    board={map.board}
                    className="size-full"
                    fit="cover"
                    lazy
                    src={image}
                  />
                ) : (
                  <span className="flex size-full items-center justify-center bg-muted text-sm text-muted-foreground tabular-nums">
                    {index + 1}
                  </span>
                )}
              </ToggleGroupItem>
              {image ? (
                <IconButton
                  className="absolute top-1 right-1 bg-background/80"
                  label={t("enemy.zoomMap", { number: index + 1 })}
                  onClick={() => setViewing(index)}
                  size="icon-sm"
                  variant="ghost"
                >
                  <ZoomIn />
                </IconButton>
              ) : null}
            </div>
          )
        })}
      </ToggleGroup>
      {viewing === null ? null : (
        <MapViewer
          index={viewing}
          onClose={() => setViewing(null)}
          onIndexChange={setViewing}
          onPick={onChange}
          season={season}
          value={value}
        />
      )}
    </>
  )
}
