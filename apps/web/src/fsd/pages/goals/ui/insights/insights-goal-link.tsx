import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { characterIcon, mowIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"

import { goalTypeIcon, type GoalKind } from "@/entities/goal"
import { EntityIcon } from "@/shared/ui"

import { goalHref, type InsightsGoalInfo } from "./insights-view"

/** A goal shown as its unit's portrait, the unit's name and the goal type's icon (the type is
 *  spelled out for screen readers), opening its edit dialog on the Goals list. `row` sizes the
 *  portrait for a list row; `chip` is a compact pill for a goal list under a material. */
export function GoalLink({
  goalId,
  label,
  info,
  variant = "chip",
}: {
  goalId: string
  label: { name: string; goalType: string } | null
  info?: InsightsGoalInfo
  variant?: "row" | "chip"
}) {
  const { t } = useTranslation()
  if (!label) {
    return (
      <Link
        className="min-w-0 truncate underline-offset-4 hover:underline"
        to={goalHref(goalId)}
      >
        {t("goals.insights.unknownGoal")}
      </Link>
    )
  }
  const portrait = info ? unitPortrait(info) : undefined
  const typeIcon = info
    ? goalTypeIcon(info.goalType as GoalKind, info.entityType)
    : undefined

  return (
    <Link
      aria-label={t("goals.insights.goalLabel", label)}
      className={cn(
        "group relative flex min-w-0 items-center underline-offset-4 pointer-coarse:min-h-10 pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:-inset-y-1",
        variant === "chip"
          ? "gap-1.5 rounded-full border bg-muted/40 py-0.5 pr-2.5 pl-0.5 text-xs hover:bg-muted"
          : "gap-2.5 text-sm"
      )}
      to={goalHref(goalId)}
    >
      {portrait ? (
        <EntityIcon
          alt=""
          className={cn(
            "shrink-0 rounded-full",
            variant === "chip" ? "size-6" : "size-9 pointer-coarse:size-10"
          )}
          src={portrait}
        />
      ) : null}
      <span className="min-w-0 truncate group-hover:underline">
        {label.name}
      </span>
      <span className="sr-only">{` · ${label.goalType}`}</span>
      {typeIcon ? (
        <EntityIcon alt="" className="size-4 shrink-0" src={typeIcon} />
      ) : null}
    </Link>
  )
}

function unitPortrait(info: InsightsGoalInfo) {
  if (info.entityType === "Character") {
    return characterIcon(info.entityId as UnitId)
  }
  if (info.entityType === "Mow") return mowIcon(info.entityId as UnitId)
  return undefined
}
