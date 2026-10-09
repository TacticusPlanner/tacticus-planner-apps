import { useId, useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
import { cn } from "@workspace/ui/lib/utils"

import {
  ObjectiveIcon,
  useObjectiveLabel,
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
  effectiveTeamName,
  initialEditorDraft,
  toTeamDraft,
  toggleMember,
  toggleObjective,
  toggleReserve,
} from "../model/team-editor-draft"
import type { PlanMutationOutcome } from "../model/use-legendary-event-plan"
import { ClearDepthStepper } from "./clear-depth-stepper"
import { TeamUnitPicker } from "./team-unit-picker"

/**
 * The team editor (design D3, D7, D8): a dialog on desktop and a bottom sheet on mobile. Opened
 * empty from Add team or prefilled from Edit; mount it with a fresh `key` per opening so the draft
 * starts from the team. Covered objectives follow the members live and can be unticked; the depth
 * is the current run's. The dialog closes only once the save succeeded — after a conflict or an
 * error the draft stays for another try; after a conflict (the plan was reloaded, this save was
 * not applied) the dialog says so.
 */
export function TeamEditorDialog({
  open,
  onOpenChange,
  laneId,
  lane,
  units,
  roster,
  team,
  teamNumber,
  run,
  onlyUnlockedDefault,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  laneId: LegendaryEventLaneId
  lane: LegendaryEventLane
  units: readonly LegendaryEventUnit[]
  roster: readonly LegendaryEventRosterUnit[] | undefined
  /** The team being edited; absent for a new team. */
  team?: LegendaryEventTeam
  /** N of the "Team N" fallback name. */
  teamNumber: number
  run: LegendaryEventRun
  onlyUnlockedDefault: boolean
  onSubmit: (draft: TeamDraft) => Promise<PlanMutationOutcome>
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const objectiveLabel = useObjectiveLabel()
  const nameId = useId()
  const context = { lane, units }
  const [draft, setDraft] = useState(() =>
    initialEditorDraft(team, run, context)
  )
  const [saving, setSaving] = useState(false)
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
  const canSave = canSaveDraft(draft, name) && !saving

  const handleToggleMember = (unitId: string) => {
    const result = toggleMember(draft, unitId, context)
    if (!result.refused) setDraft(result.draft)
    return !result.refused
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSave) return
    setSaving(true)
    setReloaded(false)
    const outcome = await onSubmit(toTeamDraft(draft, name))
    setSaving(false)
    setReloaded(outcome === "conflict")
    if (outcome === "saved") onOpenChange(false)
  }

  return (
    <ResponsiveDialog
      data-testid="team-editor"
      onOpenChange={(next) => {
        if (!saving) onOpenChange(next)
      }}
      open={open}
      preventOutsideClose
    >
      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {team
              ? t("teams.editor.editTitle", { name: team.name })
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

          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">{t("teams.editor.members")}</h3>
            <TeamUnitPicker
              lane={lane}
              memberUnitIds={draft.memberUnitIds}
              onToggleMember={handleToggleMember}
              onToggleReserve={(unitId) =>
                setDraft((current) => toggleReserve(current, unitId, context))
              }
              onlyUnlockedDefault={onlyUnlockedDefault}
              reserveUnitId={draft.reserveUnitId}
              roster={roster}
              units={units}
            />
          </section>

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
                        data-index={objective.index}
                        data-testid="team-editor-objective"
                        onClick={() =>
                          setDraft((current) =>
                            toggleObjective(current, objective.index)
                          )
                        }
                        type="button"
                      >
                        <ObjectiveIcon icon={icon} muted={!isChecked} />
                        <span data-testid="team-editor-objective-label">
                          {label}
                        </span>
                        <span className="font-semibold tabular-nums">
                          {number.format(objective.points)}
                        </span>
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
            <ClearDepthStepper
              battleCount={lane.battleIds.length}
              data-testid="team-editor-depth"
              onChange={(depth) =>
                setDraft((current) => ({ ...current, depth }))
              }
              value={draft.depth}
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
        <ResponsiveDialogFooter>
          <Button
            disabled={saving}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            {t("teams.editor.cancel")}
          </Button>
          <Button
            data-testid="team-editor-save"
            disabled={!canSave}
            type="submit"
          >
            {saving ? <Spinner aria-label={t("teams.editor.saving")} /> : null}
            {t("teams.editor.save")}
          </Button>
        </ResponsiveDialogFooter>
      </form>
    </ResponsiveDialog>
  )
}
