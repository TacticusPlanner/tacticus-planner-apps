export const uiKitSections = [
  {
    descriptionKey: "uiKit.sections.colors.description",
    id: "colors",
    labelKey: "uiKit.sections.colors.label",
  },
  {
    descriptionKey: "uiKit.sections.buttons.description",
    id: "buttons",
    labelKey: "uiKit.sections.buttons.label",
  },
  {
    descriptionKey: "uiKit.sections.forms.description",
    id: "forms",
    labelKey: "uiKit.sections.forms.label",
  },
  {
    descriptionKey: "uiKit.sections.selection.description",
    id: "selection",
    labelKey: "uiKit.sections.selection.label",
  },
  {
    descriptionKey: "uiKit.sections.feedback.description",
    id: "feedback",
    labelKey: "uiKit.sections.feedback.label",
  },
  {
    descriptionKey: "uiKit.sections.overlays.description",
    id: "overlays",
    labelKey: "uiKit.sections.overlays.label",
  },
  {
    descriptionKey: "uiKit.sections.layout.description",
    id: "layout",
    labelKey: "uiKit.sections.layout.label",
  },
  {
    descriptionKey: "uiKit.sections.dataDisplay.description",
    id: "data-display",
    labelKey: "uiKit.sections.dataDisplay.label",
  },
] as const

export type UiKitSectionId = (typeof uiKitSections)[number]["id"]

export type ColorToken = {
  cssVariable: string
  name: string
  utility?: string
}

export type ColorTokenGroup = {
  description: string
  name: string
  tokens: ColorToken[]
}

export const colorTokens = [
  {
    name: "Background",
    cssVariable: "--background",
    utility: "bg-background",
  },
  {
    name: "Foreground",
    cssVariable: "--foreground",
    utility: "bg-foreground",
  },
  {
    name: "Primary",
    cssVariable: "--primary",
    utility: "bg-primary",
  },
  {
    name: "Secondary",
    cssVariable: "--secondary",
    utility: "bg-secondary",
  },
  {
    name: "Muted",
    cssVariable: "--muted",
    utility: "bg-muted",
  },
  {
    name: "Accent",
    cssVariable: "--accent",
    utility: "bg-accent",
  },
  {
    name: "Destructive",
    cssVariable: "--destructive",
    utility: "bg-destructive",
  },
] satisfies ColorToken[]

export const colorTokenGroups: ColorTokenGroup[] = [
  {
    name: "Theme",
    description: "shadcn semantic tokens used by shared UI components.",
    tokens: colorTokens,
  },
  {
    name: "Rarity",
    description: "Character and item rarity colors carried forward from V1.",
    tokens: [
      { name: "Common", cssVariable: "--rarity-common" },
      { name: "Uncommon", cssVariable: "--rarity-uncommon" },
      { name: "Rare", cssVariable: "--rarity-rare" },
      { name: "Epic", cssVariable: "--rarity-epic" },
      { name: "Legendary", cssVariable: "--rarity-legendary" },
      { name: "Mythic", cssVariable: "--rarity-mythic" },
    ],
  },
  {
    name: "Ranks",
    description: "Rank material colors for upgrade planning views.",
    tokens: [
      { name: "Stone 1", cssVariable: "--rank-stone1" },
      { name: "Stone 2", cssVariable: "--rank-stone2" },
      { name: "Stone 3", cssVariable: "--rank-stone3" },
      { name: "Iron 1", cssVariable: "--rank-iron1" },
      { name: "Iron 2", cssVariable: "--rank-iron2" },
      { name: "Iron 3", cssVariable: "--rank-iron3" },
      { name: "Bronze 1", cssVariable: "--rank-bronze1" },
      { name: "Bronze 2", cssVariable: "--rank-bronze2" },
      { name: "Bronze 3", cssVariable: "--rank-bronze3" },
      { name: "Silver 1", cssVariable: "--rank-silver1" },
      { name: "Silver 2", cssVariable: "--rank-silver2" },
      { name: "Silver 3", cssVariable: "--rank-silver3" },
      { name: "Gold 1", cssVariable: "--rank-gold1" },
      { name: "Gold 2", cssVariable: "--rank-gold2" },
      { name: "Gold 3", cssVariable: "--rank-gold3" },
      { name: "Diamond 1", cssVariable: "--rank-diamond1" },
      { name: "Diamond 2", cssVariable: "--rank-diamond2" },
      { name: "Diamond 3", cssVariable: "--rank-diamond3" },
      { name: "Adamantine 1", cssVariable: "--rank-adamantine1" },
      { name: "Adamantine 2", cssVariable: "--rank-adamantine2" },
      { name: "Adamantine 3", cssVariable: "--rank-adamantine3" },
    ],
  },
  {
    name: "Difficulty",
    description: "Campaign and event difficulty colors.",
    tokens: [
      { name: "Standard", cssVariable: "--diff-standard" },
      { name: "Mirror", cssVariable: "--diff-mirror" },
      { name: "Elite", cssVariable: "--diff-elite" },
      { name: "Event standard", cssVariable: "--diff-event-std" },
      { name: "Event extreme", cssVariable: "--diff-event-ext" },
      { name: "Event challenge", cssVariable: "--diff-event-chal" },
    ],
  },
]

export const tableRows = [
  { component: "Button", status: "Installed", owner: "Shared UI" },
  { component: "Dialog", status: "Installed", owner: "Shared UI" },
  { component: "Table", status: "Installed", owner: "Shared UI" },
  { component: "Tooltip", status: "Installed", owner: "Shared UI" },
] as const

export type Payment = {
  id: string
  amount: number
  status: "failed" | "pending" | "processing" | "success"
  email: string
}

export const payments: Payment[] = [
  {
    id: "728ed52f",
    amount: 316,
    status: "success",
    email: "ken99@example.com",
  },
  {
    id: "489e1d42",
    amount: 242,
    status: "success",
    email: "abe45@example.com",
  },
  {
    id: "3f94c8f1",
    amount: 837,
    status: "processing",
    email: "monserrat44@example.com",
  },
  {
    id: "6a12b83c",
    amount: 874,
    status: "success",
    email: "silas22@example.com",
  },
  {
    id: "9d43e917",
    amount: 721,
    status: "failed",
    email: "carmella@example.com",
  },
  {
    id: "2f71a65e",
    amount: 128,
    status: "pending",
    email: "noelia@example.com",
  },
]
