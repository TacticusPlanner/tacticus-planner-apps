import { startTransition, useEffect, useOptimistic, useRef } from "react"
import { useTranslation } from "react-i18next"
import { CheckIcon } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
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
  // The strip shows the picked tab at once; the tab's content renders in a transition, so a tap
  // repaints before a heavy tab (Plan's upgrade impact, say) has rendered (web vitals plan item 7).
  const [shownTab, showTab] = useOptimistic(selectedTab)
  const scroller = useRef<HTMLDivElement>(null)
  // Keeps the selected tab in view when the strip is scrolled sideways, without scrolling the
  // page; again whenever the strip's size changes (web fonts landing, a rotation).
  useEffect(() => {
    const box = scroller.current
    const active = box?.querySelector<HTMLElement>(
      `[data-testid="legendary-event-tab-${shownTab}"]`
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
  }, [shownTab])
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
        onValueChange={(value) =>
          startTransition(() => {
            showTab(value as LegendaryEventTab)
            onSelectTab(value as LegendaryEventTab)
          })
        }
        value={shownTab}
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

/**
 * The page's lane selection (spec: one lane selection): a segmented control above the lane blocks.
 * Desktop: one toggle per lane, pressed while it shows, any one to three at once (the last pressed
 * lane stays). Mobile: one lane at a time, as a segmented single choice that sticks under the tab
 * strip.
 */
export function LaneSelector({
  lanes,
  isMobile,
}: {
  lanes: LaneSelection
  isMobile: boolean
}) {
  const { t } = useTranslation("legendaryEvents")
  // The switches show a tap at once; the lane blocks follow in the selection's transition.
  const [shown, showLanes] = useOptimistic(lanes.shown)
  if (isMobile) {
    // Sticks under the sticky tab strip, so the lane can be switched far down a long tab.
    return (
      <div
        className="sticky top-[calc(var(--mobile-header-height)+2.875rem)] z-20 -mx-4 bg-background px-4 py-1"
        data-sticky="true"
        data-testid="legendary-event-lane-picker-bar"
      >
        <ToggleGroup
          aria-label={t("tabs.laneLabel")}
          className="w-full"
          data-testid="legendary-event-lane-picker"
          onValueChange={(next) => {
            // A pressed lane stays pressed: one lane always shows.
            if (!next) return
            startTransition(() => {
              showLanes([next as LegendaryEventLaneId])
              lanes.onPick(next as LegendaryEventLaneId)
            })
          }}
          spacing={0}
          type="single"
          value={shown[0]}
          variant="outline"
        >
          {LEGENDARY_EVENT_LANE_IDS.map((lane) => (
            <ToggleGroupItem
              className="min-h-11 flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              data-testid={`legendary-event-lane-pick-${lane}`}
              id={`le-lane-pick-${lane}`}
              key={lane}
              value={lane}
            >
              {t(`lanes.${lane}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    )
  }
  return (
    <ToggleGroup
      aria-label={t("tabs.lanesShown")}
      className="self-start"
      data-testid="legendary-event-lane-switches"
      onValueChange={(next) => {
        // The last shown lane stays: one lane always shows.
        if (next.length === 0) return
        startTransition(() => {
          showLanes(
            LEGENDARY_EVENT_LANE_IDS.filter((laneId) => next.includes(laneId))
          )
          for (const laneId of LEGENDARY_EVENT_LANE_IDS) {
            const on = next.includes(laneId)
            if (on !== lanes.shown.includes(laneId)) lanes.onToggle(laneId, on)
          }
        })
      }}
      spacing={0}
      type="multiple"
      value={[...shown]}
      variant="outline"
    >
      {LEGENDARY_EVENT_LANE_IDS.map((laneId) => {
        const isShown = shown.includes(laneId)
        return (
          <ToggleGroupItem
            className="min-w-24 gap-1.5 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            data-lane={laneId}
            data-testid="legendary-event-lane-switch"
            id={`le-lane-switch-${laneId}`}
            key={laneId}
            value={laneId}
          >
            {isShown ? (
              <CheckIcon aria-hidden className="size-3.5" />
            ) : (
              <span aria-hidden className="size-3.5" />
            )}
            {t(`lanes.${laneId}`)}
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}
