import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"

/**
 * A unit's two ability levels as small boxes, as the Collection tile and the game show them. Under
 * a rarity cap, a level below the cap's target is amber.
 */
export function UnitAbilities({
  levels,
  under,
  className,
}: {
  levels: readonly [number, number]
  /** Which levels are under the rarity cap; the lineup marks them, the picker does not. */
  under?: readonly [boolean, boolean]
  className?: string
}) {
  const { t } = useTranslation("teams")
  return (
    <span
      aria-label={t("picker.abilities", {
        first: levels[0],
        second: levels[1],
      })}
      className={cn("flex gap-1 text-xs tabular-nums", className)}
      data-testid="team-unit-abilities"
      role="img"
    >
      {levels.map((level, index) => (
        <span
          className={cn(
            "grid h-5 min-w-7 place-items-center rounded-sm border px-1 font-semibold",
            under?.[index] &&
              "border-amber-600 text-amber-800 dark:border-amber-400 dark:text-amber-400"
          )}
          data-under={under?.[index] ? "true" : undefined}
          key={index}
        >
          {level}
        </span>
      ))}
    </span>
  )
}
