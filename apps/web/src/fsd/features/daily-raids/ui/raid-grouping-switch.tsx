import { useId } from "react"
import { useTranslation } from "react-i18next"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

import {
  isRaidGrouping,
  RAID_GROUPINGS,
} from "../model/raid-grouping/raid-grouping"
import { usePickRaidGrouping } from "../model/raid-grouping/use-pick-raid-grouping"

/**
 * "Group by: Upgrade | Campaign" on Dailies > Raids: the one place the raid list grouping is picked.
 * Today, Bonus Raids, HSE, HRE and the Home raids widget all follow it on this browser.
 */
export function RaidGroupingSwitch() {
  const { t } = useTranslation("dailies")
  const labelId = useId()
  const [grouping, pick] = usePickRaidGrouping()
  return (
    <div className="flex items-center gap-2" data-testid="raid-grouping">
      <span className="text-xs text-muted-foreground" id={labelId}>
        {t("grouping.label")}
      </span>
      <ToggleGroup
        aria-labelledby={labelId}
        onValueChange={(value) => {
          if (isRaidGrouping(value)) pick(value)
        }}
        type="single"
        value={grouping}
      >
        {RAID_GROUPINGS.map((item) => (
          <ToggleGroupItem
            data-testid={`raid-grouping-${item}`}
            key={item}
            title={t(`grouping.help.${item}`)}
            value={item}
          >
            {t(`grouping.${item}`)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
