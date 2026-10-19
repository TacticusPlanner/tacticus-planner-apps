import { useState } from "react"
import { useTranslation } from "react-i18next"
import { X } from "lucide-react"
import { characterIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import type { LegendaryEventLaneId } from "@/entities/legendary-event"
import { EntityIcon } from "@/shared/ui"

import { PLAN_LANE_IDS } from "./plan-inputs"
import type { DraftTeam } from "./plan-teams"
import type { PlanDraft } from "./use-plan-draft"

/**
 * Step 3 (spec: review the generated teams): Keep my teams or Replace my teams, then each lane's
 * teams with their depth per run. Removing a team lets the next best suggestion take its place;
 * Restore brings removed teams back. Lanes are tabs below 768px and stacked above it.
 */
export function TeamsStep({ draft }: { draft: PlanDraft }) {
  const { t } = useTranslation("legendaryEvents")
  const [lane, setLane] = useState<LegendaryEventLaneId>("alpha")
  const { adjustments, evaluation } = draft
  const hasStored = draft.inputs.plan.teams.some(
    (team) => team.memberUnitIds.length > 0
  )
  const remove = (key: string) =>
    draft.adjustTeams((current) => ({
      ...current,
      removed: new Set([...current.removed, key]),
    }))

  return (
    <section className="flex flex-col gap-4" data-testid="plan-wizard-teams">
      <h2 className="text-lg font-semibold">{t("planWizard.steps.teams")}</h2>
      {hasStored ? (
        <div className="flex flex-wrap gap-2" role="group">
          {([false, true] as const).map((replace) => (
            <Button
              aria-pressed={adjustments.replace === replace}
              data-testid={`plan-wizard-teams-${replace ? "replace" : "keep"}`}
              key={String(replace)}
              onClick={() =>
                draft.adjustTeams((current) => ({ ...current, replace }))
              }
              size="sm"
              variant={adjustments.replace === replace ? "default" : "outline"}
            >
              {t(
                replace ? "planWizard.teams.replace" : "planWizard.teams.keep"
              )}
            </Button>
          ))}
        </div>
      ) : null}
      {adjustments.removed.size > 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          {t("planWizard.teams.removed", { count: adjustments.removed.size })}
          <Button
            className="h-auto px-0"
            onClick={() =>
              draft.adjustTeams((current) => ({
                ...current,
                removed: new Set(),
              }))
            }
            variant="link"
          >
            {t("planWizard.teams.restore")}
          </Button>
        </p>
      ) : null}
      <div className="flex gap-1 md:hidden" role="tablist">
        {PLAN_LANE_IDS.map((laneId) => (
          <Button
            aria-selected={lane === laneId}
            key={laneId}
            onClick={() => setLane(laneId)}
            role="tab"
            size="sm"
            variant={lane === laneId ? "default" : "ghost"}
          >
            {t(`lanes.${laneId}`)}
          </Button>
        ))}
      </div>
      {PLAN_LANE_IDS.map((laneId) => {
        const teams = evaluation.teams.filter((team) => team.laneId === laneId)
        return (
          <div
            className={cn(
              "flex-col gap-2",
              lane === laneId ? "flex" : "hidden md:flex"
            )}
            data-lane={laneId}
            data-testid="plan-wizard-lane"
            key={laneId}
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
                    draft={draft}
                    key={team.key}
                    onRemove={() => remove(team.key)}
                    team={team}
                  />
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </section>
  )
}

function TeamRow({
  draft,
  team,
  onRemove,
}: {
  draft: PlanDraft
  team: DraftTeam
  onRemove: () => void
}) {
  const { t } = useTranslation("legendaryEvents")
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
          aria-label={t("planWizard.teams.removeTeam", { name })}
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
      <p className="text-xs text-muted-foreground">
        {draft.runs
          .map((run) => {
            const depth = team.depthByRun[run] ?? 0
            return depth > 0
              ? t("planWizard.teams.depth", { run, depth })
              : t("planWizard.teams.depthNone", { run })
          })
          .join(" · ")}
      </p>
    </li>
  )
}
