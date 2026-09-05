import { useTranslation } from "react-i18next"
import { rankAt } from "@workspace/game-domain"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Textarea } from "@workspace/ui/components/textarea"

import type { FarmingStrategy, GoalDetail } from "@/entities/goal"
import type { ProjectSummary } from "@/entities/project"

import { additionalTargetFromWire } from "@/features/goal-farming"
import { AcquisitionSourceField } from "../create-goal/acquisition-source-field"
import { FarmingStrategyField } from "../create-goal/farming-strategy-field"
import { GoalLevelSummary } from "../create-goal/goal-level-summary"
import { GoalLocationsField } from "../create-goal/goal-locations-field"
import { GoalProjectsField } from "../projects/goal-projects-field"
import type { useAcquisitionSourceSelection } from "../../model/goal-creation-form/use-acquisition-source-selection"
import type { ProjectMembershipConflict } from "../../model/projects/project-membership"

export type GoalDetailDraft = {
  notes: string
  selectedLocations: string[]
  selectedProjectIds: string[]
  farmingStrategy: FarmingStrategy
}

/**
 * Edit mode's form — only the properties a user can actually change (plan §5). Split out of
 * `goal-detail-sheet.tsx` to keep that file under this repo's max-lines rule; unchanged from what
 * used to be the sheet's single always-editable body, now gated behind the sheet's Edit action.
 */
export function GoalDetailEditForm({
  detail,
  draft,
  onDraftChange,
  projects,
  projectsValid,
  isRank,
  isLevel,
  isUnlock,
  isAscension,
  allLocations,
  overrideValid,
  conflicts,
  portalContainer,
  acquisitionSelection,
  battlesById,
  shopOffers,
}: {
  detail: GoalDetail
  draft: GoalDetailDraft
  onDraftChange: (next: GoalDetailDraft) => void
  projects: ProjectSummary[]
  projectsValid: boolean
  isRank: boolean
  isLevel: boolean
  isUnlock: boolean
  isAscension: boolean
  allLocations: string[]
  overrideValid: boolean
  conflicts: ProjectMembershipConflict[]
  portalContainer: HTMLElement | null
  /** Only meaningful (and only used) for Unlock/Ascension — see `usesAcquisitionSources` in
   *  `goal-detail-sheet.tsx`. */
  acquisitionSelection: ReturnType<typeof useAcquisitionSourceSelection>
  battlesById: Parameters<
    typeof useAcquisitionSourceSelection
  >[0]["battlesById"]
  shopOffers: Parameters<typeof useAcquisitionSourceSelection>[0]["shopOffers"]
}) {
  const { t } = useTranslation()

  return (
    <div
      className="grid gap-6 px-4 text-sm"
      data-testid="goal-detail-edit-form"
    >
      <Field>
        <FieldLabel htmlFor="goal-notes">{t("goals.detail.notes")}</FieldLabel>
        <Textarea
          id="goal-notes"
          maxLength={200}
          value={draft.notes}
          onChange={(event) =>
            onDraftChange({ ...draft, notes: event.target.value })
          }
        />
        <span className="text-xs text-muted-foreground">
          {draft.notes.length}/200
        </span>
      </Field>

      <GoalProjectsField
        conflicts={conflicts}
        projects={projects}
        selectedProjectIds={draft.selectedProjectIds}
        projectsValid={projectsValid}
        onToggle={(projectId, checked) =>
          onDraftChange({
            ...draft,
            selectedProjectIds: checked
              ? [...draft.selectedProjectIds, projectId]
              : draft.selectedProjectIds.filter((id) => id !== projectId),
          })
        }
        portalContainer={portalContainer}
      />

      {isRank && detail.config.rank ? (
        <FarmingStrategyField
          abilityActiveEnd={0}
          abilityActiveStart={0}
          abilityPassiveEnd={0}
          abilityPassiveStart={0}
          context="rank"
          farmingStrategy={draft.farmingStrategy}
          onFarmingStrategyChange={(value) =>
            onDraftChange({ ...draft, farmingStrategy: value })
          }
          rankAdditionalTarget={additionalTargetFromWire(
            rankAt(detail.config.rank.end),
            detail.config.rank
          )}
          rankEnd={rankAt(detail.config.rank.end)}
          rankStart={rankAt(detail.config.rank.start)}
        />
      ) : null}

      {isLevel && detail.config.level ? (
        <GoalLevelSummary target={detail.config.level} />
      ) : null}

      {isUnlock || isAscension ? (
        <AcquisitionSourceField
          battlesById={battlesById}
          campaignEnabled={acquisitionSelection.campaignEnabled}
          mythicShardLocations={
            isAscension ? acquisitionSelection.mythicShardLocations : []
          }
          onCampaignEnabledChange={acquisitionSelection.setCampaignEnabled}
          onOnslaughtEnabledChange={acquisitionSelection.setOnslaughtEnabled}
          onShopsEnabledChange={acquisitionSelection.setShopsEnabled}
          onToggleShardLocation={acquisitionSelection.toggleShardLocation}
          onToggleShopOffer={acquisitionSelection.toggleShopOffer}
          onslaughtEnabled={acquisitionSelection.onslaughtEnabled}
          onslaughtProgressSaved={false}
          onslaughtShardsPerRun={0}
          regularShardLocations={acquisitionSelection.regularShardLocations}
          selectedShardLocationIds={acquisitionSelection.shardLocationIds}
          selectedShopOfferIds={acquisitionSelection.selectedShopOfferIds}
          shopOffers={shopOffers}
          shopsEnabled={acquisitionSelection.shopsEnabled}
          showCampaigns={
            acquisitionSelection.regularShardLocations.length > 0 ||
            acquisitionSelection.mythicShardLocations.length > 0
          }
          showOnslaught={isAscension && detail.entityType === "Character"}
        />
      ) : null}
      {!isRank && !isLevel && !isUnlock && !isAscension ? (
        <GoalLocationsField
          allLocations={allLocations}
          isUnlock={isUnlock}
          onToggle={(battleId, checked) =>
            onDraftChange({
              ...draft,
              selectedLocations: checked
                ? [...draft.selectedLocations, battleId]
                : draft.selectedLocations.filter((id) => id !== battleId),
            })
          }
          overrideValid={overrideValid}
          selectedLocations={draft.selectedLocations}
        />
      ) : null}
    </div>
  )
}
