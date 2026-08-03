import type { ReactNode } from "react"
import { ArrowRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  ASSET_BASE_PATH,
  characterIcon,
  mowIcon,
} from "@workspace/game-catalog"
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
import { Progress } from "@workspace/ui/components/progress"

import type { GoalKind } from "@/entities/goal"
import { EntityIcon, ProgressionBadge, RankBadge } from "@/shared/ui"

import type { ResourceNeed } from "../../model/estimate/progression-cost-calc"
import type { GoalProgress } from "../../model/attainment/goal-progress"
import type { GoalProject } from "../../model/shared/types"
import { ProjectColorDot } from ".//project-color-dot"

const genericUpgradeIcon = `${ASSET_BASE_PATH}/upgrade_materials/ui_icon_upgrade_generic.png`
const genericLevelIcon = `${ASSET_BASE_PATH}/misc/xp_generic.png`

/** The track with the larger remaining gap — the one that's actually gating the goal, so that's the
 *  one `GoalProgressDisplay` shows a current/target pair for. */
function widestAbilityTrack(
  progress: Extract<GoalProgress, { kind: "Ability" }>
): { current: number; target: number } {
  const activeGap = progress.targetActive - progress.currentActive
  const passiveGap = progress.targetPassive - progress.currentPassive
  return activeGap > passiveGap
    ? { current: progress.currentActive, target: progress.targetActive }
    : { current: progress.currentPassive, target: progress.targetPassive }
}

/** The goal-type badge/card icon — a generic per-kind symbol representing the concept, not any one
 * specific unit/upgrade/item (see e.g. `EquipmentIcon` for the actual per-item icon used in the
 * Equipment creation picker). `Ability` is the one kind whose icon depends on which entity it's
 * for — a Character's active/passive ability vs. a MoW's primary/secondary ability are visually
 * distinct concepts in-game, so `entityType` picks between them (defaults to the Character icon
 * when unknown). */
function goalTypeIcon(kind: GoalKind, entityType?: string): string {
  switch (kind) {
    case "Rank":
    case "Upgrade":
      // Same theme — both are fundamentally "farm this upgrade" goals.
      return genericUpgradeIcon
    case "Ascension":
      return `${ASSET_BASE_PATH}/misc/orbs_generic.png`
    case "Ability":
      return entityType === "Mow"
        ? `${ASSET_BASE_PATH}/misc/components_generic.png`
        : `${ASSET_BASE_PATH}/misc/ability_badges_generic.png`
    case "Unlock":
      return `${ASSET_BASE_PATH}/misc/ui_icon_character_shard_empty.png`
    case "UpgradeItem":
      return `${ASSET_BASE_PATH}/misc/forge_badges_generic.png`
    case "Level":
      return genericLevelIcon
  }
}

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

export function GoalTypeBadge({
  type,
  entityType,
}: {
  type: GoalKind
  entityType?: string
}) {
  const { t } = useTranslation()

  return (
    <Badge className="gap-1.5" variant="outline">
      <EntityIcon
        alt=""
        className="size-4"
        src={goalTypeIcon(type, entityType)}
      />
      {t(`goals.create.goalTypes.${type}`)}
    </Badge>
  )
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
          {project.isActivePlan ? ` · ${t("goals.project.active")}` : ""}
        </Badge>
      ))}
    </div>
  )
}

/** Current → target state plus a progress bar, formatted per `GoalProgress`'s kind (plan §2) — reuses
 * `RankBadge`/`ProgressionBadge` for Rank/Ascension so a goal's target reads identically here and in
 * the create-goal form; other kinds are plain numbers, since no icon/name exists for a raw level or
 * shard count. Renders nothing for `Unknown` (player data for this goal hasn't synced yet). */
export function GoalProgressDisplay({
  progress,
  potentialRatio,
  actualSummary,
  potentialSummary,
}: {
  progress: GoalProgress
  potentialRatio?: number
  actualSummary?: ReactNode
  potentialSummary?: ReactNode
}) {
  const { t } = useTranslation()

  if (progress.kind === "Unknown") return actualSummary

  const currentTarget =
    progress.kind === "Rank" ? (
      <span className="flex items-center gap-1.5">
        <RankBadge rank={progress.current} showLabel={false} />
        <ArrowRight className="size-3.5 text-muted-foreground" />
        <RankBadge rank={progress.target} showLabel={false} />
      </span>
    ) : progress.kind === "Ascension" ? (
      <span className="flex items-center gap-1.5">
        <ProgressionBadge value={progress.current} />
        <ArrowRight className="size-3.5 text-muted-foreground" />
        <ProgressionBadge value={progress.target} />
      </span>
    ) : progress.kind === "Ability" ? (
      <span>
        {t("goals.overview.levelProgress", widestAbilityTrack(progress))}
      </span>
    ) : progress.kind === "Unlock" ? (
      <span>
        {t("goals.create.unlock.ownedOfTotal", {
          owned: progress.owned,
          total: progress.required,
        })}
      </span>
    ) : progress.kind === "Level" || progress.kind === "UpgradeItem" ? (
      <span>
        {t("goals.overview.levelProgress", {
          current: progress.current,
          target: progress.target,
        })}
      </span>
    ) : progress.ratio !== null ? (
      // "Upgrade" — no natural current/target pair to show (it's an average across several
      // materials), so the percentage itself is the only visible readout.
      <span>{Math.round(progress.ratio * 100)}%</span>
    ) : null

  return (
    <div className="grid gap-1" data-testid="goal-progress">
      {currentTarget}
      {progress.ratio !== null ? (
        <div className="grid gap-1">
          {potentialRatio !== undefined ? (
            <span className="text-xs text-muted-foreground">
              {t("goals.overview.actualProgress")}
            </span>
          ) : null}
          <Progress
            aria-label={
              potentialRatio !== undefined
                ? t("goals.overview.actualProgress")
                : t("goals.overview.progressLabel")
            }
            aria-valuetext={`${Math.round(progress.ratio * 100)}%`}
            className="h-1.5"
            data-testid="goal-progress-bar"
            value={progress.ratio * 100}
          />
          {actualSummary}
          {potentialRatio !== undefined ? (
            <>
              <span className="text-xs text-muted-foreground">
                {t("goals.overview.potentialProgress")}
              </span>
              <Progress
                aria-label={t("goals.overview.potentialProgress")}
                aria-valuetext={`${Math.round(potentialRatio * 100)}%`}
                className="h-1.5"
                data-testid="goal-potential-progress-bar"
                value={potentialRatio * 100}
              />
              {potentialSummary}
            </>
          ) : null}
        </div>
      ) : (
        actualSummary
      )}
    </div>
  )
}

/** "N upgrades/shards/orbs remaining" (plan §2) — a coarse count, not the full per-material
 * breakdown (that lives in the detail view's Estimate section). `null` (uncosted kind, or nothing
 * left) renders nothing. */
export function GoalRemainingSummary({
  remaining,
}: {
  remaining: ResourceNeed | null
}) {
  const { t } = useTranslation()
  if (!remaining) return null

  const upgradeCount = remaining.upgrades.reduce(
    (sum, need) => sum + need.count,
    0
  )
  const orbCount = Object.values(remaining.orbsByType).reduce(
    (sum, count) => sum + (count ?? 0),
    0
  )
  const parts = [
    // Rank goals report unfilled *slots* (a small, fixed-size count — 6 per rank) instead of the raw
    // crafting-material total, which can look enormous once recipes are factored in and doesn't map
    // onto "how many rank-ups are left" the way a slot count does. Every other goal kind has no slot
    // concept (`upgradeSlotsRemaining` is `null`), so it keeps the material total.
    remaining.upgradeSlotsRemaining !== null
      ? remaining.upgradeSlotsRemaining > 0
        ? t("goals.overview.remaining.upgradeSlots", {
            count: remaining.upgradeSlotsRemaining,
          })
        : null
      : upgradeCount > 0
        ? t("goals.overview.remaining.upgrades", { count: upgradeCount })
        : null,
    remaining.shards > 0
      ? t("goals.overview.remaining.shards", { count: remaining.shards })
      : null,
    remaining.mythicShards > 0
      ? t("goals.overview.remaining.mythicShards", {
          count: remaining.mythicShards,
        })
      : null,
    orbCount > 0
      ? t("goals.overview.remaining.orbs", { count: orbCount })
      : null,
  ].filter((part): part is string => part !== null)

  if (parts.length === 0) return null

  return (
    <p
      className="text-xs text-muted-foreground"
      data-testid="goal-remaining-summary"
    >
      {parts.join(" · ")}
    </p>
  )
}

export function GoalEnergyRemainingSummary({
  energy,
}: {
  energy: number | undefined
}) {
  const { t } = useTranslation()
  if (energy === undefined) return null

  return (
    <p
      className="text-xs text-muted-foreground"
      data-testid="goal-energy-remaining-summary"
    >
      {t("goals.overview.remaining.energy", { energy })}
    </p>
  )
}
