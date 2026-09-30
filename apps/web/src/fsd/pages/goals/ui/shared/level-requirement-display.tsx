import { useTranslation } from "react-i18next"
import { xpBookIcon } from "@workspace/game-catalog"
import type { Rarity } from "@workspace/game-domain"

import { EntityIcon } from "@/shared/ui"

import type { LevelRequirementProgress } from "../../model/attainment/level-requirement-progress"
import { GoalProgressDisplay, GoalTargetDisplay } from "./goal-progress-visuals"

export type XpBookFigure = {
  needed: number
  available: number
  rarity: Rarity
}

/** The level requirement of a Rank/Ability goal as ONE compact line in the Progress cell, beneath
 * the goal's own progress (`goal-list-layout`): the level target ("Lv 44 → 50"), the XP-book figure
 * (book icon, available of needed — omitted when no books are needed), and a Potential-only bar —
 * count beside the bar, like the Unlock goal's owned/required count. Leveling happens as a side effect
 * of ranking up, so only how far owned books could get the character is new information. Ordinary
 * progress, never a blocker. Renders nothing when the character's level is already sufficient
 * (`levelRequirement` is `null`). */
export function LevelRequirementLine({
  levelRequirement,
  potentialRatio,
  xpBooks,
}: {
  levelRequirement: LevelRequirementProgress | null | undefined
  potentialRatio: number | undefined
  xpBooks?: XpBookFigure
}) {
  const { t, i18n } = useTranslation()
  if (!levelRequirement) return null
  const fmt = (value: number) =>
    new Intl.NumberFormat(i18n?.resolvedLanguage).format(value)
  const book = xpBooks && xpBooks.needed > 0 ? xpBooks : undefined
  const bookText = book
    ? t("goals.resourceChips.xpBooksValue", {
        available: fmt(book.available),
        needed: fmt(book.needed),
      })
    : null
  const bookLabel =
    book && bookText
      ? t("goals.resourceChips.chipLabel", {
          name: t("goals.resourceChips.xpBooks", {
            rarity: t(`goals.resourceChips.rarity.${book.rarity}`),
          }),
          quantity: bookText,
        })
      : undefined

  return (
    <div
      className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"
      data-testid="level-requirement-line"
    >
      <span
        className="whitespace-nowrap"
        data-testid="level-requirement-target"
      >
        <GoalTargetDisplay progress={levelRequirement} />
      </span>
      {book ? (
        <span
          aria-label={bookLabel}
          className="flex items-center gap-1 whitespace-nowrap tabular-nums"
          data-testid="level-requirement-books"
          role="img"
          title={bookLabel}
        >
          <EntityIcon alt="" className="size-4" src={xpBookIcon(book.rarity)} />
          <span aria-hidden>{bookText}</span>
        </span>
      ) : null}
      <div className="min-w-0 flex-1" data-testid="level-requirement-progress">
        <GoalProgressDisplay
          potentialOnly
          // Paused goals have no plan potential; fall back to the actual ratio so the line keeps the
          // same compact potential-only layout (and height) as an Active goal's.
          potentialRatio={potentialRatio ?? levelRequirement.ratio ?? undefined}
          progress={levelRequirement}
        />
      </div>
    </div>
  )
}
