import { useTranslation } from "react-i18next"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { cn } from "@workspace/ui/lib/utils"

import {
  LEGENDARY_EVENT_LANE_IDS,
  type LegendaryEventLaneId,
} from "@/entities/legendary-event"

import type { LegendaryEventTab } from "./legendary-event-page.view-model"

const TABS: readonly LegendaryEventTab[] = [
  "overview",
  ...LEGENDARY_EVENT_LANE_IDS,
]

/** The Overview / Alpha / Beta / Gamma strip (design D3). On mobile it sticks under the app
 *  header, so a lane can be switched from anywhere on the page. */
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
        <TabsList
          aria-label={t("tabs.label")}
          className="w-full"
          data-testid="legendary-event-tab-list"
          variant="line"
        >
          {TABS.map((tab) => (
            <TabsTrigger
              data-testid={`legendary-event-tab-${tab}`}
              key={tab}
              value={tab}
            >
              {tab === "overview"
                ? t("tabs.overview")
                : t(`lanes.${tab satisfies LegendaryEventLaneId}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}
