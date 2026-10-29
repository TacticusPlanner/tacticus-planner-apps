import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"
import { xpBookIcon } from "@workspace/game-catalog"
import type { Rarity } from "@workspace/game-domain"

import { EntityIcon } from "@/shared/ui"

import type { LevelRequirementProgress } from "@/features/goal-planning"
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
 * (`levelRequirement` is `null`). `booksFirst` uses the goal card's order — XP books, the bar, then the
 * level target; `trailing` renders at the line's right end, centered on it (the card's gold chip). */
export function LevelRequirementLine({
  levelRequirement,
  potentialRatio,
  xpBooks,
  booksFirst = false,
  trailing,
  className,
}: {
  levelRequirement: LevelRequirementProgress | null | undefined
  potentialRatio: number | undefined
  xpBooks?: XpBookFigure
  booksFirst?: boolean
  trailing?: ReactNode
  className?: string
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

  const target = (
    <span className="whitespace-nowrap" data-testid="level-requirement-target">
      <GoalTargetDisplay progress={levelRequirement} />
    </span>
  )
  const books = book ? (
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
  ) : null

  const bar = (
    <div className="min-w-0 flex-1" data-testid="level-requirement-progress">
      <GoalProgressDisplay
        potentialOnly
        // Paused goals have no plan potential; fall back to the actual ratio so the line keeps the
        // same compact potential-only layout (and height) as an Active goal's.
        potentialRatio={potentialRatio ?? levelRequirement.ratio ?? undefined}
        progress={levelRequirement}
      />
    </div>
  )

  return (
    <div
      className={cn(
        "mt-1 flex items-center gap-2 text-xs text-muted-foreground",
        className
      )}
      data-testid="level-requirement-line"
    >
      {booksFirst ? (
        <>
          {books}
          {bar}
          {target}
        </>
      ) : (
        <>
          {target}
          {books}
          {bar}
        </>
      )}
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  )
}
