import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { characterIcon, mowIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Field, FieldLabel } from "@workspace/ui/components/field"

import { goalTypeIcon, type GoalKind } from "@/entities/goal"
import { EntityIcon } from "@/shared/ui"

import type { GoalProject } from "../../model/shared/types"
import { ProjectColorDot } from "@/entities/project"

export function GoalUnitIcon({
  entityType,
  entityId,
  name,
  className = "size-10",
}: {
  entityType: string
  entityId: string
  name: string
  className?: string
}) {
  const src =
    entityType === "Character"
      ? characterIcon(entityId as UnitId)
      : entityType === "Mow"
        ? mowIcon(entityId as UnitId)
        : undefined

  return <EntityIcon alt={name} className={className} src={src} />
}

/** The Create Goal sheet's goal-type picker — a bordered, two-per-row checkbox grid, each option
 * labeled with that goal type's icon (see `GoalTypeCard`, the matching fields-container it feeds).
 * `entityType` is a single value for the whole group — one toggle group is always scoped to one
 * Character/Mow being created. */
export function GoalTypeToggleGroup({
  kinds,
  enabledTypes,
  onToggle,
  isDisabled,
  entityType,
}: {
  kinds: GoalKind[]
  enabledTypes: ReadonlySet<GoalKind>
  onToggle: (kind: GoalKind, enabled: boolean) => void
  isDisabled?: (kind: GoalKind) => boolean
  entityType?: string
}) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-2 gap-2 rounded-2xl border p-3">
      {kinds.map((kind) => (
        <Field key={kind} orientation="horizontal">
          <Checkbox
            checked={enabledTypes.has(kind)}
            disabled={isDisabled?.(kind)}
            onCheckedChange={(checked) => onToggle(kind, checked === true)}
            data-testid={`create-goal-type-toggle-${kind}`}
          />
          <FieldLabel className="font-normal">
            <EntityIcon
              alt=""
              className="size-5 shrink-0"
              src={goalTypeIcon(kind, entityType)}
            />
            {t(`goals.create.goalTypes.${kind}`)}
          </FieldLabel>
        </Field>
      ))}
    </div>
  )
}

/** Wraps a selected goal type's own fields in a `Card` headed by that type's icon/name — the
 * counterpart `GoalTypeToggleGroup` toggles into view. */
export function GoalTypeCard({
  kind,
  entityType,
  children,
}: {
  kind: GoalKind
  entityType?: string
  children: ReactNode
}) {
  const { t } = useTranslation()

  return (
    // shrink-0: Card's own `overflow-hidden` resets its automatic min-height to 0 as a flex item —
    // without this, the Sheet's scrolling `flex flex-col` form squeezes every card down to a sliver
    // (flex-shrink has nothing content-sized to stop at) instead of the form scrolling past them.
    <Card
      className="shrink-0"
      data-testid={`create-goal-type-card-${kind}`}
      size="sm"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <EntityIcon
            alt=""
            className="size-6 shrink-0"
            src={goalTypeIcon(kind, entityType)}
          />
          {t(`goals.create.goalTypes.${kind}`)}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">{children}</CardContent>
    </Card>
  )
}

export function GoalProjectBadges({ projects }: { projects: GoalProject[] }) {
  const { t } = useTranslation()
  if (projects.length === 0) return null

  return (
    <div
      aria-label={t("goals.project.membership")}
      className="flex flex-wrap gap-1"
      data-testid="goal-project-memberships"
    >
      {projects.map((project) => (
        <Badge className="gap-1" key={project.projectId} variant="secondary">
          <ProjectColorDot color={project.color} />
          {project.name}
          {project.isActivePlan ? ` · ${t("goals.project.currentPlan")}` : ""}
        </Badge>
      ))}
    </div>
  )
}
