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

import type { ArenaCategory } from "../../model/arena-recommendations.types"
import { ArenaTeam } from "./arena-team"

/**
 * One recommended-team category: its title/description, any "broadened" / "capped included" /
 * "fewer than requested" note, and the team itself. The Random category also gets a Regenerate
 * control (disabled when every slot is locked) and per-character lock toggles.
 */
export function ArenaCategorySection({
  category,
  onRegenerate,
  onToggleLock,
}: {
  category: ArenaCategory
  onRegenerate?: () => void
  onToggleLock?: (unitId: UnitId) => void
}) {
  const { t } = useTranslation("arena")

  const allLocked =
    category.members.length > 0 &&
    category.members.every((member) => member.locked)

  return (
    <Card data-testid={`arena-category-${category.id}`}>
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
            data-testid={`arena-shortfall-${category.id}`}
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
            data-testid="arena-random-regenerate"
          >
            <RefreshCw className="size-4" />
            {t("regenerate")}
          </Button>
        ) : null}
        <ArenaTeam
          members={category.members}
          testId={`arena-team-${category.id}`}
          onToggleLock={onToggleLock}
        />
      </CardContent>
    </Card>
  )
}
