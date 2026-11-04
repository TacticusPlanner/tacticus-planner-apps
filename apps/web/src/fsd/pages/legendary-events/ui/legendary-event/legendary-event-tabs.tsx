import { useEffect, useId, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { cn } from "@workspace/ui/lib/utils"

import {
  LEGENDARY_EVENT_LANE_IDS,
  type LegendaryEventLaneId,
  type LegendaryEventLifecycle,
} from "@/entities/legendary-event"

import {
  LEGENDARY_EVENT_TABS,
  type LegendaryEventTab,
} from "./legendary-event-page.view-model"
import type { LaneSelection } from "./use-lane-selection"

/** The run tab's name: Current run while the event is active, Next run before it, Last run once
 *  it is archived. */
const RUN_TAB_LABEL = {
  active: "tabs.run.current",
  upcoming: "tabs.run.next",
  archived: "tabs.run.last",
} as const

/** The Overview / Teams / Plan / run strip (design D3). It scrolls sideways when it does not fit,
 *  and on mobile it sticks under the app header, so a tab can be switched from anywhere on the
 *  page. */
export function LegendaryEventTabs({
  selectedTab,
  onSelectTab,
  lifecycle,
  isMobile,
}: {
  selectedTab: LegendaryEventTab
  onSelectTab: (tab: LegendaryEventTab) => void
  lifecycle: LegendaryEventLifecycle["state"]
  isMobile: boolean
}) {
  const { t } = useTranslation("legendaryEvents")
  const scroller = useRef<HTMLDivElement>(null)
  // Keeps the selected tab in view when the strip is scrolled sideways, without scrolling the
  // page; again whenever the strip's size changes (web fonts landing, a rotation).
  useEffect(() => {
    const box = scroller.current
    const active = box?.querySelector<HTMLElement>(
      `[data-testid="legendary-event-tab-${selectedTab}"]`
    )
    if (!box || !active) return
    const reveal = () => {
      const boxRect = box.getBoundingClientRect()
      const tabRect = active.getBoundingClientRect()
      if (tabRect.left < boxRect.left)
        box.scrollLeft -= boxRect.left - tabRect.left
      else if (tabRect.right > boxRect.right)
        box.scrollLeft += tabRect.right - boxRect.right
    }
    reveal()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(reveal)
    observer.observe(box.firstElementChild ?? box)
    return () => observer.disconnect()
  }, [selectedTab])
  return (
    <div
      className={cn(
        "min-w-0 bg-background",
        isMobile && "sticky top-(--mobile-header-height) z-20 -mx-4 px-4 py-1"
      )}
      data-sticky={isMobile ? "true" : undefined}
      data-testid="legendary-event-tabs"
    >
      <Tabs
        onValueChange={(value) => onSelectTab(value as LegendaryEventTab)}
        value={selectedTab}
      >
        {/* The bottom padding keeps the active tab's underline inside the scroll box. */}
        <div className="overflow-x-auto pb-1.5" ref={scroller}>
          <TabsList
            aria-label={t("tabs.label")}
            className="w-max min-w-full justify-start"
            data-testid="legendary-event-tab-list"
            variant="line"
          >
            {LEGENDARY_EVENT_TABS.map((tab) => (
              <TabsTrigger
                className="flex-none px-2.5 sm:flex-1"
                data-testid={`legendary-event-tab-${tab}`}
                key={tab}
                value={tab}
              >
                {tab === "run" ? t(RUN_TAB_LABEL[lifecycle]) : t(`tabs.${tab}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>
    </div>
  )
}

/** Which lanes the lane blocks below it show: a switch per lane on desktop (one, two or all
 *  three; the last shown lane stays), an Alpha / Beta / Gamma picker on mobile (one at a time).
 *  The choice is the page's, so every tab's lane blocks follow it. */
export function LaneSelector({
  lanes,
  isMobile,
}: {
  lanes: LaneSelection
  isMobile: boolean
}) {
  const { t } = useTranslation("legendaryEvents")
  const id = useId()
  if (isMobile) {
    return (
      <Tabs
        data-testid="legendary-event-lane-picker"
        onValueChange={(next) => lanes.onPick(next as LegendaryEventLaneId)}
        value={lanes.shown[0]}
      >
        <TabsList aria-label={t("tabs.laneLabel")} className="w-full">
          {LEGENDARY_EVENT_LANE_IDS.map((lane) => (
            <TabsTrigger
              className="px-4"
              data-testid={`legendary-event-lane-pick-${lane}`}
              key={lane}
              value={lane}
            >
              {t(`lanes.${lane}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    )
  }
  return (
    <div
      aria-label={t("tabs.lanesShown")}
      className="flex flex-wrap items-center gap-x-4 gap-y-2"
      data-testid="legendary-event-lane-switches"
      role="group"
    >
      {LEGENDARY_EVENT_LANE_IDS.map((laneId) => {
        const shown = lanes.shown.includes(laneId)
        return (
          <div className="flex items-center gap-2" key={laneId}>
            <Switch
              checked={shown}
              data-lane={laneId}
              data-testid="legendary-event-lane-switch"
              disabled={shown && lanes.shown.length === 1}
              id={`${id}-${laneId}`}
              onCheckedChange={(checked) => lanes.onToggle(laneId, checked)}
            />
            <Label htmlFor={`${id}-${laneId}`}>{t(`lanes.${laneId}`)}</Label>
          </div>
        )
      })}
    </div>
  )
}
