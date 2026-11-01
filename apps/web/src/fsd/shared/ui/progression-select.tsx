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

import { progressionVisual } from "@workspace/game-catalog"
import {
  progressionOrder,
  progressionRarity,
  type Progression,
} from "@workspace/game-domain"

import { EntityIcon } from "./entity-icon"
import { RarityIcon } from "./rarity-icon"

export function ProgressionSelect({
  label,
  value,
  options = progressionOrder,
  onChange,
}: {
  label: string
  value: Progression
  options?: readonly Progression[]
  onChange: (value: Progression) => void
}) {
  const id = useId()
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Select value={value} onValueChange={(v) => onChange(v as Progression)}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
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
export function ProgressionBadge({
  value,
  size = "md",
}: {
  value: Progression
  /** `lg` enlarges the icons for scan-first lists (the Goals table's Goal column). */
  size?: "md" | "lg"
}) {
  const { t } = useTranslation(["progression"])
  const large = size === "lg"
  const rarity = progressionRarity(value)
  const stars = value.slice(value.indexOf(":") + 1)
  const visual = progressionVisual(value)
  const starsLabel = t(`stars.${stars}`, { defaultValue: stars })

  return (
    <span className="inline-flex items-center gap-1.5">
      <RarityIcon rarity={rarity} className={large ? "size-6" : "size-4"} />
      {visual.kind === "none" ? (
        <span className="text-sm">{starsLabel}</span>
      ) : visual.kind === "wings" ? (
        <EntityIcon
          src={visual.icon}
          alt={starsLabel}
          className={large ? "h-6 w-auto" : "h-4 w-auto"}
        />
      ) : (
        <span className="inline-flex items-center gap-0.5">
          {Array.from({ length: visual.count }, (_, index) => (
            <EntityIcon
              key={index}
              src={visual.icon}
              alt={index === 0 ? starsLabel : ""}
              className={large ? "size-5" : "size-3.5"}
            />
          ))}
        </span>
      )}
    </span>
  )
}
