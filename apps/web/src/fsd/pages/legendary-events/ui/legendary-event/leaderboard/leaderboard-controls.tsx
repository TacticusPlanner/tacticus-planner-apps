import { useId } from "react"
import { useTranslation } from "react-i18next"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

import { ObjectiveIcon } from "@/entities/legendary-event"

import type { LeaderboardControlsState } from "../legendary-event-page.view-model"
import type { ObjectiveChipGroup } from "./leaderboard.view-model"

/**
 * The one controls bar shared by the lane and Overview leaderboards (design D7): "Only unlocked"
 * (disabled while ownership is unknown), "Deduct scored points" and the objective multi-select
 * chips, one group per lane with a lane heading when there are several (design D2 of the Overview
 * refinement). The notes for an unsynced roster and an unavailable progress read sit beneath it.
 */
export function LeaderboardControls({
  state,
  groups,
  rosterAvailable,
  progressAvailable,
}: {
  state: LeaderboardControlsState
  groups: readonly ObjectiveChipGroup[]
  rosterAvailable: boolean
  progressAvailable: boolean
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  const unlockedId = useId()
  const deductId = useId()
  const labelled = groups.length > 1
  const selectedIn = (group: ObjectiveChipGroup) =>
    group.chips
      .map((chip) => chip.key)
      .filter((key) => state.selectedObjectives.has(key))
  // A group's change carries only its own keys; the other groups' selections are kept, and a key
  // shared between lanes follows the group that changed it.
  const changeGroup = (group: ObjectiveChipGroup, keys: string[]) => {
    const next = new Set(state.selectedObjectives)
    for (const chip of group.chips) next.delete(chip.key)
    for (const key of keys) next.add(key)
    state.onSelectedObjectivesChange(next)
  }

  return (
    <div
      className="flex min-w-0 flex-col gap-2"
      data-testid="leaderboard-controls"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <Switch
            checked={rosterAvailable && state.onlyUnlocked}
            data-testid="leaderboard-only-unlocked"
            disabled={!rosterAvailable}
            id={unlockedId}
            onCheckedChange={state.onOnlyUnlockedChange}
          />
          <Label htmlFor={unlockedId}>{t("leaderboard.onlyUnlocked")}</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={state.deductScored}
            data-testid="leaderboard-deduct-scored"
            id={deductId}
            onCheckedChange={state.onDeductScoredChange}
          />
          <Label htmlFor={deductId}>{t("leaderboard.deductScored")}</Label>
        </div>
      </div>
      {groups.map((group) => {
        const lane = t(`lanes.${group.laneId}`)
        return (
          <div
            className="flex min-w-0 flex-col gap-1"
            data-lane={group.laneId}
            data-testid="leaderboard-objective-group"
            key={group.laneId}
          >
            {labelled ? (
              <span
                className="text-xs font-medium text-muted-foreground"
                data-testid="leaderboard-objective-group-label"
              >
                {t("leaderboard.laneObjectives", { lane })}
              </span>
            ) : null}
            <ToggleGroup
              aria-label={
                labelled
                  ? t("leaderboard.laneObjectiveFilter", { lane })
                  : t("leaderboard.objectiveFilter")
              }
              className="flex-wrap"
              data-testid="leaderboard-objective-filter"
              onValueChange={(keys) => changeGroup(group, keys)}
              size="sm"
              spacing={1}
              type="multiple"
              value={selectedIn(group)}
              variant="outline"
            >
              {group.chips.map((chip) => (
                <ToggleGroupItem
                  className="data-[state=on]:border-(--event-legendary) data-[state=on]:bg-(--event-legendary)/15"
                  data-objective={chip.key}
                  data-testid="leaderboard-objective-chip"
                  key={chip.key}
                  value={chip.key}
                >
                  <ObjectiveIcon className="size-4" icon={chip.icon} />
                  {chip.label}
                  {chip.count ? (
                    <span
                      className="text-xs text-muted-foreground tabular-nums"
                      data-testid="leaderboard-objective-count"
                    >
                      {t("leaderboard.objectiveCount", {
                        cleared: number.format(chip.count.cleared),
                        total: number.format(chip.count.total),
                      })}
                    </span>
                  ) : null}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        )
      })}
      {rosterAvailable ? null : (
        <p
          className="text-sm text-muted-foreground"
          data-testid="leaderboard-roster-not-synced"
        >
          {t("leaderboard.rosterNotSynced")}
        </p>
      )}
      {progressAvailable ? null : (
        <p
          className="text-sm text-muted-foreground"
          data-testid="leaderboard-progress-unavailable"
        >
          {t("leaderboard.progressUnavailable")}
        </p>
      )}
    </div>
  )
}
