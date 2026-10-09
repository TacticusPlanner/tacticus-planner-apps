// The importable V1 profile parts, in display order, with their label (and optional description)
// keys — the one definition both the panel's checkboxes and the result's part rows read.
export const V1_IMPORT_PARTS = [
  { key: "personalTacticusApiKey", label: "goals.v1Import.parts.personalKey" },
  { key: "tacticusUserId", label: "goals.v1Import.parts.userId" },
  { key: "guildApiToken", label: "goals.v1Import.parts.guildKey" },
  { key: "goals", label: "goals.v1Import.parts.goals" },
  {
    key: "onslaughtProgress",
    label: "goals.v1Import.parts.onslaughtProgress",
  },
  {
    key: "campaignEventProgress",
    label: "goals.v1Import.parts.campaignEventProgress",
  },
  {
    key: "legendaryEventPlans",
    label: "goals.v1Import.parts.legendaryEventPlans",
    description: "goals.v1Import.partDescriptions.legendaryEventPlans",
  },
] as const

export type V1ImportPartKey = (typeof V1_IMPORT_PARTS)[number]["key"]
