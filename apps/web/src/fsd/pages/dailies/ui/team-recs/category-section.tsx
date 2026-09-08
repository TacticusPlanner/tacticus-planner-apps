import { RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { UnitId } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import type { TeamCategory } from "../../model/team-recommendations.types"
import { TeamList } from "./team-list"

/**
 * One recommended-team category: its title/description, any "broadened" / "capped included" /
 * "fewer than requested" note, and the team itself. The Random category also gets a Regenerate
 * control (disabled when every slot is locked) and per-character lock toggles.
 */
export function TeamCategorySection({
  category,
  testIdPrefix = "arena",
  onRegenerate,
  onToggleLock,
}: {
  category: TeamCategory
  testIdPrefix?: string
  onRegenerate?: () => void
  onToggleLock?: (unitId: UnitId) => void
}) {
  const { t } = useTranslation("teamRecs")

  const allLocked =
    category.members.length > 0 &&
    category.members.every((member) => member.locked)

  return (
    <Card data-testid={`${testIdPrefix}-category-${category.id}`}>
      <CardHeader>
        <CardTitle>{t(`category.${category.id}.title`)}</CardTitle>
        <CardDescription>
          {t(`category.${category.id}.description`)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {category.broadened ? (
          <p className="text-xs text-muted-foreground">
            {t("category.broadenedNote")}
          </p>
        ) : null}
        {category.includedCappedCharacters ? (
          <p className="text-xs text-muted-foreground">
            {t("category.cappedNote")}
          </p>
        ) : null}
        {category.deliveredSize < category.requestedSize ? (
          <p
            className="text-xs text-muted-foreground"
            data-testid={`${testIdPrefix}-shortfall-${category.id}`}
          >
            {t("category.fewerThanRequested", {
              delivered: category.deliveredSize,
              requested: category.requestedSize,
            })}
          </p>
        ) : null}
        {onRegenerate ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            disabled={allLocked}
            data-testid={`${testIdPrefix}-random-regenerate`}
          >
            <RefreshCw className="size-4" />
            {t("regenerate")}
          </Button>
        ) : null}
        <TeamList
          members={category.members}
          testId={`${testIdPrefix}-team-${category.id}`}
          testIdPrefix={testIdPrefix}
          onToggleLock={onToggleLock}
        />
      </CardContent>
    </Card>
  )
}
