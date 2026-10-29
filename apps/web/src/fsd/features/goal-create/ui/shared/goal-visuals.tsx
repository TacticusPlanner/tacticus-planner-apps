import { useId, type ReactNode, type Ref } from "react"
import { ChevronDownIcon } from "lucide-react"
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
import { cn } from "@workspace/ui/lib/utils"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Field, FieldLabel } from "@workspace/ui/components/field"

import { goalTypeIcon, type GoalKind } from "@/entities/goal"
import { EntityIcon } from "@/shared/ui"

import type { GoalProject } from "@/features/goal-planning/@x/goal-create"
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
  const idPrefix = useId()

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-2xl border p-3">
      {kinds.map((kind) => (
        <Field
          className="min-h-11 md:min-h-0"
          key={kind}
          orientation="horizontal"
        >
          <Checkbox
            checked={enabledTypes.has(kind)}
            disabled={isDisabled?.(kind)}
            id={`${idPrefix}-${kind}`}
            onCheckedChange={(checked) => onToggle(kind, checked === true)}
            data-testid={`create-goal-type-toggle-${kind}`}
          />
          <FieldLabel
            className="min-h-11 flex-1 items-center font-normal md:min-h-0"
            htmlFor={`${idPrefix}-${kind}`}
          >
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
 * counterpart `GoalTypeToggleGroup` toggles into view. The header is a band set off from the fields;
 * with `onExpandedChange` it is a disclosure button and a collapsed card shows only its header, with
 * `summary` (start → target) and the number of blocking problems. A collapsed body stays mounted. */
export function GoalTypeCard({
  kind,
  entityType,
  children,
  expanded = true,
  onExpandedChange,
  summary,
  issueCount = 0,
  headerId,
  ref,
}: {
  kind: GoalKind
  entityType?: string
  children: ReactNode
  expanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  summary?: ReactNode
  issueCount?: number
  /** The header button's id, so an issue on a collapsed card can fall back to focusing it. */
  headerId?: string
  ref?: Ref<HTMLDivElement>
}) {
  const { t } = useTranslation()
  const bodyId = useId()
  const title = (
    <>
      <EntityIcon
        alt=""
        className="size-6 shrink-0"
        src={goalTypeIcon(kind, entityType)}
      />
      <span>{t(`goals.create.goalTypes.${kind}`)}</span>
      {summary ? (
        <span className="flex min-w-0 items-center gap-1 text-sm font-normal text-muted-foreground">
          <span aria-hidden>·</span>
          {summary}
        </span>
      ) : null}
      {issueCount > 0 ? (
        <Badge
          className="ml-auto"
          data-testid={`create-goal-type-card-${kind}-issue-count`}
          variant="destructive"
        >
          {t("goals.create.issues.count", { count: issueCount })}
        </Badge>
      ) : null}
    </>
  )

  return (
    // shrink-0: Card's own `overflow-hidden` resets its automatic min-height to 0 as a flex item —
    // without this, the Sheet's scrolling `flex flex-col` form squeezes every card down to a sliver
    // (flex-shrink has nothing content-sized to stop at) instead of the form scrolling past them.
    <Card
      className="col-span-full shrink-0 gap-0 py-0 data-[size=sm]:[--card-spacing:--spacing(3)]"
      data-expanded={expanded}
      data-testid={`create-goal-type-card-${kind}`}
      ref={ref}
      size="sm"
    >
      <CardHeader
        className={cn("gap-0 bg-muted/50 py-2", expanded && "border-b")}
      >
        <CardTitle className="flex items-center gap-2">
          {onExpandedChange ? (
            <button
              aria-controls={bodyId}
              aria-expanded={expanded}
              className="flex min-h-8 w-full flex-wrap items-center gap-2 text-left"
              data-testid={`create-goal-type-card-${kind}-header`}
              id={headerId}
              onClick={() => onExpandedChange(!expanded)}
              type="button"
            >
              {title}
              <ChevronDownIcon
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform",
                  issueCount === 0 && "ml-auto",
                  expanded && "rotate-180"
                )}
              />
            </button>
          ) : (
            title
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 py-3" hidden={!expanded} id={bodyId}>
        {children}
      </CardContent>
    </Card>
  )
}

/** `truncate` caps each badge's width (the goal card's meta line); the full name stays in its tooltip. */
export function GoalProjectBadges({
  projects,
  truncate = false,
}: {
  projects: GoalProject[]
  truncate?: boolean
}) {
  const { t } = useTranslation()
  if (projects.length === 0) return null

  return (
    <div
      aria-label={t("goals.project.membership")}
      className="flex flex-wrap gap-1"
      data-testid="goal-project-memberships"
    >
      {projects.map((project) => (
        <Badge
          className={cn("gap-1", truncate && "max-w-40")}
          key={project.projectId}
          title={truncate ? project.name : undefined}
          variant="secondary"
        >
          <ProjectColorDot color={project.color} />
          {truncate ? (
            <span className="truncate">{project.name}</span>
          ) : (
            project.name
          )}
        </Badge>
      ))}
    </div>
  )
}
