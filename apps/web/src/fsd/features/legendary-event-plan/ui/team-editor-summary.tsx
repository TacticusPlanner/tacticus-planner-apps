import { useTranslation } from "react-i18next"
import { Check } from "lucide-react"

import {
  MIN_TEAM_MEMBERS,
  ObjectiveIcon,
  useObjectiveLabel,
  type LegendaryEventLane,
} from "@/entities/legendary-event"

import type { ClearDepthSummary } from "../model/clear-depth-display"

/**
 * The editor footer's read-only summary (design D2): the member count ("n/5 · at least 3" below
 * three, with the minimum message Save is described by), the covered objectives as compact chips
 * (one already cleared in every battle 1..`clearedThrough` carries a cleared mark) and the clear
 * depth (the value, the estimate marked "estimated", or not set). It reads the same draft as the
 * body; the depth stepper stays in the body.
 */
export function TeamEditorSummary({
  memberCount,
  checkedObjectives,
  depth,
  needsMembersId,
  clearedIndexes = [],
  clearedThrough = null,
}: {
  memberCount: number
  /** The checked objectives, in catalog `index` order. */
  checkedObjectives: readonly LegendaryEventLane["unitsRestrictions"][number][]
  depth: ClearDepthSummary
  /** The id of the minimum message, which Save is described by. */
  needsMembersId: string
  /** The covered objectives already cleared through `clearedThrough`. */
  clearedIndexes?: readonly number[]
  /** The depth the cleared marks read; null shows none. */
  clearedThrough?: number | null
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const objectiveLabel = useObjectiveLabel()
  const number = new Intl.NumberFormat(i18n.language)
  const needsMembers = memberCount < MIN_TEAM_MEMBERS
  return (
    <div
      aria-label={t("teams.editor.footer.summary")}
      className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 text-sm"
      data-testid="team-editor-summary"
      role="group"
    >
      <span
        className="rounded-full border px-2 py-0.5 font-semibold tabular-nums"
        data-testid="team-editor-summary-count"
      >
        {needsMembers
          ? t("teams.picker.countBelowMinimum", {
              members: memberCount,
              min: MIN_TEAM_MEMBERS,
            })
          : t("teams.picker.count", {
              members: memberCount,
            })}
      </span>
      <ul
        aria-label={t("teams.editor.coverage")}
        className="flex min-w-0 flex-wrap items-center gap-1"
        data-testid="team-editor-summary-coverage"
      >
        {checkedObjectives.length === 0 ? (
          <li className="text-xs text-muted-foreground">
            {t("teams.editor.footer.noCoverage")}
          </li>
        ) : (
          checkedObjectives.map((objective) => {
            const { label, icon } = objectiveLabel(objective)
            const cleared =
              clearedThrough !== null &&
              clearedIndexes.includes(objective.index)
            return (
              <li
                className="flex items-center gap-1 rounded-full border border-primary/60 bg-primary/10 py-0.5 pr-2 pl-1 text-xs"
                data-cleared={cleared ? "true" : undefined}
                data-index={objective.index}
                data-testid="team-editor-summary-objective"
                key={objective.index}
              >
                <ObjectiveIcon className="size-4" icon={icon} />
                <span data-testid="team-editor-summary-objective-label">
                  {label}
                </span>
                {cleared ? (
                  <>
                    <Check
                      aria-hidden
                      className="size-3.5 shrink-0 text-muted-foreground"
                      data-testid="team-editor-summary-objective-cleared"
                    />
                    <span className="sr-only">
                      {t("teams.clearedThrough", { battle: clearedThrough })}
                    </span>
                  </>
                ) : null}
              </li>
            )
          })
        )}
      </ul>
      <span
        className="text-xs text-muted-foreground tabular-nums"
        data-estimated={depth.kind === "estimate" ? "true" : undefined}
        data-testid="team-editor-summary-depth"
      >
        {depth.kind === "unset"
          ? t("teams.editor.footer.depthUnset")
          : t(
              depth.kind === "estimate"
                ? "teams.editor.footer.depthEstimated"
                : "teams.editor.footer.depth",
              { depth: number.format(depth.depth) }
            )}
      </span>
      {needsMembers ? (
        <p
          className="w-full text-sm text-muted-foreground"
          data-testid="team-editor-needs-members"
          id={needsMembersId}
        >
          {t("teams.editor.needsMembers", { min: MIN_TEAM_MEMBERS })}
        </p>
      ) : null}
    </div>
  )
}
