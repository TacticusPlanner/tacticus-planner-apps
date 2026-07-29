import { useTranslation } from "react-i18next"

import type { GoalKind } from "@/entities/goal"
import type { useCreateGoalForm } from "../../model/goal-creation-form/use-create-goal-form"
import { FarmingStrategyField } from ".//farming-strategy-field"
import { AscensionFarmingFields } from ".//goal-farming-fields"
import { GoalShardLocationsField } from ".//goal-shard-locations-field"
import { AbilityGoalFields, RankGoalFields } from ".//goal-type-fields"
import { GoalTypeCard } from "../shared/goal-visuals"
import { LevelGoalFields } from ".//level-goal-fields"
import { UnlockRequirementField } from ".//unlock-requirement-field"
import { UpgradeGoalFields } from ".//upgrade-goal-fields"

type GoalForm = ReturnType<typeof useCreateGoalForm>

/**
 * Every enabled goal-type's `GoalTypeCard`, in the same order as the toggle group above it
 * (`goalKinds`) — one switch per kind rather than one hardcoded block per kind, so the two can never
 * drift apart again. Split out of unit-goal-form-fields.tsx purely for that file's own max-lines
 * budget (same reason `EquipmentGoalFields`/`UpgradeGoalFields`/`GoalProjectsField` live in their own
 * files) — a coordinator, not a leaf field, so it still takes the whole `form`.
 */
export function GoalTypeCards({
  form,
  goalKinds,
}: {
  form: GoalForm
  goalKinds: GoalKind[]
}) {
  const { t } = useTranslation()

  return (
    <>
      {goalKinds
        .filter((kind) => form.enabledTypes.has(kind))
        .map((kind) => {
          switch (kind) {
            case "Rank":
              return (
                <GoalTypeCard key={kind} kind="Rank">
                  <RankGoalFields
                    rankStart={form.rankStart}
                    rankEnd={form.rankEnd}
                    rankEndOptions={form.rankEndOptions}
                    rankAdditionalTarget={form.rankAdditionalTarget}
                    additionalTargetChoices={form.additionalTargetChoices}
                    onRankEndChange={form.setRankEnd}
                    onRankAdditionalTargetChange={form.setRankAdditionalTarget}
                    missingUpgrades={form.missingUpgrades}
                    rankAppliedUpgrades={form.rankAppliedUpgrades}
                    rankUpgradeSlotsTotal={form.rankUpgradeSlotsTotal}
                  />
                  <FarmingStrategyField
                    context="rank"
                    rankStart={form.rankStart}
                    rankEnd={form.rankEnd}
                    rankAdditionalTarget={form.rankAdditionalTarget}
                    abilityActiveStart={form.abilityActiveStart}
                    abilityActiveEnd={form.abilityActiveEnd}
                    abilityPassiveStart={form.abilityPassiveStart}
                    abilityPassiveEnd={form.abilityPassiveEnd}
                    farmingStrategy={form.farmingStrategy}
                    onFarmingStrategyChange={form.setFarmingStrategy}
                  />
                </GoalTypeCard>
              )
            case "Ascension":
              return (
                <GoalTypeCard key={kind} kind="Ascension">
                  <AscensionFarmingFields
                    progressionStart={form.progressionStart}
                    progressionEnd={form.progressionEnd}
                    onProgressionEndChange={form.setProgressionEnd}
                    ascensionFarmingSource={form.ascensionFarmingSource}
                    onAscensionFarmingSourceChange={
                      form.setAscensionFarmingSource
                    }
                    progressionPreview={form.progressionPreview}
                  />
                  {/* Each group is shown only when Ascension's own current range actually needs
                      that shard type (plan: don't recommend a mythic-only node for a below-
                      Mythic range, or vice versa) — see use-progression-preview.ts's
                      ascensionNeeds{Regular,Mythic}Shards. The regular group is additionally
                      suppressed here when Unlock is also enabled, since it's the same shared
                      selection state and Unlock's own card already shows it (avoids duplicating
                      the checkbox list and its testids on both cards at once); the mythic group
                      has no such conflict, since Unlock never shows one. */}
                  {form.entityType === "Character" &&
                  !form.enabledTypes.has("Unlock") &&
                  form.progressionPreview?.ascensionNeedsRegularShards ? (
                    <GoalShardLocationsField
                      battlesById={form.battlesById}
                      onToggle={form.toggleShardLocation}
                      selectedIds={form.shardLocationIds}
                      shardLocations={form.regularShardLocations}
                      shardType="Regular"
                    />
                  ) : null}
                  {form.entityType === "Character" &&
                  form.progressionPreview?.ascensionNeedsMythicShards ? (
                    <GoalShardLocationsField
                      battlesById={form.battlesById}
                      onToggle={form.toggleShardLocation}
                      selectedIds={form.shardLocationIds}
                      shardLocations={form.mythicShardLocations}
                      shardType="Mythic"
                    />
                  ) : null}
                </GoalTypeCard>
              )
            case "Ability":
              return (
                <GoalTypeCard
                  entityType={form.entityType}
                  key={kind}
                  kind="Ability"
                >
                  <AbilityGoalFields
                    activeStart={form.abilityActiveStart}
                    passiveStart={form.abilityPassiveStart}
                    targetLevel={form.abilityTargetLevel}
                    onTargetLevelChange={form.setAbilityTargetLevel}
                    missingUpgrades={form.missingUpgrades}
                    costingSupported={form.entityType === "Mow"}
                  />
                  {form.entityType === "Mow" ? (
                    <FarmingStrategyField
                      context="ability"
                      rankStart={form.rankStart}
                      rankEnd={form.rankEnd}
                      abilityActiveStart={form.abilityActiveStart}
                      abilityActiveEnd={form.abilityActiveEnd}
                      abilityPassiveStart={form.abilityPassiveStart}
                      abilityPassiveEnd={form.abilityPassiveEnd}
                      farmingStrategy={form.farmingStrategy}
                      onFarmingStrategyChange={form.setFarmingStrategy}
                    />
                  ) : null}
                </GoalTypeCard>
              )
            case "Upgrade":
              return (
                <GoalTypeCard key={kind} kind="Upgrade">
                  <UpgradeGoalFields
                    targets={form.upgradeTargets}
                    relevantUpgradeQuantities={form.relevantUpgradeQuantities}
                    upgradesById={form.upgradesById}
                    onAdd={form.addUpgradeTarget}
                    onRemove={form.removeUpgradeTarget}
                    onQuantityChange={form.setUpgradeTargetQuantity}
                    missingUpgrades={form.upgradeGoalNeed}
                    rankRange={
                      form.entityType === "Character"
                        ? {
                            start: form.upgradeRankStart,
                            end: form.upgradeRankEnd,
                            startOptions: form.upgradeRankStartOptions,
                            endOptions: form.upgradeRankEndOptions,
                            onStartChange: form.setUpgradeRankStart,
                            onEndChange: form.setUpgradeRankEnd,
                          }
                        : undefined
                    }
                  />
                </GoalTypeCard>
              )
            case "Level":
              return (
                <GoalTypeCard key={kind} kind="Level">
                  <LevelGoalFields
                    levelStart={form.levelStart}
                    levelEnd={form.levelEnd}
                    levelEndOptions={form.levelEndOptions}
                    onLevelEndChange={form.setLevelEnd}
                    cost={form.levelCost}
                  />
                </GoalTypeCard>
              )
            case "Unlock":
              return (
                <GoalTypeCard key={kind} kind="Unlock">
                  <p className="text-sm text-muted-foreground">
                    {t("goals.create.unlockDescription")}
                  </p>
                  {form.entityType === "Mow" ? (
                    <p className="text-xs text-muted-foreground">
                      {t("goals.create.unlockCostUnsupportedMow")}
                    </p>
                  ) : (
                    <>
                      {form.unlockRequirement ? (
                        <UnlockRequirementField
                          energyEstimate={form.unlockRequirement.energyEstimate}
                          ownedShards={form.unlockRequirement.ownedShards}
                          rarity={form.unlockRequirement.rarity}
                          totalShards={form.unlockRequirement.totalShards}
                        />
                      ) : null}
                      <GoalShardLocationsField
                        battlesById={form.battlesById}
                        onToggle={form.toggleShardLocation}
                        selectedIds={form.shardLocationIds}
                        shardLocations={form.regularShardLocations}
                        shardType="Regular"
                      />
                    </>
                  )}
                </GoalTypeCard>
              )
            case "UpgradeItem":
              // Item goals use the sheet's separate "Item" pill/form entirely —
              // never offered in CHARACTER_GOAL_KINDS/MOW_GOAL_KINDS, so unreachable here.
              return null
          }
        })}
    </>
  )
}
