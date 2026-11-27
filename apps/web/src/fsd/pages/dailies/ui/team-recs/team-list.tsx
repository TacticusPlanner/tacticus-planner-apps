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
import { Pressable } from "@workspace/ui/components/pressable"

import { EntityIcon, RankBadge, RarityIcon } from "@/shared/ui"
import { rationaleIcon } from "./rationale-icon"

import type {
  EventUnitMatch,
  TeamMember,
  TeamMemberPreferenceMatch,
  TeamMemberRationale,
} from "@/features/team-recommendations"
import { useNumberFormat } from "@/shared/lib"

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
    "factions",
    "common",
  ])

  // What an event unit matched: a trait, an alliance or a faction, from the namespace naming it.
  const numbers = useNumberFormat()
  const eventUnitMatchName = (match: EventUnitMatch): string => {
    switch (match.via) {
      case "trait":
        return t(`traits:${match.id}`, { defaultValue: match.id })
      case "alliance":
        return t(`common:alliances.${match.id}`, { defaultValue: match.id })
      case "faction":
        return t(`factions:${match.id}`, { defaultValue: match.id })
    }
  }

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
            <EntityIcon size="icon" src={iconOf(preference.id)} alt="" />
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
      case "onslaught-goal":
        return t("rationale.onslaughtGoal")
      case "event-unit":
        return rationale.match
          ? t("rationale.eventUnit", {
              match: eventUnitMatchName(rationale.match),
            })
          : t("rationale.eventUnitAny")
      case "strength":
        return t("rationale.strength", {
          power: numbers.format(rationale.combatPower),
        })
      case "minimum-size":
        return t("rationale.minimumSize")
      case "random":
        return t("rationale.random")
    }
  }

  // The visible short form where an icon carries the reason: the matched name, or the power.
  const rationaleShort = (
    rationale: TeamMemberRationale
  ): string | undefined => {
    if (rationale.kind === "event-unit" && rationale.match) {
      return t("rationale.eventUnitShort", {
        match: eventUnitMatchName(rationale.match),
      })
    }
    if (rationale.kind === "strength") {
      return numbers.format(rationale.combatPower)
    }
    return undefined
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
              size="portrait-sm"
              alt={name}
              src={characterIcon(member.unitId)}
              className="shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{name}</p>
              <RationaleLine
                icon={rationaleIcon(member.rationale)}
                short={rationaleShort(member.rationale)}
                text={rationaleText(member.rationale)}
              />
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
              <RarityIcon rarity={member.rarity} />
              <RankBadge rank={member.rank} showLabel={false} tooltip />
            </div>
            {onToggleLock ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    // The label says the state ("Unlock"/"Lock"), so no aria-pressed as well.
                    aria-label={
                      member.locked ? t("lock.unlock") : t("lock.lock")
                    }
                    data-testid={`${testIdPrefix}-lock-${member.unitId}`}
                    onClick={() => onToggleLock(member.unitId)}
                  >
                    {member.locked ? (
                      <Lock className="size-icon" />
                    ) : (
                      <LockOpen className="size-icon text-muted-foreground" />
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

/**
 * A member's why-chosen line. Where the reason has an icon (an event unit's matched trait, alliance
 * or faction; power for combat strength) the row shows the icon and a short value, with the full
 * sentence in a tooltip and for assistive technology; any other reason shows its sentence.
 */
function RationaleLine({
  icon,
  short,
  text,
}: {
  icon: string | undefined
  short: string | undefined
  text: string
}) {
  if (icon === undefined || short === undefined) {
    return <p className="truncate text-xs text-muted-foreground">{text}</p>
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* A button, so a keyboard user can open the tooltip with the full reason. */}
        <Pressable
          className="flex max-w-full min-w-0 items-center gap-1 rounded-sm text-left text-xs text-muted-foreground"
          data-testid="team-member-rationale"
        >
          <span className="sr-only">{text}</span>
          <EntityIcon size="icon" src={icon} alt="" className="shrink-0" />
          <span aria-hidden="true" className="truncate tabular-nums">
            {short}
          </span>
        </Pressable>
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  )
}
