import { useTranslation } from "react-i18next"
import { progressionRarity, type Progression } from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"

import { CompactStars } from "./compact-stars"
import { progressionText } from "./progression-text"
import { RarityIcon } from "./rarity-icon"

/**
 * A progression in its compact form: the rarity icon (its name in a tooltip), then one star icon and
 * the star count (or the wings at the top step). The whole badge is named by its short text
 * ("Legendary 5★") for assistive technology. `fade` dims one half, e.g. the rarity on a promotion.
 * Collection's roster rows, the compare marks and the LE leaderboard all use this one visual.
 */
export function CompactProgression({
  value,
  className,
  iconClassName = "size-5",
  fade,
  "data-testid": testId,
}: {
  value: Progression
  className?: string
  iconClassName?: string
  fade?: "rarity" | "stars"
  "data-testid"?: string
}) {
  const { t } = useTranslation(["progression"])
  return (
    <span
      aria-label={progressionText(t, value)}
      className={cn("inline-flex shrink-0 items-center gap-1", className)}
      data-progression={value}
      data-testid={testId}
      role="img"
    >
      <RarityIcon
        className={cn(iconClassName, fade === "rarity" && fadedPart)}
        rarity={progressionRarity(value)}
      />
      <CompactStars
        className={fade === "stars" ? fadedPart : undefined}
        progression={value}
      />
    </span>
  )
}

const fadedPart = "opacity-35"
