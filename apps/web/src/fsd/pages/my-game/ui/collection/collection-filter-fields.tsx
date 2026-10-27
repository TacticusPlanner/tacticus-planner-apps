import { useId, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { factionIcon, rarityIcon } from "@workspace/game-catalog"
import { rankOrder, rarityOrder, type Rank } from "@workspace/game-domain"
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
  RankBadge,
  SearchableSelect,
  type SelectOption,
} from "@/shared/ui"

import {
  collectionAlliances,
  collectionKinds,
  collectionOwnerships,
  isCollectionAlliance,
  isCollectionKind,
  isCollectionOwnership,
  type CollectionQuery,
} from "../../model/collection-query"
import type { CollectionFactionOption } from "../../model/use-collection-factions"

const ANY = "__any__"

/**
 * The standalone filter controls, shared by the desktop inline panel and the mobile sheet. Rank
 * range and ownership read the synced roster, so without one they are disabled and explained.
 */
export function CollectionFilterFields({
  query,
  update,
  factions,
  rosterAvailable,
  className,
}: {
  query: CollectionQuery
  update: (patch: Partial<CollectionQuery>) => void
  factions: readonly CollectionFactionOption[]
  rosterAvailable: boolean
  className?: string
}) {
  const { t } = useTranslation(["common", "progression"])
  const noteId = useId()
  const rosterNote = rosterAvailable ? undefined : noteId

  const rankOptions: SelectOption<Rank>[] = rankOrder.map((rank) => ({
    value: rank,
    label: t(`progression:ranks.${rank}`, { defaultValue: rank }),
    icon: <RankBadge rank={rank} showLabel={false} iconClassName="size-5" />,
  }))

  return (
    <div
      className={cn("grid gap-3", className)}
      role="group"
      aria-label={t("myGame.collection.toolbar.filters")}
      data-testid="collection-filter-fields"
    >
      <Field label={t("myGame.collection.toolbar.alliance")}>
        {(id) => (
          <PlainSelect
            id={id}
            value={query.alliance}
            anyLabel={t("myGame.collection.toolbar.allAlliances")}
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
      <Field
        label={t("myGame.collection.toolbar.faction")}
        labelsControl={false}
      >
        {() => (
          <MultiSelect
            label={t("myGame.collection.toolbar.faction")}
            placeholder={t("myGame.collection.toolbar.allFactions")}
            searchPlaceholder={t("myGame.collection.toolbar.searchFactions")}
            emptyText={t("myGame.collection.toolbar.noFactions")}
            options={factions.map((faction) => ({
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
      <Field
        label={t("myGame.collection.toolbar.rarity")}
        labelsControl={false}
      >
        {() => (
          <MultiSelect
            label={t("myGame.collection.toolbar.rarity")}
            placeholder={t("myGame.collection.toolbar.allRarities")}
            options={rarityOrder.map((rarity) => {
              const label = t(`progression:rarities.${rarity}`, {
                defaultValue: rarity,
              })
              return {
                value: rarity,
                label,
                icon: (
                  <img
                    src={rarityIcon(rarity)}
                    alt={label}
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
      <div
        className="contents"
        role="group"
        aria-label={t("myGame.collection.toolbar.rankRange")}
        aria-describedby={rosterNote}
      >
        <Field
          label={t("myGame.collection.toolbar.rankFrom")}
          labelsControl={false}
        >
          {() => (
            <SearchableSelect
              label={t("myGame.collection.toolbar.rankFrom")}
              placeholder={t("myGame.collection.toolbar.anyRank")}
              clearLabel={t("myGame.collection.toolbar.clearRankFrom")}
              searchPlaceholder={t("myGame.collection.toolbar.searchRanks")}
              emptyText={t("myGame.collection.toolbar.noRanks")}
              options={rankOptions}
              value={query.rankMin ?? undefined}
              onChange={(rank) => update({ rankMin: rank ?? null })}
              disabled={!rosterAvailable}
              data-testid="collection-rank-min-filter"
            />
          )}
        </Field>
        <Field
          label={t("myGame.collection.toolbar.rankTo")}
          labelsControl={false}
        >
          {() => (
            <SearchableSelect
              label={t("myGame.collection.toolbar.rankTo")}
              placeholder={t("myGame.collection.toolbar.anyRank")}
              clearLabel={t("myGame.collection.toolbar.clearRankTo")}
              searchPlaceholder={t("myGame.collection.toolbar.searchRanks")}
              emptyText={t("myGame.collection.toolbar.noRanks")}
              options={rankOptions}
              value={query.rankMax ?? undefined}
              onChange={(rank) => update({ rankMax: rank ?? null })}
              disabled={!rosterAvailable}
              data-testid="collection-rank-max-filter"
            />
          )}
        </Field>
      </div>
      <Field label={t("myGame.collection.toolbar.ownership")}>
        {(id) => (
          <PlainSelect
            id={id}
            value={query.ownership}
            anyLabel={t("myGame.collection.toolbar.ownershipAll")}
            options={collectionOwnerships.map((ownership) => ({
              value: ownership,
              label: t(`myGame.collection.toolbar.${ownership}`),
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
      <Field label={t("myGame.collection.toolbar.kind")}>
        {(id) => (
          <PlainSelect
            id={id}
            value={query.kind}
            anyLabel={t("myGame.collection.toolbar.kindAll")}
            options={collectionKinds.map((kind) => ({
              value: kind,
              label: t(`myGame.collection.toolbar.${kind}`),
            }))}
            onChange={(value) =>
              update({ kind: isCollectionKind(value) ? value : null })
            }
          />
        )}
      </Field>
      {rosterAvailable ? null : (
        <p id={noteId} className="col-span-full text-xs text-muted-foreground">
          {t("myGame.collection.toolbar.needsRoster")}
        </p>
      )}
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
  value,
  anyLabel,
  options,
  onChange,
  disabled,
  describedBy,
}: {
  id: string
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
        className="w-full"
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
