import { useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown, ChevronRight, MoreHorizontal } from "lucide-react"
import { eventDay } from "@workspace/game-catalog"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"

import type { ClassifiedEntry, DayGroup } from "@/features/shops/event-planner"
import { EntityIcon } from "@/shared/ui"

import { DESTRUCTIVE_TEXT, TOUCH_ICON, TOUCH_SM } from "./day-state-style"
import { Cost } from "./event-shop-slots"
import type { EventShopController } from "./use-event-shop-controller"
import type { EventShopFormat } from "./use-event-shop-format"

type View = "upcoming" | "all"

/** Needs review lists this many entries before "Show all N". */
const REVIEW_SHOWN = 5

/**
 * The shopping list (spec event-shop-shopping-list): totals, Needs review, Today, later days and a
 * collapsed Done in the Upcoming view, or everything by week and day in All; Clear week per week; the
 * ended event's recap. Rendered in the desktop side column, the tablet drawer and the phone Plan tab.
 */
export function ShoppingList({
  controller,
  format,
  onGoToDay,
}: {
  controller: EventShopController
  format: EventShopFormat
  onGoToDay: (dayIndex: number) => void
}) {
  const { t } = useTranslation("eventShops")
  const [view, setView] = useState<View>("upcoming")
  // Done starts open when it holds a bought-ahead row, so its "Not on sale until" note is seen.
  const [showDoneChoice, setShowDone] = useState<boolean | null>(null)
  const [allReview, setAllReview] = useState(false)
  const { list, event, todayIndex } = controller
  const showDone =
    showDoneChoice ?? list.done.some((entry) => entry.boughtAhead)
  const currency = event.currency
  const cost = (amount: number) => (
    <Cost amount={amount} currency={currency} format={format} />
  )
  const row = (entry: ClassifiedEntry) => (
    <ListRow
      key={`${entry.dayIndex}-${entry.entry.slotIndex}`}
      controller={controller}
      entry={entry}
      format={format}
      onGoToDay={onGoToDay}
    />
  )
  const dayHeading = (group: DayGroup) =>
    format.date(eventDay(event, group.dayIndex).date)
  const empty = controller.entries.length === 0
  // "{range}: nothing left to buy" when the event runs past today and no later day has packs to buy.
  const lastDay = event.dayCount - 1
  const nothingLeft =
    todayIndex >= 0 && todayIndex < lastDay && list.later.length === 0
      ? t("list.nothingLeft", {
          range: `${format.date(eventDay(event, todayIndex + 1).date)} – ${format.date(eventDay(event, lastDay).date)}`,
        })
      : null

  return (
    <section
      className="flex flex-col gap-3"
      data-testid="event-shop-shopping-list"
    >
      <h2 className="text-base font-semibold">{t("list.title")}</h2>
      <dl
        className="grid grid-cols-4 gap-2 text-xs"
        data-testid="event-shop-totals"
      >
        {(["stillToBuy", "bought", "missed", "inCart"] as const).map((key) => (
          <div
            key={key}
            className="flex flex-col gap-0.5 rounded-md bg-muted/60 p-2"
          >
            <dt className="text-muted-foreground">{t(`list.totals.${key}`)}</dt>
            <dd
              className={cn(
                "font-semibold",
                key === "missed" &&
                  list.totals.missed > 0 &&
                  "text-amber-700 dark:text-amber-400"
              )}
              data-testid={`event-shop-total-${key}`}
            >
              {cost(list.totals[key])}
            </dd>
          </div>
        ))}
      </dl>
      {list.ended ? (
        <div
          className="flex flex-wrap items-center gap-x-2 rounded-md bg-muted p-2 text-sm"
          data-testid="event-shop-ended-recap"
        >
          <p>{t("list.ended")}</p>
          {!empty && view === "upcoming" ? (
            <Button
              className={cn("h-auto px-0", TOUCH_SM)}
              data-testid="event-shop-ended-see-all"
              onClick={() => setView("all")}
              size="sm"
              variant="link"
            >
              {t("list.seeAll")}
            </Button>
          ) : null}
        </div>
      ) : null}
      {empty ? (
        <p
          className="text-sm text-muted-foreground"
          data-testid="event-shop-list-empty"
        >
          {t("list.empty")}
        </p>
      ) : (
        <>
          <div
            aria-label={t("list.view.label")}
            className="flex gap-1"
            role="group"
          >
            {(["upcoming", "all"] as const).map((option) => (
              <Button
                key={option}
                aria-pressed={view === option}
                className={TOUCH_SM}
                data-testid={`event-shop-view-${option}`}
                onClick={() => setView(option)}
                size="sm"
                variant={view === option ? "secondary" : "ghost"}
              >
                {t(`list.view.${option}`)}
              </Button>
            ))}
          </div>
          {view === "upcoming" ? (
            <div className="flex flex-col gap-4">
              {list.needsReview.length > 0 ? (
                <Group
                  action={
                    <Button
                      className={TOUCH_SM}
                      data-testid="event-shop-miss-all"
                      disabled={!controller.cartReady}
                      onClick={controller.missAllReview}
                      size="sm"
                      variant="ghost"
                    >
                      {t("list.missAll")}
                    </Button>
                  }
                  hint={t("list.needsReviewHint")}
                  testId="event-shop-needs-review"
                  title={t("list.needsReviewCount", {
                    count: list.needsReview.length,
                  })}
                  tone="review"
                >
                  {(allReview
                    ? list.needsReview
                    : list.needsReview.slice(0, REVIEW_SHOWN)
                  ).map(row)}
                  {list.needsReview.length > REVIEW_SHOWN ? (
                    <li>
                      <Button
                        className={cn("px-0", TOUCH_SM)}
                        data-testid="event-shop-review-show-all"
                        onClick={() => setAllReview((open) => !open)}
                        size="sm"
                        variant="link"
                      >
                        {allReview
                          ? t("list.showFewer")
                          : t("list.showAll", {
                              count: list.needsReview.length,
                            })}
                      </Button>
                    </li>
                  ) : null}
                </Group>
              ) : null}
              {list.today ? (
                <Group
                  action={
                    <Button
                      className={TOUCH_SM}
                      data-testid="event-shop-all-today-bought"
                      disabled={!controller.cartReady}
                      onClick={controller.markTodayBought}
                      size="sm"
                      variant="outline"
                    >
                      {t("list.allTodayBought")}
                    </Button>
                  }
                  testId="event-shop-today"
                  title={`${t("list.today")} · ${dayHeading(list.today)}`}
                >
                  {list.today.entries.map(row)}
                </Group>
              ) : null}
              {nothingLeft ? (
                <p
                  className="text-sm text-muted-foreground"
                  data-testid="event-shop-nothing-left"
                >
                  {nothingLeft}
                </p>
              ) : null}
              {list.later.map((group) => (
                <Group
                  key={group.dayIndex}
                  meta={cost(group.stillToBuy)}
                  testId={`event-shop-later-${group.dayIndex}`}
                  title={dayHeading(group)}
                >
                  {group.entries.map(row)}
                </Group>
              ))}
              {list.done.length > 0 ? (
                <div data-testid="event-shop-done">
                  <Button
                    aria-expanded={showDone}
                    className={cn("px-0", TOUCH_SM)}
                    onClick={() => setShowDone(!showDone)}
                    size="sm"
                    variant="ghost"
                  >
                    {showDone ? (
                      <ChevronDown aria-hidden="true" />
                    ) : (
                      <ChevronRight aria-hidden="true" />
                    )}
                    {t("list.done", { count: list.done.length })}
                    <span className="ml-1 text-muted-foreground">
                      {cost(list.doneBought)}
                    </span>
                  </Button>
                  {showDone ? (
                    <ul className="flex flex-col gap-1">
                      {list.done.map(row)}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col gap-4" data-testid="event-shop-all">
              {list.all.map((week) => (
                <div key={week.week} className="flex flex-col gap-3">
                  <h3 className="text-sm font-semibold">
                    {t("days.week", { week: week.week })}
                  </h3>
                  {week.days.map((group) => (
                    <Group
                      key={group.dayIndex}
                      meta={cost(group.stillToBuy)}
                      past={group.dayIndex < todayIndex}
                      testId={`event-shop-all-day-${group.dayIndex}`}
                      title={dayHeading(group)}
                    >
                      {group.entries.map(row)}
                    </Group>
                  ))}
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-x-3">
            {list.weeks.map((week) => (
              <Button
                key={week}
                className={cn("px-2", DESTRUCTIVE_TEXT, TOUCH_SM)}
                data-testid={`event-shop-clear-week-${week}`}
                disabled={!controller.cartReady}
                onClick={() =>
                  controller.openDialog({ kind: "clearWeek", week })
                }
                size="sm"
                variant="ghost"
              >
                {t("list.clearWeek", { week })}
              </Button>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

function Group({
  title,
  hint,
  meta,
  action,
  tone,
  past,
  testId,
  children,
}: {
  title: string
  hint?: string
  meta?: ReactNode
  action?: ReactNode
  tone?: "review"
  past?: boolean
  testId?: string
  children: ReactNode
}) {
  const { t } = useTranslation("eventShops")
  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        tone === "review" && "rounded-md border border-amber-500/40 p-2"
      )}
      data-past={past || undefined}
      data-testid={testId}
    >
      <div className="flex items-center justify-between gap-2">
        <h3
          className={cn(
            "flex items-center gap-1.5 text-sm font-semibold",
            tone === "review" && "text-amber-700 dark:text-amber-400",
            past && "text-muted-foreground"
          )}
        >
          {title}
          {past ? (
            <span className="rounded-sm bg-muted px-1.5 text-xs font-normal">
              {t("list.past")}
            </span>
          ) : null}
        </h3>
        {meta ? (
          <span className="text-xs text-muted-foreground">{meta}</span>
        ) : null}
        {action}
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <ul className="flex flex-col gap-1">{children}</ul>
    </div>
  )
}

function ListRow({
  controller,
  entry,
  format,
  onGoToDay,
}: {
  controller: EventShopController
  entry: ClassifiedEntry
  format: EventShopFormat
  onGoToDay: (dayIndex: number) => void
}) {
  const { t } = useTranslation("eventShops")
  const { rewardType, quantity, purchasedQuantity, draftAlliance } = entry.entry
  const reward = format.reward(rewardType)
  const disabled = !controller.cartReady
  const ref = entry.entry
  const date = format.date(eventDay(controller.event, entry.dayIndex).date)
  const status =
    entry.state === "done"
      ? t("list.boughtPacks", { bought: purchasedQuantity, quantity })
      : entry.state === "needsReview"
        ? t("list.boughtPacks", { bought: purchasedQuantity, quantity })
        : t("list.packs", { toBuy: entry.toBuyPacks, quantity })

  return (
    <li
      className="flex flex-wrap items-center gap-2 rounded-md p-1 hover:bg-muted/40"
      data-state={entry.state}
      data-testid={`event-shop-row-${entry.dayIndex}-${ref.slotIndex}`}
    >
      <EntityIcon alt="" className="size-8 shrink-0" src={reward.iconUrl} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">
          {reward.label}
          {draftAlliance ? (
            <span className="text-muted-foreground">
              {" "}
              · {t(`alliances.${draftAlliance}`)}
            </span>
          ) : null}
        </p>
        <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
          <span>{date}</span>
          <span>·</span>
          <span>
            {t("slot.pack", { qty: format.number(entry.qtyPerPack) })}
          </span>
          <span>·</span>
          <span>{status}</span>
          {entry.state === "needsReview" && entry.missedPacks > 0 ? (
            <>
              <span>·</span>
              <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                <Cost
                  amount={entry.missedPacks * entry.costPerPack}
                  currency={controller.event.currency}
                  format={format}
                />
                {t("list.missedCost")}
              </span>
            </>
          ) : null}
          {entry.toBuyPacks > 0 && entry.state === "upcoming" ? (
            <>
              <span>·</span>
              <Cost
                amount={entry.toBuyPacks * entry.costPerPack}
                currency={controller.event.currency}
                format={format}
              />
            </>
          ) : null}
        </p>
        {entry.boughtAhead ? (
          <p
            className="flex flex-wrap items-center gap-x-1.5 text-xs text-amber-700 dark:text-amber-400"
            data-testid={`event-shop-bought-ahead-${entry.dayIndex}-${ref.slotIndex}`}
          >
            {t("list.notOnSale", { date })}
            <Button
              className={cn("h-auto px-0 text-xs", TOUCH_SM)}
              disabled={disabled}
              onClick={() => controller.undoBought(ref)}
              size="sm"
              variant="link"
            >
              {t("list.undo")}
            </Button>
          </p>
        ) : null}
      </div>
      {entry.state === "needsReview" ? (
        // On its own line under the row, so the name and date keep the width in a narrow column.
        <div className="order-last flex basis-full flex-wrap gap-1 pl-10">
          <Button
            className={TOUCH_SM}
            disabled={disabled}
            onClick={() => controller.markBought(ref)}
            size="sm"
            variant="outline"
          >
            {t("list.markBought")}
          </Button>
          <Button
            className={TOUCH_SM}
            data-testid={`event-shop-missed-${entry.dayIndex}-${ref.slotIndex}`}
            disabled={disabled}
            onClick={() => controller.missed(ref)}
            size="sm"
            variant="ghost"
          >
            {t("list.missed")}
          </Button>
        </div>
      ) : entry.state === "upcoming" ? (
        <Button
          className={cn("shrink-0", TOUCH_SM)}
          data-testid={`event-shop-row-bought-${entry.dayIndex}-${ref.slotIndex}`}
          disabled={disabled}
          onClick={() => controller.markBought(ref)}
          size="sm"
          variant="outline"
        >
          {t("slot.markBought", { count: quantity })}
        </Button>
      ) : null}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={t("list.more")}
            className={cn("shrink-0", TOUCH_ICON)}
            data-testid={`event-shop-row-menu-${entry.dayIndex}-${ref.slotIndex}`}
            size="icon-sm"
            variant="ghost"
          >
            <MoreHorizontal aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onGoToDay(entry.dayIndex)}>
            {t("list.goToDay")}
          </DropdownMenuItem>
          {entry.state === "needsReview" ? (
            <DropdownMenuItem
              data-testid={`event-shop-bought-some-${entry.dayIndex}-${ref.slotIndex}`}
              disabled={disabled}
              onSelect={() =>
                controller.openDialog({ kind: "boughtSome", entry })
              }
            >
              {t("list.boughtSome")}
            </DropdownMenuItem>
          ) : null}
          {purchasedQuantity > 0 ? (
            <DropdownMenuItem
              disabled={disabled}
              onSelect={() => controller.undoBought(ref)}
            >
              {t("list.undoBought")}
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem
            disabled={disabled}
            onSelect={() => controller.remove(ref)}
            variant="destructive"
          >
            {t("list.remove")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}
