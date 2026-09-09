// Ported verbatim from V1 `4-entities/guild_boss/guild-boss-portraits.ts`. Raid-boss / prime / minion
// / field-npc unit-set ids whose portrait file cannot be derived from the id by the usual
// camelCase -> snake_case rule, mapped to the bare file name under
// `apps/web/public/game_catalog/characters/`. Every file referenced here is already present in that
// folder (it also backs the V1 app). A prime / minion not listed here and not a playable character
// (some Necron minions, Tyranid Warrior variants) has no portrait asset even in V1 and correctly
// falls back to a text badge.

/** Round portraits for boss / prime / minion unit-set ids. */
export const raidBossRoundPortraitOverrides: Record<string, string> = {
  // Boss 1 - Tervigon (portrait only, no RoundPortrait available)
  GuildBoss1Boss1TyranTervigonLeviathan:
    "ui_image_portrait_guild_tervigon_01.png",
  GuildBoss1Boss2TyranTervigonKronos: "ui_image_portrait_guild_tervigon_02.png",
  GuildBoss1Boss3TyranTervigonGorgon: "ui_image_portrait_guild_tervigon_03.png",
  GuildBoss1MiniBoss1TyranWarriorLeviathan:
    "ui_image_RoundPortrait_tyran_warrior_01.png",
  GuildBoss1MiniBoss2TyranWarriorKronos:
    "ui_image_RoundPortrait_tyran_warrior_02.png",
  GuildBoss1MiniBoss3TyranWarriorGorgon:
    "ui_image_RoundPortrait_tyran_warrior_03.png",
  // Boss 2 - Hive Tyrant
  GuildBoss2Boss1TyranHiveTyrantLeviathan:
    "ui_image_RoundPortrait_guild_tyrant_01.png",
  GuildBoss2Boss2TyranHiveTyrantKronos:
    "ui_image_RoundPortrait_guild_tyrant_02.png",
  GuildBoss2Boss3TyranHiveTyrantGorgon:
    "ui_image_RoundPortrait_guild_tyrant_03.png",
  // Boss 3 - Silent King + Minions
  GuildBoss3Boss1NecroSilentKing:
    "ui_image_RoundPortrait_necro_silentking_01.png",
  GuildBoss3Minion1NecroMesophet:
    "ui_image_RoundPortrait_necro_mesophet_01.png",
  GuildBoss3Minion2NecroHapthatra:
    "ui_image_RoundPortrait_necro_hapthatra_01.png",
  GuildBoss3Minion3NecroMenhir: "ui_image_RoundPortrait_necro_menhir_01.png",
  // Boss 4 - Ghazghkull
  GuildBoss4Boss1OrksGhazghkull:
    "ui_image_RoundPortrait_guild_ghazghkull_01.png",
  // Boss 5 - Mortarion + Minion
  GuildBoss5Boss1DeathMortarion:
    "ui_image_RoundPortrait_guild_mortarion_01.png",
  GuildBoss5Minion1DeathBlightlord:
    "ui_image_RoundPortrait_death_blightlord_01.png",
  // Boss 6 - Screamer-killer
  GuildBoss6Boss1TyranScreamerKiller:
    "ui_image_RoundPortrait_guild_screamerkiller_01.png",
  // Boss 7 - Rogaldorn
  GuildBoss7Boss1AstraRogaldorn:
    "ui_image_RoundPortrait_guild_rogaldorn_01.png",
  // Boss 8 - Avatar of Khaine
  GuildBoss8Boss1EldarAvatar: "ui_image_RoundPortrait_guild_avatar_01.png",
  // Boss 9 - Magnus
  GuildBoss9Boss1ThousMagnus: "ui_image_RoundPortrait_guild_magnus_01.png",
  // Boss 10 - Belisarius Cawl
  GuildBoss10Boss1AdmecBelisarius:
    "ui_image_RoundPortrait_guild_belisarius_01.png",
  // Boss 11 - Riptide
  GuildBoss11Boss1TauRiptide: "ui_image_RoundPortrait_guild_riptide_01.png",
  // Boss 12 - The Lion
  GuildBoss12Boss1DarkaLion: "ui_image_RoundPortrait_guild_lion_01.png",
}

// Full (non-round) portraits for main boss unit-set ids. Ported so the splash art is available for the
// deferred detail-header follow-up (`tacticus-planner-apps#122`); consumed only via
// `raidBossPrefixPortraitOverrides` / `raidBossSplashPortrait` for now.
const raidBossFullPortraitOverrides: Record<string, string> = {
  GuildBoss1Boss1TyranTervigonLeviathan:
    "ui_image_portrait_guild_tervigon_01.png",
  GuildBoss1Boss2TyranTervigonKronos: "ui_image_portrait_guild_tervigon_02.png",
  GuildBoss1Boss3TyranTervigonGorgon: "ui_image_portrait_guild_tervigon_03.png",
  GuildBoss2Boss1TyranHiveTyrantLeviathan:
    "ui_image_portrait_guild_tyrant_01.png",
  GuildBoss2Boss2TyranHiveTyrantKronos: "ui_image_portrait_guild_tyrant_02.png",
  GuildBoss2Boss3TyranHiveTyrantGorgon: "ui_image_portrait_guild_tyrant_03.png",
  GuildBoss3Boss1NecroSilentKing: "ui_image_portrait_necro_silentking_01.png",
  GuildBoss4Boss1OrksGhazghkull: "ui_image_portrait_guild_ghazghkull_01.png",
  GuildBoss5Boss1DeathMortarion: "ui_image_portrait_guild_mortarion_01.png",
  GuildBoss6Boss1TyranScreamerKiller:
    "ui_image_portrait_guild_screamerkiller_01.png",
  GuildBoss7Boss1AstraRogaldorn: "ui_image_portrait_guild_rogaldorn_01.png",
  GuildBoss8Boss1EldarAvatar: "ui_image_portrait_guild_avatar_01.png",
  GuildBoss9Boss1ThousMagnus: "ui_image_portrait_guild_magnus_01.png",
  GuildBoss10Boss1AdmecBelisarius: "ui_image_portrait_guild_belisarius_01.png",
  GuildBoss11Boss1TauRiptide: "ui_image_portrait_guild_riptide_01.png",
  GuildBoss12Boss1DarkaLion: "ui_image_portrait_guild_lion_01.png",
}

/** Round portraits for field-npc unit-set ids referenced by `unitAmountDecrease` modifiers. */
export const fieldNpcPortraitOverrides: Record<string, string> = {
  GuildBoss6Npc1TyranHormagaunt:
    "ui_image_RoundPortrait_tyran_hormagaunt_01.png",
  GuildBoss6Npc5TyranBarbgaunt: "ui_image_RoundPortrait_tyran_barbgaunt_01.png",
  GuildBoss7Npc1AstraGuardsman: "ui_image_RoundPortrait_astra_npc_01.png",
  GuildBoss8Npc2EldarWarlock: "ui_image_RoundPortrait_aelda_warlock_01.png",
  GuildBoss9Npc3ThousRubricMarine: "ui_image_RoundPortrait_thous_rubric_01.png",
  GuildBoss9Npc4ThousTerminator:
    "ui_image_RoundPortrait_thous_terminator_02.png",
  GuildBoss10Npc2AdmecElectropriest:
    "ui_image_RoundPortrait_admec_electropriest_01.png",
  GuildBoss11Npc3TauDroneShield: "ui_image_RoundPortrait_tauta_drone_02.png",
  GuildBoss12Npc2DarkaHellblaster:
    "ui_image_RoundPortrait_darka_hellblaster_02.png",
}

/** Full portrait keyed by `GuildBoss{N}` prefix — first entry per prefix from the full-portrait map. */
export const raidBossPrefixPortraitOverrides: Record<string, string> = (() => {
  const map: Record<string, string> = {}
  for (const unitSetId of Object.keys(raidBossFullPortraitOverrides)) {
    const prefix = /^(GuildBoss\d+)/.exec(unitSetId)?.[1]
    if (prefix !== undefined && map[prefix] === undefined) {
      map[prefix] = raidBossFullPortraitOverrides[unitSetId]
    }
  }
  return map
})()
