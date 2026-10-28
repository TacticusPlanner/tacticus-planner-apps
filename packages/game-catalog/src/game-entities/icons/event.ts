import { datamineAssetUrl } from "./asset-path"
import { factionIcon } from "./faction"

// Game art for game-events-calendar definitions. Definitions carry no icon of their own (spec:
// game-events-calendar), so the client resolves one from the definition id, then its type.

/** A Home Screen Event's medallion and wide interstitial banner (`liveevents/`), by definition id.
 *  The game names both after the event's `theme`; the banner is absent where the game has none. */
const homeScreenEventArt: Record<string, { icon: string; banner?: string }> = {
  "hse-faction-focus": {
    icon: "ui_gamemodeicon_factionfocus",
    banner: "ui_interstitial_factionfocus",
  },
  "hse-warp-surge": { icon: "ui_gamemodeicon_warpsurge" },
  "hse-training-rush": {
    icon: "ui_gamemodeicon_trainingrush",
    banner: "ui_interstitial_trainingrush",
  },
  "hse-global-conflict-operations": {
    icon: "ui_gamemodeicon_conflictoperations",
    banner: "ui_interstitial_conflict_operations",
  },
  "hse-global-operation-imperator": {
    icon: "ui_gamemodeicon_global_hse_operation_imperator",
    banner: "ui_interstitial_global_hse_operation_imperator",
  },
  "hse-arsenal-of-war": {
    icon: "ui_gamemodeicon_arsenalofwar",
    banner: "ui_interstitial_arsenal_of_war",
  },
  "hse-machine-hunt": {
    icon: "ui_gamemodeicon_machinehunt",
    banner: "ui_interstitial_machine_hunt",
  },
  "hse-terminator-boost": {
    icon: "ui_gamemodeicon_trait_boost_terminator_armour",
    banner: "ui_interstitial_trait_boost_terminator_armour",
  },
  // The game's `kill_tyranids` theme.
  "hse-purge-order": {
    icon: "ui_gamemodeicon_killtyranids",
    banner: "ui_interstitial_killtyranids",
  },
  "hse-squig-smash": {
    icon: "ui_gamemodeicon_squig_smash",
    banner: "ui_interstitial_squig_smash",
  },
  "hse-trait-boost-rapid-assault": {
    icon: "ui_gamemodeicon_trait_boost_rapid_assault",
    banner: "ui_interstitial_trait_boost_rapid_assault",
  },
  "hse-trait-boost-flying": {
    icon: "ui_gamemodeicon_trait_boost_flying",
    banner: "ui_interstitial_trait_boost_flying",
  },
  "hse-trait-boost-psyker": { icon: "ui_gamemodeicon_trait_boost_psyker" },
  "hse-for-the-dark-gods": {
    icon: "ui_gamemodeicon_forthedarkgods",
    banner: "ui_interstitial_forthedarkgods",
  },
  "hse-for-the-emperor": {
    icon: "ui_gamemodeicon_fortheemperor",
    banner: "ui_interstitial_fortheemperor",
  },
  "hse-defeat-waves": {
    icon: "ui_gamemodeicon_defeatwaves",
    banner: "ui_interstitial_defeatwaves",
  },
  "hse-11th-edition-week-1": {
    icon: "ui_gamemodeicon_11th_edition",
    banner: "ui_interstitial_11th_edition",
  },
  "hse-11th-edition-week-2": {
    icon: "ui_gamemodeicon_11th_edition",
    banner: "ui_interstitial_11th_edition",
  },
  "hse-11th-edition-week-3": {
    icon: "ui_gamemodeicon_11th_edition",
    banner: "ui_interstitial_11th_edition",
  },
}

/** Faction Boost has a medallion per boosted faction, keyed by the occurrence's `targetFactionId`. */
const factionBoostArt: Record<string, { icon: string; banner?: string }> = {
  AdeptusMechanicus: {
    icon: "ui_gamemodeicon_faction_boost_adeptus_mechanicus",
  },
  DarkAngels: {
    icon: "ui_gamemodeicon_faction_boost_dark_angels",
    banner: "ui_interstitial_dark_angels",
  },
  SpaceWolves: { icon: "ui_gamemodeicon_faction_boost_space_wolves" },
}

// Two definitions share the StandingModifier type but have their own game icons.
const iconByDefinitionId: Record<string, string> = {
  "always-double-xp-sunday": "liveevents/event_icon_extraxp",
  "always-double-gold-saturday": "liveevents/event_icon_goldtemple",
}

const iconByDefinitionType: Record<string, string> = {
  CampaignEvent: "ui/ui_gamemodeicon_ce_generic",
  Incursion: "liveevents/ui_gamemodeicon_mow",
  LegendaryEvent: "atlases/ui_icon_event_lhe",
  NewCharacterEvent: "atlases/ui_icon_event_HRE",
  GameVersionRelease: "atlases/ui_icon_menu_news",
  TournamentArena: "atlases/ui_pvp_sync_game_mode_icon",
  BattlePass: "atlases/ui_icon_menu_battlepass",
  Quest: "atlases/ui_icon_menu_quests",
  GuildRaidSeason: "atlases/ui_icon_menu_guildboss",
  GuildWarSeason: "atlases/ui_icon_guildwars",
  ShopEvent: "liveevents/ui_gamemodeicon_anniversary",
  CrusadeSeason: "ui/ui_crusade_game_mode_icon",
}

function targetFactionId(
  parameters: Readonly<Record<string, unknown>> | null | undefined
): string | undefined {
  const value = parameters?.targetFactionId
  return typeof value === "string" ? value : undefined
}

function homeScreenArt(
  definitionId: string,
  parameters: Readonly<Record<string, unknown>> | null | undefined
): { icon: string; banner?: string } | undefined {
  if (definitionId === "hse-faction-boost") {
    const faction = targetFactionId(parameters)
    return faction ? factionBoostArt[faction] : undefined
  }
  return homeScreenEventArt[definitionId]
}

/**
 * The game's icon for a calendar event: a Home Screen Event's own medallion, else the icon of its
 * definition type. `undefined` when the game has none (e.g. Against the Tide), so callers keep a
 * generic fallback. A Faction Boost for a faction without its own medallion uses that faction's emblem.
 */
export function eventIcon(
  definitionId: string,
  definitionType: string | undefined,
  parameters?: Readonly<Record<string, unknown>> | null
): string | undefined {
  const art = homeScreenArt(definitionId, parameters)
  if (art) return datamineAssetUrl(`liveevents/${art.icon}.webp`)
  if (definitionId === "hse-faction-boost") {
    const faction = targetFactionId(parameters)
    return faction ? factionIcon(faction) : undefined
  }
  const path =
    iconByDefinitionId[definitionId] ??
    (definitionType ? iconByDefinitionType[definitionType] : undefined)
  return path ? datamineAssetUrl(`${path}.webp`) : undefined
}

/** A Home Screen Event's wide banner art (1024×512), or `undefined` when the game ships none. */
export function homeScreenEventBanner(
  definitionId: string,
  parameters?: Readonly<Record<string, unknown>> | null
): string | undefined {
  const banner = homeScreenArt(definitionId, parameters)?.banner
  return banner ? datamineAssetUrl(`liveevents/${banner}.webp`) : undefined
}

/** The game's countdown (stopwatch) icon. */
export function countdownIcon(): string {
  return datamineAssetUrl("atlases/ui_icon_timer.webp")
}

/** A Home Screen Event's points currency (`liveevents/ui_icon_resource_event_<theme>`), by
 *  definition id; the game names it after the event's `theme`, like the medallion. */
const homeScreenEventPoints: Record<string, string> = {
  "hse-faction-focus": "ui_icon_resource_event_factionfocus",
  "hse-warp-surge": "ui_icon_resource_event_warpsurge",
  "hse-training-rush": "ui_icon_resource_event_trainingpoints",
  "hse-global-conflict-operations": "ui_icon_resource_event_conflictoperations",
  "hse-global-operation-imperator":
    "ui_icon_resource_global_hse_operation_imperator",
  "hse-arsenal-of-war": "ui_icon_resource_event_arsenalofwar",
  "hse-machine-hunt": "ui_icon_resource_event_machinehunt",
  "hse-terminator-boost":
    "ui_icon_resource_event_trait_boost_terminator_armour",
  "hse-purge-order": "ui_icon_resource_event_killtyranids",
  "hse-squig-smash": "ui_icon_resource_event_squig_smash",
  "hse-trait-boost-rapid-assault":
    "ui_icon_resource_event_trait_boost_rapid_assault",
  "hse-trait-boost-flying": "ui_icon_resource_event_trait_boost_flying",
  "hse-trait-boost-psyker": "ui_icon_resource_event_trait_boost_psyker",
  "hse-for-the-dark-gods": "ui_icon_resource_event_forthedarkgods",
  "hse-for-the-emperor": "ui_icon_resource_event_fortheemperor",
  "hse-defeat-waves": "ui_icon_resource_event_defeatwaves",
  "hse-11th-edition-week-1": "ui_icon_resource_event_11th_edition",
  "hse-11th-edition-week-2": "ui_icon_resource_event_11th_edition",
  "hse-11th-edition-week-3": "ui_icon_resource_event_11th_edition",
}

const factionBoostPoints: Record<string, string> = {
  AdeptusMechanicus: "ui_icon_resource_event_faction_boost_adeptus_mechanicus",
  DarkAngels: "ui_icon_resource_event_faction_boost_dark_angels",
  SpaceWolves: "ui_icon_resource_event_faction_boost_space_wolves",
}

/**
 * A Home Screen Event's points icon: the event's own points currency, else the game's generic event
 * points icon (a Faction Boost for a faction without its own, an event the map does not know).
 */
export function homeScreenEventPointsIcon(
  definitionId: string,
  parameters?: Readonly<Record<string, unknown>> | null
): string {
  const faction =
    definitionId === "hse-faction-boost"
      ? targetFactionId(parameters)
      : undefined
  const file =
    (faction ? factionBoostPoints[faction] : undefined) ??
    homeScreenEventPoints[definitionId] ??
    "ui_icon_resource_event_points_generic"
  return datamineAssetUrl(`liveevents/${file}.webp`)
}
