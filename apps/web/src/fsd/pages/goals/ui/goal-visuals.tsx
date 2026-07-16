import { useTranslation } from "react-i18next"
import {
  ASSET_BASE_PATH,
  characterIcon,
  mowIcon,
} from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { Badge } from "@workspace/ui/components/badge"

import type { GoalKind } from "@/entities/goal"
import { EntityIcon } from "@/shared/ui"

import type { GoalProject } from "../model/types"

const goalTypeIcons: Record<GoalKind, string> = {
  Rank: `${ASSET_BASE_PATH}/upgrade-crafted-badge.png`,
  Ascension: `${ASSET_BASE_PATH}/resources/ui_hero_ascension_orbs_rare.png`,
  Ability: `${ASSET_BASE_PATH}/resources/ui_forge_badges_common.png`,
  Unlock: `${ASSET_BASE_PATH}/misc/ui_icon_character_shard_empty.png`,
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

export function GoalTypeBadge({ type }: { type: GoalKind }) {
  const { t } = useTranslation()

  return (
    <Badge className="gap-1.5" variant="outline">
      <EntityIcon alt="" className="size-4" src={goalTypeIcons[type]} />
      {t(`goals.create.goalTypes.${type}`)}
    </Badge>
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
          <span
            aria-hidden="true"
            className="size-2 rounded-full bg-current"
            style={project.color ? { color: project.color } : undefined}
          />
          {project.name}
          {project.isActivePlan ? ` · ${t("goals.project.active")}` : ""}
        </Badge>
      ))}
    </div>
  )
}
