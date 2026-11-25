import { Children, useId, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  campaignIcon,
  damageTypeIcon,
  factionIcon,
  gameMenuIcon,
  onslaughtAllianceIcon,
  rarityIcon,
  statIcon,
  traitIcon,
} from "@workspace/game-catalog"
import {
  campaignIdSchema,
  progressionOrder,
  rankOrder,
  rarityOrder,
} from "@workspace/game-domain"
import type { Progression, Rank } from "@workspace/game-domain"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"

import {
  closestOverlayContent,
  EntityIcon,
  FilterLabelIcon,
  MultiSelect,
  ProgressionBadge,
  RankBadge,
  SearchableSelect,
  progressionText,
} from "@/shared/ui"
import type { FilterLabelIconKind, SelectOption } from "@/shared/ui"

import type { UnitKind } from "@/entities/unit"

import {
  isUnitFilterAbilityAttack,
  isUnitFilterAbilityRole,
  isUnitFilterAbilityTarget,
  isUnitFilterAlliance,
  isUnitFilterAttackType,
  isUnitFilterKind,
  isUnitFilterSummons,
  offersUnitFilterField,
  sectionFilterCounts,
  unitFilterAbilityAttacks,
  unitFilterAbilityRoles,
  unitFilterAbilityTargets,
  unitFilterAlliances,
  unitFilterAttackTypes,
  unitFilterKinds,
  unitFilterSummons,
} from "../model/unit-filters"
import type {
  UnitFilterField,
  UnitFilterScope,
  UnitFilterShardSource,
  UnitFilters,
} from "../model/unit-filters"
import type { UnitFilterOptions } from "../model/use-unit-filter-options"

const ANY = "__any__"

const kindIcons = {
  character: gameMenuIcon("heroes"),
  mow: gameMenuIcon("machinesOfWar"),
} as const

const attackTypeIcons = {
  melee: statIcon("melee"),
  ranged: statIcon("ranged"),
} as const

// Each campaign tier by the first storyline's icon for it; Extremis (event campaigns only) by the
// first event's. "Not in a campaign" has none.
const shardSourceIcons: Record<UnitFilterShardSource, string | undefined> = {
  Standard: campaignIcon(campaignIdSchema.parse("campaign1"), "Standard"),
  Elite: campaignIcon(campaignIdSchema.parse("elite1"), "Elite"),
  Mirror: campaignIcon(campaignIdSchema.parse("mirror1"), "Mirror"),
  EliteMirror: campaignIcon(
    campaignIdSchema.parse("eliteMirror1"),
    "EliteMirror"
  ),
  Extremis: campaignIcon(campaignIdSchema.parse("eventCampaign1"), "Extremis"),
  none: undefined,
}

/** An option's leading game icon, decorative (the option's text names it). */
function optionIcon(src: string | undefined) {
  return src ? (
    <EntityIcon size="inline" src={src} alt="" className="shrink-0" />
  ) : undefined
}

// "None" (no stars yet) is never an owned unit's progression, so it is not offered.
const starSteps = progressionOrder.filter((step) => !step.endsWith(":None"))

/**
 * The standalone unit filter controls, shared by the desktop dialog and the mobile sheet, in five
 * sections: Unit, Progression, Attack, Abilities, and Traits and more. Each section title shows how
 * many of its filters are set. Rank range and stars range read the synced roster, so without one
 * they are disabled and explained. Each range (rank, stars, hits, attack range) is one cell with
 * both ends side by side, so a pair never splits across rows.
 * `layout="panel"` (desktop) is a fixed three-column grid: a range takes two columns and ends its
 * row, so every row starts at the left edge. `layout="sheet"` (mobile) stacks one cell per row.
 */
export function UnitFilterFields({
  filters,
  update,
  options,
  scope = "roster",
  kind = null,
  rosterAvailable = true,
  layout,
}: {
  filters: UnitFilters
  update: (patch: Partial<UnitFilters>) => void
  options: UnitFilterOptions
  /** `catalog` leaves out the filters that read the player's roster (rank and stars ranges). */
  scope?: UnitFilterScope
  /** A list of one kind: Unit type is left out, and for Machines of War the character-only fields. */
  kind?: UnitKind | null
  /** Roster scope: without a synced roster the roster filters are disabled and explained. */
  rosterAvailable?: boolean
  layout: "panel" | "sheet"
}) {
  const { t } = useTranslation(["common", "progression"])
  const { t: label } = useTranslation("common", {
    keyPrefix: "myGame.collection.toolbar",
  })
  const noteId = useId()
  const offers = (field: UnitFilterField) =>
    offersUnitFilterField(field, { scope, kind })
  const rosterNote = rosterAvailable || !offers("rank") ? undefined : noteId

  const rankOptions: SelectOption<Rank>[] = rankOrder.map((rank) => ({
    value: rank,
    label: t(`progression:ranks.${rank}`, { defaultValue: rank }),
    icon: <RankBadge rank={rank} showLabel={false} />,
  }))
  const starOptions: SelectOption<Progression>[] = starSteps.map((step) => ({
    value: step,
    label: progressionText(t, step),
    icon: <ProgressionBadge value={step} />,
  }))
  const numbers = (values: readonly number[]) =>
    values.map((value) => ({ value: String(value), label: String(value) }))
  const toNumber = (value: string | null) =>
    value === null ? null : Number(value)
  const asText = (value: number | null) =>
    value === null ? null : String(value)
  const wide = layout === "panel" ? "col-span-2" : undefined
  const counts = sectionFilterCounts(filters)

  return (
    <div
      // A divider between sections, so five of them still read as separate blocks.
      className="grid gap-6 [&>section+section]:border-t [&>section+section]:pt-6"
      role="group"
      aria-label={label("filters")}
      data-testid="unit-filter-fields"
    >
      <FieldGroup
        title={label("groupUnit")}
        count={counts.unit}
        layout={layout}
      >
        {offers("alliance") ? (
          <Field label={label("alliance")} icon="alliance">
            {(id) => (
              <PlainSelect
                id={id}
                value={filters.alliance}
                anyLabel={label("allAlliances")}
                options={unitFilterAlliances.map((alliance) => ({
                  value: alliance,
                  label: t(`alliances.${alliance}`),
                  icon: optionIcon(onslaughtAllianceIcon(alliance)),
                }))}
                onChange={(value) =>
                  update({
                    alliance: isUnitFilterAlliance(value) ? value : null,
                  })
                }
              />
            )}
          </Field>
        ) : null}
        {offers("factions") ? (
          <Field label={label("faction")} icon="faction" labelsControl={false}>
            {() => (
              <MultiSelect
                label={label("faction")}
                placeholder={label("allFactions")}
                searchPlaceholder={label("searchFactions")}
                emptyText={label("noFactions")}
                clearLabel={label("clearFactions")}
                options={options.factions.map((faction) => ({
                  value: faction.id,
                  label: faction.name,
                  icon: (
                    <EntityIcon
                      size="inline"
                      src={factionIcon(faction.id)}
                      alt={faction.name}
                    />
                  ),
                }))}
                value={filters.factions}
                onChange={(next) => update({ factions: next })}
                data-testid="unit-faction-filter"
              />
            )}
          </Field>
        ) : null}
        {offers("kind") ? (
          <Field label={label("kind")} icon="unitType">
            {(id) => (
              <PlainSelect
                id={id}
                value={filters.kind}
                anyLabel={label("kindAll")}
                options={unitFilterKinds.map((kind) => ({
                  value: kind,
                  label: label(kind),
                  icon: optionIcon(kindIcons[kind]),
                }))}
                onChange={(value) =>
                  update({ kind: isUnitFilterKind(value) ? value : null })
                }
              />
            )}
          </Field>
        ) : null}
      </FieldGroup>
      <FieldGroup
        title={label("groupProgression")}
        count={counts.progression}
        layout={layout}
      >
        {offers("rarities") ? (
          <Field label={label("rarity")} icon="rarity" labelsControl={false}>
            {() => (
              <MultiSelect
                label={label("rarity")}
                placeholder={label("allRarities")}
                clearLabel={label("clearRarities")}
                options={rarityOrder.map((rarity) => {
                  const name = t(`progression:rarities.${rarity}`, {
                    defaultValue: rarity,
                  })
                  return {
                    value: rarity,
                    label: name,
                    icon: optionIcon(rarityIcon(rarity)),
                  }
                })}
                value={filters.rarities}
                onChange={(next) => update({ rarities: next })}
                data-testid="unit-rarity-filter"
              />
            )}
          </Field>
        ) : null}
        {offers("rank") ? (
          <RangeField
            label={label("rankRange")}
            icon="rank"
            describedBy={rosterNote}
            className={wide}
          >
            <SearchableSelect
              label={label("rankFrom")}
              placeholder={label("anyRank")}
              clearLabel={label("clearRankFrom")}
              searchPlaceholder={label("searchRanks")}
              emptyText={label("noRanks")}
              options={rankOptions}
              value={filters.rankMin ?? undefined}
              onChange={(rank) => update({ rankMin: rank ?? null })}
              disabled={!rosterAvailable}
              data-testid="unit-rank-min-filter"
            />
            <SearchableSelect
              label={label("rankTo")}
              placeholder={label("anyRank")}
              clearLabel={label("clearRankTo")}
              searchPlaceholder={label("searchRanks")}
              emptyText={label("noRanks")}
              options={rankOptions}
              value={filters.rankMax ?? undefined}
              onChange={(rank) => update({ rankMax: rank ?? null })}
              disabled={!rosterAvailable}
              data-testid="unit-rank-max-filter"
            />
          </RangeField>
        ) : null}
        {offers("stars") ? (
          <RangeField
            label={label("starsRange")}
            icon="stars"
            describedBy={rosterNote}
            className={wide}
          >
            <SearchableSelect
              label={label("starsFrom")}
              placeholder={label("anyStars")}
              clearLabel={label("clearStarsFrom")}
              searchPlaceholder={label("searchStars")}
              emptyText={label("noStars")}
              options={starOptions}
              value={filters.starsMin ?? undefined}
              onChange={(step) => update({ starsMin: step ?? null })}
              disabled={!rosterAvailable}
              data-testid="unit-stars-min-filter"
            />
            <SearchableSelect
              label={label("starsTo")}
              placeholder={label("anyStars")}
              clearLabel={label("clearStarsTo")}
              searchPlaceholder={label("searchStars")}
              emptyText={label("noStars")}
              options={starOptions}
              value={filters.starsMax ?? undefined}
              onChange={(step) => update({ starsMax: step ?? null })}
              disabled={!rosterAvailable}
              data-testid="unit-stars-max-filter"
            />
          </RangeField>
        ) : null}
        {rosterNote ? (
          <p
            id={noteId}
            className="col-span-full text-xs text-muted-foreground"
          >
            {label("needsRoster")}
          </p>
        ) : null}
      </FieldGroup>
      <FieldGroup
        title={label("groupAttack")}
        count={counts.attack}
        layout={layout}
      >
        {offers("attack") ? (
          <Field label={label("attackType")} icon="attackType">
            {(id) => (
              <PlainSelect
                id={id}
                value={filters.attack}
                anyLabel={label("attackAny")}
                options={unitFilterAttackTypes.map((attack) => ({
                  value: attack,
                  label: label(`attackTypes.${attack}`),
                  icon: optionIcon(attackTypeIcons[attack]),
                }))}
                onChange={(value) =>
                  update({
                    attack: isUnitFilterAttackType(value) ? value : null,
                  })
                }
              />
            )}
          </Field>
        ) : null}
        {offers("hits") ? (
          <RangeField label={label("hitsRange")} icon="hits" className={wide}>
            <PlainSelect
              ariaLabel={label("hitsFrom")}
              value={asText(filters.hitsMin)}
              anyLabel={label("anyValue")}
              options={numbers(options.hits)}
              onChange={(value) => update({ hitsMin: toNumber(value) })}
            />
            <PlainSelect
              ariaLabel={label("hitsTo")}
              value={asText(filters.hitsMax)}
              anyLabel={label("anyValue")}
              options={numbers(options.hits)}
              onChange={(value) => update({ hitsMax: toNumber(value) })}
            />
          </RangeField>
        ) : null}
        {offers("range") ? (
          <RangeField
            label={label("attackRange")}
            icon="attackRange"
            className={wide}
          >
            <PlainSelect
              ariaLabel={label("rangeFrom")}
              value={asText(filters.rangeMin)}
              anyLabel={label("anyValue")}
              options={numbers(options.ranges)}
              onChange={(value) => update({ rangeMin: toNumber(value) })}
            />
            <PlainSelect
              ariaLabel={label("rangeTo")}
              value={asText(filters.rangeMax)}
              anyLabel={label("anyValue")}
              options={numbers(options.ranges)}
              onChange={(value) => update({ rangeMax: toNumber(value) })}
            />
          </RangeField>
        ) : null}
        {offers("damageTypes") ? (
          <Field
            label={label("damageTypes")}
            icon="damageType"
            labelsControl={false}
          >
            {() => (
              <MultiSelect
                label={label("damageTypes")}
                placeholder={label("allDamageTypes")}
                searchPlaceholder={label("searchDamageTypes")}
                clearLabel={label("clearDamageTypes")}
                emptyText={label("noMatch")}
                options={options.damageTypes.map((type) => ({
                  value: type.id,
                  label: type.name,
                  icon: (
                    <EntityIcon
                      size="inline"
                      src={damageTypeIcon(type.id)}
                      alt={type.name}
                    />
                  ),
                }))}
                value={filters.damageTypes}
                onChange={(next) => update({ damageTypes: next })}
                data-testid="unit-damage-type-filter"
              />
            )}
          </Field>
        ) : null}
      </FieldGroup>
      <FieldGroup
        title={label("groupAbilities")}
        count={counts.abilities}
        layout={layout}
      >
        {offers("abilityRole") ? (
          <Field label={label("abilityRole")} icon="abilityRole">
            {(id) => (
              <PlainSelect
                id={id}
                value={filters.abilityRole}
                anyLabel={label("abilityAny")}
                options={unitFilterAbilityRoles.map((role) => ({
                  value: role,
                  label: label(`abilityRoles.${role}`),
                }))}
                onChange={(value) =>
                  update({
                    abilityRole: isUnitFilterAbilityRole(value) ? value : null,
                  })
                }
              />
            )}
          </Field>
        ) : null}
        {offers("abilityTarget") ? (
          <Field label={label("abilityTarget")} icon="abilityTarget">
            {(id) => (
              <PlainSelect
                id={id}
                value={filters.abilityTarget}
                anyLabel={label("abilityAny")}
                options={unitFilterAbilityTargets.map((target) => ({
                  value: target,
                  label: label(`abilityTargets.${target}`),
                }))}
                onChange={(value) =>
                  update({
                    abilityTarget: isUnitFilterAbilityTarget(value)
                      ? value
                      : null,
                  })
                }
              />
            )}
          </Field>
        ) : null}
        {offers("abilityAttack") ? (
          <Field label={label("abilityAttack")} icon="abilityAttack">
            {(id) => (
              <PlainSelect
                id={id}
                value={filters.abilityAttack}
                anyLabel={label("abilityAny")}
                options={unitFilterAbilityAttacks.map((attack) => ({
                  value: attack,
                  label: label(`abilityAttacks.${attack}`),
                  icon: optionIcon(attackTypeIcons[attack]),
                }))}
                onChange={(value) =>
                  update({
                    abilityAttack: isUnitFilterAbilityAttack(value)
                      ? value
                      : null,
                  })
                }
              />
            )}
          </Field>
        ) : null}
        {offers("summons") ? (
          <Field label={label("summons")} icon="summons">
            {(id) => (
              <PlainSelect
                id={id}
                value={filters.summons}
                anyLabel={label("summonsAny")}
                options={unitFilterSummons.map((summons) => ({
                  value: summons,
                  label: label(`summonsTypes.${summons}`),
                }))}
                onChange={(value) =>
                  update({
                    summons: isUnitFilterSummons(value) ? value : null,
                  })
                }
              />
            )}
          </Field>
        ) : null}
      </FieldGroup>
      <FieldGroup
        title={label("groupMore")}
        count={counts.more}
        layout={layout}
      >
        {offers("traits") ? (
          <Field label={label("traits")} icon="trait" labelsControl={false}>
            {() => (
              <MultiSelect
                label={label("traits")}
                placeholder={label("allTraits")}
                searchPlaceholder={label("searchTraits")}
                clearLabel={label("clearTraits")}
                emptyText={label("noMatch")}
                options={options.traits.map((trait) => ({
                  value: trait.id,
                  label: trait.name,
                  icon: (
                    <EntityIcon
                      size="inline"
                      src={traitIcon(trait.id)}
                      alt={trait.name}
                    />
                  ),
                }))}
                value={filters.traits}
                onChange={(next) => update({ traits: next })}
                data-testid="unit-trait-filter"
              />
            )}
          </Field>
        ) : null}
        {offers("movement") ? (
          <Field label={label("movement")} icon="movement">
            {(id) => (
              <PlainSelect
                id={id}
                value={asText(filters.movement)}
                anyLabel={label("anyValue")}
                options={numbers(options.movements)}
                onChange={(value) => update({ movement: toNumber(value) })}
              />
            )}
          </Field>
        ) : null}
        {offers("shardSources") ? (
          <Field
            label={label("shardSource")}
            icon="shardSource"
            labelsControl={false}
          >
            {() => (
              <MultiSelect
                label={label("shardSource")}
                placeholder={label("allShardSources")}
                clearLabel={label("clearShardSources")}
                options={options.shardSources.map((source) => ({
                  value: source,
                  label: label(`shardSources.${source}`),
                  icon: optionIcon(shardSourceIcons[source]),
                }))}
                value={filters.shardSources}
                onChange={(next) => update({ shardSources: next })}
                data-testid="unit-shard-source-filter"
              />
            )}
          </Field>
        ) : null}
      </FieldGroup>
    </div>
  )
}

/**
 * A titled section of filter controls, its title followed by how many of them are set. On the
 * desktop panel a fixed three-column grid where whatever follows a range starts a new row.
 */
function FieldGroup({
  title,
  count,
  layout,
  children,
}: {
  title: string
  count: number
  layout: "panel" | "sheet"
  children: React.ReactNode
}) {
  const { t } = useTranslation("common")
  const id = useId()
  if (Children.toArray(children).length === 0) return null
  return (
    <section className="grid gap-3" aria-labelledby={id}>
      <h3 id={id} className="text-sm font-medium">
        {count > 0
          ? t("myGame.collection.toolbar.sectionCount", {
              section: title,
              count,
            })
          : title}
      </h3>
      <div
        className={cn(
          "grid gap-x-3 gap-y-4",
          layout === "panel"
            ? "grid-cols-3 [&>[data-range]+*]:col-start-1"
            : "grid-cols-1"
        )}
      >
        {children}
      </div>
    </section>
  )
}

/**
 * Both ends of a range in one cell, under one caption, joined by "to". The ends name themselves
 * (each control's own label); the cell is a group named by the caption.
 */
function RangeField({
  label,
  icon,
  describedBy,
  className,
  children,
}: {
  label: string
  icon: FilterLabelIconKind
  describedBy?: string
  className?: string
  children: [React.ReactNode, React.ReactNode]
}) {
  const { t } = useTranslation("common")
  return (
    <div
      className={cn("grid min-w-0 gap-1.5", className)}
      data-range
      role="group"
      aria-label={label}
      aria-describedby={describedBy}
    >
      <span aria-hidden="true" className="flex items-center gap-1.5 text-sm">
        <FilterLabelIcon kind={icon} />
        {label}
      </span>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5">
        {children[0]}
        <span aria-hidden="true" className="text-sm text-muted-foreground">
          {t("myGame.collection.toolbar.rangeJoin")}
        </span>
        {children[1]}
      </div>
    </div>
  )
}

/** A labelled control. A control that names itself (`labelsControl={false}`: the comboboxes carry
 *  their own accessible name) gets the same visible caption without a `for` pointing nowhere. */
function Field({
  label,
  icon,
  labelsControl = true,
  children,
}: {
  label: string
  icon: FilterLabelIconKind
  labelsControl?: boolean
  children: (id: string) => React.ReactNode
}) {
  const id = useId()
  return (
    <div className="grid min-w-0 gap-1.5">
      {labelsControl ? (
        <Label htmlFor={id} className="gap-1.5 font-normal">
          <FilterLabelIcon kind={icon} />
          {label}
        </Label>
      ) : (
        <span aria-hidden="true" className="flex items-center gap-1.5 text-sm">
          <FilterLabelIcon kind={icon} />
          {label}
        </span>
      )}
      {children(id)}
    </div>
  )
}

/** A single select with an "any" first row standing for "not set". */
function PlainSelect({
  id,
  ariaLabel,
  value,
  anyLabel,
  options,
  onChange,
  disabled,
  describedBy,
}: {
  /** Named by a `<label for>` (`id`) or, inside a range, by `ariaLabel`. */
  id?: string
  ariaLabel?: string
  value: string | null
  anyLabel: string
  /** `icon` sits inside the row, so the trigger repeats it beside the chosen value. */
  options: { value: string; label: string; icon?: React.ReactNode }[]
  onChange: (value: string | null) => void
  disabled?: boolean
  describedBy?: string
}) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  // Inside the mobile sheet the list must portal into the sheet, or its scroll lock blocks it.
  const [container, setContainer] = useState<HTMLElement>()
  return (
    <Select
      value={value ?? ANY}
      onValueChange={(next) => onChange(next === ANY ? null : next)}
      onOpenChange={(open) => {
        if (open) setContainer(closestOverlayContent(triggerRef.current))
      }}
      disabled={disabled}
    >
      <SelectTrigger
        ref={triggerRef}
        id={id}
        // Shrinks to its cell and cuts a long value off, rather than growing over the next one.
        className="w-full min-w-0 *:data-[slot=select-value]:min-w-0"
        aria-label={ariaLabel}
        aria-describedby={describedBy}
      >
        <SelectValue />
      </SelectTrigger>
      {/* Below the trigger, not item-aligned over it: an aligned list covers its own control. */}
      <SelectContent position="popper" align="start" container={container}>
        <SelectItem value={ANY}>{anyLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.icon}
            <span className="truncate">{option.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
