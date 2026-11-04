import { useTranslation } from "react-i18next"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"

import {
  LEGENDARY_EVENT_LANE_IDS,
  type LegendaryEventLaneId,
} from "@/entities/legendary-event"

/** Plan's Battles lane dropdown, in the battle row before the battle numbers. */
export function BattlesLaneSelect({
  laneId,
  onChange,
  isMobile,
}: {
  laneId: LegendaryEventLaneId
  onChange: (lane: LegendaryEventLaneId) => void
  isMobile: boolean
}) {
  const { t } = useTranslation("legendaryEvents")
  return (
    <Select
      onValueChange={(value) => onChange(value as LegendaryEventLaneId)}
      value={laneId}
    >
      <SelectTrigger
        aria-label={t("battles.laneLabel")}
        className={cn("w-32", isMobile && "h-11 w-full")}
        data-testid="battles-lane-select"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LEGENDARY_EVENT_LANE_IDS.map((lane) => (
          <SelectItem data-testid="battles-lane-option" key={lane} value={lane}>
            {t(`lanes.${lane}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
