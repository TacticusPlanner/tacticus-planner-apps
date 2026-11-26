import { useTranslation } from "react-i18next"
import { ChevronsDown, TriangleAlert } from "lucide-react"
import type { Rarity } from "@workspace/game-domain"

import { TeamUnitPortrait } from "@/entities/team"
import type { TeamRoster } from "@/entities/team"
import { HintTrigger } from "@/shared/ui"
import { useUnitName } from "@/shared/unit-name"

import { capMarks } from "../../model/cap-marks"
import type { CapPart } from "../../model/cap-marks"
import { cappedView } from "../../model/capped-view"
import type { Selection } from "../../model/offense"

/** "Under Rare: rank, abilities" and "Capped to Rare: rarity, abilities", as the Teams lineup says it. */
function useCapText() {
  const { t, i18n } = useTranslation(["guildWar", "teams", "progression"])
  const list = (parts: readonly CapPart[]) =>
    new Intl.ListFormat(i18n.language, {
      type: "conjunction",
      style: "narrow",
    }).format(parts.map((part) => t(`teams:picker.capParts.${part}`)))
  return (key: "over" | "under", parts: readonly CapPart[], cap: Rarity) =>
    t(key === "under" ? "teams:picker.underCap" : "guildWar:staged.overCap", {
      rarity: t(`progression:rarities.${cap}`),
      parts: list(parts),
    })
}

/**
 * The picked units in the selection bar, at the defenders' cap, each with the Teams page's cap
 * marks: an amber warning when anything is under the cap, else a capped-down mark when the cap
 * brings anything down. The reason is in a hint (a tooltip, a popover on touch).
 */
export function StagedTeam({
  selection,
  roster,
  cap,
}: {
  selection: Selection
  roster: TeamRoster | null
  cap: Rarity | undefined
}) {
  const { t } = useTranslation("guildWar")
  const unitName = useUnitName()
  const capText = useCapText()
  return (
    <ul
      aria-label={t("staged.label")}
      className="flex flex-wrap items-center gap-1.5"
      data-testid="guild-war-staged"
    >
      {[...selection].map(([id, kind]) => {
        const owned = (kind === "mow" ? roster?.mows : roster?.characters)?.get(
          id
        )
        const marks = capMarks(owned, cap)
        const name = unitName(kind === "mow" ? "Mow" : "Character", id)
        const lines =
          marks && cap
            ? [
                marks.under.length > 0
                  ? capText("under", marks.under, cap)
                  : null,
                marks.over.length > 0 ? capText("over", marks.over, cap) : null,
              ].filter((line): line is string => line !== null)
            : []
        const under = (marks?.under.length ?? 0) > 0
        return (
          <li
            aria-label={name}
            className="relative"
            data-cap={under ? "under" : lines.length > 0 ? "over" : undefined}
            data-testid="guild-war-staged-unit"
            data-unit={id}
            key={id}
          >
            <TeamUnitPortrait
              size="portrait-sm"
              unit={cappedView(kind, id, roster, cap)}
            />
            {lines.length > 0 ? (
              <HintTrigger
                className="absolute -top-1 -right-1 rounded-full bg-background p-0.5"
                data-testid="guild-war-staged-cap"
                hint={
                  <span className="flex flex-col gap-1">
                    {lines.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </span>
                }
                label={`${name}: ${lines.join(". ")}`}
              >
                {under ? (
                  <TriangleAlert
                    aria-hidden="true"
                    className="size-icon-xs text-amber-600 dark:text-amber-400"
                  />
                ) : (
                  <ChevronsDown
                    aria-hidden="true"
                    className="size-icon-xs text-muted-foreground"
                  />
                )}
              </HintTrigger>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
