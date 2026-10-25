import { useDeferredValue, useMemo, useState, type KeyboardEvent } from "react"
import { useTranslation } from "react-i18next"
import { Pencil, Plus, Undo2, X } from "lucide-react"
import { characterIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import type {
  LegendaryEventLaneId,
  LegendaryEventTeam,
} from "@/entities/legendary-event"
import { TeamEditorDialog } from "@/features/legendary-event-plan"
import { EntityIcon } from "@/shared/ui"

import { teamSwaps, type TeamSwap } from "./plan-evaluator"
import { PLAN_LANE_IDS } from "./plan-inputs"
import { memberKey, type DraftTeam } from "./plan-teams"
import type { PlanDraft } from "./use-plan-draft"

/** The team editor's view of a draft team. */
const asStoredTeam = (team: DraftTeam): LegendaryEventTeam => ({
  id: team.storedId ?? team.key,
  laneId: team.laneId,
  name: team.name,
  sortOrder: 0,
  memberUnitIds: team.memberUnitIds,
  reserveUnitId: team.reserveUnitId,
  objectiveIndexes: team.objectiveIndexes,
  runDepths: [],
})

/**
 * Step 3 (spec: teams step undoes, edits and adds teams): Keep my teams or Replace my teams with
 * their counts, then each lane's teams with their depth per run. Removing a team lets the next best
 * suggestion take its place; a removed team stays listed, struck through, with Undo, and Restore
 * all brings every one back. Edit and Add a team open the team editor on the draft. A kept team of
 * the user's that a generated one beats offers a swap (accepting removes it; Keep hides the offer).
 * Lanes are tabs below 768px, stacked from 768px and side by side from 1024px.
 */
export function TeamsStep({
  draft,
  lane,
  onLaneChange,
}: {
  draft: PlanDraft
  lane: LegendaryEventLaneId
  onLaneChange: (laneId: LegendaryEventLaneId) => void
}) {
  const { t } = useTranslation("legendaryEvents")
  const [editor, setEditor] = useState<{
    laneId: LegendaryEventLaneId
    team: DraftTeam | null
    opening: number
  } | null>(null)
  const { adjustments, evaluation, planEconomy, inputs } = draft
  // Swap offers regenerate a lane per kept team: computed at deferred priority.
  const deferred = useDeferredValue(evaluation)
  const swaps = useMemo(
    () =>
      new Map(
        teamSwaps(inputs, planEconomy, adjustments, deferred).map((swap) => [
          swap.teamKey,
          swap,
        ])
      ),
    [inputs, planEconomy, adjustments, deferred]
  )
  const storedCount = inputs.plan.teams.filter(
    (team) => team.memberUnitIds.length > 0
  ).length
  const generatedCount = evaluation.teams.filter(
    (team) => team.storedId === null
  ).length
  const removed = [...draft.removedTeams.values()]
  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>, at: number) => {
    const delta =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0
    if (delta === 0) return
    event.preventDefault()
    const next =
      PLAN_LANE_IDS[(at + delta + PLAN_LANE_IDS.length) % PLAN_LANE_IDS.length]!
    onLaneChange(next)
    document.getElementById(`plan-wizard-tab-${next}`)?.focus()
  }
  const editorLane = editor
    ? inputs.lanes.find((entry) => entry.laneId === editor.laneId)
    : undefined
  const firstRun = draft.runs[0] ?? 1
  const editorRoster = useMemo(
    () => [...(evaluation.rosters.get(firstRun)?.values() ?? [])],
    [evaluation.rosters, firstRun]
  )

  return (
    <section className="flex flex-col gap-4" data-testid="plan-wizard-teams">
      <h2 className="text-lg font-semibold">{t("planWizard.steps.teams")}</h2>
      {storedCount > 0 ? (
        <div
          aria-label={t("planWizard.teams.modeLabel")}
          className="inline-flex w-fit max-w-full rounded-lg border p-0.5"
          role="group"
        >
          {([false, true] as const).map((replace) => (
            <Button
              aria-pressed={adjustments.replace === replace}
              // Wraps instead of overflowing a phone-width page (longer in de/es/fr).
              className="h-auto min-h-8 min-w-0 shrink whitespace-normal"
              data-testid={`plan-wizard-teams-${replace ? "replace" : "keep"}`}
              key={String(replace)}
              onClick={() =>
                draft.adjustTeams((current) => ({ ...current, replace }))
              }
              size="sm"
              variant={adjustments.replace === replace ? "default" : "ghost"}
            >
              {replace
                ? t("planWizard.teams.replaceCount", { count: generatedCount })
                : t("planWizard.teams.keepCount", { count: storedCount })}
            </Button>
          ))}
        </div>
      ) : null}
      {removed.length > 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          {t("planWizard.teams.removed", { count: removed.length })}
          <Button
            className="h-auto px-0"
            data-testid="plan-wizard-teams-restore-all"
            onClick={draft.restoreAll}
            variant="link"
          >
            {t("planWizard.teams.restoreAll")}
          </Button>
        </p>
      ) : null}
      <div
        aria-label={t("planWizard.teams.lanesLabel")}
        className="flex gap-1 md:hidden"
        role="tablist"
      >
        {PLAN_LANE_IDS.map((laneId, at) => (
          <Button
            aria-controls={`plan-wizard-lane-${laneId}`}
            aria-selected={lane === laneId}
            id={`plan-wizard-tab-${laneId}`}
            key={laneId}
            onClick={() => onLaneChange(laneId)}
            onKeyDown={(event) => onTabKey(event, at)}
            role="tab"
            size="sm"
            tabIndex={lane === laneId ? 0 : -1}
            variant={lane === laneId ? "default" : "ghost"}
          >
            {t(`lanes.${laneId}`)}
          </Button>
        ))}
      </div>
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-3">
        {PLAN_LANE_IDS.map((laneId) => {
          const teams = evaluation.teams.filter(
            (team) => team.laneId === laneId
          )
          const laneRemoved = removed.filter(
            (entry) => entry.team.laneId === laneId
          )
          const battles =
            inputs.lanes.find((entry) => entry.laneId === laneId)?.lane
              .battleIds.length ?? 0
          return (
            <div
              aria-labelledby={`plan-wizard-tab-${laneId}`}
              className={cn(
                "min-w-0 flex-col gap-2",
                lane === laneId ? "flex" : "hidden md:flex"
              )}
              data-lane={laneId}
              data-testid="plan-wizard-lane"
              id={`plan-wizard-lane-${laneId}`}
              key={laneId}
              role="tabpanel"
            >
              <h3 className="hidden font-semibold md:block">
                {t(`lanes.${laneId}`)}
              </h3>
              {teams.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("planWizard.teams.empty")}
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {teams.map((team) => (
                    <TeamRow
                      battles={battles}
                      draft={draft}
                      key={team.key}
                      onEdit={() =>
                        setEditor({
                          laneId,
                          team,
                          opening: Date.now(),
                        })
                      }
                      onRemove={() => draft.removeTeam(team)}
                      swap={
                        draft.skippedSwaps.has(team.key)
                          ? undefined
                          : swaps.get(team.key)
                      }
                      team={team}
                    />
                  ))}
                </ul>
              )}
              {laneRemoved.length > 0 ? (
                <ul className="flex flex-col gap-1.5">
                  {laneRemoved.map((entry) => (
                    <li
                      className="flex items-center gap-2 rounded-xl border border-dashed px-3 py-2 text-sm text-muted-foreground"
                      data-testid="plan-wizard-removed-team"
                      key={entry.team.key}
                    >
                      <span className="min-w-0 flex-1 truncate line-through">
                        {entry.name}
                      </span>
                      <Button
                        data-testid="plan-wizard-team-undo"
                        onClick={() => draft.undoRemove(entry.team.key)}
                        size="sm"
                        variant="ghost"
                      >
                        <Undo2 aria-hidden="true" />
                        {t("planWizard.teams.undo")}
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <Button
                className="w-fit"
                data-testid="plan-wizard-team-add"
                onClick={() =>
                  setEditor({ laneId, team: null, opening: Date.now() })
                }
                size="sm"
                variant="outline"
              >
                <Plus aria-hidden="true" />
                {t("planWizard.teams.add")}
              </Button>
            </div>
          )
        })}
      </div>
      {editor && editorLane ? (
        <TeamEditorDialog
          key={editor.opening}
          lane={editorLane.lane}
          laneId={editor.laneId}
          onOpenChange={(open) => {
            if (!open) setEditor(null)
          }}
          onSubmit={(values) => {
            const team = {
              name: values.name,
              memberUnitIds: values.memberUnitIds,
              reserveUnitId: values.reserveUnitId,
              objectiveIndexes: values.objectiveIndexes,
            }
            if (editor.team) draft.editTeam(editor.team, team)
            else draft.addTeam(editor.laneId, team)
            setEditor(null)
            return Promise.resolve("saved")
          }}
          onlyUnlockedDefault
          open
          roster={editorRoster}
          run={firstRun}
          team={editor.team ? asStoredTeam(editor.team) : undefined}
          teamName={editor.team ? draft.teamName(editor.team.key) : undefined}
          teamNumber={
            evaluation.teams.filter((team) => team.laneId === editor.laneId)
              .length + 1
          }
          units={inputs.units}
        />
      ) : null}
    </section>
  )
}

function TeamRow({
  draft,
  team,
  swap,
  battles,
  onRemove,
  onEdit,
}: {
  draft: PlanDraft
  team: DraftTeam
  swap: TeamSwap | undefined
  /** The lane's battle count, for the depth bars. */
  battles: number
  onRemove: () => void
  onEdit: () => void
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const name = draft.teamName(team.key)
  return (
    <li
      className="flex flex-col gap-2 rounded-xl border p-3"
      data-stored={team.storedId !== null}
      data-testid="plan-wizard-team"
    >
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
        {team.storedId !== null ? (
          <Badge variant="outline">{t("planWizard.teams.yours")}</Badge>
        ) : null}
        <Button
          aria-label={t("planWizard.teams.editTeam", { name })}
          data-testid="plan-wizard-team-edit"
          onClick={onEdit}
          size="icon"
          variant="ghost"
        >
          <Pencil aria-hidden="true" />
        </Button>
        <Button
          aria-label={t("planWizard.teams.removeTeam", { name })}
          data-testid="plan-wizard-team-remove"
          onClick={onRemove}
          size="icon"
          variant="ghost"
        >
          <X aria-hidden="true" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-1">
        {team.memberUnitIds.map((unitId) => (
          <EntityIcon
            alt={draft.inputs.nameOf(unitId)}
            className="size-9 rounded-full"
            key={unitId}
            src={characterIcon(unitId as UnitId)}
          />
        ))}
      </div>
      <ul className="flex flex-col gap-1" data-testid="plan-wizard-team-depth">
        {draft.runs.map((run) => {
          const depth = team.depthByRun[run] ?? 0
          const share = battles > 0 ? Math.min(100, (depth / battles) * 100) : 0
          return (
            <li
              className="flex items-center gap-2 text-xs text-muted-foreground"
              key={run}
            >
              <span className="w-36 shrink-0 tabular-nums">
                {t("planWizard.teams.depthOf", { run, depth, battles })}
              </span>
              <span
                aria-hidden="true"
                className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted"
              >
                <span
                  className="block h-full rounded-full bg-primary"
                  style={{ width: `${share}%` }}
                />
              </span>
            </li>
          )
        })}
      </ul>
      {swap ? (
        <div
          className="flex flex-col gap-2 rounded-lg bg-muted/60 p-2 text-sm"
          data-testid="plan-wizard-swap"
        >
          <p>
            {t(
              // The same units credited with more objectives, or other units.
              swap.replacements.some(
                (replacement) =>
                  memberKey(replacement.memberUnitIds) ===
                  memberKey(team.memberUnitIds)
              )
                ? "planWizard.teams.swapSame"
                : "planWizard.teams.swap",
              {
                points: new Intl.NumberFormat(i18n.language).format(
                  Math.round(swap.gain)
                ),
              }
            )}
          </p>
          {swap.replacements.map((replacement) => (
            <div className="flex flex-wrap gap-1" key={replacement.key}>
              {replacement.memberUnitIds.map((unitId) => (
                <EntityIcon
                  alt={draft.inputs.nameOf(unitId)}
                  className="size-7 rounded-full"
                  key={unitId}
                  src={characterIcon(unitId as UnitId)}
                />
              ))}
            </div>
          ))}
          <div className="flex gap-2">
            <Button
              data-testid="plan-wizard-swap-accept"
              onClick={onRemove}
              size="sm"
            >
              {t("planWizard.teams.swapAccept")}
            </Button>
            <Button
              data-testid="plan-wizard-swap-skip"
              onClick={() => draft.skipSwap(team.key)}
              size="sm"
              variant="outline"
            >
              {t("planWizard.teams.swapSkip")}
            </Button>
          </div>
        </div>
      ) : null}
    </li>
  )
}
