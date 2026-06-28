// Campaign-group icons exist (copied from V1) for the standard campaigns only. Event campaigns are named
// by faction in the source assets and are not mapped here, so they return undefined and the UI shows a
// text-only location chip (documented asset gap).
const standardCampaignNames: Record<string, string> = {
  indomitus: "Indomitus",
  "indomitus-mirror": "Indomitus Mirror",
  octarius: "Octarius",
  "octarius-mirror": "Octarius Mirror",
  "saim-hann": "Saim-Hann",
  "saim-hann-mirror": "Saim-Hann Mirror",
  "fall-of-cadia": "Fall of Cadia",
  "fall-of-cadia-mirror": "Fall of Cadia Mirror",
}

export function campaignIcon(
  groupId: string,
  difficulty: string
): string | undefined {
  const name = standardCampaignNames[groupId]
  if (!name) return undefined
  // For mirror groups the "Mirror" tier is the base file; only "elite" adds a suffix.
  const suffix = difficulty === "elite" ? " Elite" : ""
  return `/snowprint_assets/campaigns/${name}${suffix}.png`
}
