import { useState } from "react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import type { GameCatalogEventShopRecord } from "@workspace/game-catalog"
import { Badge } from "@workspace/ui/components/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { Tabs, TabsContent } from "@workspace/ui/components/tabs"

import { PageTabsList, PageTabsTrigger } from "@/shared/ui"

import type { EventShopForm, EventShopTab } from "../../model/event-shop-route"
import { eventShopTabs } from "../../model/event-shop-route"
import type { DailiesOutletContext } from "../dailies-layout"
import { EventShopCoverage } from "./event-shop-coverage"
import { DayChips, WeekCalendar } from "./event-shop-day-picker"
import { EventShopDialogs } from "./event-shop-dialogs"
import { EventShopHeader } from "./event-shop-header"
import { EventShopNotices } from "./event-shop-notices"
import {
  EventShopMilestones,
  EventShopMissions,
  EventShopRewardsPhone,
} from "./event-shop-rewards"
import { EventShopShoppingListTotalsBar } from "./event-shop-totals-bar"
import { ShoppingList } from "./event-shop-shopping-list"
import { SlotSheet } from "./event-shop-slot-sheet"
import { SlotGrid, SlotTiles } from "./event-shop-slots"
import { useEventShopTutorial } from "./event-shop-page.tutorial"
import type { EventShopController } from "./use-event-shop-controller"
import { useEventShopFormat } from "./use-event-shop-format"

export interface EventShopViewProps {
  controller: EventShopController
  events: readonly GameCatalogEventShopRecord[]
  form: EventShopForm
  tab: EventShopTab
  context: DailiesOutletContext
  onSelectEvent: (eventId: string) => void
  onSelectDay: (dayIndex: number) => void
  onSelectTab: (tab: EventShopTab) => void
  /** Selects a day and opens the Shop tab (a shopping-list row, a search result). */
  onGoToDay: (dayIndex: number) => void
}

/** The event shop in its desktop, tablet or phone form (design D4). */
export function EventShopView(props: EventShopViewProps) {
  const {
    controller,
    events,
    form,
    tab,
    context,
    onSelectEvent,
    onSelectDay,
    onSelectTab,
  } = props
  const { t } = useTranslation("eventShops")
  const format = useEventShopFormat()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sheetSlot, setSheetSlot] = useState<number | null>(null)
  const reviewCount = controller.list.needsReview.length
  const goToDay = (dayIndex: number) => {
    setDrawerOpen(false)
    props.onGoToDay(dayIndex)
  }
  useEventShopTutorial({
    form,
    hasTick: controller.entries.some(
      (entry) => entry.dayIndex === controller.selectedDay.index
    ),
    hasSlots: controller.slots.length > 0,
  })

  const plan = (
    <div className="flex flex-col gap-6">
      <ShoppingList
        controller={controller}
        format={format}
        onGoToDay={goToDay}
      />
      <EventShopCoverage
        context={context}
        controller={controller}
        format={format}
      />
    </div>
  )
  const tabLabel = (value: EventShopTab): ReactNode =>
    value === "plan" && reviewCount > 0 ? (
      <>
        {t("tabs.plan")}
        <Badge
          aria-label={t("list.toReview", { count: reviewCount })}
          className="h-5 min-w-5 border-transparent bg-amber-500 px-1.5 text-amber-950"
          data-testid="event-shop-review-badge"
        >
          {reviewCount}
        </Badge>
      </>
    ) : (
      t(`tabs.${value}`)
    )

  const tabs = (
    <Tabs
      onValueChange={(value) => onSelectTab(value as EventShopTab)}
      value={tab}
    >
      {/* The shared page tabs (ui-style-guide rule 4). The event picker and the shop search scope
          every tab, so they sit above it in the page toolbar. */}
      <PageTabsList aria-label={t("tabs.label")}>
        {eventShopTabs(form).map((value) => (
          <PageTabsTrigger
            key={value}
            data-testid={`event-shop-tab-${value}`}
            value={value}
          >
            {tabLabel(value)}
          </PageTabsTrigger>
        ))}
      </PageTabsList>
      <TabsContent className="flex flex-col gap-4 pt-2" value="shop">
        {form === "phone" ? (
          <>
            <DayChips
              controller={controller}
              format={format}
              onSelectDay={onSelectDay}
            />
            <SlotTiles
              controller={controller}
              format={format}
              onOpen={setSheetSlot}
            />
          </>
        ) : (
          <>
            <WeekCalendar
              controller={controller}
              format={format}
              onSelectDay={onSelectDay}
            />
            <SlotGrid controller={controller} format={format} />
          </>
        )}
      </TabsContent>
      {form === "phone" ? (
        <>
          <TabsContent className="pt-2" value="plan">
            {plan}
          </TabsContent>
          <TabsContent className="pt-2" value="rewards">
            <EventShopRewardsPhone
              controller={controller}
              format={format}
              onSelectDay={onSelectDay}
            />
          </TabsContent>
        </>
      ) : (
        <>
          <TabsContent className="pt-2" value="milestones">
            <EventShopMilestones
              controller={controller}
              format={format}
              onSelectDay={onSelectDay}
            />
          </TabsContent>
          <TabsContent className="pt-2" value="missions">
            <EventShopMissions
              controller={controller}
              format={format}
              onSelectDay={onSelectDay}
            />
          </TabsContent>
        </>
      )}
    </Tabs>
  )

  return (
    <div className="flex flex-col gap-4" data-testid={`event-shop-${form}`}>
      <EventShopHeader
        controller={controller}
        events={events}
        format={format}
        compact={form === "phone"}
        onOpenDay={goToDay}
        onSelectEvent={onSelectEvent}
      />
      <EventShopNotices controller={controller} />
      {form === "desktop" ? (
        <div className="grid grid-cols-[minmax(0,1fr)_24rem] items-start gap-6">
          {tabs}
          <aside
            className="sticky top-4 max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-lg border p-3"
            data-testid="event-shop-side-column"
          >
            {plan}
          </aside>
        </div>
      ) : (
        tabs
      )}
      {form === "tablet" ? (
        <>
          <EventShopShoppingListTotalsBar
            controller={controller}
            format={format}
            kind="button"
            onActivate={() => setDrawerOpen(true)}
          />
          <Sheet onOpenChange={setDrawerOpen} open={drawerOpen}>
            <SheetContent
              className="w-[min(28rem,100vw)] overflow-y-auto sm:max-w-md"
              data-testid="event-shop-drawer"
              side="right"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>{t("list.title")}</SheetTitle>
                <SheetDescription className="sr-only">
                  {t("coverage.title")}
                </SheetDescription>
              </SheetHeader>
              <div className="px-4 pb-6">{plan}</div>
            </SheetContent>
          </Sheet>
        </>
      ) : null}
      {form === "phone" && tab === "shop" ? (
        <EventShopShoppingListTotalsBar
          controller={controller}
          format={format}
          kind="bar"
          onActivate={() => onSelectTab("plan")}
        />
      ) : null}
      {form === "phone" ? (
        <SlotSheet
          controller={controller}
          format={format}
          onClose={() => setSheetSlot(null)}
          slotIndex={sheetSlot}
        />
      ) : null}
      <EventShopDialogs controller={controller} format={format} />
    </div>
  )
}
