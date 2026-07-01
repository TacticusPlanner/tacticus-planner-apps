import { Info } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
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
  type Rank,
} from "@workspace/game-catalog"

import { RankBadge } from "@/shared/ui"

import { CharacterCombobox } from "./character-combobox"

const maxIndex = rankOrder.length - 1

export function RankLookupControls({
  characterGroups,
  characterId,
  onCharacterChange,
  rankStart,
  rankEnd,
  onRangeChange,
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
  pointFive: boolean
  pointFiveDisabled: boolean
  onPointFiveChange: (value: boolean) => void
  onApply: () => void
  applyDisabled: boolean
  isMobile: boolean
}) {
  const { t } = useTranslation()

  // The other select's options are pre-filtered to keep start < end, so a plain set suffices.
  const selectStart = (next: Rank) => onRangeChange(next, rankEnd)
  const selectEnd = (next: Rank) => onRangeChange(rankStart, next)
  const startOptions = rankOrder.filter(
    (_, index) => index < rankIndex(rankEnd)
  )
  const endOptions = rankOrder.filter(
    (_, index) => index > rankIndex(rankStart)
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-2">
        <Label>{t("rankLookup.character")}</Label>
        <CharacterCombobox
          groups={characterGroups}
          value={characterId}
          onChange={onCharacterChange}
          placeholder={t("rankLookup.characterPlaceholder")}
          emptyText={t("rankLookup.noCharacter")}
        />
      </div>

      <div className="grid gap-2">
        <Label>{t("rankLookup.rankRange")}</Label>
        {isMobile ? (
          <div className="grid grid-cols-2 gap-3">
            <RankSelect
              label={t("rankLookup.start")}
              value={rankStart}
              options={startOptions}
              onChange={selectStart}
            />
            <RankSelect
              label={t("rankLookup.end")}
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
              aria-label={t("rankLookup.rankRange")}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="point-five"
          checked={pointFive}
          disabled={pointFiveDisabled}
          onCheckedChange={onPointFiveChange}
        />
        <Label htmlFor="point-five">{t("rankLookup.pointFive")}</Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={t("rankLookup.pointFive")}
              className="text-muted-foreground hover:text-foreground"
            >
              <Info className="size-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            {pointFiveDisabled
              ? t("rankLookup.pointFiveAdamantineDisabled")
              : t("rankLookup.pointFiveHint")}
          </TooltipContent>
        </Tooltip>
      </div>

      <Button onClick={onApply} disabled={applyDisabled}>
        {t("rankLookup.apply")}
      </Button>
    </div>
  )
}

function RankSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: Rank
  options: Rank[]
  onChange: (rank: Rank) => void
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v as Rank)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((rank) => (
            <SelectItem key={rank} value={rank}>
              <RankBadge rank={rank} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
