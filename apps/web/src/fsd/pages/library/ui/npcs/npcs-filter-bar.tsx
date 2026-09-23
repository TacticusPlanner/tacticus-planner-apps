import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { damageTypeIcon, factionIcon, traitIcon } from "@workspace/game-catalog"
import { Button } from "@workspace/ui/components/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"

import type { NpcAttackFilter, NpcFilters } from "@/entities/npc"
import { EntityIcon } from "@/shared/ui"

import type { NpcFilterOptions } from "./npcs-page.view-model"

const ANY = "__any__"

type Option = { id: string; name: string; icon?: string }

/** A searchable multi-select over id/name options, each shown with its game icon. */
function MultiSelect({
  label,
  clearLabel,
  options,
  value,
  onChange,
  testId,
}: {
  label: string
  clearLabel: string
  options: Option[]
  value: readonly string[]
  onChange: (next: string[]) => void
  testId: string
}) {
  const { t } = useTranslation("library")
  const [open, setOpen] = useState(false)
  const selectedNames = options
    .filter((option) => value.includes(option.id))
    .map((option) => option.name)

  const toggle = (id: string) =>
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id]
    )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative flex items-center">
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={label}
            className="w-full justify-between font-normal"
            data-testid={testId}
          >
            <span className="truncate">
              {selectedNames.length > 0 ? selectedNames.join(", ") : label}
            </span>
            {/* The X replaces the chevron rather than sitting beside it — two trailing affordances
                on one control read as clutter, and the trigger body still opens the list. */}
            <ChevronsUpDown
              className={cn(
                "shrink-0 opacity-50",
                value.length > 0 && "invisible"
              )}
            />
          </Button>
        </PopoverTrigger>
        {/* Clearing one facet should not mean clearing them all: this resets just this control. */}
        {value.length > 0 ? (
          <button
            type="button"
            onClick={() => onChange([])}
            aria-label={clearLabel}
            data-testid={`${testId}-clear`}
            className="absolute right-2.5 flex size-5 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder={label} />
          <CommandList>
            {/* This list holds filter options, not NPCs — an empty search here means no option
                matched, which is a different statement from "no NPCs match". */}
            <CommandEmpty>{t("npcs.noMatchingOptions")}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.name}
                  onSelect={() => toggle(option.id)}
                  aria-selected={value.includes(option.id)}
                >
                  <Check
                    className={cn(
                      "size-4 shrink-0",
                      value.includes(option.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.icon ? (
                    <EntityIcon
                      src={option.icon}
                      alt=""
                      className="size-5 shrink-0"
                    />
                  ) : null}
                  <span className="truncate">{option.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
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
      <SelectContent>
        <SelectItem value={ANY}>{anyLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            <span className="flex items-center gap-2">
              {option.icon ? (
                <EntityIcon
                  src={option.icon}
                  alt=""
                  className="size-5 shrink-0"
                />
              ) : null}
              {option.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/**
 * The collapsible filter controls. Name search is not here — it is a separate, always-visible input
 * (see `NpcsFilterPanel`): searching by name is how you find a unit you already have in mind, while
 * these narrow a roster you are browsing.
 */
export function NpcsFilterBar({
  filters,
  options,
  activeCount,
  onChange,
  onClear,
  className,
}: {
  filters: NpcFilters
  options: NpcFilterOptions
  activeCount: number
  onChange: (filters: NpcFilters) => void
  onClear: () => void
  className?: string
}) {
  const { t } = useTranslation("library")

  return (
    <div
      className={cn("grid grid-cols-1 gap-3", className)}
      data-testid="npcs-filter-bar"
      role="group"
      aria-label={t("npcs.filters")}
    >
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
      <IconSelect
        label={t("npcs.alliance")}
        anyLabel={t("npcs.allAlliances")}
        options={options.alliances}
        value={filters.alliance}
        onChange={(alliance) => onChange({ ...filters, alliance })}
        testId="npcs-alliance-filter"
      />
      <IconSelect
        label={t("npcs.attack")}
        anyLabel={t("npcs.anyAttack")}
        options={[
          { id: "meleeOnly", name: t("npcs.meleeOnly") },
          { id: "ranged", name: t("npcs.hasRanged") },
        ]}
        value={filters.attack}
        onChange={(attack) =>
          onChange({ ...filters, attack: attack as NpcAttackFilter | null })
        }
        testId="npcs-attack-filter"
      />
      <MultiSelect
        label={t("npcs.damageType")}
        clearLabel={t("npcs.clearOne", { name: t("npcs.damageType") })}
        options={options.damageTypes.map((type) => ({
          ...type,
          icon: damageTypeIcon(type.id),
        }))}
        value={filters.damageTypes}
        onChange={(damageTypes) => onChange({ ...filters, damageTypes })}
        testId="npcs-damage-type-filter"
      />
      <MultiSelect
        label={t("npcs.trait")}
        clearLabel={t("npcs.clearOne", { name: t("npcs.trait") })}
        options={options.traits.map((trait) => ({
          ...trait,
          icon: traitIcon(trait.id),
        }))}
        value={filters.traits}
        onChange={(traits) => onChange({ ...filters, traits })}
        testId="npcs-trait-filter"
      />
      <Button
        variant="ghost"
        onClick={onClear}
        disabled={activeCount === 0}
        data-testid="npcs-clear-filters"
        className="justify-self-start"
      >
        <X aria-hidden />
        {t("npcs.clearFilters")}
      </Button>
    </div>
  )
}
