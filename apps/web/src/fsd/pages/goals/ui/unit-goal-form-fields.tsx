import { useTranslation } from "react-i18next"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Label } from "@workspace/ui/components/label"

import type { UnitId } from "@workspace/game-domain"

import type { GoalKind } from "@/entities/goal"
import { UnitCombobox } from "@/shared/ui"
import type { useCreateGoalForm } from "../model/use-create-goal-form"
import { FarmingStrategyField } from "./farming-strategy-field"
import {
  AbilityTrackFields,
  AscensionFarmingFields,
  ProgressionPreview,
} from "./goal-farming-fields"
import { RankGoalFields } from "./goal-type-fields"
import { GoalTypeCard, GoalTypeToggleGroup } from "./goal-visuals"
import { UpgradeGoalFields } from "./upgrade-goal-fields"

// Rank is omitted entirely on the MoW tab (plan §16 phase 6) — MoWs have no rank ladder, so offering
// the toggle would let a user attempt a goal type `useGoalPrerequisites`/`buildCombinedGoalSpecs`
// never handle for that entity. Unlock, by contrast, applies to both — a MoW's resource cost just
// isn't estimated yet (see `unlockResourceNeed`'s `isMow` short-circuit).
const CHARACTER_GOAL_KINDS: GoalKind[] = [
  "Rank",
  "Ascension",
  "Ability",
  "Unlock",
  "Upgrade",
]
const MOW_GOAL_KINDS: GoalKind[] = ["Ascension", "Ability", "Unlock", "Upgrade"]

type GoalForm = ReturnType<typeof useCreateGoalForm>

/**
 * The "Unit" pill's entire form body — unit picker, goal-type toggles, prerequisite suggestions,
 * every enabled goal-type's `GoalTypeCard`, the combined-goal review list, and project selection.
 * Split out of `create-goal-sheet.tsx` purely for that file's own max-lines budget (same reason
 * `EquipmentGoalFields`/`UpgradeGoalFields`/`GoalProjectsField` live in their own files) — this is
 * a coordinator-level component (it assembles many goal-type cards from the one central form, same
 * as `create-goal-sheet.tsx` itself), not a leaf presentational field, so taking the whole `form`
 * is the same posture as the sheet already had; the leaf field components it renders
 * (`RankGoalFields`, `AscensionFarmingFields`, `AbilityTrackFields`, `FarmingStrategyField`,
 * `UpgradeGoalFields`, `ProgressionPreview`) each still get only their own explicit props.
 */
export function UnitGoalFormFields({
  form,
  unitIcon,
}: {
  form: GoalForm
  unitIcon: (id: UnitId) => string | undefined
}) {
  const { t } = useTranslation()

  return (
    <form
      id="create-goal-form"
      className="flex flex-1 flex-col gap-4 overflow-y-auto px-6"
      onSubmit={(event) => void form.handleSubmit(event)}
    >
      <div className="mt-2 grid gap-2">
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
        <div className="grid gap-1.5">
          <Label className="text-xs text-muted-foreground">
            {t("goals.create.goalTypeLabel")}
          </Label>
          <GoalTypeToggleGroup
            kinds={
              form.entityType === "Mow" ? MOW_GOAL_KINDS : CHARACTER_GOAL_KINDS
            }
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
      ) : null}

      {form.prerequisites.needsUnlock ? (
        <Field orientation="horizontal">
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
        <Field orientation="horizontal">
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

      {form.entityId && form.enabledTypes.has("Rank") ? (
        <GoalTypeCard kind="Rank">
          <RankGoalFields
            rankStart={form.rankStart}
            rankEnd={form.rankEnd}
            rankEndOptions={form.rankEndOptions}
            rankStartOptions={form.rankStartOptions}
            rankStartPointFive={form.rankStartPointFive}
            rankEndPointFive={form.rankEndPointFive}
            onRankStartChange={form.setRankStart}
            onRankEndChange={form.setRankEnd}
            onRankStartPointFiveChange={form.setRankStartPointFive}
            onRankEndPointFiveChange={form.setRankEndPointFive}
            missingUpgrades={form.missingUpgrades}
            estimate={form.estimatePreview}
            dailyEnergy={form.planningSettings.dailyEnergy}
          />
          <FarmingStrategyField
            context="rank"
            rankStart={form.rankStart}
            rankEnd={form.rankEnd}
            abilityActiveStart={form.abilityActiveStart}
            abilityActiveEnd={form.abilityActiveEnd}
            abilityPassiveStart={form.abilityPassiveStart}
            abilityPassiveEnd={form.abilityPassiveEnd}
            farmingStrategy={form.farmingStrategy}
            onFarmingStrategyChange={form.setFarmingStrategy}
          />
        </GoalTypeCard>
      ) : null}

      {form.entityId && form.enabledTypes.has("Ascension") ? (
        <GoalTypeCard kind="Ascension">
          <AscensionFarmingFields
            progressionStart={form.progressionStart}
            progressionEnd={form.progressionEnd}
            progressionStartOptions={form.progressionStartOptions}
            onProgressionStartChange={form.setProgressionStart}
            onProgressionEndChange={form.setProgressionEnd}
            ascensionFarmingSource={form.ascensionFarmingSource}
            onAscensionFarmingSourceChange={form.setAscensionFarmingSource}
            progressionPreview={form.progressionPreview}
          />
        </GoalTypeCard>
      ) : null}

      {form.entityId && form.enabledTypes.has("Ability") ? (
        <GoalTypeCard entityType={form.entityType} kind="Ability">
          <AbilityTrackFields
            entityType={form.entityType}
            abilityTrack={form.abilityTrack}
            onAbilityTrackChange={form.setAbilityTrack}
            abilityActiveStart={form.abilityActiveStart}
            abilityActiveEnd={form.abilityActiveEnd}
            abilityPassiveStart={form.abilityPassiveStart}
            abilityPassiveEnd={form.abilityPassiveEnd}
            onAbilityActiveStartChange={form.setAbilityActiveStart}
            onAbilityActiveEndChange={form.setAbilityActiveEnd}
            onAbilityPassiveStartChange={form.setAbilityPassiveStart}
            onAbilityPassiveEndChange={form.setAbilityPassiveEnd}
            missingUpgrades={form.missingUpgrades}
            estimate={form.estimatePreview}
            dailyEnergy={form.planningSettings.dailyEnergy}
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
      ) : null}

      {form.entityId && form.enabledTypes.has("Upgrade") ? (
        <GoalTypeCard kind="Upgrade">
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
      ) : null}

      {form.entityId && form.enabledTypes.has("Unlock") ? (
        <GoalTypeCard kind="Unlock">
          <p className="text-sm text-muted-foreground">
            {t("goals.create.unlockDescription")}
          </p>
          {form.entityType === "Mow" ? (
            <p className="text-xs text-muted-foreground">
              {t("goals.create.unlockCostUnsupportedMow")}
            </p>
          ) : !form.enabledTypes.has("Ascension") ? (
            <ProgressionPreview preview={form.progressionPreview} />
          ) : null}
        </GoalTypeCard>
      ) : null}

      {form.entityId && form.reviewItems.length > 0 ? (
        <div
          className="grid gap-1 rounded-2xl border p-3 text-sm"
          data-testid="create-goal-review"
        >
          <p className="font-medium">{t("goals.create.reviewTitle")}</p>
          <ul className="grid gap-0.5 text-muted-foreground">
            {form.reviewItems.map((item) => (
              <li key={item.goalType}>
                {t(`goals.create.goalTypes.${item.goalType}`)}
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
          </ul>
        </div>
      ) : null}

      {form.entityId ? (
        <div className="grid gap-1.5">
          <Label className="text-xs text-muted-foreground">
            {t("goals.create.projectLabel")}
          </Label>
          {form.projects.length > 0 ? (
            <div className="grid gap-2">
              {form.projects.map((project) => (
                <Field key={project.projectId} orientation="horizontal">
                  <Checkbox
                    checked={form.selectedProjectIds.includes(
                      project.projectId
                    )}
                    data-testid={`create-goal-project-${project.projectId}`}
                    onCheckedChange={(checked) =>
                      form.toggleProject(project.projectId, checked === true)
                    }
                  />
                  <FieldLabel className="font-normal">
                    {project.name}
                    {project.isActivePlan
                      ? ` (${t("goals.create.projectActive")})`
                      : ""}
                  </FieldLabel>
                </Field>
              ))}
            </div>
          ) : null}
          {form.selectedProjectIds.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {t("goals.create.projectDefault")}
            </p>
          ) : null}
        </div>
      ) : null}

      {form.status === "error" && form.errorMessage ? (
        <FieldError data-testid="create-goal-error">
          {form.errorMessage}
        </FieldError>
      ) : null}
      {form.validationMessage ? (
        <FieldError data-testid="create-goal-validation-error">
          {form.validationMessage}
        </FieldError>
      ) : null}
    </form>
  )
}
