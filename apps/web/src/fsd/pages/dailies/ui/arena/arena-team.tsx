import { Lock, LockOpen } from "lucide-react"
import { useTranslation } from "react-i18next"
import { characterIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"

import { EntityIcon, RankBadge, RarityIcon } from "@/shared/ui"

import type {
  ArenaMemberRationale,
  ArenaTeamMember,
} from "../../model/arena-recommendations.types"

/** One recommended team — one character per row: portrait, name + why-chosen line, current rarity
 * and rank, and (Random Team only) a lock toggle that keeps the character across Regenerate. */
export function ArenaTeam({
  members,
  testId,
  onToggleLock,
}: {
  members: readonly ArenaTeamMember[]
  testId?: string
  onToggleLock?: (unitId: UnitId) => void
}) {
  const { t } = useTranslation(["arena", "characters"])

  const rationaleText = (rationale: ArenaMemberRationale): string => {
    switch (rationale.kind) {
      case "goal":
        return rationale.projectId
          ? t("rationale.projectGoal")
          : t("rationale.goal")
      case "strength":
        return t("rationale.strength", {
          power: rationale.combatPower.toLocaleString(),
        })
      case "minimum-size":
        return t("rationale.minimumSize")
      case "random":
        return t("rationale.random")
    }
  }

  return (
    <ul className="flex flex-col gap-2" data-testid={testId}>
      {members.map((member) => {
        const name = t(`characters:${member.unitId}`, {
          defaultValue: member.unitId,
        })
        return (
          <li
            key={member.unitId}
            className="flex items-center gap-3 rounded-lg border p-2"
          >
            <EntityIcon
              alt={name}
              src={characterIcon(member.unitId)}
              className="size-10 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {rationaleText(member.rationale)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <RarityIcon rarity={member.rarity} className="size-5" />
              <RankBadge rank={member.rank} showLabel={false} />
            </div>
            {onToggleLock ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-pressed={member.locked}
                aria-label={member.locked ? t("lock.unlock") : t("lock.lock")}
                data-testid={`arena-lock-${member.unitId}`}
                onClick={() => onToggleLock(member.unitId)}
              >
                {member.locked ? (
                  <Lock className="size-4" />
                ) : (
                  <LockOpen className="size-4 text-muted-foreground" />
                )}
              </Button>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
