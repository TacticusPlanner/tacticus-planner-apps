import { unitModesClash } from "@/entities/team"
import type { Team, TeamMode } from "@/entities/team"

/**
 * The other teams each unit is in that share a selected Guild War mode (offense or defense, each on
 * its own), by unit id: the editor flags those units (V1's deployed marker), and they stay
 * selectable. Other modes never clash. The team being edited is left out.
 */
export function sameModeUsage(
  teams: readonly Pick<
    Team,
    "id" | "name" | "modes" | "characterIds" | "mowIds"
  >[],
  editingTeamId: string | null,
  modes: readonly TeamMode[]
): Map<string, string[]> {
  const usage = new Map<string, string[]>()
  if (modes.length === 0) return usage
  for (const team of teams) {
    if (team.id === editingTeamId) continue
    if (!unitModesClash(team.modes, modes)) continue
    for (const unitId of [...team.characterIds, ...team.mowIds]) {
      usage.set(unitId, [...(usage.get(unitId) ?? []), team.name])
    }
  }
  return usage
}
