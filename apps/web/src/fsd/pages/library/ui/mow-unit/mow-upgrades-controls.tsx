import { useId } from "react"
import type { UpgradeId } from "@workspace/game-domain"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

import type { UpgradeWithFarmLocations } from "@/entities/rank-lookup"
import { UpgradeIcon } from "@/shared/ui"

/** One step's recipe as small material icons with counts; the name is the icon's accessible label. */
export function RecipeIcons({
  recipe,
  upgradesById,
  nameOf,
}: {
  recipe: readonly UpgradeId[]
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>
  nameOf: (id: UpgradeId) => string
}) {
  const counts = new Map<UpgradeId, number>()
  for (const id of recipe) counts.set(id, (counts.get(id) ?? 0) + 1)
  return (
    <ul className="flex flex-wrap gap-1.5">
      {[...counts].map(([id, count]) => {
        const upgrade = upgradesById.get(id)
        return (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <li className="inline-flex items-center gap-0.5">
                <span role="img" aria-label={nameOf(id)}>
                  <UpgradeIcon
                    id={id}
                    rarity={upgrade?.rarity}
                    crafted={upgrade?.crafted}
                    size="inline"
                  />
                </span>
                {count > 1 ? <span className="text-xs">×{count}</span> : null}
              </li>
            </TooltipTrigger>
            <TooltipContent>{nameOf(id)}</TooltipContent>
          </Tooltip>
        )
      })}
    </ul>
  )
}

/** A labelled level select offering `min`…`max`. */
export function LevelSelect({
  label,
  value,
  min,
  max,
  onChange,
  "data-testid": testId,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (level: number) => void
  "data-testid": string
}) {
  const id = useId()
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Select
        value={String(value)}
        onValueChange={(next) => onChange(Number(next))}
      >
        <SelectTrigger id={id} className="h-10 w-full" data-testid={testId}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: max - min + 1 }, (_, index) => min + index).map(
            (level) => (
              <SelectItem key={level} value={String(level)}>
                {level}
              </SelectItem>
            )
          )}
        </SelectContent>
      </Select>
    </div>
  )
}
