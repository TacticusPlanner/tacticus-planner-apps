import { useId, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  damageTypeIcon,
  factionIcon,
  rarityIcon,
  traitIcon,
} from "@workspace/game-catalog"
import {
  progressionOrder,
  progressionRarity,
  rankOrder,
  rarityOrder,
  type Progression,
  type Rank,
} from "@workspace/game-domain"
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
  MultiSelect,
  ProgressionBadge,
  RankBadge,
  SearchableSelect,
  type SelectOption,
} from "@/shared/ui"

import {
  collectionAlliances,
  collectionAttackTypes,
  collectionKinds,
  collectionOwnerships,
  isCollectionAlliance,
  isCollectionAttackType,
  isCollectionKind,
  isCollectionOwnership,
  type CollectionQuery,
} from "../../model/collection-query"
import type { CollectionOptions } from "../../model/use-collection-options"

const ANY = "__any__"

// "None" (no stars yet) is never an owned unit's progression, so it is not offered.
const starSteps = progressionOrder.filter((step) => !step.endsWith(":None"))

/**
 * The standalone filter controls, shared by the desktop inline panel and the mobile sheet, in two
 * labelled groups: Unit (who the unit is and how far the player has taken it) and Combat (V1's
 * character properties, plus where the shards drop). Rank range, stars range and ownership read
 * the synced roster, so without one they are disabled and explained. Each range (rank, stars, hits,
 * attack range) is one cell with both ends side by side, so a pair never splits across rows.
 * `layout="panel"` (desktop) fits as many columns as the width allows and stretches them across
 * the panel (no empty columns on a wide screen), a range taking two;
 * `layout="sheet"` (mobile) stacks one cell per row.
 */
export function CollectionFilterFields({
  query,
  update,
  options,
  rosterAvailable,
  layout,
}: {
  query: CollectionQuery
  update: (patch: Partial<CollectionQuery>) => void
  options: CollectionOptions
  rosterAvailable: boolean
  layout: "panel" | "sheet"
}) {
  const { t } = useTranslation(["common", "progression"])
  const { t: label } = useTranslation("common", {
    keyPrefix: "myGame.collection.toolbar",
  })
  const noteId = useId()
  const rosterNote = rosterAvailable ? undefined : noteId

  const rankOptions: SelectOption<Rank>[] = rankOrder.map((rank) => ({
    value: rank,
    label: t(`progression:ranks.${rank}`, { defaultValue: rank }),
    icon: <RankBadge rank={rank} showLabel={false} iconClassName="size-5" />,
  }))
  const starOptions: SelectOption<Progression>[] = starSteps.map((step) => {
    const rarity = progressionRarity(step)
    const stars = step.slice(step.indexOf(":") + 1)
    return {
      value: step,
      label: `${t(`progression:rarities.${rarity}`, { defaultValue: rarity })} · ${t(
        `progression:stars.${stars}`,
        { defaultValue: stars }
      )}`,
      icon: <ProgressionBadge value={step} />,
    }
  })
  const numbers = (values: readonly number[]) =>
    values.map((value) => ({ value: String(value), label: String(value) }))
  const toNumber = (value: string | null) =>
    value === null ? null : Number(value)
  const asText = (value: number | null) =>
    value === null ? null : String(value)
  const grid =
    layout === "panel"
      ? "grid-flow-row-dense [grid-template-columns:repeat(auto-fit,minmax(10rem,1fr))]"
      : "grid-cols-1"
  const wide = layout === "panel" ? "col-span-2" : undefined

  return (
    <div
      className="grid gap-4"
      role="group"
      aria-label={label("filters")}
      data-testid="collection-filter-fields"
    >
      <FieldGroup title={label("groupUnit")} className={grid}>
        <Field label={label("alliance")}>
          {(id) => (
            <PlainSelect
              id={id}
              value={query.alliance}
              anyLabel={label("allAlliances")}
              options={collectionAlliances.map((alliance) => ({
                value: alliance,
                label: t(`alliances.${alliance}`),
              }))}
              onChange={(value) =>
                update({
                  alliance: isCollectionAlliance(value) ? value : null,
                })
              }
            />
          )}
        </Field>
        <Field label={label("faction")} labelsControl={false}>
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
                    src={factionIcon(faction.id)}
                    alt={faction.name}
                    className="size-5"
                  />
                ),
              }))}
              value={query.factions}
              onChange={(next) => update({ factions: next })}
              data-testid="collection-faction-filter"
            />
          )}
        </Field>
        <Field label={label("rarity")} labelsControl={false}>
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
                  icon: (
                    <img
                      src={rarityIcon(rarity)}
                      alt={name}
                      className="size-5"
                    />
                  ),
                }
              })}
              value={query.rarities}
              onChange={(next) => update({ rarities: next })}
              data-testid="collection-rarity-filter"
            />
          )}
        </Field>
        <RangeField
          label={label("rankRange")}
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
            value={query.rankMin ?? undefined}
            onChange={(rank) => update({ rankMin: rank ?? null })}
            disabled={!rosterAvailable}
            data-testid="collection-rank-min-filter"
          />
          <SearchableSelect
            label={label("rankTo")}
            placeholder={label("anyRank")}
            clearLabel={label("clearRankTo")}
            searchPlaceholder={label("searchRanks")}
            emptyText={label("noRanks")}
            options={rankOptions}
            value={query.rankMax ?? undefined}
            onChange={(rank) => update({ rankMax: rank ?? null })}
            disabled={!rosterAvailable}
            data-testid="collection-rank-max-filter"
          />
        </RangeField>
        <RangeField
          label={label("starsRange")}
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
            value={query.starsMin ?? undefined}
            onChange={(step) => update({ starsMin: step ?? null })}
            disabled={!rosterAvailable}
            data-testid="collection-stars-min-filter"
          />
          <SearchableSelect
            label={label("starsTo")}
            placeholder={label("anyStars")}
            clearLabel={label("clearStarsTo")}
            searchPlaceholder={label("searchStars")}
            emptyText={label("noStars")}
            options={starOptions}
            value={query.starsMax ?? undefined}
            onChange={(step) => update({ starsMax: step ?? null })}
            disabled={!rosterAvailable}
            data-testid="collection-stars-max-filter"
          />
        </RangeField>
        <Field label={label("ownership")}>
          {(id) => (
            <PlainSelect
              id={id}
              value={query.ownership}
              anyLabel={label("ownershipAll")}
              options={collectionOwnerships.map((ownership) => ({
                value: ownership,
                label: label(ownership),
              }))}
              onChange={(value) =>
                update({
                  ownership: isCollectionOwnership(value) ? value : null,
                })
              }
              disabled={!rosterAvailable}
              describedBy={rosterNote}
            />
          )}
        </Field>
        <Field label={label("kind")}>
          {(id) => (
            <PlainSelect
              id={id}
              value={query.kind}
              anyLabel={label("kindAll")}
              options={collectionKinds.map((kind) => ({
                value: kind,
                label: label(kind),
              }))}
              onChange={(value) =>
                update({ kind: isCollectionKind(value) ? value : null })
              }
            />
          )}
        </Field>
        {rosterAvailable ? null : (
          <p
            id={noteId}
            className="col-span-full text-xs text-muted-foreground"
          >
            {label("needsRoster")}
          </p>
        )}
      </FieldGroup>
      <FieldGroup title={label("groupCombat")} className={grid}>
        <Field label={label("attackType")}>
          {(id) => (
            <PlainSelect
              id={id}
              value={query.attack}
              anyLabel={label("attackAny")}
              options={collectionAttackTypes.map((attack) => ({
                value: attack,
                label: label(`attackTypes.${attack}`),
              }))}
              onChange={(value) =>
                update({
                  attack: isCollectionAttackType(value) ? value : null,
                })
              }
            />
          )}
        </Field>
        <RangeField label={label("hitsRange")} className={wide}>
          <PlainSelect
            ariaLabel={label("hitsFrom")}
            value={asText(query.hitsMin)}
            anyLabel={label("anyValue")}
            options={numbers(options.hits)}
            onChange={(value) => update({ hitsMin: toNumber(value) })}
          />
          <PlainSelect
            ariaLabel={label("hitsTo")}
            value={asText(query.hitsMax)}
            anyLabel={label("anyValue")}
            options={numbers(options.hits)}
            onChange={(value) => update({ hitsMax: toNumber(value) })}
          />
        </RangeField>
        <Field label={label("movement")}>
          {(id) => (
            <PlainSelect
              id={id}
              value={asText(query.movement)}
              anyLabel={label("anyValue")}
              options={numbers(options.movements)}
              onChange={(value) => update({ movement: toNumber(value) })}
            />
          )}
        </Field>
        <RangeField label={label("attackRange")} className={wide}>
          <PlainSelect
            ariaLabel={label("rangeFrom")}
            value={asText(query.rangeMin)}
            anyLabel={label("anyValue")}
            options={numbers(options.ranges)}
            onChange={(value) => update({ rangeMin: toNumber(value) })}
          />
          <PlainSelect
            ariaLabel={label("rangeTo")}
            value={asText(query.rangeMax)}
            anyLabel={label("anyValue")}
            options={numbers(options.ranges)}
            onChange={(value) => update({ rangeMax: toNumber(value) })}
          />
        </RangeField>
        <Field label={label("damageTypes")} labelsControl={false}>
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
                    src={damageTypeIcon(type.id)}
                    alt={type.name}
                    className="size-5"
                  />
                ),
              }))}
              value={query.damageTypes}
              onChange={(next) => update({ damageTypes: next })}
              data-testid="collection-damage-type-filter"
            />
          )}
        </Field>
        <Field label={label("traits")} labelsControl={false}>
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
                    src={traitIcon(trait.id)}
                    alt={trait.name}
                    className="size-5"
                  />
                ),
              }))}
              value={query.traits}
              onChange={(next) => update({ traits: next })}
              data-testid="collection-trait-filter"
            />
          )}
        </Field>
        <Field label={label("shardSource")} labelsControl={false}>
          {() => (
            <MultiSelect
              label={label("shardSource")}
              placeholder={label("allShardSources")}
              clearLabel={label("clearShardSources")}
              options={options.shardSources.map((source) => ({
                value: source,
                label: label(`shardSources.${source}`),
              }))}
              value={query.shardSources}
              onChange={(next) => update({ shardSources: next })}
              data-testid="collection-shard-source-filter"
            />
          )}
        </Field>
      </FieldGroup>
    </div>
  )
}

/** A captioned group of filter controls; `className` lays out its grid. */
function FieldGroup({
  title,
  className,
  children,
}: {
  title: string
  className?: string
  children: React.ReactNode
}) {
  const id = useId()
  return (
    <section className="grid gap-2" aria-labelledby={id}>
      <h3 id={id} className="text-xs font-medium tracking-wide uppercase">
        {title}
      </h3>
      <div className={cn("grid gap-3", className)}>{children}</div>
    </section>
  )
}

/**
 * Both ends of a range in one cell, under one caption, joined by "to". The ends name themselves
 * (each control's own label); the cell is a group named by the caption.
 */
function RangeField({
  label,
  describedBy,
  className,
  children,
}: {
  label: string
  describedBy?: string
  className?: string
  children: [React.ReactNode, React.ReactNode]
}) {
  const { t } = useTranslation("common")
  return (
    <div
      className={cn("grid min-w-0 gap-1.5", className)}
      role="group"
      aria-label={label}
      aria-describedby={describedBy}
    >
      <span aria-hidden="true" className="text-xs text-muted-foreground">
        {label}
      </span>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5">
        {children[0]}
        <span aria-hidden="true" className="text-xs text-muted-foreground">
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
  labelsControl = true,
  children,
}: {
  label: string
  labelsControl?: boolean
  children: (id: string) => React.ReactNode
}) {
  const id = useId()
  return (
    <div className="grid min-w-0 gap-1.5">
      {labelsControl ? (
        <Label htmlFor={id} className="text-xs text-muted-foreground">
          {label}
        </Label>
      ) : (
        <span aria-hidden="true" className="text-xs text-muted-foreground">
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
  options: { value: string; label: string }[]
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
        className="w-full min-w-0 *:data-[slot=select-value]:block *:data-[slot=select-value]:truncate"
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
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
