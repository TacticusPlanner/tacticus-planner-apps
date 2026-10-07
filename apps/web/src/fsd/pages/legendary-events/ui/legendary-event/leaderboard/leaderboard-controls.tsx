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
import type { ObjectiveChip } from "./leaderboard.view-model"

/**
 * The one controls bar shared by the lane and Overview leaderboards (design D7): "Only unlocked"
 * (disabled while ownership is unknown), "Deduct scored points" and the objective multi-select
 * chips. The notes for an unsynced roster and an unavailable progress read sit beneath it.
 */
export function LeaderboardControls({
  state,
  objectives,
  rosterAvailable,
  progressAvailable,
}: {
  state: LeaderboardControlsState
  objectives: readonly ObjectiveChip[]
  rosterAvailable: boolean
  progressAvailable: boolean
}) {
  const { t } = useTranslation("legendaryEvents")
  const unlockedId = useId()
  const deductId = useId()
  const selected = objectives
    .map((chip) => chip.key)
    .filter((key) => state.selectedObjectives.has(key))

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
      <ToggleGroup
        aria-label={t("leaderboard.objectiveFilter")}
        className="flex-wrap"
        data-testid="leaderboard-objective-filter"
        onValueChange={(keys) =>
          state.onSelectedObjectivesChange(new Set(keys))
        }
        size="sm"
        spacing={1}
        type="multiple"
        value={selected}
        variant="outline"
      >
        {objectives.map((chip) => (
          <ToggleGroupItem
            className="data-[state=on]:border-(--event-legendary) data-[state=on]:bg-(--event-legendary)/15"
            data-objective={chip.key}
            data-testid="leaderboard-objective-chip"
            key={chip.key}
            value={chip.key}
          >
            <ObjectiveIcon className="size-4" icon={chip.icon} />
            {chip.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
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
