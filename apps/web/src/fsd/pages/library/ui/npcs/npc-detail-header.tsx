import { useTranslation } from "react-i18next"
import { factionIcon } from "@workspace/game-catalog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"

import { NpcLevelBadge, NpcPortrait, type NpcLevelOption } from "@/entities/npc"
import { EntityIcon } from "@/shared/ui"

import type { NpcVariationOption } from "./npcs-page.view-model"

// Both selectors share one height, tall enough for the Variation value (mode label over the variation id),
// so the two fields line up; the value may span two lines and each line truncates instead of overflowing.
const SELECTOR_TRIGGER =
  "w-full min-w-0 data-[size=default]:h-11 *:data-[slot=select-value]:line-clamp-none *:data-[slot=select-value]:min-w-0"

export function NpcDetailHeader({
  name,
  factionId,
  factionName,
  variationOptions,
  selectedVariationId,
  onVariationChange,
  levels,
  selectedLevel,
  onLevelChange,
  compact = false,
}: {
  name: string
  factionId: string
  factionName: string
  variationOptions: NpcVariationOption[]
  selectedVariationId: string
  onVariationChange: (variationId: string) => void
  levels: NpcLevelOption[]
  selectedLevel: NpcLevelOption | undefined
  onLevelChange: (servedIndex: number) => void
  /** Mobile: full-width stacked selectors under the identity row. */
  compact?: boolean
}) {
  const { t } = useTranslation("library")
  const emblem = factionIcon(factionId)

  return (
    <div className="flex flex-col gap-4" data-testid="npc-detail-header">
      <div className="flex items-center gap-3">
        <NpcPortrait
          variationId={selectedVariationId}
          name={name}
          className="size-16"
        />
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold" data-testid="npc-name">
            {name}
          </h2>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {emblem ? (
              <EntityIcon src={emblem} alt="" className="size-4" />
            ) : null}
            <span className="truncate">{factionName}</span>
          </p>
          {selectedLevel ? (
            <NpcLevelBadge row={selectedLevel.row} className="mt-1" />
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          // Same column gap as the attack and ability grids, so every two-column block in the
          // detail shares one set of column origins.
          "grid gap-x-6 gap-y-3",
          compact ? "grid-cols-1" : "grid-cols-2"
        )}
      >
        <label className="flex min-w-0 flex-col gap-1 text-sm">
          <span className="text-muted-foreground">{t("npcs.variation")}</span>
          <Select
            value={selectedVariationId}
            onValueChange={onVariationChange}
            disabled={variationOptions.length <= 1}
          >
            <SelectTrigger
              className={SELECTOR_TRIGGER}
              data-testid="npcs-variation-select"
              aria-label={t("npcs.variation")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="start">
              <SelectGroup>
                {variationOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    <span className="flex min-w-0 flex-col items-start text-left leading-tight">
                      <span className="max-w-full truncate">
                        {option.label}
                      </span>
                      {option.label !== option.id ? (
                        <span className="max-w-full truncate text-xs text-muted-foreground">
                          {option.id}
                        </span>
                      ) : null}
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </label>

        <label className="flex min-w-0 flex-col gap-1 text-sm">
          <span className="text-muted-foreground">{t("npcs.level")}</span>
          <Select
            value={selectedLevel ? String(selectedLevel.servedIndex) : ""}
            onValueChange={(value) => onLevelChange(Number(value))}
            disabled={levels.length === 0}
          >
            <SelectTrigger
              className={SELECTOR_TRIGGER}
              data-testid="npcs-level-select"
              aria-label={t("npcs.level")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="start">
              <SelectGroup>
                {levels.map((level) => (
                  <SelectItem
                    key={level.servedIndex}
                    value={String(level.servedIndex)}
                  >
                    <NpcLevelBadge
                      row={level.row}
                      health={level.tie ? level.row.health : undefined}
                    />
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </label>
      </div>
    </div>
  )
}
