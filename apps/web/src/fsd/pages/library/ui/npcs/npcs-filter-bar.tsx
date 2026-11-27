import { useTranslation } from "react-i18next"
import {
  damageTypeIcon,
  factionIcon,
  statIcon,
  traitIcon,
} from "@workspace/game-catalog"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Switch } from "@workspace/ui/components/switch"

import type { NpcAttackFilter, NpcFilters } from "@/entities/npc"
import { EntityIcon, FilterField, MultiSelect } from "@/shared/ui"
import type { SelectOption } from "@/shared/ui"

import type { NpcFilterOptions } from "../../model/npcs/npcs-page.view-model"

const ANY = "__any__"

type Option = { id: string; name: string; icon?: string }

/** Id/name options as the shared selects take them, each with its game icon. */
function toSelectOptions(options: Option[]): SelectOption<string>[] {
  return options.map((option) => ({
    value: option.id,
    label: option.name,
    icon: option.icon ? (
      <EntityIcon size="icon" src={option.icon} alt="" className="shrink-0" />
    ) : undefined,
  }))
}

/** A single-select whose options carry an icon, with an "any" reset row. */
function IconSelect({
  label,
  anyLabel,
  options,
  value,
  onChange,
  testId,
}: {
  label: string
  anyLabel: string
  options: Option[]
  value: string | null
  onChange: (next: string | null) => void
  testId: string
}) {
  return (
    <Select
      value={value ?? ANY}
      onValueChange={(next) => onChange(next === ANY ? null : next)}
    >
      <SelectTrigger className="w-full" aria-label={label} data-testid={testId}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="start">
        <SelectGroup>
          <SelectItem value={ANY}>{anyLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              <span className="flex items-center gap-2">
                {option.icon ? (
                  <EntityIcon
                    size="icon"
                    src={option.icon}
                    alt=""
                    className="shrink-0"
                  />
                ) : null}
                {option.name}
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

/**
 * The filter controls inside the toolbar's Filters panel (`FiltersControl`), each with its visible
 * label. Name search is not here — it is a separate, always-visible input (see `NpcsToolbar`):
 * searching by name is how you find a unit you already have in mind, while these narrow a roster
 * you are browsing. "Clear filters" sits in the panel's footer.
 */
export function NpcsFilterBar({
  filters,
  options,
  onChange,
}: {
  filters: NpcFilters
  options: NpcFilterOptions
  onChange: (filters: NpcFilters) => void
}) {
  const { t } = useTranslation("library")

  return (
    <div
      className="grid grid-cols-1 gap-3 @lg:grid-cols-2"
      data-testid="npcs-filter-bar"
      role="group"
      aria-label={t("npcs.filters")}
    >
      <FilterField icon="faction" label={t("npcs.faction")}>
        <IconSelect
          label={t("npcs.faction")}
          anyLabel={t("npcs.allFactions")}
          options={options.factions.map((faction) => ({
            ...faction,
            icon: factionIcon(faction.id),
          }))}
          value={filters.factionId}
          onChange={(factionId) => onChange({ ...filters, factionId })}
          testId="npcs-faction-filter"
        />
      </FilterField>
      <FilterField icon="alliance" label={t("npcs.alliance")}>
        <IconSelect
          label={t("npcs.alliance")}
          anyLabel={t("npcs.allAlliances")}
          options={options.alliances}
          value={filters.alliance}
          onChange={(alliance) => onChange({ ...filters, alliance })}
          testId="npcs-alliance-filter"
        />
      </FilterField>
      {/* Offered only while the encounter data is present (the orchestrator leaves no modes otherwise). */}
      {options.gameModes.length > 0 ? (
        <FilterField icon="gameMode" label={t("npcs.gameMode")}>
          <IconSelect
            label={t("npcs.gameMode")}
            anyLabel={t("npcs.anyGameMode")}
            options={options.gameModes}
            value={filters.gameMode}
            onChange={(gameMode) =>
              onChange({
                ...filters,
                gameMode: gameMode as NpcFilters["gameMode"],
                // A location belongs to the mode it was chosen under.
                encounterGroup: null,
              })
            }
            testId="npcs-game-mode-filter"
          />
        </FilterField>
      ) : null}
      {/* A single location (Onslaught) would only repeat the game mode. */}
      {options.locations.length > 1 ? (
        <FilterField icon="campaignType" label={t("npcs.location")}>
          <IconSelect
            label={t("npcs.location")}
            anyLabel={t("npcs.anyLocation")}
            options={options.locations}
            value={filters.encounterGroup}
            onChange={(encounterGroup) =>
              onChange({ ...filters, encounterGroup })
            }
            testId="npcs-location-filter"
          />
        </FilterField>
      ) : null}
      {options.gameModes.length > 0 ? (
        <FilterField icon="enemies" inline label={t("npcs.minCount")}>
          {({ id }) => (
            <Input
              id={id}
              type="number"
              min={1}
              inputMode="numeric"
              className="w-20"
              value={filters.minCount ?? ""}
              onChange={({ target: { valueAsNumber: count } }) =>
                onChange({
                  ...filters,
                  minCount: Number.isInteger(count) && count > 0 ? count : null,
                })
              }
              data-testid="npcs-min-count-filter"
            />
          )}
        </FilterField>
      ) : null}
      {options.canFilterRunning ? (
        <FilterField
          icon="runningNow"
          inline
          label={t("npcs.encounters.timing.running")}
        >
          {({ id }) => (
            <Switch
              id={id}
              checked={filters.runningNow}
              onCheckedChange={(runningNow) =>
                onChange({ ...filters, runningNow })
              }
              data-testid="npcs-running-filter"
            />
          )}
        </FilterField>
      ) : null}
      <FilterField icon="attackType" label={t("npcs.attack")}>
        <IconSelect
          label={t("npcs.attack")}
          anyLabel={t("npcs.anyAttack")}
          options={[
            {
              id: "meleeOnly",
              name: t("npcs.meleeOnly"),
              icon: statIcon("melee"),
            },
            {
              id: "ranged",
              name: t("npcs.hasRanged"),
              icon: statIcon("ranged"),
            },
          ]}
          value={filters.attack}
          onChange={(attack) =>
            onChange({ ...filters, attack: attack as NpcAttackFilter | null })
          }
          testId="npcs-attack-filter"
        />
      </FilterField>
      <FilterField icon="damageType" label={t("npcs.damageType")}>
        <MultiSelect
          label={t("npcs.damageType")}
          placeholder={t("npcs.anyDamageType")}
          searchPlaceholder={t("npcs.damageType")}
          emptyText={t("npcs.noMatchingOptions")}
          clearLabel={t("npcs.clearOne", { name: t("npcs.damageType") })}
          options={toSelectOptions(
            options.damageTypes.map((type) => ({
              ...type,
              icon: damageTypeIcon(type.id),
            }))
          )}
          value={filters.damageTypes}
          onChange={(damageTypes) => onChange({ ...filters, damageTypes })}
          data-testid="npcs-damage-type-filter"
        />
      </FilterField>
      <FilterField icon="trait" label={t("npcs.trait")}>
        <MultiSelect
          label={t("npcs.trait")}
          placeholder={t("npcs.anyTrait")}
          searchPlaceholder={t("npcs.trait")}
          emptyText={t("npcs.noMatchingOptions")}
          clearLabel={t("npcs.clearOne", { name: t("npcs.trait") })}
          options={toSelectOptions(
            options.traits.map((trait) => ({
              ...trait,
              icon: traitIcon(trait.id),
            }))
          )}
          value={filters.traits}
          onChange={(traits) => onChange({ ...filters, traits })}
          data-testid="npcs-trait-filter"
        />
      </FilterField>
    </div>
  )
}
