import { Info, Share2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"
import { Label } from "@workspace/ui/components/label"
import { Slider } from "@workspace/ui/components/slider"
import { Switch } from "@workspace/ui/components/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

import {
  rankAt,
  rankIndex,
  rankOrder,
  type FactionGroup,
  type Progression,
  type Rank,
} from "@workspace/game-catalog"

import {
  CharacterCombobox,
  ProgressionSelect,
  RankBadge,
  RankSelect,
} from "@/shared/ui"

import { shareCurrentLookupUrl } from "./character-lookup-share"

const maxIndex = rankOrder.length - 1

export function CharacterLookupControls({
  characterGroups,
  characterId,
  onCharacterChange,
  rankStart,
  rankEnd,
  onRangeChange,
  progressionStart,
  progressionEnd,
  onProgressionRangeChange,
  pointFive,
  pointFiveDisabled,
  onPointFiveChange,
  onApply,
  applyDisabled,
  isMobile,
}: {
  characterGroups: FactionGroup[]
  characterId?: string
  onCharacterChange: (id: string) => void
  rankStart: Rank
  rankEnd: Rank
  onRangeChange: (start: Rank, end: Rank) => void
  progressionStart: Progression
  progressionEnd: Progression
  onProgressionRangeChange: (start: Progression, end: Progression) => void
  pointFive: boolean
  pointFiveDisabled: boolean
  onPointFiveChange: (value: boolean) => void
  onApply: () => void
  applyDisabled: boolean
  isMobile: boolean
}) {
  const { t } = useTranslation()

  const handleShare = () => {
    void shareCurrentLookupUrl(isMobile).then((result) => {
      if (result === "shared") return
      toast[result === "copied" ? "success" : "error"](
        t(
          result === "copied"
            ? "unitLookup.share.copied"
            : "unitLookup.share.error"
        )
      )
    })
  }

  // The other select's options are pre-filtered to keep start < end, so a plain set suffices.
  const selectStart = (next: Rank) => onRangeChange(next, rankEnd)
  const selectEnd = (next: Rank) => onRangeChange(rankStart, next)
  const startOptions = rankOrder.filter(
    (_, index) => index < rankIndex(rankEnd)
  )
  const endOptions = rankOrder.filter(
    (_, index) => index > rankIndex(rankStart)
  )

  // Unlike the rank range, "from" and "to" progression are allowed to be equal (e.g. checking
  // stats across a rank change alone, without also changing rarity/stars), so both selects offer
  // the full ladder.
  const selectProgressionStart = (next: Progression) =>
    onProgressionRangeChange(next, progressionEnd)
  const selectProgressionEnd = (next: Progression) =>
    onProgressionRangeChange(progressionStart, next)

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-2" data-testid="lookup-character-select">
        <Label>{t("unitLookup.character")}</Label>
        <CharacterCombobox
          groups={characterGroups}
          value={characterId}
          onChange={onCharacterChange}
          placeholder={t("unitLookup.characterPlaceholder")}
          emptyText={t("unitLookup.noCharacter")}
        />
      </div>

      <div className="grid gap-2">
        <Label>{t("unitLookup.rankRange")}</Label>
        {isMobile ? (
          <div className="grid grid-cols-2 gap-3">
            <RankSelect
              label={t("unitLookup.start")}
              value={rankStart}
              options={startOptions}
              onChange={selectStart}
            />
            <RankSelect
              label={t("unitLookup.end")}
              value={rankEnd}
              options={endOptions}
              onChange={selectEnd}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3 pt-1">
            <div className="flex items-center justify-between gap-2">
              <RankBadge rank={rankStart} iconClassName="size-8" />
              <span aria-hidden className="text-muted-foreground">
                →
              </span>
              <RankBadge rank={rankEnd} iconClassName="size-8" />
            </div>
            <Slider
              value={[rankIndex(rankStart), rankIndex(rankEnd)]}
              min={0}
              max={maxIndex}
              step={1}
              minStepsBetweenThumbs={1}
              onValueChange={([start, end]) =>
                onRangeChange(rankAt(start), rankAt(end))
              }
              aria-label={t("unitLookup.rankRange")}
            />
          </div>
        )}
      </div>

      <div className="grid gap-2">
        <Label>{t("unitLookup.progression")}</Label>
        <div className="grid grid-cols-2 gap-3">
          <ProgressionSelect
            label={t("unitLookup.start")}
            value={progressionStart}
            onChange={selectProgressionStart}
          />
          <ProgressionSelect
            label={t("unitLookup.end")}
            value={progressionEnd}
            onChange={selectProgressionEnd}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="point-five"
          checked={pointFive}
          disabled={pointFiveDisabled}
          onCheckedChange={onPointFiveChange}
        />
        <Label htmlFor="point-five">{t("unitLookup.pointFive")}</Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={t("unitLookup.pointFive")}
              className="text-muted-foreground hover:text-foreground"
            >
              <Info className="size-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            {pointFiveDisabled
              ? t("unitLookup.pointFiveAdamantineDisabled")
              : t("unitLookup.pointFiveHint")}
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-center gap-2">
        <Button
          className="flex-1"
          data-testid="lookup-apply-button"
          disabled={applyDisabled}
          onClick={onApply}
        >
          {t("unitLookup.apply")}
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label={t("unitLookup.share.action")}
              data-testid="lookup-share-button"
              onClick={handleShare}
              size="icon"
              variant="outline"
            >
              <Share2 />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("unitLookup.share.action")}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
