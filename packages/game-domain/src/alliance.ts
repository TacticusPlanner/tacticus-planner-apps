export const Alliance = {
  Imperial: "Imperial",
  Chaos: "Chaos",
  Xenos: "Xenos",
  Neutral: "Neutral",
} as const

export type Alliance = (typeof Alliance)[keyof typeof Alliance]

export const allianceOrder: readonly Alliance[] = Object.values(Alliance)

export const allianceRank = (alliance: Alliance): number => {
  const index = allianceOrder.indexOf(alliance)
  return index === -1 ? allianceOrder.length : index
}

/** The three grand alliances a unit can belong to (every alliance except Neutral), in display order. */
export type PlayableAlliance = Exclude<Alliance, typeof Alliance.Neutral>

export const playableAlliances: readonly PlayableAlliance[] = [
  Alliance.Imperial,
  Alliance.Chaos,
  Alliance.Xenos,
]

/** Whether `id` names a playable alliance (game data and enemy tags use the same ids). */
export const isPlayableAlliance = (id: string): id is PlayableAlliance =>
  (playableAlliances as readonly string[]).includes(id)
