import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"

import { EntityIcon } from "@/shared/ui"

import { goalTypeIcon } from "../model/goal-type-icon"
import type { GoalKind } from "../model/types"

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
