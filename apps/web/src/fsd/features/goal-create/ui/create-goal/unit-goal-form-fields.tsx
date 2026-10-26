import { useRef, type RefObject } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Label } from "@workspace/ui/components/label"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import type { UnitId } from "@workspace/game-domain"
import { UnitCombobox } from "@/shared/ui"
import { goalKindsForEntity } from "@/features/goal-planning/@x/goal-create"
import type { useCreateGoalForm } from "../../model/goal-creation-form/use-create-goal-form"
import { buildCombinedGoalSpecs } from "../../model/goal-creation-form/goal-spec-builder"
import { GoalProjectsField } from "../projects/goal-projects-field"
import { GoalTypeToggleGroup, GoalTypeCard } from "../shared/goal-visuals"
import { GoalRangeSummary } from "../shared/goal-range-summary"
import { UnitInfoCard, UnitStatusSummary } from "./unit-info-card"
import type { GoalKind } from "@/entities/goal"
import {
  AcquisitionSourceField,
  ShopOfferRow,
} from "./acquisition-source-field"
import { CreateGoalOptions } from "./create-goal-options"
import { FarmingStrategyField } from "./farming-strategy-field"
import { AscensionFarmingFields } from "./goal-farming-fields"
import { GoalCreationReview } from "./goal-creation-review"
import { goalCardHeaderId } from "./goal-form-issue-ids"
import { GoalNoteDisclosure } from "./goal-note-disclosure"
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
 * The "Unit" pill's entire form body: the unit picker, then (at the dialog's `@2xl` width) a main column
 * — goal-type selector, prerequisite suggestions, projects, an empty state or the enabled goal-type
 * cards (an accordion: one expanded at a time) — beside a side column that stays in view with the
 * current status and the "What will be created" review. Narrower, it is one column: status first, then
 * the main column, then (below 768px) the footer's options and the review. A coordinator-level
 * component, so it takes the whole `form`.
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
  const isMobile = useIsMobile()
  const goalKinds = goalKindsForEntity(form.entityType)
  const cardRefs = useRef(new Map<GoalKind, HTMLDivElement>())
  const unitKind = form.entityType === "Mow" ? "mow" : undefined

  const toggleType = (kind: GoalKind, enabled: boolean) => {
    form.toggleType(kind, enabled)
    // Bring the new card's header into view without moving focus off the checkbox.
    if (enabled) {
      setTimeout(() => {
        cardRefs.current.get(kind)?.scrollIntoView?.({ block: "nearest" })
      }, 0)
    }
  }

  const statusProps = {
    entityType: form.entityType,
    isOwned: form.entityAlreadyOwned,
    loading: form.entityLoading,
    rank: form.entityType === "Character" ? form.rankStart : undefined,
    progression: form.progressionStart,
    abilityActiveLevel: form.abilityActiveStart,
    abilityPassiveLevel: form.abilityPassiveStart,
    level: form.entityType === "Character" ? form.currentLevel : undefined,
    shardCount: form.entityAlreadyOwned
      ? ((form.usesMythicShards ? form.ownedMythicShards : form.ownedShards) ??
        0)
      : (form.lockedShards ?? 0),
    shardIsMythic: form.entityAlreadyOwned && form.usesMythicShards,
  }

  return (
    <form
      id="create-goal-form"
      className="grid items-start gap-3 pb-3"
      onSubmit={(event) => void form.handleSubmit(event)}
    >
      <UnitCombobox
        groups={form.unitGroups}
        value={form.entityId}
        onChange={form.handleEntityChange}
        placeholder={t("goals.create.unitPlaceholder")}
        emptyText={t("goals.create.unitEmpty")}
        icon={unitIcon}
        lockedIds={form.lockedUnitIds}
      />

      {form.entityId ? (
        <div
          className="grid items-start gap-3 @2xl:grid-cols-[minmax(0,1fr)_22rem]"
          data-testid="create-goal-columns"
        >
          <div
            className="order-2 grid min-w-0 content-start gap-3 @2xl:col-start-1 @2xl:row-start-1"
            data-testid="create-goal-main-column"
          >
            <div
              className="grid gap-1"
              data-testid="create-goal-status-and-types"
            >
              <Label className="text-xs text-muted-foreground">
                {t("goals.create.goalTypeLabel")}
              </Label>
              <GoalTypeToggleGroup
                kinds={goalKinds}
                enabledTypes={form.enabledTypes}
                onToggle={toggleType}
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
              {form.existingUnlockGoalId ? (
                <p
                  className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground"
                  data-testid="create-goal-unlock-existing"
                >
                  {t("goals.create.unlockExistingGoal")}
                  <Link
                    className="font-medium text-primary underline"
                    onClick={form.onNavigateAway}
                    to={`/plan/goals?goal=${form.existingUnlockGoalId}`}
                  >
                    {t("goals.create.openGoal")}
                  </Link>
                </p>
              ) : !form.unlockAvailable ? (
                <p className="text-xs text-muted-foreground">
                  {form.entityAlreadyOwned
                    ? t("goals.create.validation.alreadyUnlocked", {
                        context: unitKind,
                      })
                    : t("goals.create.unlockUnavailable", {
                        context: unitKind,
                      })}
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

            {/* Prerequisite suggestions describe extra goals to prepend to the set below. */}
            {form.prerequisites.needsUnlock ? (
              <Field className="min-h-11 md:min-h-0" orientation="horizontal">
                <Checkbox
                  checked={form.includeSuggestedUnlock}
                  data-testid="create-goal-include-unlock"
                  id="create-goal-include-unlock"
                  onCheckedChange={(checked) =>
                    form.setIncludeSuggestedUnlock(checked === true)
                  }
                />
                <FieldLabel
                  className="font-normal"
                  htmlFor="create-goal-include-unlock"
                >
                  {t("goals.create.suggestions.includeUnlock")}
                </FieldLabel>
              </Field>
            ) : null}

            {form.prerequisites.needsAscension ? (
              <Field className="min-h-11 md:min-h-0" orientation="horizontal">
                <Checkbox
                  checked={form.includeSuggestedAscension}
                  data-testid="create-goal-include-ascension"
                  id="create-goal-include-ascension"
                  onCheckedChange={(checked) =>
                    form.setIncludeSuggestedAscension(checked === true)
                  }
                />
                <FieldLabel
                  className="font-normal"
                  htmlFor="create-goal-include-ascension"
                >
                  {t("goals.create.suggestions.includeAscension")}
                </FieldLabel>
              </Field>
            ) : null}

            <GoalProjectsField
              onSelectionChange={form.selectProjects}
              portalContainer={portalContainer}
              projects={form.projects}
              projectsValid={form.selectedProjectIds.length > 0}
              selectedProjectIds={form.selectedProjectIds}
              testIdPrefix="create-goal"
            />

            {form.enabledTypes.size === 0 ? (
              <p
                className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground"
                data-testid="create-goal-empty-state"
              >
                {t("goals.create.emptyTypes")}
              </p>
            ) : (
              <GoalTypeCards
                cardRefs={cardRefs}
                form={form}
                goalKinds={goalKinds}
              />
            )}
          </div>
          {/* The side column, after the main one in reading order: below @2xl its items join the single
              column (`contents`), the status first and the review last. */}
          <aside
            className="contents @2xl:sticky @2xl:top-0 @2xl:col-start-2 @2xl:row-start-1 @2xl:grid @2xl:gap-3"
            data-testid="create-goal-side-column"
          >
            <div className="order-1">
              {isMobile ? (
                <UnitStatusSummary {...statusProps} />
              ) : (
                <UnitInfoCard {...statusProps} />
              )}
            </div>
            {isMobile ? (
              <div className="order-3">
                <CreateGoalOptions
                  form={form}
                  placement="body"
                  portalContainer={portalContainer}
                />
              </div>
            ) : null}
            <div className="order-3">
              <GoalCreationReview form={form} />
            </div>
          </aside>
        </div>
      ) : null}

      {form.status === "error" && form.errorMessage ? (
        <FieldError data-testid="create-goal-error">
          {form.errorMessage}
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
  cardRefs,
}: {
  form: GoalForm
  goalKinds: GoalKind[]
  cardRefs: RefObject<Map<GoalKind, HTMLDivElement>>
}) {
  const { t } = useTranslation()
  const { issues } = form
  // Each card's own goal (the first spec of its type; later ones are its milestones), for the summary.
  const specs = buildCombinedGoalSpecs(form.combinedSpecParams)
  // The accordion and summary line every card shares (goal-creation: cards collapse to one line).
  const cardProps = (kind: GoalKind) => {
    const spec = specs.find((candidate) => candidate.goalType === kind)
    return {
      kind,
      entityType: form.entityType,
      expanded: form.expandedKind === kind,
      onExpandedChange: (expanded: boolean) =>
        form.setExpandedKind(expanded ? kind : null),
      summary: spec ? (
        <GoalRangeSummary entityType={form.entityType} spec={spec} />
      ) : undefined,
      issueCount: issues.filter((issue) => issue.kind === kind).length,
      headerId: goalCardHeaderId(kind),
      ref: (node: HTMLDivElement | null) => {
        if (node) cardRefs.current.set(kind, node)
        else cardRefs.current.delete(kind)
      },
    }
  }
  const note = (kind: GoalKind) => (
    <GoalNoteDisclosure
      kind={kind}
      note={form.notes[kind] ?? ""}
      onChange={(value) => form.setNote(kind, value)}
    />
  )
  const previewLoading = form.entityLoading || form.upgradesById.size === 0
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
                <GoalTypeCard key={kind} {...cardProps(kind)}>
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
                      issues={issues}
                      previewLoading={previewLoading}
                      taken={form.takenTargetsFor("Rank")}
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
                  {note(kind)}
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
                <GoalTypeCard key={kind} {...cardProps(kind)}>
                  <AscensionFarmingFields
                    issues={issues}
                    progressionEndOptions={form.progressionEndOptions}
                    taken={form.takenTargetsFor("Ascension")}
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
                  {note(kind)}
                </GoalTypeCard>
              )
            }
            case "Ability":
              return (
                <GoalTypeCard key={kind} {...cardProps(kind)}>
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
                    issues={issues}
                    previewLoading={previewLoading}
                    taken={form.takenTargetsFor("Ability")}
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
                  {note(kind)}
                </GoalTypeCard>
              )
            case "Upgrade":
              return (
                <GoalTypeCard key={kind} {...cardProps(kind)}>
                  <UpgradeGoalFields
                    issues={issues}
                    ownedQuantities={
                      form.inventoryLoaded
                        ? form.ownedUpgradeQuantities
                        : undefined
                    }
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
                  {note(kind)}
                </GoalTypeCard>
              )
            case "Unlock":
              return (
                <GoalTypeCard key={kind} {...cardProps(kind)}>
                  <p className="text-sm text-muted-foreground">
                    {t("goals.create.unlockDescription", {
                      context: form.entityType === "Mow" ? "mow" : undefined,
                    })}
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
                  {note(kind)}
                </GoalTypeCard>
              )
          }
        })}
    </>
  )
}
