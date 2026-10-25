import { useTranslation } from "react-i18next"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Label } from "@workspace/ui/components/label"
import type { UnitId } from "@workspace/game-domain"
import { UnitCombobox } from "@/shared/ui"
import { goalKindsForEntity } from "@/features/goal-planning/@x/goal-create"
import type { useCreateGoalForm } from "../../model/goal-creation-form/use-create-goal-form"
import { GoalProjectsField } from "../projects/goal-projects-field"
import { GoalTypeToggleGroup, GoalTypeCard } from "../shared/goal-visuals"
import { UnitInfoCard } from "./unit-info-card"
import { progressionLabel, type GoalKind } from "@/entities/goal"
import {
  AcquisitionSourceField,
  ShopOfferRow,
} from "./acquisition-source-field"
import { FarmingStrategyField } from "./farming-strategy-field"
import { AscensionFarmingFields } from "./goal-farming-fields"
import { GoalShardLocationsField } from "./goal-shard-locations-field"
import { AbilityGoalFields } from "./ability-goal-fields"
import { RankGoalFields } from "./goal-type-fields"
import { LevelRequirementNote } from "./level-requirement-note"
import { MythicMaterialSourceField } from "./mythic-material-source-field"
import { UnlockRequirementField } from "./unlock-requirement-field"
import { UpgradeGoalFields } from "./upgrade-goal-fields"
import {
  AbilityMilestoneFields,
  AscensionMilestoneFields,
  RankMilestoneFields,
} from "./goal-milestone-fields"
import { canAddMilestone } from "../../model/goal-creation-form/goal-milestones"

type GoalForm = ReturnType<typeof useCreateGoalForm>

/**
 * The "Unit" pill's entire form body, in display order: unit picker, goal-type toggles, every
 * enabled goal-type's `GoalTypeCard` (assembled by `GoalTypeCards`), prerequisite suggestions,
 * project membership selection, then the combined-goal review list ("What will be
 * created", with each selected project's own duration estimate) last. This is a coordinator-level component, not a leaf presentational field, so taking the
 * whole `form` is the same posture as the sheet already had.
 */
export function UnitGoalFormFields({
  form,
  portalContainer,
  unitIcon,
}: {
  form: GoalForm
  portalContainer: HTMLElement | null
  unitIcon: (id: UnitId) => string | undefined
}) {
  const { t } = useTranslation()
  const goalKinds = goalKindsForEntity(form.entityType)

  return (
    <form
      id="create-goal-form"
      className="grid items-start gap-3 pb-3 @2xl:grid-cols-2"
      onSubmit={(event) => void form.handleSubmit(event)}
    >
      <div className="col-span-full">
        <UnitCombobox
          groups={form.unitGroups}
          value={form.entityId}
          onChange={form.handleEntityChange}
          placeholder={t("goals.create.unitPlaceholder")}
          emptyText={t("goals.create.unitEmpty")}
          icon={unitIcon}
          lockedIds={form.lockedUnitIds}
        />
      </div>

      {form.entityId ? (
        <div
          className="col-span-full grid items-start gap-3 @2xl:grid-cols-2"
          data-testid="create-goal-status-and-types"
        >
          <UnitInfoCard
            entityType={form.entityType}
            isOwned={form.entityAlreadyOwned}
            loading={form.entityLoading}
            rank={form.entityType === "Character" ? form.rankStart : undefined}
            progression={form.progressionStart}
            abilityActiveLevel={form.abilityActiveStart}
            abilityPassiveLevel={form.abilityPassiveStart}
            level={
              form.entityType === "Character" ? form.currentLevel : undefined
            }
            shardCount={
              form.entityAlreadyOwned
                ? ((form.usesMythicShards
                    ? form.ownedMythicShards
                    : form.ownedShards) ?? 0)
                : (form.lockedShards ?? 0)
            }
            shardIsMythic={form.entityAlreadyOwned && form.usesMythicShards}
          />

          <div className="grid content-start gap-3">
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">
                {t("goals.create.goalTypeLabel")}
              </Label>
              <GoalTypeToggleGroup
                kinds={goalKinds}
                enabledTypes={form.enabledTypes}
                onToggle={form.toggleType}
                isDisabled={(kind) =>
                  (kind === "Unlock" && !form.unlockAvailable) ||
                  (kind === "Rank" && form.atMaxRank) ||
                  (kind === "Ascension" && form.atMaxProgression) ||
                  (kind === "Ability" && form.atMaxAbility) ||
                  (kind === "Upgrade" &&
                    form.entityType === "Character" &&
                    form.atMaxRank)
                }
                entityType={form.entityType}
              />
              {!form.unlockAvailable ? (
                <p className="text-xs text-muted-foreground">
                  {t(
                    form.entityAlreadyOwned
                      ? "goals.create.validation.alreadyUnlocked"
                      : "goals.create.unlockUnavailable"
                  )}
                </p>
              ) : null}
              {form.atMaxRank ? (
                <p className="text-xs text-muted-foreground">
                  {t("goals.create.validation.rankMaxed")}
                </p>
              ) : null}
              {form.atMaxProgression ? (
                <p className="text-xs text-muted-foreground">
                  {t("goals.create.validation.progressionMaxed")}
                </p>
              ) : null}
              {form.atMaxAbility ? (
                <p className="text-xs text-muted-foreground">
                  {t("goals.create.validation.abilityMaxed")}
                </p>
              ) : null}
            </div>

            {form.slotConflictMessage ? (
              <p
                className="text-sm text-destructive"
                data-testid="create-goal-slot-conflict"
                role="alert"
              >
                {form.slotConflictMessage}
              </p>
            ) : null}
            <GoalProjectsField
              onSelectionChange={form.selectProjects}
              portalContainer={portalContainer}
              projects={form.projects}
              projectsValid={form.selectedProjectIds.length > 0}
              selectedProjectIds={form.selectedProjectIds}
              testIdPrefix="create-goal"
            />
          </div>
        </div>
      ) : null}

      {form.entityId ? (
        <GoalTypeCards form={form} goalKinds={goalKinds} />
      ) : null}

      {/* Prerequisite suggestions describe extra goals to prepend to the set above — shown after
          the config cards so the user sees what they configured before what gets auto-added. */}
      {form.prerequisites.needsUnlock ? (
        <Field className="col-span-full" orientation="horizontal">
          <Checkbox
            checked={form.includeSuggestedUnlock}
            data-testid="create-goal-include-unlock"
            onCheckedChange={(checked) =>
              form.setIncludeSuggestedUnlock(checked === true)
            }
          />
          <FieldLabel className="font-normal">
            {t("goals.create.suggestions.includeUnlock")}
          </FieldLabel>
        </Field>
      ) : null}

      {form.prerequisites.needsAscension ? (
        <Field className="col-span-full" orientation="horizontal">
          <Checkbox
            checked={form.includeSuggestedAscension}
            data-testid="create-goal-include-ascension"
            onCheckedChange={(checked) =>
              form.setIncludeSuggestedAscension(checked === true)
            }
          />
          <FieldLabel className="font-normal">
            {t("goals.create.suggestions.includeAscension")}
          </FieldLabel>
        </Field>
      ) : null}

      {form.entityId && form.reviewItems.length > 0 ? (
        <div
          className="col-span-full flex flex-wrap items-baseline gap-x-4 gap-y-0.5 rounded-2xl border px-3 py-2 text-sm"
          data-testid="create-goal-review"
        >
          <p className="font-medium">{t("goals.create.reviewTitle")}</p>
          <ul className="flex flex-wrap gap-x-3 text-muted-foreground">
            {form.reviewItems.map((item) => (
              <li key={item.goalType}>
                {t(`goals.create.goalTypes.${item.goalType}`)}
                {item.count > 1 ? ` ×${item.count}` : null}
                {item.autoSuggested ? (
                  <span className="text-xs">
                    {" — "}
                    {t(
                      item.goalType === "Unlock"
                        ? "goals.create.suggestions.unlockRequired"
                        : "goals.create.suggestions.ascensionRequired"
                    )}
                  </span>
                ) : null}
              </li>
            ))}
            {form.prerequisites.coveringAscension ? (
              <li data-testid="create-goal-review-depends-on-existing">
                {t("goals.create.suggestions.dependsOnExisting", {
                  target: progressionLabel(
                    t,
                    form.prerequisites.coveringAscension.end
                  ),
                })}
              </li>
            ) : null}
          </ul>
          {form.estimatedProjectIds.length > 0 ? (
            <ul className="flex flex-wrap gap-x-3 border-l pl-3 text-muted-foreground">
              {form.estimatedProjectIds.map((projectId) => {
                const project = form.projects.find(
                  (candidate) => candidate.projectId === projectId
                )
                const estimate = form.perProjectEstimates.get(projectId)
                return (
                  <li
                    data-testid={`create-goal-project-estimate-${projectId}`}
                    key={projectId}
                  >
                    {project?.name ?? projectId}
                    {": "}
                    {!estimate || estimate.status === "loading"
                      ? t("goals.create.projectEstimateLoading")
                      : estimate.status === "unavailable"
                        ? t("goals.create.projectEstimateUnavailable")
                        : estimate.outcome.status === "Blocked"
                          ? t(
                              `goals.estimate.blocked.${estimate.outcome.reason}`
                            )
                          : t("goals.create.previewEstimate", {
                              days: estimate.outcome.days,
                            })}
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>
      ) : null}

      {form.status === "error" && form.errorMessage ? (
        <FieldError className="col-span-full" data-testid="create-goal-error">
          {form.errorMessage}
        </FieldError>
      ) : null}
      {form.validationMessage ? (
        <FieldError
          className="col-span-full"
          data-testid="create-goal-validation-error"
        >
          {form.validationMessage}
        </FieldError>
      ) : null}
    </form>
  )
}

/**
 * Every enabled goal-type's `GoalTypeCard`, in the same order as the toggle group above it
 * (`goalKinds`) — one switch per kind rather than one hardcoded block per kind, so the two can never
 * drift apart again. A coordinator, not a leaf field, so it still takes the whole `form`.
 */
function GoalTypeCards({
  form,
  goalKinds,
}: {
  form: GoalForm
  goalKinds: GoalKind[]
}) {
  const { t } = useTranslation()
  // One Mythic-material selection serves every enabled Rank/Upgrade/MoW-Ability goal of this unit
  // (add-mythic-material-shop-sources); render it once, in the first such card.
  const mythicHost = goalKinds.find(
    (kind) =>
      form.enabledTypes.has(kind) &&
      (kind === "Rank" ||
        kind === "Upgrade" ||
        (kind === "Ability" && form.entityType === "Mow"))
  )
  // Each ladder's last target: the newest added milestone, else the card's own target.
  const { milestoneFields } = form
  const { milestones } = milestoneFields
  const ladderEnds = {
    rank: milestones.rank.at(-1) ?? form.rankEnd,
    progression: milestones.ascension.at(-1) ?? form.progressionEnd,
    ability: milestones.ability.at(-1) ?? {
      activeEnd: form.abilityActiveEnd,
      passiveEnd: form.abilityPassiveEnd,
    },
  }
  const invalidMilestone = (kind: GoalKind) =>
    form.milestoneIssue?.kind === kind ? form.milestoneIssue.index : null
  const mythicField = (kind: GoalKind) =>
    kind === mythicHost ? (
      <MythicMaterialSourceField selection={form.mythicMaterialSelection} />
    ) : null

  return (
    <>
      {goalKinds
        .filter((kind) => form.enabledTypes.has(kind))
        .map((kind) => {
          switch (kind) {
            case "Rank":
              return (
                <GoalTypeCard key={kind} kind="Rank" wide>
                  <div className="grid items-start gap-2 @2xl:grid-cols-2">
                    <RankGoalFields
                      rankStart={form.rankStart}
                      rankEnd={form.rankEnd}
                      rankEndOptions={form.rankEndOptions}
                      rankAdditionalTarget={form.rankAdditionalTarget}
                      additionalTargetChoices={form.additionalTargetChoices}
                      onRankEndChange={form.setRankEnd}
                      onRankAdditionalTargetChange={
                        form.setRankAdditionalTarget
                      }
                      missingUpgrades={form.missingUpgrades}
                      rankAppliedUpgrades={form.rankAppliedUpgrades}
                      rankUpgradeSlotsTotal={form.rankUpgradeSlotsTotal}
                    />
                    <div className="grid gap-2">
                      <LevelRequirementNote
                        preview={form.levelRequirements.Rank}
                        xpBookRarity={form.xpBookRarity}
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
                    </div>
                  </div>
                  <RankMilestoneFields
                    canAdd={canAddMilestone("Rank", ladderEnds)}
                    invalidIndex={invalidMilestone("Rank")}
                    milestones={milestones.rank}
                    onAdd={() => milestoneFields.addRank(ladderEnds.rank)}
                    onChange={(index, value) =>
                      milestoneFields.update("rank", index, value)
                    }
                    onRemove={(index) => milestoneFields.remove("rank", index)}
                    rankStart={form.rankStart}
                  />
                  {mythicField(kind)}
                </GoalTypeCard>
              )
            case "Ascension": {
              // Each shard-type sub-list, and the Shops group's offers, are shown only when
              // Ascension's own current range actually needs that type (plan: don't recommend a
              // mythic-only node/offer for a below-Mythic range, or vice versa — see
              // use-progression-preview.ts's ascensionNeeds{Regular,Mythic}Shards). Campaigns and
              // Shops are additionally suppressed here when Unlock is also enabled, since they're
              // the same shared selection state and Unlock's own card already shows them (avoids
              // duplicating the checkbox lists and their testids on both cards at once); Onslaught
              // has no such conflict — Unlock never shows that group. Unlock's own card never shows
              // mythic sources (it's always regular-only), so when the range needs mythic and Unlock
              // is also enabled, those mythic-only rows would otherwise have no home at all — a
              // small block below (outside the shared Campaigns/Shops groups, so no testid
              // collision with Unlock's card) keeps them selectable/clearable
              // (tacticus-planner-apps#103).
              const isCharacter = form.entityType === "Character"
              const sharedWithUnlock = form.enabledTypes.has("Unlock")
              const needsMythic =
                isCharacter &&
                (form.progressionPreview?.ascensionNeedsMythicShards ?? false)
              const ascensionOnlyMythicShardLocations =
                sharedWithUnlock && needsMythic ? form.mythicShardLocations : []
              const ascensionOnlyMythicShopOffers =
                sharedWithUnlock && needsMythic
                  ? (form.shopOffers ?? []).filter((offer) => offer.isMythic)
                  : []
              return (
                <GoalTypeCard key={kind} kind="Ascension" wide>
                  <AscensionFarmingFields
                    progressionEnd={form.progressionEnd}
                    progressionPreview={form.progressionPreview}
                    progressionStart={form.progressionStart}
                    onProgressionEndChange={form.setProgressionEnd}
                  />
                  <AscensionMilestoneFields
                    canAdd={canAddMilestone("Ascension", ladderEnds)}
                    invalidIndex={invalidMilestone("Ascension")}
                    milestones={milestones.ascension}
                    onAdd={() =>
                      milestoneFields.addAscension(ladderEnds.progression)
                    }
                    onChange={(index, value) =>
                      milestoneFields.update("ascension", index, value)
                    }
                    onRemove={(index) =>
                      milestoneFields.remove("ascension", index)
                    }
                    progressionStart={form.progressionStart}
                  />
                  <AcquisitionSourceField
                    battlesById={form.battlesById}
                    campaignEnabled={form.campaignEnabled}
                    campaignMythicShardsPerDay={
                      form.progressionPreview?.campaignMythicShardsPerDay ?? 0
                    }
                    campaignShardsPerDay={
                      form.progressionPreview?.campaignShardsPerDay ?? 0
                    }
                    mythicShardLocations={
                      needsMythic && !sharedWithUnlock
                        ? form.mythicShardLocations
                        : []
                    }
                    onCampaignEnabledChange={form.setCampaignEnabled}
                    onNavigateAway={form.onNavigateAway}
                    onOnslaughtEnabledChange={form.setOnslaughtEnabled}
                    onShopsEnabledChange={form.setShopsEnabled}
                    onToggleShardLocation={form.toggleShardLocation}
                    onToggleShopOffer={form.toggleShopOffer}
                    onslaughtCurrentIsMythic={
                      form.progressionPreview?.onslaughtCurrentIsMythic ?? false
                    }
                    onslaughtEnabled={form.onslaughtEnabled}
                    onslaughtProgressSaved={
                      form.progressionPreview?.onslaughtProgressSaved ?? false
                    }
                    onslaughtShardsPerDay={
                      form.progressionPreview?.onslaughtShardsPerDay ?? 0
                    }
                    regularShardLocations={
                      isCharacter &&
                      !sharedWithUnlock &&
                      form.progressionPreview?.ascensionNeedsRegularShards
                        ? form.regularShardLocations
                        : []
                    }
                    selectedShardLocationIds={form.shardLocationIds}
                    selectedShopOfferIds={form.selectedShopOfferIds}
                    shopOffers={sharedWithUnlock ? [] : form.shopOffers}
                    shopShardsPerDaySelected={
                      form.progressionPreview?.shopShardsPerDaySelected ?? 0
                    }
                    shopsEnabled={form.shopsEnabled}
                    showCampaigns={
                      isCharacter &&
                      !sharedWithUnlock &&
                      (form.regularShardLocations.length > 0 ||
                        form.mythicShardLocations.length > 0)
                    }
                    showOnslaught={isCharacter}
                  />
                  {ascensionOnlyMythicShardLocations.length > 0 ||
                  ascensionOnlyMythicShopOffers.length > 0 ? (
                    <div
                      className="grid gap-1.5 rounded-2xl border p-3"
                      data-testid="create-goal-ascension-only-mythic-sources"
                    >
                      <p className="text-xs text-muted-foreground">
                        {t(
                          "goals.create.acquisitionSources.ascensionOnlyMythicLabel"
                        )}
                      </p>
                      <GoalShardLocationsField
                        battlesById={form.battlesById}
                        onToggle={form.toggleShardLocation}
                        selectedIds={form.shardLocationIds}
                        shardLocations={ascensionOnlyMythicShardLocations}
                        shardType="Mythic"
                      />
                      {ascensionOnlyMythicShopOffers.length > 0 ? (
                        <div className="grid gap-1.5 sm:grid-cols-2">
                          {ascensionOnlyMythicShopOffers.map((offer) => (
                            <ShopOfferRow
                              checked={form.selectedShopOfferIds.includes(
                                offer.offerId
                              )}
                              key={offer.offerId}
                              offer={offer}
                              onToggle={form.toggleShopOffer}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </GoalTypeCard>
              )
            }
            case "Ability":
              return (
                <GoalTypeCard
                  entityType={form.entityType}
                  key={kind}
                  kind="Ability"
                >
                  <AbilityGoalFields
                    entityType={form.entityType}
                    activeStart={form.abilityActiveStart}
                    passiveStart={form.abilityPassiveStart}
                    activeTarget={form.abilityActiveTarget}
                    passiveTarget={form.abilityPassiveTarget}
                    onActiveTargetChange={form.setAbilityActiveTarget}
                    onPassiveTargetChange={form.setAbilityPassiveTarget}
                    missingUpgrades={form.missingUpgrades}
                    costingSupported={form.entityType === "Mow"}
                  />
                  <AbilityMilestoneFields
                    activeStart={form.abilityActiveStart}
                    canAdd={canAddMilestone("Ability", ladderEnds)}
                    entityType={form.entityType}
                    invalidIndex={invalidMilestone("Ability")}
                    milestones={milestones.ability}
                    onAdd={() => milestoneFields.addAbility(ladderEnds.ability)}
                    onChange={(index, value) =>
                      milestoneFields.update("ability", index, value)
                    }
                    onRemove={(index) =>
                      milestoneFields.remove("ability", index)
                    }
                    passiveStart={form.abilityPassiveStart}
                  />
                  <LevelRequirementNote
                    preview={form.levelRequirements.Ability}
                    xpBookRarity={form.xpBookRarity}
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
                  {mythicField(kind)}
                </GoalTypeCard>
              )
            case "Upgrade":
              return (
                <GoalTypeCard key={kind} kind="Upgrade" wide>
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
                    mowRanges={
                      form.mowTrackMaxLevels
                        ? {
                            primary: {
                              value: form.mowActiveRange,
                              maxLevel: form.mowTrackMaxLevels.primary,
                              onChange: form.setMowActiveRange,
                            },
                            secondary: {
                              value: form.mowPassiveRange,
                              maxLevel: form.mowTrackMaxLevels.secondary,
                              onChange: form.setMowPassiveRange,
                            },
                          }
                        : undefined
                    }
                  />
                  {mythicField(kind)}
                </GoalTypeCard>
              )
            case "Unlock":
              return (
                <GoalTypeCard key={kind} kind="Unlock" wide>
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
                      <AcquisitionSourceField
                        battlesById={form.battlesById}
                        campaignEnabled={form.campaignEnabled}
                        campaignShardsPerDay={
                          form.progressionPreview?.campaignShardsPerDay ?? 0
                        }
                        mythicShardLocations={[]}
                        onCampaignEnabledChange={form.setCampaignEnabled}
                        onOnslaughtEnabledChange={form.setOnslaughtEnabled}
                        onShopsEnabledChange={form.setShopsEnabled}
                        onToggleShardLocation={form.toggleShardLocation}
                        onToggleShopOffer={form.toggleShopOffer}
                        onslaughtEnabled={false}
                        onslaughtProgressSaved={false}
                        regularShardLocations={form.regularShardLocations}
                        selectedShardLocationIds={form.shardLocationIds}
                        selectedShopOfferIds={form.selectedShopOfferIds}
                        shopOffers={(form.shopOffers ?? []).filter(
                          (offer) => !offer.isMythic
                        )}
                        shopShardsPerDaySelected={
                          form.progressionPreview?.shopShardsPerDaySelected ?? 0
                        }
                        shopsEnabled={form.shopsEnabled}
                        showCampaigns={form.regularShardLocations.length > 0}
                        showOnslaught={false}
                      />
                    </>
                  )}
                </GoalTypeCard>
              )
          }
        })}
    </>
  )
}
