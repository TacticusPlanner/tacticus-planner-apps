import { useTranslation } from "react-i18next"
import { characterIcon, mowIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "@/shared/ui"
import { useUnitName } from "@/shared/unit-name"

import type { PortraitUnit } from "../model/project-unit-portraits"
import { portraitsLabel } from "../model/portraits-label"

const portraitSrc = (unit: PortraitUnit) =>
  unit.entityType === "Character"
    ? characterIcon(unit.entityId as UnitId)
    : unit.entityType === "Mow"
      ? mowIcon(unit.entityId as UnitId)
      : undefined

/**
 * Overlapping round portraits of a project's first units, then "+N" for the rest
 * (add-project-unit-portraits). The group carries one accessible label naming the shown units and
 * the count of the others; the images themselves are decorative.
 */
export function ProjectUnitPortraits({
  units,
  total,
  size = "card",
}: {
  units: readonly PortraitUnit[]
  /** Distinct in-flight units in the project, shown or not. */
  total: number
  /** `card` on the Projects page, `widget` (smaller) in the home widget. */
  size?: "card" | "widget"
}) {
  const { t, i18n } = useTranslation()
  const unitName = useUnitName()
  if (units.length === 0) return null

  const more = Math.max(0, total - units.length)
  const label = portraitsLabel(
    units.map((unit) => unitName(unit.entityType, unit.entityId)),
    more,
    i18n.language,
    (count, names) => t("goals.project.portraits.more", { count, names })
  )
  const iconSize = size === "card" ? "size-6" : "size-5"

  return (
    <span
      aria-label={label}
      className="flex shrink-0 items-center"
      data-testid="project-unit-portraits"
      role="img"
    >
      {units.map((unit, index) => (
        <EntityIcon
          alt=""
          className={cn(
            iconSize,
            "rounded-full bg-muted ring-2 ring-background",
            index > 0 && "-ml-1.5"
          )}
          key={`${unit.entityType}:${unit.entityId}`}
          src={portraitSrc(unit)}
        />
      ))}
      {more > 0 ? (
        <span
          aria-hidden="true"
          className="ml-1 text-xs font-medium text-muted-foreground tabular-nums"
        >
          +{more}
        </span>
      ) : null}
    </span>
  )
}
