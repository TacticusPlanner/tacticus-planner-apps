import { useEffect, useId, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, Lock } from "lucide-react"
import { characterIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Switch } from "@workspace/ui/components/switch"
import { cn } from "@workspace/ui/lib/utils"

import { UnitGoalBadge } from "@/entities/goal"
import {
  ObjectiveIcon,
  objectiveClearedThrough,
  useObjectiveLabel,
  type TeamSuggestion,
} from "@/entities/legendary-event"
import { useAnalyticsActions } from "@/shared/analytics"
import {
  EntityIcon,
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/ui"
import { useUnitName } from "@/shared/unit-name"

import type { TeamSuggestionsSource } from "../model/team-suggestions-state"
import { useTeamSuggestions } from "../model/use-team-suggestions"

const FIRST_SHOWN = 3
const MAX_SHOWN = 10

/**
 * Suggest teams (spec: Suggest teams dialog): a dialog on desktop and a bottom sheet on mobile with
 * the Only unlocked and Prefer units with goals toggles, the first three proposals and Show more up
 * to ten. Each proposal lists its members (goal badge, locked styling), its covered objectives, a
 * one-line reason and Use this team, which hands it to `onUseSuggestion`; nothing is saved here.
 * Mount it per opening so the toggles reset when it closes; `open` false hides it while the team
 * editor it handed a proposal to is open.
 */
export function TeamSuggestionsDialog({
  open,
  onClose,
  source,
  goalLines,
  onUseSuggestion,
}: {
  open: boolean
  onClose: () => void
  source: TeamSuggestionsSource
  goalLines?: (unitId: string) => readonly string[]
  /** `rank` is the proposal's 1-based position in the list. */
  onUseSuggestion: (suggestion: TeamSuggestion, rank: number) => void
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const unitName = useUnitName()
  const objectiveLabel = useObjectiveLabel()
  const { captureEvent } = useAnalyticsActions()
  const nameOf = (unit: { id: string }) => unitName("Character", unit.id)
  const { state, toggles, setOnlyUnlocked, setPreferGoals } =
    useTeamSuggestions(source, nameOf)
  const [showMore, setShowMore] = useState(false)
  const unlockedId = useId()
  const goalsId = useId()
  const reasonIdPrefix = useId()
  const number = new Intl.NumberFormat(i18n.language)
  const list = new Intl.ListFormat(i18n.language, { type: "conjunction" })
  const objectives = new Map(
    source.lane.unitsRestrictions.map((objective) => [
      objective.index,
      objectiveLabel(objective),
    ])
  )
  const owned =
    source.estimates && source.estimates !== "pending"
      ? source.estimates.roster
      : undefined

  // Logged once per opening, when the first proposals are known.
  const logged = useRef(false)
  const readyCount = state.kind === "ready" ? state.suggestions.length : null
  useEffect(() => {
    if (logged.current || readyCount === null) return
    logged.current = true
    captureEvent({
      type: "legendary_event_team_suggestions_opened",
      eventId: source.eventId,
      laneId: source.laneId,
      suggestionCount: readyCount,
    })
  }, [readyCount, captureEvent, source.eventId, source.laneId])

  const suggestions = state.kind === "ready" ? state.suggestions : []
  const shown = suggestions.slice(0, showMore ? MAX_SHOWN : FIRST_SHOWN)

  return (
    <ResponsiveDialog
      data-testid="team-suggestions"
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      open={open}
    >
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>
          {t("suggestions.title", { lane: t(`lanes.${source.laneId}`) })}
        </ResponsiveDialogTitle>
        <p className="text-sm text-muted-foreground">
          {t("suggestions.description")}
        </p>
      </ResponsiveDialogHeader>
      <ResponsiveDialogBody className="gap-3 pb-4">
        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-muted/40 px-3 py-2"
          data-testid="team-suggestions-toggles"
        >
          <label
            className="flex min-h-11 items-center gap-2 text-sm md:min-h-0"
            htmlFor={unlockedId}
          >
            <Switch
              checked={toggles.onlyUnlocked}
              data-testid="team-suggestions-only-unlocked"
              id={unlockedId}
              onCheckedChange={setOnlyUnlocked}
            />
            {t("suggestions.onlyUnlocked")}
          </label>
          <label
            className="flex min-h-11 items-center gap-2 text-sm md:min-h-0"
            htmlFor={goalsId}
          >
            <Switch
              checked={toggles.preferGoals}
              data-testid="team-suggestions-prefer-goals"
              id={goalsId}
              onCheckedChange={setPreferGoals}
            />
            {t("suggestions.preferGoals")}
          </label>
        </div>

        {state.kind === "loading" ? (
          <div data-testid="team-suggestions-loading">
            <span className="sr-only">{t("suggestions.loading")}</span>
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : null}
        {state.kind === "needsEstimates" ? (
          <p
            className="text-sm text-muted-foreground"
            data-testid="team-suggestions-needs-estimates"
          >
            {t("suggestions.needsEstimates")}
          </p>
        ) : null}
        {state.kind === "ready" && suggestions.length === 0 ? (
          <p
            className="text-sm text-muted-foreground"
            data-testid="team-suggestions-empty"
          >
            {t("suggestions.empty")}
          </p>
        ) : null}

        {shown.length > 0 ? (
          <ol
            className="flex flex-col gap-3"
            data-testid="team-suggestion-list"
          >
            {shown.map((suggestion, index) => {
              // An objective cleared in every battle the proposal reaches earns nothing: it keeps
              // its chip with the cleared mark and leaves the reason line (spec: suggestions do
              // not rely on objectives already cleared).
              const covered = suggestion.coveredObjectiveIndexes.flatMap(
                (objectiveIndex) => {
                  const label = objectives.get(objectiveIndex)
                  return label
                    ? [
                        {
                          objectiveIndex,
                          ...label,
                          cleared: objectiveClearedThrough(
                            source.model,
                            source.progress,
                            objectiveIndex,
                            suggestion.depth
                          ),
                        },
                      ]
                    : []
                }
              )
              const scoring = covered.filter((objective) => !objective.cleared)
              return (
                <li
                  aria-label={t("suggestions.rank", { rank: index + 1 })}
                  className="flex min-w-0 flex-col gap-2 rounded-xl border p-3"
                  data-testid="team-suggestion"
                  key={suggestion.memberUnitIds.join("|")}
                >
                  <ul className="flex flex-wrap gap-2">
                    {suggestion.memberUnitIds.map((unitId) => {
                      const locked = owned ? !owned.has(unitId) : false
                      return (
                        <li
                          className="flex items-center gap-1.5 rounded-full border bg-muted/30 py-0.5 pr-2 pl-0.5 text-sm"
                          data-locked={locked ? "true" : undefined}
                          data-testid="team-suggestion-member"
                          data-unit={unitId}
                          key={unitId}
                        >
                          <EntityIcon
                            alt=""
                            className={cn(
                              "size-7 rounded-full",
                              locked && "opacity-50 grayscale"
                            )}
                            src={characterIcon(unitId as UnitId)}
                          />
                          <span className="max-w-32 truncate">
                            {nameOf({ id: unitId })}
                          </span>
                          {locked ? (
                            <Lock
                              aria-label={t("teams.picker.locked")}
                              className="size-3.5 text-muted-foreground"
                            />
                          ) : null}
                          <UnitGoalBadge
                            className="size-4"
                            label={t("goalBadge.label")}
                            lines={goalLines?.(unitId) ?? []}
                          />
                        </li>
                      )
                    })}
                  </ul>
                  <ul className="flex flex-wrap gap-1.5">
                    {covered.map(({ objectiveIndex, label, icon, cleared }) => (
                      <li
                        className={cn(
                          "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
                          cleared && "text-muted-foreground"
                        )}
                        data-cleared={cleared ? "true" : undefined}
                        data-index={objectiveIndex}
                        data-testid="team-suggestion-objective"
                        key={objectiveIndex}
                        title={
                          cleared
                            ? t("teams.clearedThrough", {
                                battle: suggestion.depth,
                              })
                            : undefined
                        }
                      >
                        <ObjectiveIcon
                          className="size-3.5"
                          icon={icon}
                          muted={cleared}
                        />
                        {label}
                        {cleared ? (
                          <>
                            <Check aria-hidden className="size-3 shrink-0" />
                            <span className="sr-only">
                              {t("teams.clearedThrough", {
                                battle: suggestion.depth,
                              })}
                            </span>
                          </>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  <p
                    className="text-sm text-muted-foreground"
                    data-testid="team-suggestion-reason"
                    id={`${reasonIdPrefix}-${index}`}
                  >
                    {scoring.length > 0
                      ? t("suggestions.reason", {
                          objectives: list.format(
                            scoring.map((objective) => objective.label)
                          ),
                          depth: suggestion.depth,
                          points: number.format(suggestion.gainPoints),
                        })
                      : t("suggestions.reasonNoObjectives", {
                          depth: suggestion.depth,
                          points: number.format(suggestion.gainPoints),
                        })}
                  </p>
                  <Button
                    aria-describedby={`${reasonIdPrefix}-${index}`}
                    className="min-h-11 w-full md:min-h-0 md:w-auto md:self-end"
                    data-testid="team-suggestion-use"
                    onClick={() => onUseSuggestion(suggestion, index + 1)}
                    size="sm"
                  >
                    {t("suggestions.use")}
                  </Button>
                </li>
              )
            })}
          </ol>
        ) : null}
        {!showMore && suggestions.length > FIRST_SHOWN ? (
          <Button
            className="self-start"
            data-testid="team-suggestions-show-more"
            onClick={() => setShowMore(true)}
            size="sm"
            variant="outline"
          >
            {t("suggestions.showMore")}
          </Button>
        ) : null}
      </ResponsiveDialogBody>
    </ResponsiveDialog>
  )
}
