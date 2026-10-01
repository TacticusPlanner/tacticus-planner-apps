import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useLiveQuery } from "dexie-react-hooks"
import {
  factionIcon,
  onslaughtAllianceIcon,
  rarityIcon,
  traitIcon,
} from "@workspace/game-catalog"
import {
  getCampaignBattles,
  getCharactersMap,
  getNpcsMap,
} from "@workspace/game-catalog/queries"
import { factionOrder, type Rarity } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"

import {
  EntityIcon,
  MultiSelect,
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  SearchableSelect,
  type SelectOption,
} from "@/shared/ui"

import { listEnemyTraits } from "../../model/battle-enemy-traits"
import {
  emptyRaidsFilters,
  RAIDS_CAMPAIGN_TYPES,
  RAIDS_SLOT_OPTIONS,
  RAIDS_UPGRADE_RARITIES,
  type RaidsFilters,
} from "../../model/raids-filters/raids-filters.domain"
import { pruneFactions } from "../../model/raids-filters/prune-factions"
import { useRaidsFilters } from "../../model/raids-filters/use-raids-filters"
import { LabeledField, Section } from "./raids-filters-fields"

const ALLIANCES = ["Imperial", "Chaos", "Xenos"] as const

/** "PermaDeath" -> "Perma Death": the label of a trait the `traits` namespace has no entry for. */
const humanizeId = (id: string) => id.replace(/([a-z])([A-Z])/g, "$1 $2")

/**
 * The Raids Filters dialog (a bottom sheet below 768px). Edits are a draft: Close discards, Apply
 * writes the draft, Reset clears the applied filter and closes. Mounted only while open, so every
 * open starts from the applied values.
 */
export function RaidsFiltersDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation([
    "dailies",
    "common",
    "factions",
    "progression",
    "traits",
  ])
  const [applied, setApplied] = useRaidsFilters()
  const [draft, setDraft] = useState<RaidsFilters>(applied)
  const battles = useLiveQuery(() => getCampaignBattles(), [])
  const characters = useLiveQuery(() => getCharactersMap(), [])
  const npcs = useLiveQuery(() => getNpcsMap(), [])
  const patch = (next: Partial<RaidsFilters>) =>
    setDraft((current) => ({ ...current, ...next }))

  const allianceOptions = useMemo<SelectOption<string>[]>(
    () =>
      ALLIANCES.map((alliance) => ({
        value: alliance,
        label: t(`common:alliances.${alliance}`),
        icon: (
          <EntityIcon
            alt=""
            className="h-5 w-auto"
            src={onslaughtAllianceIcon(alliance)}
          />
        ),
      })),
    [t]
  )
  const factionAlliance = useMemo(
    () =>
      new Map(
        [...(characters?.values() ?? [])].map((character) => [
          character.faction as string,
          character.alliance as string,
        ])
      ),
    [characters]
  )
  // A faction picker offers only the factions of the alliances selected beside it (all of them
  // while none is selected, or while the roster that maps factions to alliances is still loading).
  const factionOptions = (
    alliances: readonly string[]
  ): SelectOption<string>[] =>
    factionOrder
      .filter(
        (faction) =>
          alliances.length === 0 ||
          factionAlliance.size === 0 ||
          alliances.includes(factionAlliance.get(faction) ?? "")
      )
      .map((faction) => ({
        value: faction,
        label: t(`factions:${faction}`, { defaultValue: faction }),
        icon: (
          <EntityIcon alt="" className="size-5" src={factionIcon(faction)} />
        ),
      }))
  const alliesFactionOptions = factionOptions(draft.alliesAlliances)
  const enemiesFactionOptions = factionOptions(draft.enemiesAlliances)

  const enemyTypeOptions = useMemo<SelectOption<string>[]>(
    () =>
      [...new Set((battles ?? []).flatMap((battle) => battle.enemiesTypes))]
        .sort((a, b) => a.localeCompare(b))
        .map((type) => ({ value: type, label: type })),
    [battles]
  )
  // Only traits that occur on an enemy of a campaign battle, labelled through the game-data `traits`
  // namespace (en only; other locales fall back to the English game term, like every trait surface).
  const enemyTraitOptions = useMemo<SelectOption<string>[]>(
    () =>
      listEnemyTraits(battles ?? [], npcs ?? new Map())
        .map((trait) => ({
          value: trait,
          label: t(`traits:${trait}`, { defaultValue: humanizeId(trait) }),
          icon: <EntityIcon alt="" className="size-5" src={traitIcon(trait)} />,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [battles, npcs, t]
  )
  const enemyTotalOptions = useMemo<SelectOption<number>[]>(
    () =>
      [...new Set((battles ?? []).map((battle) => battle.enemiesTotal))]
        .sort((a, b) => b - a)
        .map((total) => ({ value: total, label: String(total) })),
    [battles]
  )
  const campaignTypeOptions = RAIDS_CAMPAIGN_TYPES.map((type) => ({
    value: type,
    label: t(`dailies:raidsFilters.campaignTypes.${type}`),
  }))
  const slotOptions = RAIDS_SLOT_OPTIONS.map((slots) => ({
    value: slots,
    label: t("dailies:raidsFilters.slotsOption", { count: slots }),
  }))
  const rarityOptions = RAIDS_UPGRADE_RARITIES.map((rarity) => ({
    value: rarity,
    label: t(`progression:rarities.${rarity}`, { defaultValue: rarity }),
    icon: <EntityIcon alt="" className="size-5" src={rarityIcon(rarity)} />,
  }))

  const loading = battles === undefined
  const traitsLoading = loading || npcs === undefined
  const placeholders = {
    searchPlaceholder: t("dailies:raidsFilters.placeholders.search"),
    emptyText: t("dailies:raidsFilters.placeholders.empty"),
  }

  // Ids the catalog no longer has are dropped on apply, so a stale selection cannot linger invisibly.
  const sanitized = (): RaidsFilters => ({
    ...draft,
    alliesAlliances: draft.alliesAlliances.filter((id) =>
      allianceOptions.some((option) => option.value === id)
    ),
    enemiesAlliances: draft.enemiesAlliances.filter((id) =>
      allianceOptions.some((option) => option.value === id)
    ),
    alliesFactions: draft.alliesFactions.filter((id) =>
      factionOrder.some((faction) => faction === id)
    ),
    enemiesFactions: draft.enemiesFactions.filter((id) =>
      factionOrder.some((faction) => faction === id)
    ),
    enemiesTraits: traitsLoading
      ? draft.enemiesTraits
      : draft.enemiesTraits.filter((id) =>
          enemyTraitOptions.some((option) => option.value === id)
        ),
    enemiesTypes: loading
      ? draft.enemiesTypes
      : draft.enemiesTypes.filter((id) =>
          enemyTypeOptions.some((option) => option.value === id)
        ),
  })

  const close = () => onOpenChange(false)

  return (
    <ResponsiveDialog
      contentClassName="sm:max-w-3xl"
      data-testid="raids-filters-dialog"
      onOpenChange={onOpenChange}
      open={open}
    >
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>
          {t("dailies:raidsFilters.title")}
        </ResponsiveDialogTitle>
        <p className="text-sm text-muted-foreground">
          {t("dailies:raidsFilters.description")}
        </p>
      </ResponsiveDialogHeader>
      <ResponsiveDialogBody className="gap-5 pt-2 pb-4">
        <Section title={t("dailies:raidsFilters.sections.allies")}>
          <LabeledField label={t("dailies:raidsFilters.fields.alliances")}>
            <MultiSelect
              {...placeholders}
              data-testid="raids-filters-allies-alliances"
              label={`${t("dailies:raidsFilters.sections.allies")}: ${t("dailies:raidsFilters.fields.alliances")}`}
              onChange={(alliesAlliances) =>
                patch({
                  alliesAlliances,
                  alliesFactions: pruneFactions(
                    draft.alliesFactions,
                    alliesAlliances,
                    factionAlliance
                  ),
                })
              }
              options={allianceOptions}
              placeholder={t("dailies:raidsFilters.placeholders.allAlliances")}
              value={draft.alliesAlliances}
            />
          </LabeledField>
          <LabeledField label={t("dailies:raidsFilters.fields.factions")}>
            <MultiSelect
              {...placeholders}
              data-testid="raids-filters-allies-factions"
              label={`${t("dailies:raidsFilters.sections.allies")}: ${t("dailies:raidsFilters.fields.factions")}`}
              onChange={(alliesFactions) => patch({ alliesFactions })}
              options={alliesFactionOptions}
              placeholder={t("dailies:raidsFilters.placeholders.allFactions")}
              value={draft.alliesFactions}
            />
          </LabeledField>
        </Section>

        <Section title={t("dailies:raidsFilters.sections.enemies")}>
          <LabeledField label={t("dailies:raidsFilters.fields.alliances")}>
            <MultiSelect
              {...placeholders}
              data-testid="raids-filters-enemies-alliances"
              label={`${t("dailies:raidsFilters.sections.enemies")}: ${t("dailies:raidsFilters.fields.alliances")}`}
              onChange={(enemiesAlliances) =>
                patch({
                  enemiesAlliances,
                  enemiesFactions: pruneFactions(
                    draft.enemiesFactions,
                    enemiesAlliances,
                    factionAlliance
                  ),
                })
              }
              options={allianceOptions}
              placeholder={t("dailies:raidsFilters.placeholders.allAlliances")}
              value={draft.enemiesAlliances}
            />
          </LabeledField>
          <LabeledField label={t("dailies:raidsFilters.fields.factions")}>
            <MultiSelect
              {...placeholders}
              data-testid="raids-filters-enemies-factions"
              label={`${t("dailies:raidsFilters.sections.enemies")}: ${t("dailies:raidsFilters.fields.factions")}`}
              onChange={(enemiesFactions) => patch({ enemiesFactions })}
              options={enemiesFactionOptions}
              placeholder={t("dailies:raidsFilters.placeholders.allFactions")}
              value={draft.enemiesFactions}
            />
          </LabeledField>
          <LabeledField
            className="col-span-2"
            label={t("dailies:raidsFilters.fields.enemyTraits")}
          >
            <MultiSelect
              {...placeholders}
              data-testid="raids-filters-enemy-traits"
              disabled={traitsLoading}
              label={t("dailies:raidsFilters.fields.enemyTraits")}
              onChange={(enemiesTraits) => patch({ enemiesTraits })}
              options={enemyTraitOptions}
              placeholder={t("dailies:raidsFilters.placeholders.allTraits")}
              value={draft.enemiesTraits}
            />
          </LabeledField>
          <LabeledField label={t("dailies:raidsFilters.fields.minEnemies")}>
            <SearchableSelect
              {...placeholders}
              clearLabel={t("dailies:raidsFilters.placeholders.clear")}
              data-testid="raids-filters-enemies-min"
              disabled={loading}
              label={t("dailies:raidsFilters.fields.minEnemies")}
              onChange={(enemiesMin) => patch({ enemiesMin })}
              options={enemyTotalOptions}
              placeholder={t("dailies:raidsFilters.placeholders.noLimit")}
              value={draft.enemiesMin}
            />
          </LabeledField>
          <LabeledField label={t("dailies:raidsFilters.fields.maxEnemies")}>
            <SearchableSelect
              {...placeholders}
              clearLabel={t("dailies:raidsFilters.placeholders.clear")}
              data-testid="raids-filters-enemies-max"
              disabled={loading}
              label={t("dailies:raidsFilters.fields.maxEnemies")}
              onChange={(enemiesMax) => patch({ enemiesMax })}
              options={enemyTotalOptions}
              placeholder={t("dailies:raidsFilters.placeholders.noLimit")}
              value={draft.enemiesMax}
            />
          </LabeledField>
          <LabeledField
            className="col-span-2"
            label={t("dailies:raidsFilters.fields.enemyTypes")}
          >
            <MultiSelect
              {...placeholders}
              data-testid="raids-filters-enemy-types"
              disabled={loading}
              label={t("dailies:raidsFilters.fields.enemyTypes")}
              onChange={(enemiesTypes) => patch({ enemiesTypes })}
              options={enemyTypeOptions}
              placeholder={t("dailies:raidsFilters.placeholders.allEnemyTypes")}
              value={draft.enemiesTypes}
            />
          </LabeledField>
        </Section>

        <Section title={t("dailies:raidsFilters.sections.locations")}>
          <LabeledField label={t("dailies:raidsFilters.fields.campaignTypes")}>
            <MultiSelect
              {...placeholders}
              data-testid="raids-filters-campaign-types"
              label={t("dailies:raidsFilters.fields.campaignTypes")}
              onChange={(campaignTypes) => patch({ campaignTypes })}
              options={campaignTypeOptions}
              placeholder={t(
                "dailies:raidsFilters.placeholders.allCampaignTypes"
              )}
              value={draft.campaignTypes}
            />
          </LabeledField>
          <LabeledField label={t("dailies:raidsFilters.fields.slots")}>
            <MultiSelect
              {...placeholders}
              data-testid="raids-filters-slots"
              label={t("dailies:raidsFilters.fields.slots")}
              onChange={(slots) => patch({ slots })}
              options={slotOptions}
              placeholder={t("dailies:raidsFilters.placeholders.allSlots")}
              value={draft.slots}
            />
          </LabeledField>
        </Section>

        <Section title={t("dailies:raidsFilters.sections.upgrades")}>
          <LabeledField label={t("dailies:raidsFilters.fields.rarity")}>
            <MultiSelect<Rarity>
              {...placeholders}
              data-testid="raids-filters-rarities"
              label={t("dailies:raidsFilters.fields.rarity")}
              onChange={(upgradeRarities) => patch({ upgradeRarities })}
              options={rarityOptions}
              placeholder={t("dailies:raidsFilters.placeholders.allRarities")}
              value={draft.upgradeRarities}
            />
          </LabeledField>
        </Section>
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter className="border-t">
        <Button
          data-testid="raids-filters-close"
          onClick={close}
          variant="outline"
        >
          {t("dailies:raidsFilters.actions.close")}
        </Button>
        <Button
          data-testid="raids-filters-reset"
          onClick={() => {
            setApplied(emptyRaidsFilters)
            close()
          }}
          variant="outline"
        >
          {t("dailies:raidsFilters.actions.reset")}
        </Button>
        <Button
          data-testid="raids-filters-apply"
          onClick={() => {
            setApplied(sanitized())
            close()
          }}
        >
          {t("dailies:raidsFilters.actions.apply")}
        </Button>
      </ResponsiveDialogFooter>
    </ResponsiveDialog>
  )
}
