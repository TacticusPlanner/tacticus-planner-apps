import { useTranslation } from "react-i18next"
import { shopDaysOfWeek } from "@workspace/game-catalog"
import type { ShopDayOfWeek } from "@workspace/game-catalog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import { PageToolbar } from "@/shared/ui"

/**
 * The Daily Shops page toolbar (ui-style-guide rule 2). Find: the day, a labelled select because
 * seven choices do not fit a segmented button. The day scopes every shop, so it sits above the shop
 * tabs on every viewport.
 */
export function ShopsToolbar({
  day,
  setDay,
}: {
  day: ShopDayOfWeek
  setDay: (day: ShopDayOfWeek) => void
}) {
  const { t } = useTranslation(["library", "shops"])
  const dayName = t(`shops.days.${day}`)

  return (
    <PageToolbar
      find={
        <Select
          value={day}
          onValueChange={(value) => setDay(value as ShopDayOfWeek)}
        >
          {/* A combobox is not named by its content, so the label carries the current day too. */}
          <SelectTrigger
            aria-label={`${t("shops.dayLabel")}: ${dayName}`}
            className="min-w-0"
            data-testid="shops-day-select"
          >
            <span className="text-muted-foreground">
              {t("shops.dayLabel")}:
            </span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" align="start">
            {shopDaysOfWeek.map((value) => (
              <SelectItem key={value} value={value}>
                {t(`shops.days.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
      testId="shops-toolbar"
    />
  )
}
