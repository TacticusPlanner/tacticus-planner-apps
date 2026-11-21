import {
  factionIcon,
  onslaughtAllianceIcon,
  powerIcon,
  traitIcon,
} from "@workspace/game-catalog"
import type { OnslaughtAllianceIcon } from "@workspace/game-catalog"

import type {
  EventUnitMatch,
  TeamMemberRationale,
} from "@/features/team-recommendations"

const ALLIANCES: ReadonlySet<string> = new Set(["Imperial", "Chaos", "Xenos"])

function isAlliance(id: string): id is OnslaughtAllianceIcon {
  return ALLIANCES.has(id)
}

/** The icon of what an event unit matched: the trait, alliance or faction the event names. */
function eventUnitMatchIcon(match: EventUnitMatch): string | undefined {
  switch (match.via) {
    case "trait":
      return traitIcon(match.id)
    case "alliance":
      return isAlliance(match.id) ? onslaughtAllianceIcon(match.id) : undefined
    case "faction":
      return factionIcon(match.id)
  }
}

/**
 * The game icon that leads a team member's short why-chosen line, for the reasons that have one:
 * the matched trait, alliance or faction of an event unit, or power for combat strength.
 */
export function rationaleIcon(
  rationale: TeamMemberRationale
): string | undefined {
  if (rationale.kind === "strength") return powerIcon()
  if (rationale.kind === "event-unit" && rationale.match) {
    return eventUnitMatchIcon(rationale.match)
  }
  return undefined
}
