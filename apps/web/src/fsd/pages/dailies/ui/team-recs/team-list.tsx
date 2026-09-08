import { Lock, LockOpen } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  characterIcon,
  damageTypeIcon,
  traitIcon,
} from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon, RankBadge, RarityIcon } from "@/shared/ui"

import type {
  TeamMember,
  TeamMemberPreferenceMatch,
  TeamMemberRationale,
} from "../../model/team-recommendations.types"

/** One recommended team — one character per row: portrait, name + why-chosen line, current rarity
 * and rank, and (Random Team only) a lock toggle that keeps the character across Regenerate. */
export function TeamList({
  members,
  testId,
  onToggleLock,
  testIdPrefix = "arena",
}: {
  members: readonly TeamMember[]
  testId?: string
  onToggleLock?: (unitId: UnitId) => void
  testIdPrefix?: string
}) {
  const { t } = useTranslation([
    "teamRecs",
    "characters",
    "traits",
    "damageTypes",
  ])

  const preferenceMarker = (
    preference: TeamMemberPreferenceMatch | undefined,
    iconOf: (value: string) => string,
    labelNs: "traits" | "damageTypes",
    matchKey: "preferences.matchesTrait" | "preferences.matchesDamageType",
    missKey: "preferences.missingTrait" | "preferences.missingDamageType"
  ) => {
    if (!preference) return null
    const attribute = t(`${labelNs}:${preference.id}`, {
      defaultValue: preference.id,
    })
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full",
              preference.matched ? "bg-primary/15" : "opacity-40 grayscale"
            )}
          >
            <EntityIcon src={iconOf(preference.id)} alt="" className="size-4" />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {t(preference.matched ? matchKey : missKey, { attribute })}
        </TooltipContent>
      </Tooltip>
    )
  }

  const rationaleText = (rationale: TeamMemberRationale): string => {
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
            <div
              className="flex shrink-0 items-center gap-2"
              data-testid={`${testIdPrefix}-match-${member.unitId}`}
            >
              {preferenceMarker(
                member.preferredTrait,
                traitIcon,
                "traits",
                "preferences.matchesTrait",
                "preferences.missingTrait"
              )}
              {preferenceMarker(
                member.preferredDamageType,
                damageTypeIcon,
                "damageTypes",
                "preferences.matchesDamageType",
                "preferences.missingDamageType"
              )}
              <RarityIcon rarity={member.rarity} className="size-5" />
              <RankBadge rank={member.rank} showLabel={false} tooltip />
            </div>
            {onToggleLock ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-pressed={member.locked}
                    aria-label={
                      member.locked ? t("lock.unlock") : t("lock.lock")
                    }
                    data-testid={`${testIdPrefix}-lock-${member.unitId}`}
                    onClick={() => onToggleLock(member.unitId)}
                  >
                    {member.locked ? (
                      <Lock className="size-4" />
                    ) : (
                      <LockOpen className="size-4 text-muted-foreground" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {member.locked ? t("lock.unlock") : t("lock.lock")}
                </TooltipContent>
              </Tooltip>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
