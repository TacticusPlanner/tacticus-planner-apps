import { useTranslation } from "react-i18next"
import type { Rarity } from "@workspace/game-domain"

import { TeamUnitPortrait } from "@/entities/team"
import type { TeamRoster } from "@/entities/team"
import { useUnitName } from "@/shared/unit-name"

import { cappedView } from "../../model/capped-view"
import type { Selection } from "../../model/offense"

/** The picked units in the selection bar, at the defenders' cap. How they sit against the cap is
 *  in the bar's cap chips (`CapChips`), not on each portrait. */
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
  return (
    <ul
      aria-label={t("staged.label")}
      className="flex flex-wrap items-center gap-1.5"
      data-testid="guild-war-staged"
    >
      {[...selection].map(([id, kind]) => (
        <li
          aria-label={unitName(kind === "mow" ? "Mow" : "Character", id)}
          data-testid="guild-war-staged-unit"
          data-unit={id}
          key={id}
        >
          <TeamUnitPortrait
            size="portrait-sm"
            unit={cappedView(kind, id, roster, cap)}
          />
        </li>
      ))}
    </ul>
  )
}
