import type { ReactNode, RefObject } from "react"
import { useTranslation } from "react-i18next"
import { abilityCapForProgression } from "@workspace/game-domain"

import type { GoalKind } from "@/entities/goal"
import { RankSelect } from "@/shared/ui"

import type { useCreateGoalForm } from "../../model/goal-creation-form/use-create-goal-form"
import { buildCombinedGoalSpecs } from "../../model/goal-creation-form/goal-spec-builder"
import { canAddMilestone } from "../../model/goal-creation-form/goal-milestones"
import { AbilityGoalCard } from "../goal-card/ability-goal-card"
import { AscensionGoalCard } from "../goal-card/ascension-goal-card"
import type { ResourcePreview } from "../goal-card/card-parts"
import { RankGoalCard } from "../goal-card/rank-goal-card"
import { UnlockGoalCard } from "../goal-card/unlock-goal-card"
import { UpgradeGoalCard } from "../goal-card/upgrade-goal-card"
import { GoalRangeSummary } from "../shared/goal-range-summary"
import { GoalTypeCard } from "../shared/goal-visuals"
import { OptionalRangeField } from "../shared/optional-range-field"
import {
  AcquisitionSourceField,
  ShopOfferRow,
} from "./acquisition-source-field"
import { FarmingStrategyField } from "./farming-strategy-field"
import { goalCardHeaderId } from "./goal-form-issue-ids"
import {
  AbilityMilestoneFields,
  AscensionMilestoneFields,
  RankMilestoneFields,
} from "./goal-milestone-fields"
import { GoalNoteDisclosure } from "./goal-note-disclosure"
import { GoalShardLocationsField } from "./goal-shard-locations-field"
import { LevelRequirementNote } from "./level-requirement-note"
import { MythicMaterialSourceField } from "./mythic-material-source-field"
import { UnlockRequirementField } from "./unlock-requirement-field"

type GoalForm = ReturnType<typeof useCreateGoalForm>

const levelOptions = (maxLevel: number) =>
  Array.from({ length: maxLevel }, (_, index) => ({
    value: index + 1,
    label: index + 1,
  }))

/**
 * Every enabled goal type's card, in the toggle group's order (`goalKinds`), each the shared per-kind
 * card (`ui/goal-card`) in creation mode inside the accordion `GoalTypeCard`. This adapts the creation
 * form to the cards' props; the Edit goal dialog adapts its draft to the same cards.
 */
export function GoalTypeCards({
  form,
  goalKinds,
  cardRefs,
}: {
  form: GoalForm
  goalKinds: GoalKind[]
  cardRefs: RefObject<Map<GoalKind, HTMLDivElement>>
}) {
  const { issues } = form
  // Each card's own goal (the first spec of its type; later ones are its milestones), for the summary.
  const specs = buildCombinedGoalSpecs(form.combinedSpecParams)
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
  const cards: Record<GoalKind, () => ReactNode> = {
    Rank: () => <CreateRankCard form={form} mythicHost={mythicHost} />,
    Ascension: () => <CreateAscensionCard form={form} />,
    Ability: () => <CreateAbilityCard form={form} mythicHost={mythicHost} />,
    Upgrade: () => <CreateUpgradeCard form={form} mythicHost={mythicHost} />,
    Unlock: () => <CreateUnlockCard form={form} />,
  }
  // One Mythic-material selection serves every enabled Rank/Upgrade/MoW-Ability goal of this unit
  // (add-mythic-material-shop-sources); render it once, in the first such card.
  const mythicHost = goalKinds.find(
    (kind) =>
      form.enabledTypes.has(kind) &&
      (kind === "Rank" ||
        kind === "Upgrade" ||
        (kind === "Ability" && form.entityType === "Mow"))
  )

  return (
    <>
      {goalKinds
        .filter((kind) => form.enabledTypes.has(kind))
        .map((kind) => (
          <GoalTypeCard key={kind} {...cardProps(kind)}>
            {cards[kind]()}
          </GoalTypeCard>
        ))}
    </>
  )
}

type CardArgs = { form: GoalForm; mythicHost?: GoalKind }

const note = (form: GoalForm, kind: GoalKind) => (
  <GoalNoteDisclosure
    kind={kind}
    note={form.notes[kind] ?? ""}
    onChange={(value) => form.setNote(kind, value)}
  />
)

const mythic = ({ form, mythicHost }: CardArgs, kind: GoalKind) =>
  kind === mythicHost ? (
    <MythicMaterialSourceField selection={form.mythicMaterialSelection} />
  ) : null

const previewLoading = (form: GoalForm) =>
  form.entityLoading || form.upgradesById.size === 0

const resourcePreview = (
  form: GoalForm,
  missingUpgrades: ResourcePreview["missingUpgrades"]
): ResourcePreview => ({
  state: previewLoading(form)
    ? "loading"
    : missingUpgrades.length > 0
      ? "content"
      : "empty",
  missingUpgrades,
})

// Each ladder's last target: the newest added milestone, else the card's own target.
function ladderEnds(form: GoalForm) {
  const { milestones } = form.milestoneFields
  return {
    rank: milestones.rank.at(-1) ?? form.rankEnd,
    progression: milestones.ascension.at(-1) ?? form.progressionEnd,
    ability: milestones.ability.at(-1) ?? {
      activeEnd: form.abilityActiveEnd,
      passiveEnd: form.abilityPassiveEnd,
    },
  }
}

const invalidMilestone = (form: GoalForm, kind: GoalKind) =>
  form.milestoneIssue?.kind === kind ? form.milestoneIssue.index : null

function CreateRankCard(args: CardArgs) {
  const { form } = args
  const { milestoneFields } = form
  const ends = ladderEnds(form)
  return (
    <RankGoalCard
      additionalTargetChoices={form.additionalTargetChoices}
      appliedUpgrades={{
        applied: form.rankAppliedUpgrades,
        total: form.rankUpgradeSlotsTotal,
      }}
      extra={
        <LevelRequirementNote
          preview={form.levelRequirements.Rank}
          xpBookRarity={form.xpBookRarity}
        />
      }
      farmingStrategy={form.farmingStrategy}
      issues={form.issues}
      milestones={
        <RankMilestoneFields
          canAdd={canAddMilestone("Rank", ends)}
          invalidIndex={invalidMilestone(form, "Rank")}
          milestones={milestoneFields.milestones.rank}
          onAdd={() => milestoneFields.addRank(ends.rank)}
          onChange={(index, value) =>
            milestoneFields.update("rank", index, value)
          }
          onRemove={(index) => milestoneFields.remove("rank", index)}
          rankStart={form.rankStart}
        />
      }
      mode="create"
      mythic={mythic(args, "Rank")}
      note={note(form, "Rank")}
      onChange={(value) => {
        if (value.end !== form.rankEnd) form.setRankEnd(value.end)
        else form.setRankAdditionalTarget(value.additional)
      }}
      onFarmingStrategyChange={form.setFarmingStrategy}
      preview={resourcePreview(form, form.missingUpgrades)}
      start={form.rankStart}
      takenKeys={form.takenTargetsFor("Rank")}
      value={{ end: form.rankEnd, additional: form.rankAdditionalTarget }}
    />
  )
}

function CreateAscensionCard({ form }: CardArgs) {
  const { t } = useTranslation()
  const { milestoneFields } = form
  const ends = ladderEnds(form)
  // Each shard-type sub-list, and the Shops group's offers, are shown only when Ascension's own range
  // needs that type (use-progression-preview.ts's ascensionNeeds{Regular,Mythic}Shards). Campaigns and
  // Shops are suppressed here when Unlock is also enabled: they are the same shared selection, and
  // Unlock's card already shows them. Unlock never shows mythic sources, so when the range needs them
  // and Unlock is enabled, a block outside the shared groups keeps those rows selectable
  // (tacticus-planner-apps#103).
  const isCharacter = form.entityType === "Character"
  const sharedWithUnlock = form.enabledTypes.has("Unlock")
  const needsMythic =
    isCharacter &&
    (form.progressionPreview?.ascensionNeedsMythicShards ?? false)
  const onlyMythicLocations =
    sharedWithUnlock && needsMythic ? form.mythicShardLocations : []
  const onlyMythicOffers =
    sharedWithUnlock && needsMythic
      ? (form.shopOffers ?? []).filter((offer) => offer.isMythic)
      : []

  return (
    <AscensionGoalCard
      issues={form.issues}
      milestones={
        <AscensionMilestoneFields
          canAdd={canAddMilestone("Ascension", ends)}
          invalidIndex={invalidMilestone(form, "Ascension")}
          milestones={milestoneFields.milestones.ascension}
          onAdd={() => milestoneFields.addAscension(ends.progression)}
          onChange={(index, value) =>
            milestoneFields.update("ascension", index, value)
          }
          onRemove={(index) => milestoneFields.remove("ascension", index)}
          progressionStart={form.progressionStart}
        />
      }
      mode="create"
      note={note(form, "Ascension")}
      onChange={form.setProgressionEnd}
      preview={form.progressionPreview}
      sources={
        <>
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
              needsMythic && !sharedWithUnlock ? form.mythicShardLocations : []
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
          {onlyMythicLocations.length > 0 || onlyMythicOffers.length > 0 ? (
            <div
              className="grid gap-1.5 rounded-2xl border p-3"
              data-testid="create-goal-ascension-only-mythic-sources"
            >
              <p className="text-xs text-muted-foreground">
                {t("goals.create.acquisitionSources.ascensionOnlyMythicLabel")}
              </p>
              <GoalShardLocationsField
                battlesById={form.battlesById}
                onToggle={form.toggleShardLocation}
                selectedIds={form.shardLocationIds}
                shardLocations={onlyMythicLocations}
                shardType="Mythic"
              />
              {onlyMythicOffers.length > 0 ? (
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {onlyMythicOffers.map((offer) => (
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
        </>
      }
      start={form.progressionStart}
      takenKeys={form.takenTargetsFor("Ascension")}
      value={form.progressionEnd}
    />
  )
}

function CreateAbilityCard(args: CardArgs) {
  const { form } = args
  const { milestoneFields } = form
  const ends = ladderEnds(form)
  const isMow = form.entityType === "Mow"
  return (
    <AbilityGoalCard
      entityType={form.entityType}
      extra={
        <LevelRequirementNote
          preview={form.levelRequirements.Ability}
          xpBookRarity={form.xpBookRarity}
        />
      }
      issues={form.issues}
      milestones={
        <AbilityMilestoneFields
          activeStart={form.abilityActiveStart}
          canAdd={canAddMilestone("Ability", ends)}
          entityType={form.entityType}
          invalidIndex={invalidMilestone(form, "Ability")}
          milestones={milestoneFields.milestones.ability}
          onAdd={() => milestoneFields.addAbility(ends.ability)}
          onChange={(index, value) =>
            milestoneFields.update("ability", index, value)
          }
          onRemove={(index) => milestoneFields.remove("ability", index)}
          passiveStart={form.abilityPassiveStart}
        />
      }
      mode="create"
      mythic={mythic(args, "Ability")}
      note={note(form, "Ability")}
      onChange={(value) => {
        if (value.active !== form.abilityActiveTarget)
          form.setAbilityActiveTarget(value.active)
        if (value.passive !== form.abilityPassiveTarget)
          form.setAbilityPassiveTarget(value.passive)
      }}
      preview={isMow ? resourcePreview(form, form.missingUpgrades) : undefined}
      rarityCap={abilityCapForProgression(form.progressionStart)}
      sources={
        isMow ? (
          <FarmingStrategyField
            abilityActiveEnd={form.abilityActiveEnd}
            abilityActiveStart={form.abilityActiveStart}
            abilityPassiveEnd={form.abilityPassiveEnd}
            abilityPassiveStart={form.abilityPassiveStart}
            context="ability"
            farmingStrategy={form.farmingStrategy}
            onFarmingStrategyChange={form.setFarmingStrategy}
            rankEnd={form.rankEnd}
            rankStart={form.rankStart}
          />
        ) : null
      }
      start={{
        active: form.abilityActiveStart,
        passive: form.abilityPassiveStart,
      }}
      value={{
        active: form.abilityActiveTarget,
        passive: form.abilityPassiveTarget,
      }}
    />
  )
}

function CreateUpgradeCard(args: CardArgs) {
  const { form } = args
  const { t } = useTranslation()
  return (
    <UpgradeGoalCard
      choices={form.relevantUpgradeQuantities}
      issues={form.issues}
      mode="create"
      mythic={mythic(args, "Upgrade")}
      note={note(form, "Upgrade")}
      onAdd={form.addUpgradeTarget}
      onQuantityChange={form.setUpgradeTargetQuantity}
      onRemove={form.removeUpgradeTarget}
      ownedQuantities={
        form.inventoryLoaded ? form.ownedUpgradeQuantities : undefined
      }
      preview={{
        state: form.upgradeGoalNeed.length > 0 ? "content" : "empty",
        missingUpgrades: form.upgradeGoalNeed,
      }}
      ranges={
        form.entityType === "Character" ? (
          <div className="grid grid-cols-2 gap-3">
            <RankSelect
              label={t("goals.create.rank.start")}
              onChange={form.setUpgradeRankStart}
              options={form.upgradeRankStartOptions}
              value={form.upgradeRankStart}
            />
            <RankSelect
              label={t("goals.create.rank.end")}
              onChange={form.setUpgradeRankEnd}
              options={form.upgradeRankEndOptions}
              value={form.upgradeRankEnd}
            />
          </div>
        ) : form.mowTrackMaxLevels ? (
          <>
            <OptionalRangeField
              label={t("goals.create.upgrade.range.primary")}
              onChange={form.setMowActiveRange}
              options={levelOptions(form.mowTrackMaxLevels.primary)}
              testId="create-goal-upgrade-range-primary"
              value={form.mowActiveRange}
            />
            <OptionalRangeField
              label={t("goals.create.upgrade.range.secondary")}
              onChange={form.setMowPassiveRange}
              options={levelOptions(form.mowTrackMaxLevels.secondary)}
              testId="create-goal-upgrade-range-secondary"
              value={form.mowPassiveRange}
            />
          </>
        ) : null
      }
      targets={form.upgradeTargets}
      upgradesById={form.upgradesById}
    />
  )
}

function CreateUnlockCard({ form }: CardArgs) {
  return (
    <UnlockGoalCard
      entityType={form.entityType}
      note={note(form, "Unlock")}
      requirement={
        form.unlockRequirement ? (
          <UnlockRequirementField
            energyEstimate={form.unlockRequirement.energyEstimate}
            ownedShards={form.unlockRequirement.ownedShards}
            rarity={form.unlockRequirement.rarity}
            totalShards={form.unlockRequirement.totalShards}
          />
        ) : null
      }
      sources={
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
      }
    />
  )
}
