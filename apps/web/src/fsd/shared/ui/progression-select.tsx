import { useTranslation } from "react-i18next"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import {
  progressionOrder,
  progressionRarity,
  progressionStars,
  progressionVisual,
  type Progression,
} from "@workspace/game-catalog"

import { EntityIcon } from "./entity-icon"
import { RarityIcon } from "./rarity-icon"

export function ProgressionSelect({
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
  const { t } = useTranslation(["progression"])
  const rarity = progressionRarity(value)
  const stars = progressionStars(value)
  const visual = progressionVisual(stars)
  const starsLabel = t(`progression:${stars}`, { defaultValue: stars })

  return (
    <span className="inline-flex items-center gap-1.5">
      <RarityIcon rarity={rarity} className="size-4" />
      {visual.kind === "none" ? (
        <span className="text-sm">{starsLabel}</span>
      ) : visual.kind === "wings" ? (
        <EntityIcon src={visual.icon} alt={starsLabel} className="h-4 w-auto" />
      ) : (
        <span className="inline-flex items-center gap-0.5">
          {Array.from({ length: visual.count }, (_, index) => (
            <EntityIcon
              key={index}
              src={visual.icon}
              alt={index === 0 ? starsLabel : ""}
              className="size-3.5"
            />
          ))}
        </span>
      )}
    </span>
  )
}
