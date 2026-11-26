import { useId, useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown, Skull, Trophy } from "lucide-react"
import { rarityIcon } from "@workspace/game-catalog"
import type { Rarity } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { cn } from "@workspace/ui/lib/utils"

import { TeamUnitPortrait } from "@/entities/team"
import type { TeamRoster, TeamUnitView } from "@/entities/team"
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

import { zoneKindId } from "../../lib/season"
import type { GuildWarSeason } from "../../lib/season"
import {
  attackDetails,
  attackFields,
  editedAttackFields,
  GUILD_WAR_NOTES_MAX,
  NO_DETAILS,
} from "../../model/attack-draft"
import type { AttackDetails } from "../../model/attack-draft"
import { capEnemy } from "../../model/enemy-draft"
import { zoneOwnBuff } from "../../model/zone-buffs"
import { editRarities, editTarget } from "../../model/attack-target"
import type { ZoneRarity } from "../../model/attack-target"
import { cappedView, lineupUnitView } from "../../model/capped-view"
import type { Selection, UnitKind } from "../../model/offense"
import { pickRarity } from "../../model/page-target"
import type { GuildWarAttack, GuildWarAttackFields } from "../../model/types"
import { useOverlayContainer } from "../use-overlay-container"
import { EnemyDetails } from "./enemy-details"
import { ZoneOptions } from "./target-fields"

/** One lineup unit as the dialog shows it, at a cap. */
interface LineupEntry {
  id: string
  kind: UnitKind
  view: (cap: Rarity | undefined) => TeamUnitView
}

/** What the dialog logs or edits: a new attack with the page's selection, at the page's zone and
 *  rarity (changing them here changes the page's too, so the next attack starts there), or a
 *  logged attack, whose zone and rarity can be changed here. */
export type LogAttackSubject =
  | {
      kind: "new"
      selection: Selection
      roster: TeamRoster | null
      zoneId: string
      rarities: readonly ZoneRarity[]
      target: ZoneRarity | undefined
      onZoneChange: (zoneId: string) => void
      onRarityChange: (rarity: Rarity) => void
    }
  | { kind: "edit"; attack: GuildWarAttack }

function lineupOf(subject: LogAttackSubject): LineupEntry[] {
  if (subject.kind === "new") {
    return [...subject.selection].map(([id, kind]) => ({
      id,
      kind,
      view: (cap) => cappedView(kind, id, subject.roster, cap),
    }))
  }
  const { attack } = subject
  return [
    ...attack.characters.map((unit) => ({ unit, kind: "character" as const })),
    ...(attack.mow ? [{ unit: attack.mow, kind: "mow" as const }] : []),
  ].map(({ unit, kind }) => ({
    id: unit.unitId,
    kind,
    view: (cap) => lineupUnitView(kind, unit, cap ?? attack.rarityCap),
  }))
}

/** The attack's zone and defenders' rarity. */
function TargetEditor({
  season,
  battlefieldLevel,
  zoneId,
  onZoneChange,
  rarities,
  rarity,
  onRarityChange,
}: {
  season: GuildWarSeason | undefined
  battlefieldLevel: number
  zoneId: string
  onZoneChange: (zoneId: string) => void
  rarities: readonly ZoneRarity[]
  rarity: Rarity | undefined
  onRarityChange: (rarity: Rarity) => void
}) {
  const { t } = useTranslation(["guildWar", "progression"])
  const {
    setTrigger,
    container: overlayContainer,
    onOpenChange: onOverlayOpenChange,
  } = useOverlayContainer()
  return (
    <div className="flex flex-col gap-3">
      <FilterField label={t("target.zone")}>
        {({ id, labelId }) => (
          <Select
            disabled={!season}
            onOpenChange={onOverlayOpenChange}
            onValueChange={onZoneChange}
            value={zoneId}
          >
            <SelectTrigger
              aria-labelledby={labelId}
              className="w-full"
              id={id}
              ref={setTrigger}
            >
              <SelectValue placeholder={t("target.zonePlaceholder")} />
            </SelectTrigger>
            <ZoneOptions
              battlefieldLevel={battlefieldLevel}
              container={overlayContainer}
              season={season}
            />
          </Select>
        )}
      </FilterField>
      {rarity ? (
        <SegmentedControl
          label={t("log.rarity")}
          onValueChange={onRarityChange}
          options={rarities.map((entry) => ({
            value: entry.rarity,
            label: t(`progression:rarities.${entry.rarity}`),
            icon: (
              <EntityIcon alt="" size="icon" src={rarityIcon(entry.rarity)} />
            ),
            testId: `guild-war-rarity-${entry.rarity}`,
          }))}
          testId="guild-war-log-rarity"
          value={rarity}
        />
      ) : null}
    </div>
  )
}

/** The lineup at the defenders' cap, where a tap marks a unit lost. With no result recorded the
 *  same rows show disabled, so switching the result never changes the dialog's height. */
function LineupPicker({
  lineup,
  rarity,
  lostIds,
  disabled,
  onLostChange,
}: {
  lineup: readonly LineupEntry[]
  rarity: Rarity | undefined
  lostIds: ReadonlySet<string>
  disabled: boolean
  onLostChange: (unitIds: ReadonlySet<string>) => void
}) {
  const { t } = useTranslation("guildWar")
  const unitName = useUnitName()
  return (
    <div className="flex flex-col gap-2" data-testid="guild-war-log-lineup">
      <p
        className={cn(
          "text-sm text-muted-foreground",
          disabled && "opacity-50"
        )}
      >
        {t("log.tapLost")}
      </p>
      <ToggleGroup
        aria-label={t("log.tapLost")}
        className="flex-wrap"
        disabled={disabled}
        onValueChange={(ids) => onLostChange(new Set(ids))}
        spacing={2}
        type="multiple"
        value={disabled ? [] : [...lostIds]}
      >
        {lineup.map((entry) => {
          const name = unitName(
            entry.kind === "mow" ? "Mow" : "Character",
            entry.id
          )
          const lost = !disabled && lostIds.has(entry.id)
          return (
            <ToggleGroupItem
              aria-label={t("log.markLost", { name })}
              className="relative h-auto p-0.5"
              key={entry.id}
              value={entry.id}
            >
              <TeamUnitPortrait
                className={cn(lost && "opacity-60 grayscale")}
                size="portrait-md"
                unit={entry.view(rarity)}
              />
              {lost ? (
                <Skull
                  aria-hidden="true"
                  className="absolute -top-1 -left-1 size-icon-sm rounded-full bg-background p-0.5 text-destructive"
                />
              ) : null}
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>
    </div>
  )
}

/**
 * Log attack with details, or Edit attack (a bottom sheet on phones). A new attack starts at the
 * page's zone and rarity and changes them for the page; an edited one changes only its own, never
 * its lineup. Both note the result
 * with the units lost, a short note, and the optional Enemy details.
 */
export function LogAttackDialog({
  open,
  onOpenChange,
  subject,
  units,
  season,
  battlefieldLevel,
  pending,
  error,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  subject: LogAttackSubject
  units: readonly PickerUnit[]
  season: GuildWarSeason | undefined
  battlefieldLevel: number
  pending: boolean
  error: string | null
  onSave: (fields: GuildWarAttackFields) => void
}) {
  const { t } = useTranslation("guildWar")
  const notesId = useId()
  const enemyId = useId()
  const editing = subject.kind === "edit" ? subject.attack : null
  // A new attack starts as won, the usual outcome; an edited one starts as logged.
  const initial: AttackDetails = editing
    ? attackDetails(editing)
    : { ...NO_DETAILS, result: "won" }
  const [details, setDetails] = useState(initial)
  const [enemyOpen, setEnemyOpen] = useState(initial.enemy !== NO_DETAILS.enemy)
  // Edit only: the attack's zone (as its kind) and its rarity, until changed.
  const [zoneId, setZoneId] = useState(() =>
    editing ? zoneKindId(season, editing.zoneId) : ""
  )
  const [picked, setPicked] = useState<Rarity | undefined>(editing?.rarityCap)
  const [buffsTouched, setBuffsTouched] = useState(editing !== null)

  const lineup = lineupOf(subject)
  const rarities: readonly ZoneRarity[] =
    subject.kind === "new"
      ? subject.rarities
      : editRarities(season, battlefieldLevel, subject.attack, zoneId)
  const target =
    subject.kind === "new" ? subject.target : pickRarity(rarities, picked)
  const targetZoneId = subject.kind === "new" ? subject.zoneId : zoneId
  // A new attack's Enemy details start with the zone's own buff ticked, following the zone until
  // a buff is changed by hand; an edited attack keeps what it logged.
  const ownBuff = zoneOwnBuff(season, targetZoneId)
  const enemy =
    buffsTouched || !enemyOpen
      ? details.enemy
      : { ...details.enemy, buffIds: ownBuff ? [ownBuff] : [] }
  // Noted enemies stay within the defenders' cap, even after it is lowered here.
  const capped = { ...details, enemy: capEnemy(enemy, target?.rarity) }
  const saveTarget =
    subject.kind === "new"
      ? target && { zoneId: subject.zoneId, slot: target.slot }
      : editTarget(subject.attack, season, zoneId, target)
  const set = (patch: Partial<AttackDetails>) =>
    setDetails((current) => ({ ...current, ...patch }))

  const save = () => {
    if (!saveTarget) return
    onSave(
      subject.kind === "new"
        ? attackFields({
            selection: subject.selection,
            roster: subject.roster,
            zoneId: saveTarget.zoneId,
            slot: saveTarget.slot,
            details: capped,
          })
        : editedAttackFields(subject.attack, saveTarget, capped)
    )
  }

  // While a save runs the dialog stays open, so its result never lands on a dialog opened after
  // it (another attack's edit); a failed save keeps the dialog for a retry.
  const requestOpenChange = (next: boolean) => {
    if (!pending) onOpenChange(next)
  }

  return (
    <ResponsiveDialog
      data-testid="guild-war-log-dialog"
      onOpenChange={requestOpenChange}
      open={open}
      width="form"
    >
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>
          {editing ? t("log.editTitle") : t("log.title")}
        </ResponsiveDialogTitle>
      </ResponsiveDialogHeader>
      <ResponsiveDialogBody className="gap-5">
        <TargetEditor
          battlefieldLevel={battlefieldLevel}
          onRarityChange={
            subject.kind === "new" ? subject.onRarityChange : setPicked
          }
          onZoneChange={
            subject.kind === "new" ? subject.onZoneChange : setZoneId
          }
          rarities={rarities}
          rarity={target?.rarity}
          season={season}
          zoneId={subject.kind === "new" ? subject.zoneId : zoneId}
        />
        <LineupPicker
          disabled={details.result === "none"}
          lineup={lineup}
          lostIds={details.lostIds}
          onLostChange={(lostIds) => set({ lostIds })}
          rarity={target?.rarity}
        />
        <SegmentedControl
          label={t("log.result")}
          onValueChange={(result) => set({ result })}
          options={[
            { value: "none", label: t("log.resultNone") },
            {
              value: "won",
              label: t("log.resultWon"),
              icon: <Trophy aria-hidden="true" />,
            },
            {
              value: "lost",
              label: t("log.resultLost"),
              icon: <Skull aria-hidden="true" />,
            },
          ]}
          testId="guild-war-log-result"
          value={details.result}
        />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={notesId}>{t("log.notes")}</Label>
          <Textarea
            id={notesId}
            maxLength={GUILD_WAR_NOTES_MAX}
            onChange={(event) => set({ notes: event.target.value })}
            placeholder={t("log.notesPlaceholder")}
            rows={2}
            value={details.notes}
          />
          <p className="text-right text-xs text-muted-foreground tabular-nums">
            {t("log.notesCount", {
              count: details.notes.length,
              max: GUILD_WAR_NOTES_MAX,
            })}
          </p>
        </div>
        {/* No height animation: the section grows as enemies are added and the body scrolls. */}
        <div className="flex flex-col gap-3 border-t pt-3">
          <Button
            aria-controls={enemyId}
            aria-expanded={enemyOpen}
            className="justify-between"
            onClick={() => setEnemyOpen((current) => !current)}
            variant="ghost"
          >
            {t("log.enemyDetails")}
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "motion-safe:transition-transform",
                enemyOpen && "rotate-180"
              )}
            />
          </Button>
          {enemyOpen ? (
            <div id={enemyId}>
              <EnemyDetails
                defenderRarity={target?.rarity}
                onChange={(next) => {
                  if (next.buffIds !== capped.enemy.buffIds) {
                    setBuffsTouched(true)
                  }
                  set({ enemy: next })
                }}
                season={season}
                units={units}
                value={capped.enemy}
                zoneId={targetZoneId || null}
              />
            </div>
          ) : null}
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        <Button
          disabled={pending}
          onClick={() => requestOpenChange(false)}
          variant="outline"
        >
          {t("log.cancel")}
        </Button>
        <Button disabled={pending || !saveTarget} onClick={save}>
          {editing ? t("log.saveEdit") : t("log.save")}
        </Button>
      </ResponsiveDialogFooter>
    </ResponsiveDialog>
  )
}
