import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { cn } from "@workspace/ui/lib/utils"

import {
  LEGENDARY_EVENT_LANE_IDS,
  type LegendaryEventLaneId,
} from "@/entities/legendary-event"

import {
  LEGENDARY_EVENT_TABS,
  type LeaderboardScope,
  type LegendaryEventTab,
} from "./legendary-event-page.view-model"

/** The Overview / Teams / Lanes / Progress / Tokens / Battles / Leaderboard strip (design D3),
 *  after V1's event tabs. It scrolls sideways when it does not fit, and on mobile it sticks under
 *  the app header, so a section can be switched from anywhere on the page. */
export function LegendaryEventTabs({
  selectedTab,
  onSelectTab,
  isMobile,
}: {
  selectedTab: LegendaryEventTab
  onSelectTab: (tab: LegendaryEventTab) => void
  isMobile: boolean
}) {
  const { t } = useTranslation("legendaryEvents")
  const scroller = useRef<HTMLDivElement>(null)
  // Keeps the selected tab in view when the strip is scrolled sideways (a narrow screen, or a
  // link that opens a tab at the end), without scrolling the page; again whenever the strip's
  // size changes (web fonts landing, a rotation), since that moves the tab.
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
                {t(`tabs.${tab}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>
    </div>
  )
}

/** The Alpha / Beta / Gamma switch above the lane-scoped tabs (Lanes, Progress, Battles), whose
 *  choice carries over between them; with `allLanes` it leads with All lanes (the Leaderboard
 *  tab's scope). */
export function LegendaryEventLanePicker<T extends LeaderboardScope>({
  value,
  onValueChange,
  allLanes = false,
}: {
  value: T
  onValueChange: (value: T) => void
  allLanes?: boolean
}) {
  const { t } = useTranslation("legendaryEvents")
  const options: readonly LeaderboardScope[] = allLanes
    ? ["all", ...LEGENDARY_EVENT_LANE_IDS]
    : LEGENDARY_EVENT_LANE_IDS
  return (
    <Tabs
      data-testid="legendary-event-lane-picker"
      onValueChange={(next) => onValueChange(next as T)}
      value={value}
    >
      <TabsList aria-label={t("tabs.laneLabel")} className="w-full sm:w-fit">
        {options.map((option) => (
          <TabsTrigger
            className="px-4"
            data-testid={`legendary-event-lane-pick-${option}`}
            key={option}
            value={option}
          >
            {option === "all"
              ? t("tabs.allLanes")
              : t(`lanes.${option satisfies LegendaryEventLaneId}`)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
