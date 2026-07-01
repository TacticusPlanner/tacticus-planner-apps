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
  progressionOrder,
  progressionRarity,
  progressionStars,
  progressionVisual,
  rankAt,
  rankIndex,
  rankOrder,
  type FactionGroup,
  type Progression,
  type Rank,
  type RarityStars,
} from "@workspace/game-catalog"

import { EntityIcon, RankBadge, RarityIcon } from "@/shared/ui"

import { CharacterCombobox } from "./character-combobox"

const maxIndex = rankOrder.length - 1

// V1 displays a RarityStars step by its own enum-key text (e.g. "RedOneStar", "MythicWings")
// rather than a fabricated rarity/star-count label, so this mirrors that: split the PascalCase id
// into words, e.g. "RedOneStar" → "Red One Star".
function progressionLabel(value: RarityStars): string {
  return value.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
}

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
      <div className="grid gap-2">
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

      <Button onClick={onApply} disabled={applyDisabled}>
        {t("unitLookup.apply")}
      </Button>
    </div>
  )
}

function ProgressionSelect({
  label,
  value,
  onChange,
}: {
  label: string
  value: Progression
  onChange: (value: Progression) => void
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v as Progression)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {progressionOrder.map((option) => (
            <SelectItem key={option} value={option}>
              <ProgressionBadge value={option} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// Renders a progression step as its rarity badge + star/wings icon(s) — the rarity badge makes
// the rank/rarity correlation visible (the same star count repeats at two different rarities
// around a promotion boundary, e.g. "Common:TwoStars" then "Uncommon:TwoStars"). Stars match V1's
// stars.icon.tsx (repeated gold/red/blue star images, or a single wings image at the max step) —
// except "None", which has nothing to show an icon for and stays as plain text.
function ProgressionBadge({ value }: { value: Progression }) {
  const rarity = progressionRarity(value)
  const stars = progressionStars(value)
  const visual = progressionVisual(stars)

  return (
    <span className="inline-flex items-center gap-1.5">
      <RarityIcon rarity={rarity} className="size-4" />
      {visual.kind === "none" ? (
        <span className="text-sm">{progressionLabel(stars)}</span>
      ) : visual.kind === "wings" ? (
        <EntityIcon
          src={visual.icon}
          alt={progressionLabel(stars)}
          className="h-4 w-auto"
        />
      ) : (
        <span className="inline-flex items-center gap-0.5">
          {Array.from({ length: visual.count }, (_, index) => (
            <EntityIcon
              key={index}
              src={visual.icon}
              alt={index === 0 ? progressionLabel(stars) : ""}
              className="size-3.5"
            />
          ))}
        </span>
      )}
    </span>
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
