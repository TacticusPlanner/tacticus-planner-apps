import { useTranslation } from "react-i18next"

import { GroupByControl } from "@/shared/ui"

import { RAID_GROUPINGS } from "../model/raid-grouping/raid-grouping"
import { usePickRaidGrouping } from "../model/raid-grouping/use-pick-raid-grouping"

/**
 * "Group by: Upgrade | Campaign" on Dailies > Raids, the shared Group by control in the page
 * toolbar's View slot: the one place the raid list grouping is picked. Today, Bonus Raids, HSE, HRE
 * and the Home raids widget all follow it on this browser. There is no "None": a raid list is
 * always grouped one way or the other.
 */
export function RaidGroupingSwitch() {
  const { t } = useTranslation("dailies")
  const [grouping, pick] = usePickRaidGrouping()
  return (
    <GroupByControl
      onValueChange={pick}
      options={RAID_GROUPINGS.map((item) => ({
        value: item,
        label: t(`grouping.${item}`),
        hint: t(`grouping.help.${item}`),
        testId: `raid-grouping-${item}`,
      }))}
      testId="raid-grouping"
      value={grouping}
    />
  )
}
