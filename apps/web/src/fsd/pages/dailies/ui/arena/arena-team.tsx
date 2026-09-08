import { useTranslation } from "react-i18next"
import { characterIcon } from "@workspace/game-catalog"

import { EntityIcon } from "@/shared/ui"

import type {
  ArenaMemberRationale,
  ArenaTeamMember,
} from "../../model/arena-recommendations.types"

/** One recommended team — a portrait, name, and why-chosen line per character. */
export function ArenaTeam({
  members,
  testId,
}: {
  members: readonly ArenaTeamMember[]
  testId?: string
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
    <ul className="grid gap-2 sm:grid-cols-2" data-testid={testId}>
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
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {rationaleText(member.rationale)}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
