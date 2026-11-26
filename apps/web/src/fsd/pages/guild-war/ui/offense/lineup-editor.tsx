import { useTranslation } from "react-i18next"
import { X } from "lucide-react"
import { mowIcon } from "@workspace/game-catalog"
import { groupByFaction } from "@workspace/game-domain"
import type { FactionId, Rarity, UnitId } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import { IconButton } from "@workspace/ui/components/icon-button"

import { TeamUnitPortrait } from "@/entities/team"
import type { TeamUnitView } from "@/entities/team"
import type { PickerUnit } from "@/features/team-editor"
import { UnitCombobox } from "@/shared/ui"
import { useUnitName } from "@/shared/unit-name"

import { addableUnits, lineupHasCharacter } from "../../model/lineup-edit"
import type { Selection, UnitKind } from "../../model/offense"

/**
 * The attack's lineup being changed: each unit with a remove button, then a character and a
 * Machine of War to add from the owned units no other attack of the war used (`addableUnits`),
 * while the lineup has room. Done goes back to marking the units lost.
 */
export function LineupEditor({
  picks,
  onPicksChange,
  units,
  taken,
  rarity,
  view,
  onDone,
}: {
  picks: Selection
  onPicksChange: (picks: Selection) => void
  units: readonly PickerUnit[]
  /** Units another attack of the war used. */
  taken: ReadonlySet<string>
  rarity: Rarity | undefined
  view: (id: string, kind: UnitKind, cap: Rarity | undefined) => TeamUnitView
  onDone: () => void
}) {
  const { t } = useTranslation(["guildWar", "factions"])
  const unitName = useUnitName()
  const factionName = (id: string) => t(`factions:${id}`, { defaultValue: id })
  const groupsOf = (kind: UnitKind) =>
    groupByFaction(
      addableUnits(units, kind, picks, taken).map((unit) => ({
        id: unit.id as UnitId,
        name: unit.name,
        faction: unit.faction as FactionId,
      })),
      factionName
    )
  const characterGroups = groupsOf("character")
  const mowGroups = groupsOf("mow")
  const add = (id: string, kind: UnitKind) =>
    onPicksChange(new Map([...picks, [id, kind]]))
  const remove = (id: string) =>
    onPicksChange(new Map([...picks].filter(([pick]) => pick !== id)))

  return (
    <div className="flex flex-col gap-3" data-testid="guild-war-lineup-editor">
      <ul aria-label={t("log.lineup")} className="flex flex-wrap gap-2">
        {[...picks].map(([id, kind]) => {
          const name = unitName(kind === "mow" ? "Mow" : "Character", id)
          return (
            // The remove button sits beside the portrait, over its corner.
            <li className="relative p-0.5" key={id}>
              <TeamUnitPortrait
                size="portrait-md"
                unit={view(id, kind, rarity)}
              />
              <IconButton
                className="absolute -top-1 -right-1 rounded-full bg-background"
                label={t("log.removeUnit", { name })}
                onClick={() => remove(id)}
                size="icon-xs"
                variant="outline"
              >
                <X />
              </IconButton>
            </li>
          )
        })}
      </ul>
      {lineupHasCharacter(picks) ? null : (
        <p className="text-sm text-destructive" role="alert">
          {t("log.needCharacter")}
        </p>
      )}
      <div className="grid gap-2 @md:grid-cols-2">
        {characterGroups.length > 0 ? (
          <UnitCombobox
            emptyText={t("enemy.noUnit")}
            groups={characterGroups}
            onChange={(id) => add(id, "character")}
            placeholder={t("log.addCharacter")}
          />
        ) : null}
        {mowGroups.length > 0 ? (
          <UnitCombobox
            emptyText={t("enemy.noUnit")}
            groups={mowGroups}
            icon={mowIcon}
            onChange={(id) => add(id, "mow")}
            placeholder={t("log.addMow")}
          />
        ) : null}
      </div>
      <Button
        className="self-start"
        disabled={!lineupHasCharacter(picks)}
        onClick={onDone}
        size="sm"
        variant="outline"
      >
        {t("log.lineupDone")}
      </Button>
    </div>
  )
}
