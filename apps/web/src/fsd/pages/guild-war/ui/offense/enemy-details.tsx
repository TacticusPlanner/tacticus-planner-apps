import { useTranslation } from "react-i18next"
import { X } from "lucide-react"
import { characterIcon, mowIcon } from "@workspace/game-catalog"
import { groupByFaction, rankOrder, rarityOrder } from "@workspace/game-domain"
import type { FactionId, UnitId } from "@workspace/game-domain"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { IconButton } from "@workspace/ui/components/icon-button"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import type { PickerUnit } from "@/features/team-editor"
import { EntityIcon, UnitCombobox } from "@/shared/ui"
import { useUnitName } from "@/shared/unit-name"

import type { GuildWarSeason } from "../../lib/season"
import { MAX_ENEMY_CHARACTERS, enemyUnit } from "../../model/enemy-draft"
import type { EnemyDraft } from "../../model/enemy-draft"
import type { GuildWarEnemyUnit } from "../../model/types"
import { useGuildWarNames } from "../../model/use-guild-war-names"

const ANY = "any"

/** A select whose first choice ("Not noted") clears it. */
function OptionalSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  noneLabel,
  testId,
}: {
  label: string
  value: T | null
  options: readonly { value: T; label: string; icon?: string }[]
  onChange: (value: T | null) => void
  noneLabel: string
  testId: string
}) {
  return (
    <Select
      onValueChange={(next) =>
        onChange(options.find((option) => option.value === next)?.value ?? null)
      }
      value={value ?? ANY}
    >
      <SelectTrigger aria-label={label} className="w-full" data-testid={testId}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectItem value={ANY}>{noneLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.icon ? (
              <EntityIcon alt="" size="icon" src={option.icon} />
            ) : null}
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** One enemy unit: who, its rarity and rank when noted, and whether it was killed or left
 *  damaged. */
function EnemyUnitRow({
  unit,
  kind,
  onChange,
  onRemove,
}: {
  unit: GuildWarEnemyUnit
  kind: "character" | "mow"
  onChange: (unit: GuildWarEnemyUnit) => void
  onRemove: () => void
}) {
  const { t } = useTranslation(["guildWar", "progression"])
  const unitName = useUnitName()
  const name = unitName(kind === "mow" ? "Mow" : "Character", unit.unitId)
  const id = unit.unitId as UnitId
  return (
    <li
      aria-label={name}
      className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-lg border p-2 @lg:grid-cols-[auto_minmax(0,1fr)_repeat(3,minmax(0,8rem))_auto]"
      data-testid="guild-war-enemy-unit"
    >
      <EntityIcon
        alt=""
        size="portrait-sm"
        src={kind === "mow" ? mowIcon(id) : characterIcon(id)}
      />
      <span className="min-w-0 truncate text-sm font-medium">{name}</span>
      <IconButton
        className="@lg:order-last"
        label={t("enemy.remove", { name })}
        onClick={onRemove}
        size="icon-sm"
        variant="ghost"
      >
        <X />
      </IconButton>
      <div className="col-span-3 grid grid-cols-3 gap-2 @lg:col-span-3">
        <OptionalSelect
          label={t("enemy.rarity", { name })}
          noneLabel={t("enemy.rarityAny")}
          onChange={(rarity) => onChange({ ...unit, rarity })}
          options={rarityOrder.map((rarity) => ({
            value: rarity,
            label: t(`progression:rarities.${rarity}`),
          }))}
          testId="guild-war-enemy-rarity"
          value={unit.rarity}
        />
        {kind === "character" ? (
          <OptionalSelect
            label={t("enemy.rank", { name })}
            noneLabel={t("enemy.rankAny")}
            onChange={(rank) => onChange({ ...unit, rank })}
            options={rankOrder.map((rank) => ({
              value: rank,
              label: t(`progression:ranks.${rank}`),
            }))}
            testId="guild-war-enemy-rank"
            value={unit.rank}
          />
        ) : (
          <span />
        )}
        <OptionalSelect
          label={t("enemy.state", { name })}
          noneLabel={t("enemy.stateAny")}
          onChange={(state) => onChange({ ...unit, state })}
          options={(["killed", "damaged"] as const).map((state) => ({
            value: state,
            label: t(`enemy.states.${state}`),
          }))}
          testId="guild-war-enemy-state"
          value={unit.state}
        />
      </div>
    </li>
  )
}

/**
 * The optional enemy details of an attack: the enemy lineup (any catalog character and MoW, each
 * with rarity, rank and whether it was killed or left damaged), the zone buffs that were active and
 * the map.
 */
export function EnemyDetails({
  value,
  onChange,
  units,
  season,
}: {
  value: EnemyDraft
  onChange: (value: EnemyDraft) => void
  units: readonly PickerUnit[]
  season: GuildWarSeason | undefined
}) {
  const { t } = useTranslation(["guildWar", "factions"])
  const { buffName } = useGuildWarNames()
  const factionName = (id: string) => t(`factions:${id}`, { defaultValue: id })
  const groupsOf = (kind: PickerUnit["kind"], taken: readonly string[]) =>
    groupByFaction(
      units
        .filter((unit) => unit.kind === kind && !taken.includes(unit.id))
        .map((unit) => ({
          id: unit.id as UnitId,
          name: unit.name,
          faction: unit.faction as FactionId,
        })),
      factionName
    )
  const takenCharacters = value.characters.map((unit) => unit.unitId)
  const characterGroups = groupsOf("character", takenCharacters)
  const mowGroups = groupsOf("mow", [])

  const setCharacter = (index: number, unit: GuildWarEnemyUnit) =>
    onChange({
      ...value,
      characters: value.characters.map((entry, at) =>
        at === index ? unit : entry
      ),
    })

  return (
    <div className="flex flex-col gap-4" data-testid="guild-war-enemy">
      <div className="flex flex-col gap-2">
        <Label className="text-sm text-muted-foreground">
          {t("enemy.characters")}
        </Label>
        {value.characters.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {value.characters.map((unit, index) => (
              <EnemyUnitRow
                key={unit.unitId}
                kind="character"
                onChange={(next) => setCharacter(index, next)}
                onRemove={() =>
                  onChange({
                    ...value,
                    characters: value.characters.filter(
                      (_, at) => at !== index
                    ),
                  })
                }
                unit={unit}
              />
            ))}
          </ul>
        ) : null}
        {value.characters.length < MAX_ENEMY_CHARACTERS ? (
          <UnitCombobox
            emptyText={t("enemy.noUnit")}
            groups={characterGroups}
            onChange={(id) =>
              onChange({
                ...value,
                characters: [...value.characters, enemyUnit(id)],
              })
            }
            placeholder={t("enemy.addCharacter")}
          />
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <Label className="text-sm text-muted-foreground">
          {t("enemy.mow")}
        </Label>
        {value.mow ? (
          <ul>
            <EnemyUnitRow
              kind="mow"
              onChange={(mow) => onChange({ ...value, mow })}
              onRemove={() => onChange({ ...value, mow: null })}
              unit={value.mow}
            />
          </ul>
        ) : (
          <UnitCombobox
            emptyText={t("enemy.noUnit")}
            groups={mowGroups}
            icon={mowIcon}
            onChange={(id) => onChange({ ...value, mow: enemyUnit(id) })}
            placeholder={t("enemy.addMow")}
          />
        )}
      </div>
      {season && season.buffs.length > 0 ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm text-muted-foreground">
            {t("enemy.buffs")}
          </legend>
          <div className="grid gap-2 @md:grid-cols-2">
            {season.buffs.map((buff) => {
              const checked = value.buffIds.includes(buff.id)
              return (
                <Label
                  className="flex items-center gap-2 text-sm font-normal"
                  key={buff.id}
                >
                  <Checkbox
                    checked={checked}
                    data-testid={`guild-war-buff-${buff.id}`}
                    onCheckedChange={(next) =>
                      onChange({
                        ...value,
                        buffIds:
                          next === true
                            ? [...value.buffIds, buff.id]
                            : value.buffIds.filter((id) => id !== buff.id),
                      })
                    }
                  />
                  {buffName(buff.id)}
                </Label>
              )
            })}
          </div>
        </fieldset>
      ) : null}
      {season && season.maps.length > 0 ? (
        <div className="flex flex-col gap-2">
          <Label className="text-sm text-muted-foreground">
            {t("enemy.map")}
          </Label>
          <OptionalSelect
            label={t("enemy.map")}
            noneLabel={t("enemy.mapAny")}
            onChange={(boardId) => onChange({ ...value, boardId })}
            options={season.maps.map((map, index) => ({
              value: map.boardId,
              label: t("enemy.mapOption", { number: index + 1 }),
            }))}
            testId="guild-war-enemy-map"
            value={value.boardId}
          />
        </div>
      ) : null}
    </div>
  )
}
