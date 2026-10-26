import { useRef } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Label } from "@workspace/ui/components/label"
import type { UnitId } from "@workspace/game-domain"
import { UnitCombobox } from "@/shared/ui"
import { goalKindsForEntity } from "@/features/goal-planning/@x/goal-create"
import type { GoalKind } from "@/entities/goal"
import type { useCreateGoalForm } from "../../model/goal-creation-form/use-create-goal-form"
import { GoalProjectsField } from "../projects/goal-projects-field"
import { GoalTypeToggleGroup } from "../shared/goal-visuals"
import { CreateGoalOptions } from "./create-goal-options"
import { GoalTypeCards } from "./create-goal-cards"
import { GoalCreationReview } from "./goal-creation-review"
import type { MobileCreateStep } from "./mobile-create-step"
import { UnitInfoCard, UnitStatusSummary } from "./unit-info-card"

type GoalForm = ReturnType<typeof useCreateGoalForm>

/**
 * The creation form body. At 768px and wider: the unit picker, then (at the dialog's `@2xl` width) a
 * main column — goal-type selector, prerequisite suggestions, projects, an empty state or the enabled
 * goal-type cards (an accordion: one expanded at a time) — beside a side column that stays in view with
 * the current status and the "What will be created" review; narrower, one column. Below 768px
 * (`mobileStep` set) it shows one step of the mobile flow at a time (goal-creation: mobile creation is
 * a three-step flow): Unit (picker and full status), Goals (one-line status, types, suggestions,
 * cards) or Review (projects, options, review). The same parts render in both layouts, and every value
 * lives in the form, so changing step resets nothing. A coordinator-level component, so it takes the
 * whole `form`.
 */
export function UnitGoalFormFields({
  form,
  portalContainer,
  unitIcon,
  mobileStep,
}: {
  form: GoalForm
  portalContainer: HTMLElement | null
  unitIcon: (id: UnitId) => string | undefined
  /** The mobile step to show; undefined at 768px and wider. */
  mobileStep?: MobileCreateStep
}) {
  const { t } = useTranslation()
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

  const unitPicker = (
    <UnitCombobox
      groups={form.unitGroups}
      value={form.entityId}
      onChange={form.handleEntityChange}
      placeholder={t("goals.create.unitPlaceholder")}
      emptyText={t("goals.create.unitEmpty")}
      icon={unitIcon}
      lockedIds={form.lockedUnitIds}
    />
  )

  const typeSelector = (
    <div className="grid gap-1" data-testid="create-goal-status-and-types">
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
            : t("goals.create.unlockUnavailable", { context: unitKind })}
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
  )

  // Prerequisite suggestions describe extra goals to prepend to the set below.
  const prerequisites = (
    <>
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
    </>
  )

  const projects = (
    <GoalProjectsField
      onSelectionChange={form.selectProjects}
      portalContainer={portalContainer}
      projects={form.projects}
      projectsValid={form.selectedProjectIds.length > 0}
      selectedProjectIds={form.selectedProjectIds}
      testIdPrefix="create-goal"
    />
  )

  const cards =
    form.enabledTypes.size === 0 ? (
      <p
        className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground"
        data-testid="create-goal-empty-state"
      >
        {t("goals.create.emptyTypes")}
      </p>
    ) : (
      <GoalTypeCards cardRefs={cardRefs} form={form} goalKinds={goalKinds} />
    )

  const error =
    form.status === "error" && form.errorMessage ? (
      <FieldError data-testid="create-goal-error">
        {form.errorMessage}
      </FieldError>
    ) : null

  if (mobileStep) {
    return (
      <form
        className="grid items-start gap-3 pb-3"
        data-step={mobileStep}
        data-testid={`create-goal-step-${mobileStep}`}
        id="create-goal-form"
        onSubmit={(event) => void form.handleSubmit(event)}
      >
        {mobileStep === "unit" ? (
          <>
            {unitPicker}
            {form.entityId ? <UnitInfoCard {...statusProps} /> : null}
          </>
        ) : mobileStep === "goals" ? (
          <>
            <UnitStatusSummary {...statusProps} />
            {typeSelector}
            {prerequisites}
            {cards}
          </>
        ) : (
          <>
            {projects}
            <CreateGoalOptions
              form={form}
              placement="body"
              portalContainer={portalContainer}
            />
            <GoalCreationReview form={form} />
          </>
        )}
        {error}
      </form>
    )
  }

  return (
    <form
      id="create-goal-form"
      className="grid items-start gap-3 pb-3"
      onSubmit={(event) => void form.handleSubmit(event)}
    >
      {unitPicker}

      {form.entityId ? (
        <div
          className="grid items-start gap-3 @2xl:grid-cols-[minmax(0,1fr)_22rem]"
          data-testid="create-goal-columns"
        >
          <div
            className="order-2 grid min-w-0 content-start gap-3 @2xl:col-start-1 @2xl:row-start-1"
            data-testid="create-goal-main-column"
          >
            {typeSelector}
            {prerequisites}
            {projects}
            {cards}
          </div>
          {/* The side column, after the main one in reading order: below @2xl its items join the single
              column (`contents`), the status first and the review last. */}
          <aside
            className="contents @2xl:sticky @2xl:top-0 @2xl:col-start-2 @2xl:row-start-1 @2xl:grid @2xl:gap-3"
            data-testid="create-goal-side-column"
          >
            <div className="order-1">
              <UnitInfoCard {...statusProps} />
            </div>
            <div className="order-3">
              <GoalCreationReview form={form} />
            </div>
          </aside>
        </div>
      ) : null}

      {error}
    </form>
  )
}
