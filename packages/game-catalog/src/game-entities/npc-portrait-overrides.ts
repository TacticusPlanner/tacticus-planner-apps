/* eslint-disable max-lines -- generated data table */
// Generated from V1 tacticusplanner `4-entities/npc/data/new-npc-data.json` (each raw NPC's `Icon` path).
// The served `npcs` dataset carries no icon (id-only display contract), and NPC portrait file names do
// not follow the id (`necroBossWarden` -> `ui_image_portrait_necro_warden_01.webp`), so this is a full
// variation-id -> file map. Paths are relative to `apps/web/public/game_catalog/`: `datamines/…` is the
// game's own sprite. The `characters/…` entries are loot objects and power-ups, which are never listed,
// so their portraits are not shipped. Add an entry when the catalog gains an NPC id; an id missing here
// renders the initials badge.

/** Portrait file (relative to the catalog image root) per NPC variation id. */
export const npcPortraitOverrides: Record<string, string> = {
  necroNpc1Warrior: "datamines/atlases/ui_image_portrait_necro_npc_01.webp",
  necroNpc1TutWarrior: "datamines/atlases/ui_image_portrait_necro_npc_01.webp",
  necroNpc1TutWarriorFTUEtest:
    "datamines/atlases/ui_image_portrait_necro_npc_01.webp",
  necroNpc1WarriorSurv: "datamines/atlases/ui_image_portrait_necro_npc_01.webp",
  necroNpc2FlayedOne: "datamines/atlases/ui_image_portrait_necro_npc_02.webp",
  necroNpc2TutFlayedOne:
    "datamines/atlases/ui_image_portrait_necro_npc_02.webp",
  necroNpc2TutFlayedOneFTUEtest:
    "datamines/atlases/ui_image_portrait_necro_npc_02.webp",
  necroNpc3Deathmark: "datamines/atlases/ui_image_portrait_necro_npc_03.webp",
  necroNpc4Destroyer:
    "datamines/atlases/ui_image_portrait_necro_ophydian_01.webp",
  necroNpc4DestroyerLHE:
    "datamines/atlases/ui_image_portrait_necro_ophydian_01.webp",
  necroNpc4DestroyerSurv:
    "datamines/atlases/ui_image_portrait_necro_ophydian_01.webp",
  necroNpc5Swarm: "datamines/atlases/ui_image_portrait_necro_scarab_01.webp",
  necroNpcLHESwarm: "datamines/atlases/ui_image_portrait_necro_scarab_01.webp",
  necroNpcWarden: "datamines/atlases/ui_image_portrait_necro_warden_01.webp",
  necroNpcDestroyer:
    "datamines/atlases/ui_image_portrait_necro_hexmark_01.webp",
  necroNpcSpyder: "datamines/atlases/ui_image_portrait_necro_spyder_01.webp",
  necroNpcPlasmancer:
    "datamines/atlases/ui_image_portrait_necro_plasmancer_01.webp",
  necroNpcOverlord:
    "datamines/atlases/ui_image_portrait_necro_overlord_01.webp",
  necroNpcChronomancer:
    "datamines/atlases/ui_image_portrait_necro_chronomancer_01.webp",
  necroNpcMoWReanimator:
    "datamines/atlases/ui_image_portrait_necro_reanimator_01.webp",
  necroBossWarden: "datamines/atlases/ui_image_portrait_necro_warden_01.webp",
  necroBossWardenLHE:
    "datamines/atlases/ui_image_portrait_necro_warden_01.webp",
  necroBossWardenLEG:
    "datamines/atlases/ui_image_portrait_necro_warden_01.webp",
  necroBossDestroyer:
    "datamines/atlases/ui_image_portrait_necro_hexmark_01.webp",
  necroBossDestroyerLHE:
    "datamines/atlases/ui_image_portrait_necro_hexmark_01.webp",
  necroBossDestroyerLEG:
    "datamines/atlases/ui_image_portrait_necro_hexmark_01.webp",
  necroBossSpyder: "datamines/atlases/ui_image_portrait_necro_spyder_01.webp",
  necroBossSpyderLHE:
    "datamines/atlases/ui_image_portrait_necro_spyder_01.webp",
  necroBossSpyderLEG:
    "datamines/atlases/ui_image_portrait_necro_spyder_01.webp",
  necroBossPlasmancer:
    "datamines/atlases/ui_image_portrait_necro_plasmancer_01.webp",
  necroBossPlasmancerLHE:
    "datamines/atlases/ui_image_portrait_necro_plasmancer_01.webp",
  necroBossPlasmancerLEG:
    "datamines/atlases/ui_image_portrait_necro_plasmancer_01.webp",
  necroBossOverlord:
    "datamines/atlases/ui_image_portrait_necro_overlord_01.webp",
  necroBossOverlordLHE:
    "datamines/atlases/ui_image_portrait_necro_overlord_01.webp",
  necroBossOverlordLEG:
    "datamines/atlases/ui_image_portrait_necro_overlord_01.webp",
  necroBossChronomancerSurv:
    "datamines/atlases/ui_image_portrait_necro_chronomancer_01.webp",
  necroBossChronomancerLHE:
    "datamines/atlases/ui_image_portrait_necro_chronomancer_01.webp",
  necroBossC1Warden: "datamines/atlases/ui_image_portrait_necro_warden_01.webp",
  necroBossC1Destroyer:
    "datamines/atlases/ui_image_portrait_necro_hexmark_01.webp",
  necroBossC1Spyder: "datamines/atlases/ui_image_portrait_necro_spyder_01.webp",
  necroBossC1Plasmancer:
    "datamines/atlases/ui_image_portrait_necro_plasmancer_01.webp",
  necroBossC1Overlord:
    "datamines/atlases/ui_image_portrait_necro_overlord_01.webp",
  astraNpc1Guardsman: "datamines/atlases/ui_image_portrait_astra_npc_01.webp",
  astraNpc2Lascannon: "datamines/atlases/ui_image_portrait_astra_npc_02.webp",
  astraNpc3Voxcaster: "datamines/atlases/ui_image_portrait_astra_npc_03.webp",
  astraNpc4Mortar: "datamines/atlases/ui_image_portrait_astra_mortar_01.webp",
  astraNpc4MortarSurv:
    "datamines/atlases/ui_image_portrait_astra_mortar_01.webp",
  astraNpc5DeathRider:
    "datamines/atlases/ui_image_portrait_astra_deathrider_01.webp",
  ultraBossTigurius:
    "datamines/atlases/ui_image_portrait_ultra_tigurius_01.webp",
  ultraBossTiguriusLHE:
    "datamines/atlases/ui_image_portrait_ultra_tigurius_01.webp",
  ultraBossTiguriusSurv:
    "datamines/atlases/ui_image_portrait_ultra_tigurius_01.webp",
  ultraBossEliminatorSgt:
    "datamines/atlases/ui_image_portrait_ultra_eliminator_01.webp",
  ultraBossEliminatorSgtLHE:
    "datamines/atlases/ui_image_portrait_ultra_eliminator_01.webp",
  ultraBossEliminatorSgtCamp:
    "datamines/atlases/ui_image_portrait_ultra_eliminator_01.webp",
  ultraBossEliminatorSgtSurv:
    "datamines/atlases/ui_image_portrait_ultra_eliminator_01.webp",
  ultraBossInceptorSgt:
    "datamines/atlases/ui_image_portrait_ultra_inceptor_01.webp",
  ultraBossInceptorSgtLHE:
    "datamines/atlases/ui_image_portrait_ultra_inceptor_01.webp",
  ultraBossInceptorSgtSurv:
    "datamines/atlases/ui_image_portrait_ultra_inceptor_01.webp",
  ultraBossApothecary:
    "datamines/atlases/ui_image_portrait_ultra_apothecary_01.webp",
  ultraBossApothecaryLHE:
    "datamines/atlases/ui_image_portrait_ultra_apothecary_01.webp",
  ultraBossApothecarySurv:
    "datamines/atlases/ui_image_portrait_ultra_apothecary_01.webp",
  ultraBossCalgar: "datamines/atlases/ui_image_portrait_ultra_calgar_01.webp",
  ultraBossCalgarLHE:
    "datamines/atlases/ui_image_portrait_ultra_calgar_01.webp",
  ultraBossCalgarSurv:
    "datamines/atlases/ui_image_portrait_ultra_calgar_01.webp",
  ultraBossTitus: "datamines/atlases/ui_image_portrait_ultra_titus_01.webp",
  ultraBossTitusLHE: "datamines/atlases/ui_image_portrait_ultra_titus_01.webp",
  ultraBossTitusSurv: "datamines/atlases/ui_image_portrait_ultra_titus_01.webp",
  ultraNpcTigurius:
    "datamines/atlases/ui_image_portrait_ultra_tigurius_01.webp",
  ultraNpcEliminatorSgt:
    "datamines/atlases/ui_image_portrait_ultra_eliminator_01.webp",
  ultraNpcInceptorSgt:
    "datamines/atlases/ui_image_portrait_ultra_inceptor_01.webp",
  ultraNpcApothecary:
    "datamines/atlases/ui_image_portrait_ultra_apothecary_01.webp",
  ultraNpcCalgar: "datamines/atlases/ui_image_portrait_ultra_calgar_01.webp",
  adeptNpc1BattleSister:
    "datamines/atlases/ui_image_portrait_adept_battlesister_01.webp",
  adeptNpc2Zephyrim:
    "datamines/atlases/ui_image_portrait_adept_zephyrim_01.webp",
  adeptNpc3Warsuit: "datamines/atlases/ui_image_portrait_adept_warsuit_01.webp",
  adeptNpc3WarsuitSurv:
    "datamines/atlases/ui_image_portrait_adept_warsuit_01.webp",
  adeptBossRetributor:
    "datamines/atlases/ui_image_portrait_adept_retributor_01.webp",
  adeptBossRetributorLHE:
    "datamines/atlases/ui_image_portrait_adept_retributor_01.webp",
  adeptBossHospitaller:
    "datamines/atlases/ui_image_portrait_adept_hospitaller_01.webp",
  adeptBossHospitallerLHE:
    "datamines/atlases/ui_image_portrait_adept_hospitaller_01.webp",
  adeptBossMorvenn: "datamines/atlases/ui_image_portrait_adept_morvenn_01.webp",
  adeptBossMorvennLHE:
    "datamines/atlases/ui_image_portrait_adept_morvenn_01.webp",
  adeptBossCanoness:
    "datamines/atlases/ui_image_portrait_adept_canoness_01.webp",
  adeptBossCanonessLHE:
    "datamines/atlases/ui_image_portrait_adept_canoness_01.webp",
  adeptBossCelestine:
    "datamines/atlases/ui_image_portrait_adept_celestine_01.webp",
  adeptBossCelestineCE:
    "datamines/atlases/ui_image_portrait_adept_celestine_01.webp",
  adeptBossCelestineLHE:
    "datamines/atlases/ui_image_portrait_adept_celestine_01.webp",
  adeptNpcMoWExorcist:
    "datamines/atlases/ui_image_portrait_adept_exorcist_01.webp",
  adeptNpcCelestine:
    "datamines/atlases/ui_image_portrait_adept_celestine_01.webp",
  adeptNpcHospitaller:
    "datamines/atlases/ui_image_portrait_adept_hospitaller_01.webp",
  adeptNpcRetributor:
    "datamines/atlases/ui_image_portrait_adept_retributor_01.webp",
  adeptNpcCanoness:
    "datamines/atlases/ui_image_portrait_adept_canoness_01.webp",
  adeptNpcMorvenn: "datamines/atlases/ui_image_portrait_adept_morvenn_01.webp",
  astraNpcBullgryn:
    "datamines/atlases/ui_image_portrait_astra_bullgryn_01.webp",
  astraNpcPrimarisPsy:
    "datamines/atlases/ui_image_portrait_astra_psyker_01.webp",
  astraNpcYarrick: "datamines/atlases/ui_image_portrait_astra_yarrick_01.webp",
  astraNpcOrdnance:
    "datamines/atlases/ui_image_portrait_astra_ordnance_01.webp",
  astraNpcCreed: "datamines/atlases/ui_image_portrait_astra_creed_01.webp",
  astraNpcDreir: "datamines/atlases/ui_image_portrait_astra_dreir_01.webp",
  astraBossBullgryn:
    "datamines/atlases/ui_image_portrait_astra_bullgryn_01.webp",
  astraBossBullgrynLHE:
    "datamines/atlases/ui_image_portrait_astra_bullgryn_01.webp",
  astraBossBullgrynLEG:
    "datamines/atlases/ui_image_portrait_astra_bullgryn_01.webp",
  astraBossPrimarisPsy:
    "datamines/atlases/ui_image_portrait_astra_psyker_01.webp",
  astraBossPrimarisPsyLHE:
    "datamines/atlases/ui_image_portrait_astra_psyker_01.webp",
  astraBossPrimarisPsySurv:
    "datamines/atlases/ui_image_portrait_astra_psyker_01.webp",
  astraBossYarrick: "datamines/atlases/ui_image_portrait_astra_yarrick_01.webp",
  astraBossYarrickLHE:
    "datamines/atlases/ui_image_portrait_astra_yarrick_01.webp",
  astraBossYarrickLEG:
    "datamines/atlases/ui_image_portrait_astra_yarrick_01.webp",
  astraBossYarrickSurv:
    "datamines/atlases/ui_image_portrait_astra_yarrick_01.webp",
  astraBossOrdnance:
    "datamines/atlases/ui_image_portrait_astra_ordnance_01.webp",
  astraBossOrdnanceLHE:
    "datamines/atlases/ui_image_portrait_astra_ordnance_01.webp",
  astraBossOrdnanceLEG:
    "datamines/atlases/ui_image_portrait_astra_ordnance_01.webp",
  astraBossCreed: "datamines/atlases/ui_image_portrait_astra_creed_01.webp",
  astraBossCreedLHE: "datamines/atlases/ui_image_portrait_astra_creed_01.webp",
  astraBossCreedLEG: "datamines/atlases/ui_image_portrait_astra_creed_01.webp",
  astraBossCreedSurv: "datamines/atlases/ui_image_portrait_astra_creed_01.webp",
  blackBossTerminator:
    "datamines/atlases/ui_image_portrait_black_terminator_01.webp",
  blackBossTerminatorLHE:
    "datamines/atlases/ui_image_portrait_black_terminator_01.webp",
  blackBossTerminatorLEG:
    "datamines/atlases/ui_image_portrait_black_terminator_01.webp",
  blackNpcTerminator:
    "datamines/atlases/ui_image_portrait_black_terminator_01.webp",
  blackBossObliterator:
    "datamines/atlases/ui_image_portrait_black_obliterator_01.webp",
  blackBossObliteratorCamp:
    "datamines/atlases/ui_image_portrait_black_obliterator_01.webp",
  blackBossObliteratorLHE:
    "datamines/atlases/ui_image_portrait_black_obliterator_01.webp",
  blackBossObliteratorLEG:
    "datamines/atlases/ui_image_portrait_black_obliterator_01.webp",
  blackBossObliteratorSurv:
    "datamines/atlases/ui_image_portrait_black_obliterator_01.webp",
  blackNpcObliterator:
    "datamines/atlases/ui_image_portrait_black_obliterator_01.webp",
  blackBossPossession:
    "datamines/atlases/ui_image_portrait_black_possession_01.webp",
  blackBossPossessionLHE:
    "datamines/atlases/ui_image_portrait_black_possession_01.webp",
  blackBossPossessionLEG:
    "datamines/atlases/ui_image_portrait_black_possession_01.webp",
  blackBossPossessionSurv:
    "datamines/atlases/ui_image_portrait_black_possession_01.webp",
  blackBossHaarken: "datamines/atlases/ui_image_portrait_black_haarken_01.webp",
  blackBossHaarkenCamp:
    "datamines/atlases/ui_image_portrait_black_haarken_01.webp",
  blackBossHaarkenLHE:
    "datamines/atlases/ui_image_portrait_black_haarken_01.webp",
  blackBossHaarkenLEG:
    "datamines/atlases/ui_image_portrait_black_haarken_01.webp",
  blackBossHaarkenSurv:
    "datamines/atlases/ui_image_portrait_black_haarken_01.webp",
  blackNpcHaarken: "datamines/atlases/ui_image_portrait_black_haarken_01.webp",
  blackBossAbaddon: "datamines/atlases/ui_image_portrait_black_abaddon_01.webp",
  blackBossAbaddonCamp:
    "datamines/atlases/ui_image_portrait_black_abaddon_01.webp",
  blackBossAbaddonLHE:
    "datamines/atlases/ui_image_portrait_black_abaddon_01.webp",
  blackBossAbaddonLEG:
    "datamines/atlases/ui_image_portrait_black_abaddon_01.webp",
  blackNpcAbaddon: "datamines/atlases/ui_image_portrait_black_abaddon_01.webp",
  deathBossTyphus: "datamines/atlases/ui_image_portrait_death_typhus_01.webp",
  deathBossTyphusLHE:
    "datamines/atlases/ui_image_portrait_death_typhus_01.webp",
  deathBossTyphusLEG:
    "datamines/atlases/ui_image_portrait_death_typhus_01.webp",
  deathBossTyphusSurv:
    "datamines/atlases/ui_image_portrait_death_typhus_01.webp",
  deathBossBlightlord:
    "datamines/atlases/ui_image_portrait_death_blightlord_01.webp",
  deathBossBlightlordSurv:
    "datamines/atlases/ui_image_portrait_death_blightlord_01.webp",
  deathBossBlightlordLHE:
    "datamines/atlases/ui_image_portrait_death_blightlord_01.webp",
  deathBossRotbone: "datamines/atlases/ui_image_portrait_death_rotbone_01.webp",
  deathBossRotboneSurv:
    "datamines/atlases/ui_image_portrait_death_rotbone_01.webp",
  deathBossRotboneLHE:
    "datamines/atlases/ui_image_portrait_death_rotbone_01.webp",
  deathBossPutrifier:
    "datamines/atlases/ui_image_portrait_death_putrifier_01.webp",
  deathBossPutrifierSurv:
    "datamines/atlases/ui_image_portrait_death_putrifier_01.webp",
  deathBossPutrifierLHE:
    "datamines/atlases/ui_image_portrait_death_putrifier_01.webp",
  deathBossBlightbringer:
    "datamines/atlases/ui_image_portrait_death_blightbringer_01.webp",
  deathBossBlightbringerSurv:
    "datamines/atlases/ui_image_portrait_death_blightbringer_01.webp",
  deathBossBlightbringerLHE:
    "datamines/atlases/ui_image_portrait_death_blightbringer_01.webp",
  templBossSwordBrother:
    "datamines/atlases/ui_image_portrait_templ_brother_01.webp",
  templBossSwordBrother_LHE:
    "datamines/atlases/ui_image_portrait_templ_brother_01.webp",
  templBossSwordBrotherCamp:
    "datamines/atlases/ui_image_portrait_templ_brother_01.webp",
  templBossSwordBrotherSurv:
    "datamines/atlases/ui_image_portrait_templ_brother_01.webp",
  templBossAggressor:
    "datamines/atlases/ui_image_portrait_templ_aggressor_01.webp",
  templBossAggressorLEG:
    "datamines/atlases/ui_image_portrait_templ_aggressor_01.webp",
  templBossAggressor_LHE:
    "datamines/atlases/ui_image_portrait_templ_aggressor_01.webp",
  templBossAggressorCamp:
    "datamines/atlases/ui_image_portrait_templ_aggressor_01.webp",
  templBossAggressorSurv:
    "datamines/atlases/ui_image_portrait_templ_aggressor_01.webp",
  templBossAncient: "datamines/atlases/ui_image_portrait_templ_ancient_01.webp",
  templBossAncient_LHE:
    "datamines/atlases/ui_image_portrait_templ_ancient_01.webp",
  templBossAncientCamp:
    "datamines/atlases/ui_image_portrait_templ_ancient_01.webp",
  templBossAncientSurv:
    "datamines/atlases/ui_image_portrait_templ_ancient_01.webp",
  templBossChampion:
    "datamines/atlases/ui_image_portrait_templ_champion_01.webp",
  templBossChampionLEG:
    "datamines/atlases/ui_image_portrait_templ_champion_01.webp",
  templBossChampion_LHE:
    "datamines/atlases/ui_image_portrait_templ_champion_01.webp",
  templBossChampionSurv:
    "datamines/atlases/ui_image_portrait_templ_champion_01.webp",
  templBossChampionCamp:
    "datamines/atlases/ui_image_portrait_templ_champion_01.webp",
  templBossHelbrecht:
    "datamines/atlases/ui_image_portrait_templ_helbrecht_01.webp",
  templBossHelbrecht_LHE:
    "datamines/atlases/ui_image_portrait_templ_helbrecht_01.webp",
  templBossHelbrechtSurv:
    "datamines/atlases/ui_image_portrait_templ_helbrecht_01.webp",
  orksBossKillaKan:
    "datamines/atlases/ui_image_portrait_orkss_killakan_01.webp",
  orksBossKillaKanLEG:
    "datamines/atlases/ui_image_portrait_orkss_killakan_01.webp",
  orksBossKillaKanLHE:
    "datamines/atlases/ui_image_portrait_orkss_killakan_01.webp",
  orksNpcKillaKan: "datamines/atlases/ui_image_portrait_orkss_killakan_01.webp",
  orksBossBigMek: "datamines/atlases/ui_image_portrait_orkss_mek_01.webp",
  orksBossBigMekLEG: "datamines/atlases/ui_image_portrait_orkss_mek_01.webp",
  orksBossBigMekLHE: "datamines/atlases/ui_image_portrait_orkss_mek_01.webp",
  orksNpcBigMek: "datamines/atlases/ui_image_portrait_orkss_mek_01.webp",
  orksBossRuntherd:
    "datamines/atlases/ui_image_portrait_orkss_runtherd_01.webp",
  orksBossRuntherdLEG:
    "datamines/atlases/ui_image_portrait_orkss_runtherd_01.webp",
  orksBossRuntherdLHE:
    "datamines/atlases/ui_image_portrait_orkss_runtherd_01.webp",
  orksNpcRuntherd: "datamines/atlases/ui_image_portrait_orkss_runtherd_01.webp",
  orksBossNob: "datamines/atlases/ui_image_portrait_orkss_nob_01.webp",
  orksBossNobLEG: "datamines/atlases/ui_image_portrait_orkss_nob_01.webp",
  orksBossNobLHE: "datamines/atlases/ui_image_portrait_orkss_nob_01.webp",
  orksNpcNob: "datamines/atlases/ui_image_portrait_orkss_nob_01.webp",
  orksBossWarboss: "datamines/atlases/ui_image_portrait_orkss_warboss_01.webp",
  orksBossWarbossLHE:
    "datamines/atlases/ui_image_portrait_orkss_warboss_01.webp",
  orksNpcWarboss: "datamines/atlases/ui_image_portrait_orkss_warboss_01.webp",
  orksNpcWarbossSurv:
    "datamines/atlases/ui_image_portrait_orkss_warboss_01.webp",
  orksRedGobbo: "datamines/atlases/ui_image_portrait_orkss_redgobbo_01.webp",
  eldarBossRanger: "datamines/atlases/ui_image_portrait_aelda_ranger_01.webp",
  eldarBossRangerCamp:
    "datamines/atlases/ui_image_portrait_aelda_ranger_01.webp",
  eldarBossRangerLHE:
    "datamines/atlases/ui_image_portrait_aelda_ranger_01.webp",
  eldarBossRangerSurv:
    "datamines/atlases/ui_image_portrait_aelda_ranger_01.webp",
  eldarBossAutarch: "datamines/atlases/ui_image_portrait_aelda_autarch_01.webp",
  eldarBossAutarchCamp:
    "datamines/atlases/ui_image_portrait_aelda_autarch_01.webp",
  eldarBossAutarchLHE:
    "datamines/atlases/ui_image_portrait_aelda_autarch_01.webp",
  eldarBossFarseer: "datamines/atlases/ui_image_portrait_aelda_farseer_01.webp",
  eldarBossFarseerCamp:
    "datamines/atlases/ui_image_portrait_aelda_farseer_01.webp",
  eldarBossFarseerLHE:
    "datamines/atlases/ui_image_portrait_aelda_farseer_01.webp",
  eldarBossFarseerLEG:
    "datamines/atlases/ui_image_portrait_aelda_farseer_01.webp",
  eldarBossFarseerSurv:
    "datamines/atlases/ui_image_portrait_aelda_farseer_01.webp",
  eldarBossMauganRa: "datamines/atlases/ui_image_portrait_aelda_maugan_01.webp",
  eldarBossMauganRaCamp:
    "datamines/atlases/ui_image_portrait_aelda_maugan_01.webp",
  eldarBossMauganRaLHE:
    "datamines/atlases/ui_image_portrait_aelda_maugan_01.webp",
  eldarBossMauganRaLEG:
    "datamines/atlases/ui_image_portrait_aelda_maugan_01.webp",
  eldarBossMauganRaUltra:
    "datamines/atlases/ui_image_portrait_aelda_maugan_01.webp",
  eldarBossJainZar: "datamines/atlases/ui_image_portrait_aelda_jainzar_01.webp",
  eldarBossJainZarCamp:
    "datamines/atlases/ui_image_portrait_aelda_jainzar_01.webp",
  eldarBossJainZarLHE:
    "datamines/atlases/ui_image_portrait_aelda_jainzar_01.webp",
  eldarBossJainZarLEG:
    "datamines/atlases/ui_image_portrait_aelda_jainzar_01.webp",
  eldarBossLhykhis: "datamines/atlases/ui_image_portrait_aelda_lhykhis_01.webp",
  worldNpc1Berzerker:
    "datamines/atlases/ui_image_portrait_world_berzerker_01.webp",
  worldBossTerminatorLHE:
    "datamines/atlases/ui_image_portrait_world_terminator_01.webp",
  worldBossJakhalLHE:
    "datamines/atlases/ui_image_portrait_world_jakhal_01.webp",
  worldNpcEightbound:
    "datamines/atlases/ui_image_portrait_world_eightbound_01.webp",
  worldBossEightboundLHE:
    "datamines/atlases/ui_image_portrait_world_eightbound_01.webp",
  worldBossExecutionsLHE:
    "datamines/atlases/ui_image_portrait_world_executions_01.webp",
  worldBossKharnLHE: "datamines/atlases/ui_image_portrait_world_kharn_01.webp",
  tyranNpc1Hormagaunt:
    "datamines/atlases/ui_image_portrait_tyran_hormagaunt_01.webp",
  tyranNpc2RipperSwarm:
    "datamines/atlases/ui_image_portrait_tyran_ripper_01.webp",
  tyranNpc3Termagant:
    "datamines/atlases/ui_image_portrait_tyran_termagant_01.webp",
  tyranNpc4Warrior: "datamines/atlases/ui_image_portrait_tyran_warrior_01.webp",
  tyranNpc4WarriorSurv:
    "datamines/atlases/ui_image_portrait_tyran_warrior_01.webp",
  tyranNpc4WarriorCE2Kronos:
    "datamines/atlases/ui_image_portrait_tyran_warrior_02.webp",
  tyranNpc4WarriorCE2Gorgon:
    "datamines/atlases/ui_image_portrait_tyran_warrior_03.webp",
  tyranNpc1HormagauntKronos:
    "datamines/atlases/ui_image_portrait_tyran_hormagaunt_02.webp",
  tyranNpc2RipperSwarmKronos:
    "datamines/atlases/ui_image_portrait_tyran_ripper_01.webp",
  tyranNpc3TermagantKronos:
    "datamines/atlases/ui_image_portrait_tyran_termagant_02.webp",
  tyranNpc1HormagauntGorgon:
    "datamines/atlases/ui_image_portrait_tyran_hormagaunt_03.webp",
  tyranNpc2RipperSwarmGorgon:
    "datamines/atlases/ui_image_portrait_tyran_ripper_01.webp",
  tyranNpc3TermagantGorgon:
    "datamines/atlases/ui_image_portrait_tyran_termagant_03.webp",
  tyranNpc5Barbgaunt:
    "datamines/atlases/ui_image_portrait_tyran_barbgaunt_01.webp",
  tyranNpc5BarbgauntSurv:
    "datamines/atlases/ui_image_portrait_tyran_barbgaunt_01.webp",
  ultraNpc1Inceptor:
    "datamines/atlases/ui_image_portrait_ultra_inceptor_02.webp",
  ultraNpc2Eliminator:
    "datamines/atlases/ui_image_portrait_ultra_eliminator_02.webp",
  ultraNpc3Intercessor:
    "datamines/atlases/ui_image_portrait_ultra_inceptor_02.webp",
  ultraNpc4HeavyIntercessor:
    "datamines/atlases/ui_image_portrait_ultra_intercessor_01.webp",
  ultraNpc4HeavyIntercessorSurv:
    "datamines/atlases/ui_image_portrait_ultra_intercessor_01.webp",
  orksNpc1Grot: "datamines/atlases/ui_image_portrait_orkss_grot_01.webp",
  orksNpc2OrkBoy: "datamines/atlases/ui_image_portrait_orkss_boy_01.webp",
  orksNpc3GrotTank: "datamines/atlases/ui_image_portrait_orkss_tank_01.webp",
  orksNpc4AmmoGrot: "datamines/atlases/ui_image_portrait_orkss_grot_02.webp",
  orksNpc5LootGrotTeam:
    "datamines/atlases/ui_image_portrait_orkss_grot_03.webp",
  orksNpc6Stormboy:
    "datamines/atlases/ui_image_portrait_orkss_stormboy_01.webp",
  orksNpc7Squig: "datamines/atlases/ui_image_portrait_orkss_squig_01.webp",
  orksNpcHSESquig: "datamines/atlases/ui_image_portrait_orkss_squig_01.webp",
  orksNpc7SquigSurv: "datamines/atlases/ui_image_portrait_orkss_squig_01.webp",
  orksNpcMoWRukkatrukk:
    "datamines/atlases/ui_image_portrait_orkss_rukkatruk_01.webp",
  LootObj_AmmoBox: "datamines/atlases/ui_image_portrait_loots_ammobox_01.webp",
  LootObj_OilDrum: "datamines/atlases/ui_image_portrait_loots_oildrum_01.webp",
  LootObj_ExplOilDrum:
    "datamines/atlases/ui_image_portrait_loots_expoildrum_01.webp",
  LootObj_Crate_Imp:
    "datamines/atlases/ui_image_portrait_loots_imperialcrate_01.webp",
  LootObj_Pod_Common_Imp:
    "characters/ui_image_portrait_loots_podcommon_01.webp",
  LootObj_Pod_Uncommon_Imp:
    "characters/ui_image_portrait_loots_poduncommon_01.webp",
  LootObj_Pod_Rare_Imp: "characters/ui_image_portrait_loots_podrare_01.webp",
  LootObj_Pod_Epic_Imp: "characters/ui_image_portrait_loots_podepic_01.webp",
  LootObj_Pod_Legendary_Imp:
    "characters/ui_image_portrait_loots_podlegendary_01.webp",
  LootObj_Pod_Mythic_Imp:
    "characters/ui_image_portrait_loots_podlegendary_01.webp",
  LootObj_Strongbox_Imp:
    "datamines/atlases/ui_image_portrait_loots_strongbox_01.webp",
  LootObj_Crate_Xen:
    "datamines/atlases/ui_image_portrait_loots_imperialcrate_01.webp",
  LootObj_Pod_Common_Xen:
    "characters/ui_image_portrait_loots_podcommon_01.webp",
  LootObj_Pod_Uncommon_Xen:
    "characters/ui_image_portrait_loots_poduncommon_01.webp",
  LootObj_Pod_Rare_Xen: "characters/ui_image_portrait_loots_podrare_01.webp",
  LootObj_Pod_Epic_Xen: "characters/ui_image_portrait_loots_podepic_01.webp",
  LootObj_Pod_Legendary_Xen:
    "characters/ui_image_portrait_loots_podlegendary_01.webp",
  LootObj_Pod_Mythic_Xen:
    "characters/ui_image_portrait_loots_podlegendary_01.webp",
  LootObj_Strongbox_Xen:
    "datamines/atlases/ui_image_portrait_loots_strongbox_01.webp",
  LootObj_Crate_Cha:
    "datamines/atlases/ui_image_portrait_loots_imperialcrate_01.webp",
  LootObj_Pod_Common_Cha:
    "characters/ui_image_portrait_loots_podcommon_01.webp",
  LootObj_Pod_Uncommon_Cha:
    "characters/ui_image_portrait_loots_poduncommon_01.webp",
  LootObj_Pod_Rare_Cha: "characters/ui_image_portrait_loots_podrare_01.webp",
  LootObj_Pod_Epic_Cha: "characters/ui_image_portrait_loots_podepic_01.webp",
  LootObj_Pod_Legendary_Cha:
    "characters/ui_image_portrait_loots_podlegendary_01.webp",
  LootObj_Pod_Mythic_Cha:
    "characters/ui_image_portrait_loots_podlegendary_01.webp",
  LootObj_Strongbox_Cha:
    "datamines/atlases/ui_image_portrait_loots_strongbox_01.webp",
  LootObj_FancyBox:
    "datamines/atlases/ui_image_portrait_loots_fancybox_01.webp",
  LootObj_CoinCrate:
    "datamines/atlases/ui_image_portrait_loots_coincrate_01.webp",
  LootObj_Blackstone:
    "datamines/atlases/ui_image_portrait_loots_blackstone_01.webp",
  LootObj_XPBook: "datamines/atlases/ui_image_portrait_loots_xpbook_01.webp",
  powupArmor: "datamines/atlases/ui_image_portrait_powup_armor_01.webp",
  powupDamage: "datamines/atlases/ui_image_portrait_powup_damage_01.webp",
  powupHealth: "datamines/atlases/ui_image_portrait_powup_health_01.webp",
  powupHits: "datamines/atlases/ui_image_portrait_powup_hits_01.webp",
  powupMeleeHits: "datamines/atlases/ui_image_portrait_powup_meleehits_01.webp",
  powupReactivateAbility:
    "datamines/atlases/ui_image_portrait_powup_reactivateability_01.webp",
  powupHealing: "datamines/atlases/ui_image_portrait_powup_healing_01.webp",
  powupReinforcementShield:
    "datamines/atlases/ui_image_portrait_powup_reinforcementshield_01.webp",
  powupReinforcement:
    "datamines/atlases/ui_image_portrait_powup_reinforcement_01.webp",
  powupResurrect: "datamines/atlases/ui_image_portrait_powup_resurrect_01.webp",
  powupHeroSpawn_Uthar:
    "datamines/atlases/ui_image_portrait_powup_heroSpawn_01.webp",
  powupHeroSpawn_VexilusPraeto:
    "datamines/atlases/ui_image_portrait_powup_heroSpawn_01.webp",
  powupHeroSpawn_BladeChampion:
    "datamines/atlases/ui_image_portrait_powup_heroSpawn_01.webp",
  powupSummonSpawn_ultraSmnInceptor:
    "datamines/atlases/ui_image_portrait_powup_heroSpawn_01.webp",
  powupSummonSpawn_ultraSmnHeavyIntercessor:
    "datamines/atlases/ui_image_portrait_powup_heroSpawn_01.webp",
  powupSummonSpawn_templSmnAggressor:
    "datamines/atlases/ui_image_portrait_powup_heroSpawn_01.webp",
  powupSummonSpawn_bloodSmnIntercessor:
    "datamines/atlases/ui_image_portrait_powup_heroSpawn_01.webp",
  powupSummonSpawn_darkaSmnHellblaster:
    "datamines/atlases/ui_image_portrait_powup_heroSpawn_01.webp",
  powupSummonSpawn_darkaSmnTerminator:
    "datamines/atlases/ui_image_portrait_powup_heroSpawn_01.webp",
  powupSummonSpawn_necroSmnWarrior:
    "characters/ui_image_portrait_powup_heroSpawn_02_necron.webp",
  powupSummonSpawn_necroSmnFlayedOne:
    "characters/ui_image_portrait_powup_heroSpawn_02_necron.webp",
  powupSummonSpawn_necroSmnDeathmark:
    "characters/ui_image_portrait_powup_heroSpawn_02_necron.webp",
  powupSummonSpawn_necroSmnDestroyer:
    "characters/ui_image_portrait_powup_heroSpawn_02_necron.webp",
  powupSummonSpawn_necroSmnSwarm:
    "characters/ui_image_portrait_powup_heroSpawn_02_necron.webp",
  powupBomb: "datamines/atlases/ui_image_portrait_powup_bomb_01.webp",
  templNpc1Initiate:
    "datamines/atlases/ui_image_portrait_templ_initiate_01.webp",
  templNpc2Neophyte:
    "datamines/atlases/ui_image_portrait_templ_neophyte_01.webp",
  templNpc3InitiatePyreblaster:
    "datamines/atlases/ui_image_portrait_templ_pyreblaster_01.webp",
  templNpc4Aggressor:
    "datamines/atlases/ui_image_portrait_templ_aggressor_02.webp",
  darkaNpc1Infiltrator:
    "datamines/atlases/ui_image_portrait_darka_infiltrator_01.webp",
  darkaNpc2Hellblaster:
    "datamines/atlases/ui_image_portrait_darka_hellblaster_02.webp",
  darkaNpc3Terminator:
    "datamines/atlases/ui_image_portrait_darka_terminator_02.webp",
  darkaNpc4Watcher: "datamines/atlases/ui_image_portrait_darka_watcher_01.webp",
  darkaBossLion: "datamines/atlases/ui_image_portrait_guild_lion_01.webp",
  darkaNpcMowStormSpeeder:
    "datamines/atlases/ui_image_portrait_darka_stormspeeder_01.webp",
  darkaNpcAzrael: "datamines/atlases/ui_image_portrait_darka_azrael_01.webp",
  darkaNpcHellblaster:
    "datamines/atlases/ui_image_portrait_darka_hellblaster_01.webp",
  darkaNpcAsmodai: "datamines/atlases/ui_image_portrait_darka_asmodai_01.webp",
  darkaNpcTerminator:
    "datamines/atlases/ui_image_portrait_darka_terminator_01.webp",
  darkaNpcCompanion:
    "datamines/atlases/ui_image_portrait_darka_companion_01.webp",
  darkaNpcSternguard:
    "datamines/atlases/ui_image_portrait_darka_sternguard_01.webp",
  darkaBossAzraelLHE:
    "datamines/atlases/ui_image_portrait_darka_azrael_01.webp",
  darkaBossHellblasterLHE:
    "datamines/atlases/ui_image_portrait_darka_hellblaster_01.webp",
  darkaBossAsmodaiLHE:
    "datamines/atlases/ui_image_portrait_darka_asmodai_01.webp",
  darkaBossAsmodaiLEG:
    "datamines/atlases/ui_image_portrait_darka_asmodai_01.webp",
  darkaBossTerminatorLHE:
    "datamines/atlases/ui_image_portrait_darka_terminator_01.webp",
  darkaBossTerminatorSurv:
    "datamines/atlases/ui_image_portrait_darka_terminator_01.webp",
  darkaBossCompanionLHE:
    "datamines/atlases/ui_image_portrait_darka_companion_01.webp",
  darkaBossCompanionLEG:
    "datamines/atlases/ui_image_portrait_darka_companion_01.webp",
  darkaBossSternguardLHE:
    "datamines/atlases/ui_image_portrait_darka_sternguard_01.webp",
  astarCyrus_LHE: "datamines/atlases/ui_image_portrait_astar_cyrus_01.webp",
  thousSekhetar_LHE:
    "datamines/atlases/ui_image_portrait_thous_sekhetar_01.webp",
  darkaSternguard_LHE:
    "datamines/atlases/ui_image_portrait_darka_sternguard_01.webp",
  votanChampion_LHE:
    "datamines/atlases/ui_image_portrait_votan_champion_01.webp",
  astarEradicator_LHE:
    "datamines/atlases/ui_image_portrait_astar_eradicator_01.webp",
  blackNpc1Bloodletter:
    "datamines/atlases/ui_image_portrait_black_bloodletter_01.webp",
  blackNpc2Terminator:
    "datamines/atlases/ui_image_portrait_black_terminator_02.webp",
  blackNpc3TraitorGuardsman:
    "datamines/atlases/ui_image_portrait_black_guardsman_01.webp",
  blackNpc4Havoc: "datamines/atlases/ui_image_portrait_black_havoc_01.webp",
  blackNpc4HavocSurv: "datamines/atlases/ui_image_portrait_black_havoc_01.webp",
  deathNpc1Poxwalker:
    "datamines/atlases/ui_image_portrait_death_poxwalker_01.webp",
  deathNpc2PlagueMarine:
    "datamines/atlases/ui_image_portrait_death_plaguemarine_01.webp",
  deathNpc2PlagueMarineSurv:
    "datamines/atlases/ui_image_portrait_death_plaguemarine_01.webp",
  deathNpc3Nurglings:
    "datamines/atlases/ui_image_portrait_death_nurgling_01.webp",
  deathNpc4BlightlordTerminator:
    "datamines/atlases/ui_image_portrait_death_blightlord_01.webp",
  thousNpc1PinkHorror:
    "datamines/atlases/ui_image_portrait_thous_horror_01.webp",
  thousNpc2Screamer:
    "datamines/atlases/ui_image_portrait_thous_screamer_01.webp",
  thousNpc3RubricMarine:
    "datamines/atlases/ui_image_portrait_thous_rubric_01.webp",
  thousNpc3RubricMarineSurv:
    "datamines/atlases/ui_image_portrait_thous_rubric_01.webp",
  thousNpc4Terminator:
    "datamines/atlases/ui_image_portrait_thous_terminator_02.webp",
  thousBossTzaangor:
    "datamines/atlases/ui_image_portrait_thous_tzaangor_01.webp",
  thousBossTzaangorLHE:
    "datamines/atlases/ui_image_portrait_thous_tzaangor_01.webp",
  thousBossTzaangorCamp:
    "datamines/atlases/ui_image_portrait_thous_tzaangor_01.webp",
  thousBossTerminator:
    "datamines/atlases/ui_image_portrait_thous_terminator_01.webp",
  thousBossTerminatorLHE:
    "datamines/atlases/ui_image_portrait_thous_terminator_01.webp",
  thousBossTerminatorCamp:
    "datamines/atlases/ui_image_portrait_thous_terminator_01.webp",
  thousBossTerminatorSurv:
    "datamines/atlases/ui_image_portrait_thous_terminator_01.webp",
  thousBossInfernalMaster:
    "datamines/atlases/ui_image_portrait_thous_infernal_01.webp",
  thousBossInfernalMasterLHE:
    "datamines/atlases/ui_image_portrait_thous_infernal_01.webp",
  thousBossInfernalMasterSurv:
    "datamines/atlases/ui_image_portrait_thous_infernal_01.webp",
  thousBossInfernalMasterCamp:
    "datamines/atlases/ui_image_portrait_thous_infernal_01.webp",
  thousBossSorcerer:
    "datamines/atlases/ui_image_portrait_thous_sorcerer_01.webp",
  thousBossSorcererLHE:
    "datamines/atlases/ui_image_portrait_thous_sorcerer_01.webp",
  thousBossSorcererCamp:
    "datamines/atlases/ui_image_portrait_thous_sorcerer_01.webp",
  thousBossAhriman: "datamines/atlases/ui_image_portrait_thous_ahriman_01.webp",
  thousBossAhrimanLHE:
    "datamines/atlases/ui_image_portrait_thous_ahriman_01.webp",
  thousBossAhrimanCamp:
    "datamines/atlases/ui_image_portrait_thous_ahriman_01.webp",
  thousNpcTzaangor:
    "datamines/atlases/ui_image_portrait_thous_tzaangor_01.webp",
  thousNpcTerminator:
    "datamines/atlases/ui_image_portrait_thous_terminator_01.webp",
  thousNpcInfernalMaster:
    "datamines/atlases/ui_image_portrait_thous_infernal_01.webp",
  thousNpcSorcerer:
    "datamines/atlases/ui_image_portrait_thous_sorcerer_01.webp",
  thousNpcAhriman: "datamines/atlases/ui_image_portrait_thous_ahriman_01.webp",
  thousNpcSekhetar:
    "datamines/atlases/ui_image_portrait_thous_sekhetar_01.webp",
  thousNpcMowDaemonPrince:
    "datamines/atlases/ui_image_portrait_thous_daemonprince_01.webp",
  eldarNpc1Guardian:
    "datamines/atlases/ui_image_portrait_aelda_guardian_01.webp",
  eldarNpc2Warlock: "datamines/atlases/ui_image_portrait_aelda_warlock_01.webp",
  eldarNpc3Harlequin:
    "datamines/atlases/ui_image_portrait_aelda_harlequin_01.webp",
  eldarNpc4Wraithguard:
    "datamines/atlases/ui_image_portrait_aelda_wraithguard_01.webp",
  eldarNpc4WraithguardSurv:
    "datamines/atlases/ui_image_portrait_aelda_wraithguard_01.webp",
  tyranNpc1Hormagaunt_SyncPvp_Kronos:
    "datamines/atlases/ui_image_portrait_tyran_hormagaunt_02.webp",
  tyranNpc1Hormagaunt_SyncPvp_Gorgon:
    "datamines/atlases/ui_image_portrait_tyran_hormagaunt_03.webp",
  tyranNpc2RipperSwarm_SyncPvp_Kronos:
    "datamines/atlases/ui_image_portrait_tyran_ripper_01.webp",
  tyranNpc2RipperSwarm_SyncPvp_Gorgon:
    "datamines/atlases/ui_image_portrait_tyran_ripper_01.webp",
  tyranNpc3Termagant_SyncPvp_Kronos:
    "datamines/atlases/ui_image_portrait_tyran_termagant_02.webp",
  tyranNpc3Termagant_SyncPvp_Gorgon:
    "datamines/atlases/ui_image_portrait_tyran_termagant_03.webp",
  tyranBossNeurothrope:
    "datamines/atlases/ui_image_portrait_tyran_neurothrope_01.webp",
  tyranBossNeurothropeLHE:
    "datamines/atlases/ui_image_portrait_tyran_neurothrope_01.webp",
  tyranBossNeurothropeSurv:
    "datamines/atlases/ui_image_portrait_tyran_neurothrope_01.webp",
  tyranBossNeurothropeCE:
    "datamines/atlases/ui_image_portrait_tyran_neurothrope_01.webp",
  tyranNpcNeurothrope:
    "datamines/atlases/ui_image_portrait_tyran_neurothrope_01.webp",
  tyranNpcOSNeurothrope:
    "datamines/atlases/ui_image_portrait_tyran_neurothrope_01.webp",
  tyranBossTyrantGuard:
    "datamines/atlases/ui_image_portrait_tyran_tyrantguard_01.webp",
  tyranBossTyrantGuardLHE:
    "datamines/atlases/ui_image_portrait_tyran_tyrantguard_01.webp",
  tyranBossTyrantGuardCE:
    "datamines/atlases/ui_image_portrait_tyran_tyrantguard_01.webp",
  tyranNpcTyrantGuard:
    "datamines/atlases/ui_image_portrait_tyran_tyrantguard_01.webp",
  tyranNpcOSTyrantGuard:
    "datamines/atlases/ui_image_portrait_tyran_tyrantguard_01.webp",
  tyranBossWingedPrime:
    "datamines/atlases/ui_image_portrait_tyran_wingedprime_01.webp",
  tyranBossWingedPrimeLHE:
    "datamines/atlases/ui_image_portrait_tyran_wingedprime_01.webp",
  tyranBossWingedPrimeLEG:
    "datamines/atlases/ui_image_portrait_tyran_wingedprime_01.webp",
  tyranBossWingedPrimeSurv:
    "datamines/atlases/ui_image_portrait_tyran_wingedprime_01.webp",
  tyranBossWingedPrimeCE:
    "datamines/atlases/ui_image_portrait_tyran_wingedprime_01.webp",
  tyranNpcWingedPrime:
    "datamines/atlases/ui_image_portrait_tyran_wingedprime_01.webp",
  tyranNpcOSWingedPrime:
    "datamines/atlases/ui_image_portrait_tyran_wingedprime_01.webp",
  tyranNpcDeathleaper:
    "datamines/atlases/ui_image_portrait_tyran_deathleaper_01.webp",
  tyranNpcOSDeathleaper:
    "datamines/atlases/ui_image_portrait_tyran_deathleaper_01.webp",
  tyranBossDeathleaper:
    "datamines/atlases/ui_image_portrait_tyran_deathleaper_01.webp",
  tyranBossDeathleaperLHE:
    "datamines/atlases/ui_image_portrait_tyran_deathleaper_01.webp",
  tyranBossDeathleaperCE:
    "datamines/atlases/ui_image_portrait_tyran_deathleaper_01.webp",
  tyranBossDeathleaperSurv:
    "datamines/atlases/ui_image_portrait_tyran_deathleaper_01.webp",
  tyranNpcParasite:
    "datamines/atlases/ui_image_portrait_tyran_parasite_01.webp",
  tyranNpcOSParasite:
    "datamines/atlases/ui_image_portrait_tyran_parasite_01.webp",
  tyranBossParasite:
    "datamines/atlases/ui_image_portrait_tyran_parasite_01.webp",
  tyranBossParasiteLHE:
    "datamines/atlases/ui_image_portrait_tyran_parasite_01.webp",
  tyranBossParasiteSurv:
    "datamines/atlases/ui_image_portrait_tyran_parasite_01.webp",
  tyranBossParasiteCE:
    "datamines/atlases/ui_image_portrait_tyran_parasite_01.webp",
  tyranBossHiveTyrantLeviathan:
    "datamines/atlases/ui_image_portrait_guild_tyrant_01.webp",
  admecBossRuststalker:
    "datamines/atlases/ui_image_portrait_admec_ruststalker_01.webp",
  admecBossRuststalkerLEG:
    "datamines/atlases/ui_image_portrait_admec_ruststalker_01.webp",
  admecBossRuststalkerLHE:
    "datamines/atlases/ui_image_portrait_admec_ruststalker_01.webp",
  admecBossRuststalkerSurv:
    "datamines/atlases/ui_image_portrait_admec_ruststalker_01.webp",
  admecBossMarshall:
    "datamines/atlases/ui_image_portrait_admec_marshall_01.webp",
  admecBossMarshallLEG:
    "datamines/atlases/ui_image_portrait_admec_marshall_01.webp",
  admecBossMarshallLHE:
    "datamines/atlases/ui_image_portrait_admec_marshall_01.webp",
  admecBossManipulus:
    "datamines/atlases/ui_image_portrait_admec_manipulus_01.webp",
  admecBossManipulusLEG:
    "datamines/atlases/ui_image_portrait_admec_manipulus_01.webp",
  admecBossManipulusLHE:
    "datamines/atlases/ui_image_portrait_admec_manipulus_01.webp",
  admecBossDominus: "datamines/atlases/ui_image_portrait_admec_dominus_01.webp",
  admecBossDominusLEG:
    "datamines/atlases/ui_image_portrait_admec_dominus_01.webp",
  admecBossDominusLHE:
    "datamines/atlases/ui_image_portrait_admec_dominus_01.webp",
  admecBossDestroyer:
    "datamines/atlases/ui_image_portrait_admec_destroyer_01.webp",
  admecBossDestroyerLHE:
    "datamines/atlases/ui_image_portrait_admec_destroyer_01.webp",
  admecBossDestroyerCE:
    "datamines/atlases/ui_image_portrait_admec_destroyer_01.webp",
  admecBossRuststalkerCE:
    "datamines/atlases/ui_image_portrait_admec_ruststalker_01.webp",
  admecBossMarshallCE:
    "datamines/atlases/ui_image_portrait_admec_marshall_01.webp",
  admecBossManipulusCE:
    "datamines/atlases/ui_image_portrait_admec_manipulus_01.webp",
  admecBossDominusCE:
    "datamines/atlases/ui_image_portrait_admec_dominus_01.webp",
  admecBossMarshallSurv:
    "datamines/atlases/ui_image_portrait_admec_marshall_01.webp",
  admecBossManipulusSurv:
    "datamines/atlases/ui_image_portrait_admec_manipulus_01.webp",
  admecBossDominusSurv:
    "datamines/atlases/ui_image_portrait_admec_dominus_01.webp",
  admecNpc1Vanguard:
    "datamines/atlases/ui_image_portrait_admec_vanguard_01.webp",
  admecNpc2Techpriest:
    "datamines/atlases/ui_image_portrait_admec_techpriest_01.webp",
  admecNpc3Electropriest:
    "datamines/atlases/ui_image_portrait_admec_electropriest_01.webp",
  admecNpc3ElectropriestSurv:
    "datamines/atlases/ui_image_portrait_admec_electropriest_01.webp",
  admecNpc1VanguardSurv:
    "datamines/atlases/ui_image_portrait_admec_vanguard_01.webp",
  admecBossBelisarius:
    "datamines/atlases/ui_image_portrait_guild_belisarius_01.webp",
  astraNpcMowOrdnanceBattery:
    "datamines/atlases/ui_image_portrait_astra_ordnancebattery_01.webp",
  blackNpcMowForgefiend:
    "datamines/atlases/ui_image_portrait_black_forgefiend_01.webp",
  tyranNpcMowBiovore:
    "datamines/atlases/ui_image_portrait_tyran_biovore_01.webp",
  bloodBossIntercessorSurv:
    "datamines/atlases/ui_image_portrait_blood_intercessor_01.webp",
  bloodBossDeathCompanySurv:
    "datamines/atlases/ui_image_portrait_blood_deathcompany_01.webp",
  bloodBossSanguinarySurv:
    "datamines/atlases/ui_image_portrait_blood_sanguinary_01.webp",
  bloodBossMephistonSurv:
    "datamines/atlases/ui_image_portrait_blood_mephiston_01.webp",
  bloodBossDanteSurv: "datamines/atlases/ui_image_portrait_blood_dante_01.webp",
  bloodBossTerminatorSurv:
    "datamines/atlases/ui_image_portrait_blood_terminator_01.webp",
  bloodNpc1Intercessor:
    "datamines/atlases/ui_image_portrait_blood_intercessor_02.webp",
  bloodNpc1IntercessorSurv:
    "datamines/atlases/ui_image_portrait_blood_intercessor_02.webp",
  ultraNpcMoWDreadnought:
    "datamines/atlases/ui_image_portrait_ultra_dreadnought_01.webp",
  genesNpc1Aberrant:
    "datamines/atlases/ui_image_portrait_genes_aberrant_01.webp",
  genesNpc2Genestealer:
    "datamines/atlases/ui_image_portrait_genes_genestealer_01.webp",
  genesNpc3Neophyte:
    "datamines/atlases/ui_image_portrait_genes_neophyte_01.webp",
  genesDecoy: "datamines/atlases/ui_image_portrait_thous_horror_02.webp",
  tauNpc1FireWarrior:
    "datamines/atlases/ui_image_portrait_tauta_firewarrior_01.webp",
  tauNpc2DroneSniper: "datamines/atlases/ui_image_portrait_tauta_drone_01.webp",
  tauNpc3DroneShield: "datamines/atlases/ui_image_portrait_tauta_drone_02.webp",
  tauNpc4DroneCommandLink:
    "datamines/atlases/ui_image_portrait_tauta_drone_04.webp",
  tauNpc5StealthSuit:
    "datamines/atlases/ui_image_portrait_tauta_stealthsuit_01.webp",
  tauNpc6Carnivore:
    "datamines/atlases/ui_image_portrait_tauta_carnivore_01.webp",
  tauBossDarkstrider:
    "datamines/atlases/ui_image_portrait_tauta_darkstrider_01.webp",
  tauBossDarkstriderLHE:
    "datamines/atlases/ui_image_portrait_tauta_darkstrider_01.webp",
  tauBossDarkstriderInc:
    "datamines/atlases/ui_image_portrait_tauta_darkstrider_01.webp",
  tauBossAunShi: "datamines/atlases/ui_image_portrait_tauta_aunshi_01.webp",
  tauBossAunShiInc: "datamines/atlases/ui_image_portrait_tauta_aunshi_01.webp",
  tauBossAunShiLHE: "datamines/atlases/ui_image_portrait_tauta_aunshi_01.webp",
  tauBossShadowsun:
    "datamines/atlases/ui_image_portrait_tauta_shadowsun_01.webp",
  tauBossShadowsunInc:
    "datamines/atlases/ui_image_portrait_tauta_shadowsun_01.webp",
  tauBossShadowsunLHE:
    "datamines/atlases/ui_image_portrait_tauta_shadowsun_01.webp",
  tauBossMarksman: "datamines/atlases/ui_image_portrait_tauta_marksman_01.webp",
  tauBossMarksmanLHE:
    "datamines/atlases/ui_image_portrait_tauta_marksman_01.webp",
  tauBossMarksmanInc:
    "datamines/atlases/ui_image_portrait_tauta_marksman_01.webp",
  tauBossCrisis: "datamines/atlases/ui_image_portrait_tauta_crisis_01.webp",
  tauBossCrisisLHE: "datamines/atlases/ui_image_portrait_tauta_crisis_01.webp",
  tauBossCrisisInc: "datamines/atlases/ui_image_portrait_tauta_crisis_01.webp",
  tauBossFarsight: "datamines/atlases/ui_image_portrait_tauta_farsight_01.webp",
  tauBossFarsightInc:
    "datamines/atlases/ui_image_portrait_tauta_farsight_01.webp",
  tauBossFarsightLHE:
    "datamines/atlases/ui_image_portrait_tauta_farsight_01.webp",
  tauBossFarsightSurv:
    "datamines/atlases/ui_image_portrait_tauta_farsight_01.webp",
  tauNpcMoWBroadside:
    "datamines/atlases/ui_image_portrait_tauta_broadside_01.webp",
  tauNpcDarkstrider:
    "datamines/atlases/ui_image_portrait_tauta_darkstrider_01.webp",
  tauNpcAunShi: "datamines/atlases/ui_image_portrait_tauta_aunshi_01.webp",
  tauNpcShadowsun:
    "datamines/atlases/ui_image_portrait_tauta_shadowsun_01.webp",
  tauNpcMarksman: "datamines/atlases/ui_image_portrait_tauta_marksman_01.webp",
  tauNpcCrisis: "datamines/atlases/ui_image_portrait_tauta_crisis_01.webp",
  tauNpcFarsight: "datamines/atlases/ui_image_portrait_tauta_farsight_01.webp",
  tauBossRiptide: "datamines/atlases/ui_image_portrait_guild_riptide_01.webp",
  deathNpcMoWCrawler:
    "datamines/atlases/ui_image_portrait_death_crawler_01.webp",
  deathNpcTyphus: "datamines/atlases/ui_image_portrait_death_typhus_01.webp",
  deathNpcBlightlord:
    "datamines/atlases/ui_image_portrait_death_blightlord_01.webp",
  deathNpcRotbone: "datamines/atlases/ui_image_portrait_death_rotbone_01.webp",
  deathNpcPutrifier:
    "datamines/atlases/ui_image_portrait_death_putrifier_01.webp",
  deathBossMortarion:
    "datamines/atlases/ui_image_portrait_guild_mortarion_01.webp",
  deathNpcBlightbringer:
    "datamines/atlases/ui_image_portrait_death_blightbringer_01.webp",
  tyranNpc6SporeMine:
    "datamines/atlases/ui_image_portrait_tyran_sporemine_01.webp",
  genesNpcBiophagus:
    "datamines/atlases/ui_image_portrait_genes_biophagus_01.webp",
  genesNpcMagus: "datamines/atlases/ui_image_portrait_genes_magus_01.webp",
  genesNpcPrimus: "datamines/atlases/ui_image_portrait_genes_primus_01.webp",
  genesNpcKelermorph:
    "datamines/atlases/ui_image_portrait_genes_kelermorph_01.webp",
  genesNpcPatriarch:
    "datamines/atlases/ui_image_portrait_genes_patriarch_01.webp",
  genesBossBiophagus:
    "datamines/atlases/ui_image_portrait_genes_biophagus_01.webp",
  genesBossBiophagusLHE:
    "datamines/atlases/ui_image_portrait_genes_biophagus_01.webp",
  genesBossMagus: "datamines/atlases/ui_image_portrait_genes_magus_01.webp",
  genesBossMagusLHE: "datamines/atlases/ui_image_portrait_genes_magus_01.webp",
  genesBossMagusSurv: "datamines/atlases/ui_image_portrait_genes_magus_01.webp",
  genesBossPrimus: "datamines/atlases/ui_image_portrait_genes_primus_01.webp",
  genesBossPrimusLHE:
    "datamines/atlases/ui_image_portrait_genes_primus_01.webp",
  genesBossKelermorph:
    "datamines/atlases/ui_image_portrait_genes_kelermorph_01.webp",
  genesBossKelermorphLHE:
    "datamines/atlases/ui_image_portrait_genes_kelermorph_01.webp",
  genesBossKelermorphSurv:
    "datamines/atlases/ui_image_portrait_genes_kelermorph_01.webp",
  genesBossPatriarch:
    "datamines/atlases/ui_image_portrait_genes_patriarch_01.webp",
  genesBossPatriarchLHE:
    "datamines/atlases/ui_image_portrait_genes_patriarch_01.webp",
  votanNpc1Ecog: "datamines/atlases/ui_image_portrait_votan_ecog_01.webp",
  votanNpc2Steeljack:
    "datamines/atlases/ui_image_portrait_votan_steeljack_01.webp",
  astarBossCyrusSurv: "datamines/atlases/ui_image_portrait_astar_cyrus_01.webp",
  astarBossLysanderSurv:
    "datamines/atlases/ui_image_portrait_astar_lysander_01.webp",
  astarNpc1HaywireMine:
    "datamines/atlases/ui_image_portrait_astar_haywiremine_01.webp",
  spaceBossWulfenSurv:
    "datamines/atlases/ui_image_portrait_space_wulfen_01.webp",
  spaceBossHoundSurv: "datamines/atlases/ui_image_portrait_space_hound_01.webp",
  spaceBossRockfistSurv:
    "datamines/atlases/ui_image_portrait_space_arjac_01.webp",
  spaceBossStormcallerSurv:
    "datamines/atlases/ui_image_portrait_space_njal_01.webp",
  spaceBossWolfPriestSurv:
    "datamines/atlases/ui_image_portrait_space_wolfpriest_01.webp",
  spaceBossBlackmaneSurv:
    "datamines/atlases/ui_image_portrait_space_ragnar_01.webp",
}
