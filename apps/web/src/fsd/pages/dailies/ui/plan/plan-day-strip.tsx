import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

import type { DailyRaidsReadyViewModel } from "@/features/daily-raids"
import type { PlanDayCells } from "../../model/plan-day-cells"
import { PlanDayCard } from "./plan-day-card"
import { useDragScroll } from "./use-drag-scroll"

export const PLAN_DAY_LIMIT = 3
const MIN_CARD_HEIGHT_PX = 448
// Page padding plus the strip's horizontal scrollbar.
const BOTTOM_GAP_PX = 56

export function PlanDayStrip({
  cellsByDay,
  jumpTo,
  onShowAll,
  raids,
  selectedUnitId,
  showAllDays,
}: {
  cellsByDay: PlanDayCells[]
  // A fresh object per jump, so jumping to the same day twice scrolls twice.
  jumpTo: { day: number } | undefined
  onShowAll: () => void
  raids: DailyRaidsReadyViewModel
  selectedUnitId: string | undefined
  showAllDays: boolean
}) {
  const { t } = useTranslation("dailies")
  const stripRef = useRef<HTMLDivElement>(null)
  const [mountedDays, setMountedDays] = useState<ReadonlySet<number>>(
    () =>
      new Set(Array.from({ length: PLAN_DAY_LIMIT }, (_, index) => index + 1))
  )
  useDragScroll(stripRef)

  // Cards fill the viewport below the strip's own top edge, wherever that lands (the blocker panel
  // above can add height), so the page itself never needs a vertical scrollbar.
  const [cardHeight, setCardHeight] = useState<number>()
  useLayoutEffect(() => {
    const strip = stripRef.current
    if (!strip) return
    const update = () =>
      setCardHeight(
        Math.max(
          MIN_CARD_HEIGHT_PX,
          Math.round(
            window.innerHeight -
              (strip.getBoundingClientRect().top + window.scrollY) -
              BOTTOM_GAP_PX
          )
        )
      )
    update()
    window.addEventListener("resize", update)
    const observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(update)
    observer?.observe(document.body)
    return () => {
      window.removeEventListener("resize", update)
      observer?.disconnect()
    }
  }, [])

  const visibleDays = showAllDays
    ? raids.planDays
    : raids.planDays.slice(0, PLAN_DAY_LIMIT)
  const visibleCount = visibleDays.length

  // Grids mount when their card comes within about one card width of the strip and then stay.
  useEffect(() => {
    const strip = stripRef.current
    if (!strip) return
    const cards = strip.querySelectorAll<HTMLElement>("[data-plan-day]")
    if (typeof IntersectionObserver === "undefined") {
      setMountedDays(
        new Set(Array.from(cards, (c) => Number(c.dataset.planDay)))
      )
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const seen = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => Number((entry.target as HTMLElement).dataset.planDay))
        if (seen.length === 0) return
        setMountedDays((current) =>
          seen.every((day) => current.has(day))
            ? current
            : new Set([...current, ...seen])
        )
      },
      { root: strip, rootMargin: "0px 340px" }
    )
    cards.forEach((card) => observer.observe(card))
    return () => observer.disconnect()
  }, [visibleCount])

  // The page reveals every day before jumping to an unrevealed one, so the card exists by now.
  useEffect(() => {
    if (!jumpTo) return
    stripRef.current
      ?.querySelector(`[data-plan-day="${jumpTo.day}"]`)
      ?.scrollIntoView({ inline: "start", block: "nearest" })
  }, [jumpTo])

  return (
    <div
      ref={stripRef}
      className="relative flex cursor-grab gap-3 overflow-x-auto pb-2 select-none active:cursor-grabbing"
      data-testid="plan-days"
      style={
        cardHeight
          ? ({ "--plan-card-h": `${cardHeight}px` } as CSSProperties)
          : undefined
      }
    >
      {visibleDays.map((day, index) => (
        <PlanDayCard
          key={day.day}
          cells={cellsByDay[index]!}
          day={day}
          mounted={mountedDays.has(day.day)}
          raids={raids}
          selectedUnitId={selectedUnitId}
        />
      ))}
      {!showAllDays && raids.planDays.length > PLAN_DAY_LIMIT ? (
        <div className="flex shrink-0 items-start">
          <Button variant="outline" onClick={onShowAll}>
            {t("plan.showAll")}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
