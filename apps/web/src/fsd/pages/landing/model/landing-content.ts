import { datamineAssetUrl } from "@workspace/game-catalog"

/** Datamined art used by the landing page; every path is listed in `datamine/sprites.txt`. */
export const landingArt = {
  heroBackground: datamineAssetUrl("ui/ui_image_background_desktop.webp"),
  heroPlanet: datamineAssetUrl("ui/ui_homescreen_planet_01.webp"),
} as const

const portrait = (id: string) =>
  datamineAssetUrl(`atlases/ui_image_RoundPortrait_${id}_01.webp`)
const bossPortrait = (id: string) =>
  datamineAssetUrl(`guildboss/ui_image_portraitRound_${id}.webp`)

export type PreviewRowKey = "ascend" | "rankUp" | "legendaryEvent"

/** The static "today's plan" illustration: fixed portraits and progress, no player data. */
export const previewRows: {
  key: PreviewRowKey
  portrait: string
  progress: number
}[] = [
  { key: "ascend", portrait: portrait("adept_celestine"), progress: 30 },
  { key: "rankUp", portrait: portrait("admec_dominus"), progress: 62 },
  {
    key: "legendaryEvent",
    portrait: portrait("custo_atlacoya"),
    progress: 80,
  },
]

export type FeatureKey =
  "goals" | "dailyRaids" | "legendaryEvents" | "guildRaids"

export const features: { key: FeatureKey; icon: string }[] = [
  { key: "goals", icon: datamineAssetUrl("atlases/ui_icon_menu_quests.webp") },
  {
    key: "dailyRaids",
    icon: datamineAssetUrl("atlases/ui_icon_tabs_battle.webp"),
  },
  {
    key: "legendaryEvents",
    icon: datamineAssetUrl("atlases/ui_icon_menu_achievements.webp"),
  },
  {
    key: "guildRaids",
    icon: datamineAssetUrl("atlases/ui_icon_menu_guildboss.webp"),
  },
]

export type LibraryCardKey = "characters" | "raidBosses" | "shops"

export const libraryCards: {
  key: LibraryCardKey
  to: string
  icon: string
  previews: string[]
}[] = [
  {
    key: "characters",
    to: "/library/characters",
    icon: datamineAssetUrl("atlases/ui_icon_tabs_heroes.webp"),
    previews: [
      portrait("adept_celestine"),
      portrait("admec_dominus"),
      portrait("emper_lucius"),
      portrait("orkss_mek"),
    ],
  },
  {
    key: "raidBosses",
    to: "/library/raid-bosses",
    icon: datamineAssetUrl("atlases/ui_icon_menu_guildboss.webp"),
    previews: [
      bossPortrait("GuildBoss5Boss1DeathMortarion"),
      bossPortrait("GuildBoss4Boss1OrksGhazghkull"),
      bossPortrait("GuildBoss9Boss1ThousMagnus"),
    ],
  },
  {
    key: "shops",
    to: "/library/shops",
    icon: datamineAssetUrl("atlases/ui_icon_tabs_shop.webp"),
    previews: [],
  },
]
