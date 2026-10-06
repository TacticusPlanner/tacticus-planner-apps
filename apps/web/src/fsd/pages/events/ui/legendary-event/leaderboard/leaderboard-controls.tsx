import { useId } from "react"
import { useTranslation } from "react-i18next"
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

import type {
  LeaderboardSort,
  LeaderboardSortKey,
} from "@/entities/legendary-event"

import { SORT_FIRST_DIRECTION } from "./leaderboard.view-model"

const SORT_KEYS: readonly LeaderboardSortKey[] = ["points", "slots", "name"]

/**
 * The leaderboard's controls, shared by the three lanes: "Only unlocked" (disabled while ownership
 * is unknown) and, in the compact mobile bar, the sort key and direction. The desktop table sorts
 * from its column headers instead.
 */
export function LeaderboardControls({
  sort,
  onSortChange,
  onlyUnlocked,
  onOnlyUnlockedChange,
  rosterAvailable,
  showSort,
}: {
  sort: LeaderboardSort
  onSortChange: (sort: LeaderboardSort) => void
  onlyUnlocked: boolean
  onOnlyUnlockedChange: (onlyUnlocked: boolean) => void
  rosterAvailable: boolean
  showSort: boolean
}) {
  const { t } = useTranslation("legendaryEvents")
  const switchId = useId()
  const DirectionIcon =
    sort.direction === "asc" ? ArrowUpNarrowWide : ArrowDownWideNarrow

  return (
    <div
      className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2"
      data-testid="leaderboard-controls"
    >
      {showSort ? (
        <div className="flex min-w-0 items-center gap-1">
          <ToggleGroup
            aria-label={t("leaderboard.sortBy")}
            data-testid="leaderboard-sort"
            onValueChange={(value) => {
              if (!value) return
              const key = value as LeaderboardSortKey
              onSortChange({ key, direction: SORT_FIRST_DIRECTION[key] })
            }}
            size="sm"
            spacing={0}
            type="single"
            value={sort.key}
            variant="outline"
          >
            {SORT_KEYS.map((key) => (
              <ToggleGroupItem
                data-testid={`leaderboard-sort-${key}`}
                key={key}
                value={key}
              >
                {t(`leaderboard.sort.${key}`)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Button
            aria-label={`${t("leaderboard.direction.toggle")} (${t(`leaderboard.direction.${sort.direction}`)})`}
            data-direction={sort.direction}
            data-testid="leaderboard-sort-direction"
            onClick={() =>
              onSortChange({
                key: sort.key,
                direction: sort.direction === "asc" ? "desc" : "asc",
              })
            }
            size="icon-sm"
            variant="ghost"
          >
            <DirectionIcon aria-hidden="true" />
          </Button>
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        <Switch
          checked={rosterAvailable && onlyUnlocked}
          data-testid="leaderboard-only-unlocked"
          disabled={!rosterAvailable}
          id={switchId}
          onCheckedChange={onOnlyUnlockedChange}
        />
        <Label htmlFor={switchId}>{t("leaderboard.onlyUnlocked")}</Label>
      </div>
    </div>
  )
}
