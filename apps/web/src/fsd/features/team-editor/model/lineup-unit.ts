import { useTranslation } from "react-i18next"
import type { Rarity } from "@workspace/game-domain"

import type { TeamRoster, TeamUnitView } from "@/entities/team"

type Kind = TeamUnitView["kind"]

/** What a lineup (the desktop band or the phone list) needs to mark and change one unit. */
export interface LineupUnitProps {
  roster: TeamRoster | null
  rarityCap: Rarity
  knownUnit: (kind: Kind, unitId: string) => boolean
  /** Characters that cannot be removed or made flex: the chosen campaign's core. */
  lockedIds: ReadonlySet<string>
  notAllowed: ReadonlySet<string>
  missingCore: ReadonlySet<string>
}

/** The rule marks on a unit: not allowed (faction), must be core (campaign), unknown (catalog). */
export function useLineupMarks({
  knownUnit,
  notAllowed,
  missingCore,
}: Pick<LineupUnitProps, "knownUnit" | "notAllowed" | "missingCore">) {
  const { t } = useTranslation("teams")
  return (kind: Kind, unitId: string) =>
    [
      notAllowed.has(unitId) ? t("lineup.notAllowed") : null,
      missingCore.has(unitId) ? t("lineup.mustBeCore") : null,
      knownUnit(kind, unitId) ? null : t("lineup.unknown"),
    ].filter((mark): mark is string => mark !== null)
}
