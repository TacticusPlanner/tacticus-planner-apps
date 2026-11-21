import { useTranslation } from "react-i18next"
import { rarityIcon } from "@workspace/game-catalog"
import type { Rarity } from "@workspace/game-domain"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

import { entityIconClassName } from "./game-icon-size"
import type { EntityIconSize } from "./game-icon-size"

/** Rarity badge icon; the rarity name is shown as a tooltip instead of text. `size` is its role on the
 *  icon scale (UI style guide, rule 6); `className` is for placement only. */
export function RarityIcon({
  rarity,
  size = "inline",
  className,
}: {
  rarity: Rarity
  size?: EntityIconSize
  className?: string
}) {
  const { t } = useTranslation(["progression"])
  const label = t(`rarities.${rarity}`, { defaultValue: rarity })

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <img
          src={rarityIcon(rarity)}
          alt={label}
          className={cn(entityIconClassName(size), className)}
        />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
