import { useId, useState } from "react"
import { useTranslation } from "react-i18next"
import { Skull } from "lucide-react"
import {
  guildWarBuffIcon,
  guildWarZoneIcon,
  rarityIcon,
} from "@workspace/game-catalog"
import type { Rarity } from "@workspace/game-domain"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import { Button } from "@workspace/ui/components/button"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { cn } from "@workspace/ui/lib/utils"

import { TeamUnitPortrait, teamUnitView } from "@/entities/team"
import type { TeamRoster } from "@/entities/team"
import type { PickerUnit } from "@/features/team-editor"
import {
  EntityIcon,
  FilterField,
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  SegmentedControl,
} from "@/shared/ui"
import { useUnitName } from "@/shared/unit-name"

import { zonesByTier } from "../../lib/season"
import type { GuildWarSeason } from "../../lib/season"
import { attackFields, GUILD_WAR_NOTES_MAX } from "../../model/attack-draft"
import type { ResultChoice } from "../../model/attack-draft"
import {
  likelyRarity,
  useLastZone,
  zoneRarities,
} from "../../model/attack-target"
import { cappedView } from "../../model/capped-view"
import { EMPTY_ENEMY } from "../../model/enemy-draft"
import type { EnemyDraft } from "../../model/enemy-draft"
import type { Selection } from "../../model/offense"
import type { GuildWarAttackFields } from "../../model/types"
import { useGuildWarNames } from "../../model/use-guild-war-names"
import { EnemyDetails } from "./enemy-details"

/** The zone picker: zones grouped by their tier at the war's level, each with its picture and buff. */
function ZoneSelect({
  season,
  battlefieldLevel,
  value,
  onChange,
}: {
  season: GuildWarSeason | undefined
  battlefieldLevel: number
  value: string | null
  onChange: (zoneId: string) => void
}) {
  const { t } = useTranslation("guildWar")
  const { zoneName, tierName, buffName } = useGuildWarNames()
  const groups = season ? zonesByTier(season, battlefieldLevel) : []
  return (
    <FilterField label={t("target.zone")}>
      {({ id, labelId }) => (
        <Select disabled={!season} onValueChange={onChange} value={value ?? ""}>
          <SelectTrigger aria-labelledby={labelId} className="w-full" id={id}>
            <SelectValue placeholder={t("target.zonePlaceholder")} />
          </SelectTrigger>
          <SelectContent position="popper">
            {groups.map((group) => (
              <SelectGroup key={group.tierId}>
                <SelectLabel>{tierName(group.tierId)}</SelectLabel>
                {group.zones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id}>
                    <EntityIcon
                      alt=""
                      className="object-contain"
                      size="icon-md"
                      src={guildWarZoneIcon(zone.visualId)}
                    />
                    {zoneName(season, zone.id)}
                    {zone.buffId ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <EntityIcon
                          alt=""
                          size="icon-sm"
                          src={guildWarBuffIcon(zone.buffId)}
                        />
                        {buffName(zone.buffId)}
                      </span>
                    ) : null}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      )}
    </FilterField>
  )
}

/** The lineup, capped at the defenders' rarity; once there is a result, a tap marks a unit lost. */
function LineupPicker({
  selection,
  roster,
  rarity,
  lostIds,
  onLostChange,
}: {
  selection: Selection
  roster: TeamRoster | null
  rarity: Rarity | undefined
  lostIds: ReadonlySet<string> | null
  onLostChange: (unitIds: ReadonlySet<string>) => void
}) {
  const { t } = useTranslation("guildWar")
  const unitName = useUnitName()
  const units = [...selection].map(([id, kind]) => ({
    id,
    name: unitName(kind === "mow" ? "Mow" : "Character", id),
    portrait: (
      <TeamUnitPortrait
        className={cn(lostIds?.has(id) && "opacity-60 grayscale")}
        size="portrait-md"
        unit={
          rarity
            ? cappedView(kind, id, roster, rarity)
            : teamUnitView(kind, id, roster)
        }
      />
    ),
  }))
  if (!lostIds) {
    return (
      <ul aria-label={t("attack.lineup")} className="flex flex-wrap gap-2">
        {units.map((unit) => (
          <li aria-label={unit.name} key={unit.id}>
            {unit.portrait}
          </li>
        ))}
      </ul>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">{t("log.tapLost")}</p>
      <ToggleGroup
        aria-label={t("log.tapLost")}
        className="flex-wrap"
        onValueChange={(ids) => onLostChange(new Set(ids))}
        spacing={2}
        type="multiple"
        value={[...lostIds]}
      >
        {units.map((unit) => (
          <ToggleGroupItem
            aria-label={t("log.markLost", { name: unit.name })}
            className="relative h-auto p-0.5"
            key={unit.id}
            value={unit.id}
          >
            {unit.portrait}
            {lostIds.has(unit.id) ? (
              <Skull
                aria-hidden="true"
                className="absolute -top-1 -left-1 size-icon-sm rounded-full bg-background p-0.5 text-destructive"
              />
            ) : null}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

/**
 * Log attack (a bottom sheet on phones): the zone (the last one attacked to start) and the
 * defenders' rarity (the slot), the lineup at that cap, an optional result with the units lost,
 * a short note, and the collapsed optional Enemy details.
 */
export function LogAttackDialog({
  open,
  onOpenChange,
  selection,
  roster,
  units,
  season,
  battlefieldLevel,
  pending,
  error,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  selection: Selection
  roster: TeamRoster | null
  units: readonly PickerUnit[]
  season: GuildWarSeason | undefined
  battlefieldLevel: number
  pending: boolean
  error: string | null
  onSave: (fields: GuildWarAttackFields) => void
}) {
  const { t } = useTranslation(["guildWar", "progression"])
  const notesId = useId()
  const [lastZone, setLastZone] = useLastZone(season)
  const [zoneId, setZoneId] = useState<string | null>(lastZone)
  const [picked, setPicked] = useState<Rarity | null>(null)
  const [result, setResult] = useState<ResultChoice>("none")
  const [lost, setLost] = useState<ReadonlySet<string>>(() => new Set())
  const [notes, setNotes] = useState("")
  const [enemy, setEnemy] = useState<EnemyDraft>(EMPTY_ENEMY)

  const rarities = zoneRarities(season, battlefieldLevel, zoneId)
  const target =
    rarities.find((entry) => entry.rarity === picked) ??
    rarities.find(
      (entry) => entry.rarity === likelyRarity(rarities, selection, roster)
    )

  const save = () => {
    if (zoneId === null || !target) return
    setLastZone(zoneId)
    onSave(
      attackFields({
        selection,
        roster,
        zoneId,
        slot: target.slot,
        result,
        lostIds: lost,
        notes,
        enemy,
      })
    )
  }

  return (
    <ResponsiveDialog
      data-testid="guild-war-log-dialog"
      onOpenChange={onOpenChange}
      open={open}
      width="form"
    >
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>{t("log.title")}</ResponsiveDialogTitle>
      </ResponsiveDialogHeader>
      <ResponsiveDialogBody className="gap-5">
        <div className="flex flex-col gap-3">
          <ZoneSelect
            battlefieldLevel={battlefieldLevel}
            onChange={(next) => {
              setZoneId(next)
              setPicked(null)
            }}
            season={season}
            value={zoneId}
          />
          {target ? (
            <SegmentedControl
              label={t("log.rarity")}
              onValueChange={(next) => setPicked(next)}
              options={rarities.map((entry) => ({
                value: entry.rarity,
                label: t(`progression:rarities.${entry.rarity}`),
                icon: (
                  <EntityIcon
                    alt=""
                    size="icon"
                    src={rarityIcon(entry.rarity)}
                  />
                ),
                testId: `guild-war-rarity-${entry.rarity}`,
              }))}
              testId="guild-war-log-rarity"
              value={target.rarity}
            />
          ) : null}
        </div>
        <LineupPicker
          lostIds={result === "none" ? null : lost}
          onLostChange={setLost}
          rarity={target?.rarity}
          roster={roster}
          selection={selection}
        />
        <SegmentedControl
          label={t("log.result")}
          onValueChange={setResult}
          options={[
            { value: "none", label: t("log.resultNone") },
            { value: "won", label: t("log.resultWon") },
            { value: "lost", label: t("log.resultLost") },
          ]}
          testId="guild-war-log-result"
          value={result}
        />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={notesId}>{t("log.notes")}</Label>
          <Textarea
            id={notesId}
            maxLength={GUILD_WAR_NOTES_MAX}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={t("log.notesPlaceholder")}
            rows={2}
            value={notes}
          />
          <p className="text-right text-xs text-muted-foreground tabular-nums">
            {t("log.notesCount", {
              count: notes.length,
              max: GUILD_WAR_NOTES_MAX,
            })}
          </p>
        </div>
        <Accordion collapsible type="single">
          <AccordionItem value="enemy">
            <AccordionTrigger data-testid="guild-war-enemy-toggle">
              {t("log.enemyDetails")}
            </AccordionTrigger>
            <AccordionContent>
              <EnemyDetails
                onChange={setEnemy}
                season={season}
                units={units}
                value={enemy}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        <Button onClick={() => onOpenChange(false)} variant="outline">
          {t("log.cancel")}
        </Button>
        <Button disabled={pending || zoneId === null || !target} onClick={save}>
          {t("log.save")}
        </Button>
      </ResponsiveDialogFooter>
    </ResponsiveDialog>
  )
}
