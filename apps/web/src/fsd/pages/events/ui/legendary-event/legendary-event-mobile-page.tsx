import { useTranslation } from "react-i18next"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

import {
  LEGENDARY_EVENT_LANE_IDS,
  type LegendaryEventLaneId,
} from "@/entities/legendary-event"

import { LaneOverview } from "./lane-overview"
import { LegendaryEventHeader } from "./legendary-event-header"
import type { LegendaryEventPageViewModel } from "./legendary-event-page.view-model"
import { RunStatusCard } from "./run-status-card"

/** Mobile form: Run status, one Alpha / Beta / Gamma selector shared by every lane-scoped
 *  section below it, then the selected lane. */
export function LegendaryEventMobilePage(props: LegendaryEventPageViewModel) {
  const { t } = useTranslation("legendaryEvents")
  return (
    <div
      className="flex min-w-0 flex-col gap-4"
      data-testid="legendary-event-page"
    >
      <LegendaryEventHeader {...props} />
      <RunStatusCard {...props} />
      <Tabs
        onValueChange={(value) =>
          props.onSelectLane(value as LegendaryEventLaneId)
        }
        value={props.selectedLane}
      >
        <TabsList
          aria-label={t("lanes.selector")}
          className="w-full"
          data-testid="legendary-event-lane-selector"
          variant="line"
        >
          {LEGENDARY_EVENT_LANE_IDS.map((laneId) => (
            <TabsTrigger
              data-testid={`legendary-event-lane-tab-${laneId}`}
              key={laneId}
              value={laneId}
            >
              {t(`lanes.${laneId}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <LaneOverview event={props.event} laneIds={props.laneIds} />
    </div>
  )
}
