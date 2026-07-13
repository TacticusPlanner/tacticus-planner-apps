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
