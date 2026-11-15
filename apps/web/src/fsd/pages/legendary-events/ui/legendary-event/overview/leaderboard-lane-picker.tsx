import { useTranslation } from "react-i18next"
import { ChevronDown } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

import {
  LEGENDARY_EVENT_LANE_IDS,
  type LegendaryEventLaneId,
} from "@/entities/legendary-event"

/** The leaderboard's lane multi-select: a dropdown of lane checkboxes, naming the one lane shown,
 *  "All lanes" or the count. The last checked lane stays checked. */
export function LeaderboardLanePicker({
  laneIds,
  onToggle,
}: {
  laneIds: readonly LegendaryEventLaneId[]
  onToggle: (laneId: LegendaryEventLaneId, shown: boolean) => void
}) {
  const { t } = useTranslation("legendaryEvents")
  const summary =
    laneIds.length === LEGENDARY_EVENT_LANE_IDS.length
      ? t("leaderboard.lanesAll")
      : laneIds.length === 1
        ? t(`lanes.${laneIds[0]!}`)
        : t("leaderboard.lanesCount", { count: laneIds.length })
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={`${t("leaderboard.lanes")}: ${summary}`}
          data-testid="leaderboard-lane-picker"
          variant="outline"
        >
          {summary}
          <ChevronDown aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {LEGENDARY_EVENT_LANE_IDS.map((laneId) => {
          const checked = laneIds.includes(laneId)
          return (
            <DropdownMenuCheckboxItem
              checked={checked}
              data-lane={laneId}
              data-testid="leaderboard-lane-option"
              disabled={checked && laneIds.length === 1}
              key={laneId}
              onCheckedChange={(next) => onToggle(laneId, next === true)}
              // Keeps the menu open so several lanes can be toggled in one go.
              onSelect={(event) => event.preventDefault()}
            >
              {t(`lanes.${laneId}`)}
            </DropdownMenuCheckboxItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
