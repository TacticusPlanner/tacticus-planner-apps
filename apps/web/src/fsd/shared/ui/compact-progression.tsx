import { useTranslation } from "react-i18next"
import { progressionRarity, type Progression } from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"

import { CompactStars } from "./compact-stars"
import { progressionText } from "./progression-text"
import { RarityIcon } from "./rarity-icon"

/**
 * A progression in its compact form: the rarity icon (its name in a tooltip), then one star icon and
 * the star count (or the wings at the top step). The whole badge is named by its short text
 * ("Legendary 5★") for assistive technology.
 */
export function CompactProgression({
  value,
  className,
  iconClassName = "size-5",
  "data-testid": testId,
}: {
  value: Progression
  className?: string
  iconClassName?: string
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
      <RarityIcon className={iconClassName} rarity={progressionRarity(value)} />
      <CompactStars progression={value} />
    </span>
  )
}
