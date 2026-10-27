// Ported verbatim from V1 `4-entities/guild_boss/guild-boss-portraits.ts`. Raid-boss / prime / minion
// / field-npc unit-set ids whose portrait file cannot be derived from the id by the usual
// camelCase -> snake_case rule, mapped to the game's sprite (paths relative to
// `apps/web/public/game_catalog/`, all under `datamines/`). A prime / minion not listed here and not a
// playable character (some Necron minions, Tyranid Warrior variants) has no portrait asset even in V1
// and correctly falls back to a text badge.

/** Round portraits for boss / prime / minion unit-set ids. */
export const raidBossRoundPortraitOverrides: Record<string, string> = {
  // Boss 1 - Tervigon (portrait only, no RoundPortrait available)
  GuildBoss1Boss1TyranTervigonLeviathan:
    "datamines/atlases/ui_image_portrait_guild_tervigon_01.webp",
  GuildBoss1Boss2TyranTervigonKronos:
    "datamines/atlases/ui_image_portrait_guild_tervigon_02.webp",
  GuildBoss1Boss3TyranTervigonGorgon:
    "datamines/atlases/ui_image_portrait_guild_tervigon_03.webp",
  GuildBoss1MiniBoss1TyranWarriorLeviathan:
    "datamines/atlases/ui_image_RoundPortrait_tyran_warrior_01.webp",
  GuildBoss1MiniBoss2TyranWarriorKronos:
    "datamines/atlases/ui_image_RoundPortrait_tyran_warrior_02.webp",
  GuildBoss1MiniBoss3TyranWarriorGorgon:
    "datamines/atlases/ui_image_RoundPortrait_tyran_warrior_03.webp",
  // Boss 2 - Hive Tyrant
  GuildBoss2Boss1TyranHiveTyrantLeviathan:
    "datamines/atlases/ui_image_RoundPortrait_guild_tyrant_01.webp",
  GuildBoss2Boss2TyranHiveTyrantKronos:
    "datamines/atlases/ui_image_RoundPortrait_guild_tyrant_02.webp",
  GuildBoss2Boss3TyranHiveTyrantGorgon:
    "datamines/atlases/ui_image_RoundPortrait_guild_tyrant_03.webp",
  // Boss 3 - Silent King + Minions
  GuildBoss3Boss1NecroSilentKing:
    "datamines/atlases/ui_image_RoundPortrait_necro_silentking_01.webp",
  GuildBoss3Minion1NecroMesophet:
    "datamines/atlases/ui_image_RoundPortrait_necro_mesophet_01.webp",
  GuildBoss3Minion2NecroHapthatra:
    "datamines/atlases/ui_image_RoundPortrait_necro_hapthatra_01.webp",
  GuildBoss3Minion3NecroMenhir:
    "datamines/atlases/ui_image_RoundPortrait_necro_menhir_01.webp",
  // Boss 4 - Ghazghkull
  GuildBoss4Boss1OrksGhazghkull:
    "datamines/atlases/ui_image_RoundPortrait_guild_ghazghkull_01.webp",
  // Boss 5 - Mortarion + Minion
  GuildBoss5Boss1DeathMortarion:
    "datamines/atlases/ui_image_RoundPortrait_guild_mortarion_01.webp",
  GuildBoss5Minion1DeathBlightlord:
    "datamines/atlases/ui_image_RoundPortrait_death_blightlord_01.webp",
  // Boss 6 - Screamer-killer
  GuildBoss6Boss1TyranScreamerKiller:
    "datamines/atlases/ui_image_RoundPortrait_guild_screamerkiller_01.webp",
  // Boss 7 - Rogaldorn
  GuildBoss7Boss1AstraRogaldorn:
    "datamines/atlases/ui_image_RoundPortrait_guild_rogaldorn_01.webp",
  // Boss 8 - Avatar of Khaine
  GuildBoss8Boss1EldarAvatar:
    "datamines/atlases/ui_image_RoundPortrait_guild_avatar_01.webp",
  // Boss 9 - Magnus
  GuildBoss9Boss1ThousMagnus:
    "datamines/atlases/ui_image_RoundPortrait_guild_magnus_01.webp",
  // Boss 10 - Belisarius Cawl
  GuildBoss10Boss1AdmecBelisarius:
    "datamines/atlases/ui_image_RoundPortrait_guild_belisarius_01.webp",
  // Boss 11 - Riptide
  GuildBoss11Boss1TauRiptide:
    "datamines/atlases/ui_image_RoundPortrait_guild_riptide_01.webp",
  // Boss 12 - The Lion
  GuildBoss12Boss1DarkaLion:
    "datamines/atlases/ui_image_RoundPortrait_guild_lion_01.webp",
}

// Full (non-round) portraits for main boss unit-set ids. Ported so the splash art is available for the
// deferred detail-header follow-up (`tacticus-planner-apps#122`); consumed only via
// `raidBossPrefixPortraitOverrides` / `raidBossSplashPortrait` for now.
const raidBossFullPortraitOverrides: Record<string, string> = {
  GuildBoss1Boss1TyranTervigonLeviathan:
    "datamines/atlases/ui_image_portrait_guild_tervigon_01.webp",
  GuildBoss1Boss2TyranTervigonKronos:
    "datamines/atlases/ui_image_portrait_guild_tervigon_02.webp",
  GuildBoss1Boss3TyranTervigonGorgon:
    "datamines/atlases/ui_image_portrait_guild_tervigon_03.webp",
  GuildBoss2Boss1TyranHiveTyrantLeviathan:
    "datamines/atlases/ui_image_portrait_guild_tyrant_01.webp",
  GuildBoss2Boss2TyranHiveTyrantKronos:
    "datamines/atlases/ui_image_portrait_guild_tyrant_02.webp",
  GuildBoss2Boss3TyranHiveTyrantGorgon:
    "datamines/atlases/ui_image_portrait_guild_tyrant_03.webp",
  GuildBoss3Boss1NecroSilentKing:
    "datamines/atlases/ui_image_portrait_necro_silentking_01.webp",
  GuildBoss4Boss1OrksGhazghkull:
    "datamines/atlases/ui_image_portrait_guild_ghazghkull_01.webp",
  GuildBoss5Boss1DeathMortarion:
    "datamines/atlases/ui_image_portrait_guild_mortarion_01.webp",
  GuildBoss6Boss1TyranScreamerKiller:
    "datamines/atlases/ui_image_portrait_guild_screamerkiller_01.webp",
  GuildBoss7Boss1AstraRogaldorn:
    "datamines/atlases/ui_image_portrait_guild_rogaldorn_01.webp",
  GuildBoss8Boss1EldarAvatar:
    "datamines/atlases/ui_image_portrait_guild_avatar_01.webp",
  GuildBoss9Boss1ThousMagnus:
    "datamines/atlases/ui_image_portrait_guild_magnus_01.webp",
  GuildBoss10Boss1AdmecBelisarius:
    "datamines/atlases/ui_image_portrait_guild_belisarius_01.webp",
  GuildBoss11Boss1TauRiptide:
    "datamines/atlases/ui_image_portrait_guild_riptide_01.webp",
  GuildBoss12Boss1DarkaLion:
    "datamines/atlases/ui_image_portrait_guild_lion_01.webp",
}

/** Round portraits for field-npc unit-set ids referenced by `unitAmountDecrease` modifiers. */
export const fieldNpcPortraitOverrides: Record<string, string> = {
  GuildBoss6Npc1TyranHormagaunt:
    "datamines/atlases/ui_image_RoundPortrait_tyran_hormagaunt_01.webp",
  GuildBoss6Npc5TyranBarbgaunt:
    "datamines/atlases/ui_image_RoundPortrait_tyran_barbgaunt_01.webp",
  GuildBoss7Npc1AstraGuardsman:
    "datamines/atlases/ui_image_RoundPortrait_astra_npc_01.webp",
  GuildBoss8Npc2EldarWarlock:
    "datamines/atlases/ui_image_RoundPortrait_aelda_warlock_01.webp",
  GuildBoss9Npc3ThousRubricMarine:
    "datamines/atlases/ui_image_RoundPortrait_thous_rubric_01.webp",
  GuildBoss9Npc4ThousTerminator:
    "datamines/atlases/ui_image_RoundPortrait_thous_terminator_02.webp",
  GuildBoss10Npc2AdmecElectropriest:
    "datamines/atlases/ui_image_RoundPortrait_admec_electropriest_01.webp",
  GuildBoss11Npc3TauDroneShield:
    "datamines/atlases/ui_image_RoundPortrait_tauta_drone_02.webp",
  GuildBoss12Npc2DarkaHellblaster:
    "datamines/atlases/ui_image_RoundPortrait_darka_hellblaster_02.webp",
}

/** Full portrait keyed by `GuildBoss{N}` prefix — first entry per prefix from the full-portrait map. */
export const raidBossPrefixPortraitOverrides: Record<string, string> = (() => {
  const map: Record<string, string> = {}
  for (const unitSetId of Object.keys(raidBossFullPortraitOverrides)) {
    const prefix = /^(GuildBoss\d+)/.exec(unitSetId)?.[1]
    const portrait = raidBossFullPortraitOverrides[unitSetId]
    if (
      prefix !== undefined &&
      portrait !== undefined &&
      map[prefix] === undefined
    ) {
      map[prefix] = portrait
    }
  }
  return map
})()
