import { useTranslation } from "react-i18next"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

import type { UnitId } from "@workspace/game-domain"

import type { GoalKind } from "@/entities/goal"
import { UnitCombobox } from "@/shared/ui"
import { projectMarkerSuffix } from "../model/project-marker"
import type { useCreateGoalForm } from "../model/use-create-goal-form"
import { GoalTypeCards } from "./goal-type-cards"
import { GoalTypeToggleGroup } from "./goal-visuals"
import { UnitInfoCard } from "./unit-info-card"

// Rank is omitted entirely on the MoW tab (plan §16 phase 6) — MoWs have no rank ladder, so offering
// the toggle would let a user attempt a goal type `useGoalPrerequisites`/`buildCombinedGoalSpecs`
// never handle for that entity. Unlock, by contrast, applies to both — a MoW's resource cost just
// isn't estimated yet (see `unlockResourceNeed`'s `isMow` short-circuit).
const CHARACTER_GOAL_KINDS: GoalKind[] = [
  "Unlock",
  "Ascension",
  "Ability",
  "Upgrade",
  "Rank",
  "Level",
]
const MOW_GOAL_KINDS: GoalKind[] = ["Unlock", "Ascension", "Ability", "Upgrade"]

type GoalForm = ReturnType<typeof useCreateGoalForm>

/**
 * The "Unit" pill's entire form body, in display order: unit picker, goal-type toggles, every
 * enabled goal-type's `GoalTypeCard` (assembled by `GoalTypeCards`), prerequisite suggestions,
 * project selection + per-project priority, then the combined-goal review list ("What will be
 * created", with each selected project's own duration estimate) last. Split out of
 * `create-goal-sheet.tsx` purely for that file's own max-lines budget (same reason
 * `EquipmentGoalFields`/`UpgradeGoalFields`/`GoalProjectsField`/`GoalTypeCards` live in their own
 * files) — this is a coordinator-level component, not a leaf presentational field, so taking the
 * whole `form` is the same posture as the sheet already had.
 */
export function UnitGoalFormFields({
  form,
  unitIcon,
}: {
  form: GoalForm
  unitIcon: (id: UnitId) => string | undefined
}) {
  const { t } = useTranslation()
  const goalKinds =
    form.entityType === "Mow" ? MOW_GOAL_KINDS : CHARACTER_GOAL_KINDS

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
        <UnitInfoCard
          entityType={form.entityType}
          isOwned={form.entityAlreadyOwned}
          loading={form.entityLoading}
          rank={form.entityType === "Character" ? form.rankStart : undefined}
          progression={form.progressionStart}
          abilityActiveLevel={form.abilityActiveStart}
          abilityPassiveLevel={form.abilityPassiveStart}
          level={form.entityType === "Character" ? form.levelStart : undefined}
          shardCount={
            form.entityAlreadyOwned
              ? ((form.usesMythicShards
                  ? form.ownedMythicShards
                  : form.ownedShards) ?? 0)
              : (form.lockedShards ?? 0)
          }
          shardIsMythic={form.entityAlreadyOwned && form.usesMythicShards}
        />
      ) : null}

      {form.entityId ? (
        <div className="grid gap-1.5">
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
              (kind === "Level" && form.atMaxLevel) ||
              (kind === "Upgrade" &&
                form.entityType === "Character" &&
                form.atMaxRank) ||
              form.hasActiveOrPausedGoal(kind)
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
          {form.atMaxLevel ? (
            <p className="text-xs text-muted-foreground">
              {t("goals.create.validation.levelMaxed")}
            </p>
          ) : null}
          {/* One line per kind that already has an in-flight (Active/Paused) goal for this unit — a
              unit may still accumulate any number of Completed/Archived goals of the same type, so
              only these count (mirrors the backend's create/resume conflict check). */}
          {goalKinds
            .filter((kind) => form.hasActiveOrPausedGoal(kind))
            .map((kind) => (
              <p className="text-xs text-muted-foreground" key={kind}>
                {t("goals.create.validation.activeOrPausedGoalExists", {
                  goalType: t(`goals.create.goalTypes.${kind}`),
                })}
              </p>
            ))}
        </div>
      ) : null}

      {form.entityId ? (
        <GoalTypeCards form={form} goalKinds={goalKinds} />
      ) : null}

      {/* Prerequisite suggestions describe extra goals to prepend to the set above — shown after
          the config cards so the user sees what they configured before what gets auto-added. */}
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

      {form.prerequisites.needsLevel ? (
        <Field orientation="horizontal">
          <Checkbox
            checked={form.includeSuggestedLevel}
            data-testid="create-goal-include-level"
            onCheckedChange={(checked) =>
              form.setIncludeSuggestedLevel(checked === true)
            }
          />
          <FieldLabel className="font-normal">
            {t("goals.create.suggestions.includeLevel", {
              level: form.prerequisites.needsLevel.end,
            })}
          </FieldLabel>
        </Field>
      ) : null}

      {form.entityId ? (
        <div className="grid gap-1.5">
          <Label className="text-xs text-muted-foreground">
            {t("goals.create.projectLabel")}
          </Label>
          {form.projects.length > 0 ? (
            <div className="grid gap-2">
              {form.projects.map((project) => {
                const selected = form.selectedProjectIds.includes(
                  project.projectId
                )
                return (
                  <Field key={project.projectId} orientation="horizontal">
                    <Checkbox
                      checked={selected}
                      data-testid={`create-goal-project-${project.projectId}`}
                      onCheckedChange={(checked) =>
                        form.toggleProject(project.projectId, checked === true)
                      }
                    />
                    <FieldLabel className="flex-1 font-normal">
                      {project.name}
                      {projectMarkerSuffix(t, project)}
                    </FieldLabel>
                    {selected ? (
                      <Input
                        aria-label={t("goals.create.projectPriority", {
                          project: project.name,
                        })}
                        className="w-20"
                        data-testid={`create-goal-project-priority-${project.projectId}`}
                        min={1}
                        onChange={(event) =>
                          form.setProjectPriority(
                            project.projectId,
                            event.target.value
                          )
                        }
                        placeholder={t("goals.create.projectPriorityAuto")}
                        type="number"
                        value={form.projectPriorities[project.projectId] ?? ""}
                      />
                    ) : null}
                  </Field>
                )
              })}
            </div>
          ) : null}
          {form.selectedProjectIds.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {t("goals.create.projectDefault")}
            </p>
          ) : null}
        </div>
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
                        : item.goalType === "Level"
                          ? "goals.create.suggestions.levelRequired"
                          : "goals.create.suggestions.ascensionRequired"
                    )}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
          {form.estimatedProjectIds.length > 0 ? (
            <ul className="grid gap-0.5 border-t pt-1 text-muted-foreground">
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
