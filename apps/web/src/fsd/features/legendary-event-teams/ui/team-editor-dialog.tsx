import { useId, useMemo, useRef, useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { Check } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { cn } from "@workspace/ui/lib/utils"

import {
  ObjectiveIcon,
  buildLanePointsModel,
  objectiveClearedThrough,
  teamEffectiveDepth,
  useObjectiveLabel,
  type ClearEstimate,
  type LaneProgressView,
  type LegendaryEventLane,
  type LegendaryEventLaneId,
  type LegendaryEventRosterUnit,
  type LegendaryEventRun,
  type LegendaryEventTeam,
  type LegendaryEventUnit,
} from "@/entities/legendary-event"
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/ui"

import type { TeamDraft } from "../model/plan-patches"
import {
  TEAM_NAME_MAX_LENGTH,
  canSaveDraft,
  checkedObjectives,
  defaultTeamName,
  draftNeedsMembers,
  effectiveTeamName,
  emptyEditorDraft,
  initialEditorDraft,
  toTeamDraft,
  toggleMember,
  toggleObjective,
  toggleReserve,
} from "../model/team-editor-draft"
import {
  clearDepthSummary,
  editStartsFromEstimate,
} from "../model/clear-depth-display"
import type { PickerEstimates, PickerGoalsPreview } from "../model/team-picker"
import type {
  DepthEstimateContext,
  PlanMutationOutcome,
} from "../model/use-legendary-event-plan"
import { ClearDepthField } from "./clear-depth-field"
import { TeamEditorSummary } from "./team-editor-summary"
import { TeamUnitPicker } from "./team-unit-picker"

/**
 * The team editor (design D3, D7, D8): a dialog on desktop and a bottom sheet on mobile. Opened
 * empty from Add team, with a suggestion's members from Use this team, or prefilled from Edit;
 * mount it with a fresh `key` per opening so the draft starts from the team. Covered objectives
 * follow the members live and can be unticked; the depth is the current run's, and mirrors the
 * card: the members' live estimate shows while no manual depth is set. Below three members Save is
 * unavailable and the footer says a team needs three characters. The dialog closes only once
 * the save succeeded — after a conflict or an error the draft stays for another try; after a
 * conflict (the plan was reloaded, this save was not applied) the dialog says so.
 *
 * The body reads Name, Covered objectives, Clear depth, then Members, so the team's result sits
 * above the long unit grid; a covered objective already cleared in every battle 1..the draft's
 * depth carries a cleared mark (spec: covered objectives already cleared through the depth are
 * marked) and stays tickable.
 *
 * The footer stays in view while the body scrolls (design D2): the member count, the covered
 * objectives as read-only chips, the depth line and the actions, all read from the same draft as
 * the body. A new team also offers Save and add another (design D3): after a successful save the
 * draft is reset for the next team on the lane while the picker's chips, search, Only unlocked and
 * Goals Preview stay, and focus moves to the search field.
 */
export function TeamEditorDialog({
  open,
  onOpenChange,
  laneId,
  lane,
  units,
  roster,
  team,
  teamName,
  teamNumber,
  run,
  onlyUnlockedDefault,
  onSubmit,
  estimateTeam,
  initialMemberUnitIds,
  goalsPreview,
  goalLines,
  progress,
  estimates,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  laneId: LegendaryEventLaneId
  lane: LegendaryEventLane
  units: readonly LegendaryEventUnit[]
  roster: readonly LegendaryEventRosterUnit[] | undefined
  /** The team being edited; absent for a new team. */
  team?: LegendaryEventTeam
  /** The edited team's display name: the name field starts from it and the title names it. */
  teamName?: string
  /** N of the "Team N" fallback name. */
  teamNumber: number
  run: LegendaryEventRun
  onlyUnlockedDefault: boolean
  /** `shown` is the estimate behind the saved depth, for the override log (design D8). */
  onSubmit: (
    draft: TeamDraft,
    shown: DepthEstimateContext
  ) => Promise<PlanMutationOutcome>
  /** The lane's estimator; absent while estimates are unavailable. */
  estimateTeam?: (memberUnitIds: readonly string[]) => ClearEstimate | null
  /** A new team's members, in order (a team suggestion); ignored when editing a team. */
  initialMemberUnitIds?: readonly string[]
  goalsPreview?: PickerGoalsPreview
  /** A unit's goal badge lines; absent or empty shows no badge. */
  goalLines?: (unitId: string) => readonly string[]
  /** The lane's synced progress; undefined while it loads or failed (nothing is cleared). */
  progress?: LaneProgressView
  /** The lane's unit clear estimates and power inputs for the picker; absent when unavailable. */
  estimates?: PickerEstimates
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const objectiveLabel = useObjectiveLabel()
  const nameId = useId()
  const needsMembersId = useId()
  const context = { lane, units }
  const [initialDraft] = useState(() =>
    initialEditorDraft(team, run, context, initialMemberUnitIds, teamName)
  )
  const [draft, setDraft] = useState(initialDraft)
  const [saving, setSaving] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const isMobile = useIsMobile()
  const [reloaded, setReloaded] = useState(false)
  const number = new Intl.NumberFormat(i18n.language)
  const objectives = [...lane.unitsRestrictions].sort(
    (a, b) => a.index - b.index
  )
  const checked = checkedObjectives(draft)
  const defaultName = defaultTeamName(
    objectives
      .filter((objective) => checked.includes(objective.index))
      .map((objective) => objectiveLabel(objective).label),
    t("teams.editor.defaultName", { number: teamNumber })
  )
  const name = effectiveTeamName(draft, defaultName)
  const nameTooLong = name.length > TEAM_NAME_MAX_LENGTH
  const needsMembers = draftNeedsMembers(draft)
  const canSave = canSaveDraft(draft, name) && !saving
  const estimate =
    draft.memberUnitIds.length > 0
      ? (estimateTeam?.(draft.memberUnitIds) ?? null)
      : null
  const owned = roster
    ? new Set(roster.map((entry) => entry.unitId as string))
    : undefined
  const model = useMemo(() => buildLanePointsModel(lane), [lane])
  const draftDepth = teamEffectiveDepth(draft.depth, estimate)
  const lockedMemberCount = owned
    ? draft.memberUnitIds.filter((unitId) => !owned.has(unitId)).length
    : 0

  const handleToggleMember = (unitId: string) => {
    const result = toggleMember(draft, unitId, context)
    if (!result.refused) setDraft(result.draft)
    return !result.refused
  }

  const save = async (addAnother: boolean) => {
    if (!canSave) return
    setSaving(true)
    setReloaded(false)
    const outcome = await onSubmit(toTeamDraft(draft, name), {
      estimate: estimate?.depth ?? null,
      fromEstimate: editStartsFromEstimate(initialDraft.depth, estimate),
    })
    setSaving(false)
    setReloaded(outcome === "conflict")
    if (outcome !== "saved") return
    if (addAnother) {
      setDraft(emptyEditorDraft())
      searchInputRef.current?.focus()
    } else {
      onOpenChange(false)
    }
  }
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    void save(false)
  }
  const actionClassName = isMobile ? "h-11" : undefined

  return (
    <ResponsiveDialog
      data-testid="team-editor"
      onOpenChange={(next) => {
        if (!saving) onOpenChange(next)
      }}
      open={open}
      preventOutsideClose
    >
      <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {team
              ? t("teams.editor.editTitle", { name: teamName ?? team.name })
              : t("teams.editor.createTitle", {
                  lane: t(`lanes.${laneId}`),
                })}
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="gap-5 pb-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor={nameId}>
              {t("teams.editor.name")}
            </label>
            <Input
              aria-invalid={nameTooLong || undefined}
              data-testid="team-editor-name"
              id={nameId}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder={defaultName}
              value={draft.name ?? defaultName}
            />
            {nameTooLong ? (
              <p className="text-xs text-destructive">
                {t("teams.editor.nameTooLong", { max: TEAM_NAME_MAX_LENGTH })}
              </p>
            ) : null}
          </div>

          <section
            className="flex flex-col gap-2"
            data-testid="team-editor-coverage"
          >
            <h3 className="text-sm font-medium">
              {t("teams.editor.coverage")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {draft.memberUnitIds.length === 0
                ? t("teams.editor.noMembers")
                : draft.derived.length === 0
                  ? t("teams.editor.noCoverage")
                  : t("teams.editor.coverageHint")}
            </p>
            <ul className="flex flex-wrap gap-2">
              {objectives
                .filter((objective) => draft.derived.includes(objective.index))
                .map((objective) => {
                  const { label, icon } = objectiveLabel(objective)
                  const isChecked = checked.includes(objective.index)
                  const cleared =
                    draftDepth !== null &&
                    objectiveClearedThrough(
                      model,
                      progress,
                      objective.index,
                      draftDepth
                    )
                  const clearedLabel = cleared
                    ? t("teams.clearedThrough", { battle: draftDepth })
                    : undefined
                  return (
                    <li key={objective.index}>
                      <button
                        aria-pressed={isChecked}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full border py-1 pr-2.5 pl-1.5 text-sm transition-colors",
                          isChecked
                            ? "border-primary bg-primary/10"
                            : "bg-transparent text-muted-foreground line-through"
                        )}
                        data-cleared={cleared ? "true" : undefined}
                        data-index={objective.index}
                        data-testid="team-editor-objective"
                        onClick={() =>
                          setDraft((current) =>
                            toggleObjective(current, objective.index)
                          )
                        }
                        title={clearedLabel}
                        type="button"
                      >
                        <ObjectiveIcon icon={icon} muted={!isChecked} />
                        <span data-testid="team-editor-objective-label">
                          {label}
                        </span>
                        <span className="font-semibold tabular-nums">
                          {number.format(objective.points)}
                        </span>
                        {cleared ? (
                          <Check
                            aria-hidden
                            className="size-3.5 shrink-0 text-muted-foreground"
                            data-testid="team-editor-objective-cleared"
                          />
                        ) : null}
                        {clearedLabel ? (
                          <span className="sr-only">{clearedLabel}</span>
                        ) : null}
                      </button>
                    </li>
                  )
                })}
            </ul>
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">
              {t("teams.editor.depth", { run })}
            </h3>
            <ClearDepthField
              align="start"
              battleCount={lane.battleIds.length}
              data-testid="team-editor-depth"
              estimate={estimate}
              lockedMemberCount={lockedMemberCount}
              onChange={(depth) =>
                setDraft((current) => ({ ...current, depth }))
              }
              value={draft.depth}
            />
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">{t("teams.editor.members")}</h3>
            <TeamUnitPicker
              estimates={estimates}
              goalLines={goalLines}
              goalsPreview={goalsPreview}
              lane={lane}
              memberUnitIds={draft.memberUnitIds}
              onToggleMember={handleToggleMember}
              onToggleReserve={(unitId) =>
                setDraft((current) => toggleReserve(current, unitId, context))
              }
              onlyUnlockedDefault={onlyUnlockedDefault}
              progress={progress}
              reserveUnitId={draft.reserveUnitId}
              roster={roster}
              searchInputRef={searchInputRef}
              units={units}
            />
          </section>
        </ResponsiveDialogBody>
        {reloaded ? (
          <p
            className="px-6 pt-2 text-sm text-destructive"
            data-testid="team-editor-not-saved"
            role="alert"
          >
            {t("teams.editor.notSaved")}
          </p>
        ) : null}
        <ResponsiveDialogFooter className="border-t md:justify-between">
          <TeamEditorSummary
            checkedObjectives={objectives.filter((objective) =>
              checked.includes(objective.index)
            )}
            depth={clearDepthSummary(draft.depth, estimate)}
            memberCount={draft.memberUnitIds.length}
            needsMembersId={needsMembersId}
          />
          <div
            className="flex shrink-0 flex-wrap justify-end gap-2"
            data-testid="team-editor-actions"
          >
            <Button
              className={actionClassName}
              disabled={saving}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              {t("teams.editor.cancel")}
            </Button>
            {team ? null : (
              <Button
                aria-describedby={needsMembers ? needsMembersId : undefined}
                className={actionClassName}
                data-testid="team-editor-save-another"
                disabled={!canSave}
                onClick={() => void save(true)}
                type="button"
                variant="secondary"
              >
                {t("teams.editor.saveAndAddAnother")}
              </Button>
            )}
            <Button
              aria-describedby={needsMembers ? needsMembersId : undefined}
              className={actionClassName}
              data-testid="team-editor-save"
              disabled={!canSave}
              type="submit"
            >
              {saving ? (
                <Spinner aria-label={t("teams.editor.saving")} />
              ) : null}
              {t("teams.editor.save")}
            </Button>
          </div>
        </ResponsiveDialogFooter>
      </form>
    </ResponsiveDialog>
  )
}
