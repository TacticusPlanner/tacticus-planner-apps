import { useId } from "react"
import { useTranslation } from "react-i18next"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import { remainingShards } from "../../model/incursion-progress.model"
import type { Incursion } from "../../model/incursions.model"
import { useTierName } from "./use-tier-name"

/** "Cleared through" picker for one MoW and the shards its uncleared tiers still pay. */
export function IncursionProgressControl({
  incursion,
  tiersCleared,
  onChange,
}: {
  incursion: Incursion
  tiersCleared: number
  onChange: (tiersCleared: number) => void
}) {
  const { t } = useTranslation("incursions")
  const id = useId()
  const tierName = useTierName(incursion)
  const left = remainingShards(incursion, tiersCleared)
  const allCleared = tiersCleared >= incursion.tiers.length

  return (
    <div
      className="flex flex-wrap items-end gap-x-6 gap-y-2 rounded-lg border bg-muted/30 p-3"
      data-testid="incursion-progress"
    >
      <div className="grid gap-1.5">
        <Label htmlFor={id} className="text-xs text-muted-foreground">
          {t("progress.clearedThrough")}
        </Label>
        <Select
          value={String(tiersCleared)}
          onValueChange={(value) => onChange(Number(value))}
        >
          <SelectTrigger
            id={id}
            className="w-44"
            data-testid="incursion-progress-select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">{t("progress.none")}</SelectItem>
            {incursion.tiers.map((tier, position) => (
              <SelectItem key={tier.index} value={String(position + 1)}>
                {tierName(tier.index)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p
        className="text-sm text-muted-foreground"
        data-testid="incursion-progress-remaining"
      >
        {allCleared
          ? t("progress.allCleared")
          : left.mythicShards > 0
            ? t("progress.remainingMythic", left)
            : t("progress.remaining", { shards: left.shards })}
      </p>
    </div>
  )
}
