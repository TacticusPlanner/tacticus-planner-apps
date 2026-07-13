import { useTranslation } from "react-i18next"
import { rarityIcon } from "@workspace/game-catalog"
import type { Rarity } from "@workspace/game-domain"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

/** Rarity badge icon; the rarity name is shown as a tooltip instead of text. */
export function RarityIcon({
  rarity,
  className = "size-6",
}: {
  rarity: Rarity
  className?: string
}) {
  const { t } = useTranslation(["progression"])
  const label = t(`rarities.${rarity}`, { defaultValue: rarity })

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <img src={rarityIcon(rarity)} alt={label} className={className} />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
