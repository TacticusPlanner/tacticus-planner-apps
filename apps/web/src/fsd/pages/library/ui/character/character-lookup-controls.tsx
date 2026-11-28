import { Share2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "@workspace/ui/lib/toast"
import { Button } from "@workspace/ui/components/button"
import { Label } from "@workspace/ui/components/label"
import { Slider } from "@workspace/ui/components/slider"
import { Switch } from "@workspace/ui/components/switch"

import { lastRank, rankAt, rankIndex, rankOrder } from "@workspace/game-domain"
import type { Progression, Rank } from "@workspace/game-domain"

import { ProgressionSelect, RankBadge, RankSelect } from "@/shared/ui"

import { shareCurrentLookupUrl } from "../../model/character/character-lookup-share"

// lastRank is currently Adamantine2 — Adamantine3 is planned but not yet in the ladder at all (see
// lastRank's own comment in @workspace/game-catalog).
const maxIndex = rankIndex(lastRank)

export function CharacterLookupControls({
  rankStart,
  rankEnd,
  onRangeChange,
  progressionStart,
  progressionEnd,
  onProgressionRangeChange,
  pointFive,
  pointFiveDisabled,
  onPointFiveChange,
  includeOwned,
  includeOwnedDisabled,
  onIncludeOwnedChange,
  onApply,
  applyDisabled,
  isMobile,
}: {
  rankStart: Rank
  rankEnd: Rank
  onRangeChange: (start: Rank, end: Rank) => void
  progressionStart: Progression
  progressionEnd: Progression
  onProgressionRangeChange: (start: Progression, end: Progression) => void
  pointFive: boolean
  pointFiveDisabled: boolean
  onPointFiveChange: (value: boolean) => void
  includeOwned: boolean
  includeOwnedDisabled: boolean
  onIncludeOwnedChange: (value: boolean) => void
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

  // Both rank selects offer the full reachable ladder. The range setter clamps the selected values
  // and auto-advances "to" when needed to keep the resulting range valid.
  const selectStart = (next: Rank) => onRangeChange(next, rankEnd)
  const selectEnd = (next: Rank) => onRangeChange(rankStart, next)
  const startOptions = rankOrder.filter((_, index) => index <= maxIndex)
  const endOptions = rankOrder.filter((_, index) => index <= maxIndex)

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
              <RankBadge rank={rankStart} size="icon-lg" />
              <span aria-hidden className="text-muted-foreground">
                →
              </span>
              <RankBadge rank={rankEnd} size="icon-lg" />
            </div>
            <Slider
              value={[rankIndex(rankStart), rankIndex(rankEnd)]}
              min={0}
              max={maxIndex}
              step={1}
              minStepsBetweenThumbs={1}
              onValueChange={([start, end]) => {
                if (start === undefined || end === undefined) return
                onRangeChange(rankAt(start), rankAt(end))
              }}
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

      {/* What each switch does is in the page tour; a switch that can't be used says why. */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Switch
            id="point-five"
            checked={pointFive}
            disabled={pointFiveDisabled}
            onCheckedChange={onPointFiveChange}
            aria-describedby={
              pointFiveDisabled ? "point-five-disabled" : undefined
            }
          />
          <Label htmlFor="point-five">{t("unitLookup.pointFive")}</Label>
        </div>
        {pointFiveDisabled ? (
          <p className="text-sm text-muted-foreground" id="point-five-disabled">
            {t("unitLookup.pointFiveAdamantineDisabled")}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Switch
            id="include-owned"
            checked={includeOwned}
            disabled={includeOwnedDisabled}
            onCheckedChange={onIncludeOwnedChange}
            aria-describedby={
              includeOwnedDisabled ? "include-owned-disabled" : undefined
            }
          />
          <Label htmlFor="include-owned">
            {t("unitLookup.includeOwnedUpgrades")}
          </Label>
        </div>
        {includeOwnedDisabled ? (
          <p
            className="text-sm text-muted-foreground"
            id="include-owned-disabled"
          >
            {t("unitLookup.includeOwnedUpgradesSignInRequired")}
          </p>
        ) : null}
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
        <Button
          data-testid="lookup-share-button"
          onClick={handleShare}
          variant="outline"
        >
          <Share2 data-icon="inline-start" />
          {t("unitLookup.share.action")}
        </Button>
      </div>
    </div>
  )
}
