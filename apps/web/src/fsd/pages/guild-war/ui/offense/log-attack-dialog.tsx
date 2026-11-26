import { useId, useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown, Skull } from "lucide-react"
import { guildWarZoneIcon, rarityIcon } from "@workspace/game-catalog"
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
import { editRarities, editTarget } from "../../model/attack-target"
import type { ZoneRarity } from "../../model/attack-target"
import { cappedView, lineupUnitView } from "../../model/capped-view"
import type { Selection, UnitKind } from "../../model/offense"
import { pickRarity } from "../../model/page-target"
import type { GuildWarAttack, GuildWarAttackFields } from "../../model/types"
import { useGuildWarNames } from "../../model/use-guild-war-names"
import { useOverlayContainer } from "../use-overlay-container"
import { EnemyDetails } from "./enemy-details"
import { ZoneOptions } from "./target-fields"

/** One lineup unit as the dialog shows it, at a cap. */
interface LineupEntry {
  id: string
  kind: UnitKind
  view: (cap: Rarity | undefined) => TeamUnitView
}

/** What the dialog logs or edits: a new attack with the page's selection at the page's zone and
 *  rarity, or a logged attack, whose zone and rarity can be changed here. */
export type LogAttackSubject =
  | {
      kind: "new"
      selection: Selection
      roster: TeamRoster | null
      zoneId: string
      target: ZoneRarity
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

/** The zone and defenders' rarity a new attack logs at, read only: they are picked on the page. */
function TargetSummary({
  season,
  zoneId,
  rarity,
}: {
  season: GuildWarSeason | undefined
  zoneId: string
  rarity: Rarity
}) {
  const { t } = useTranslation(["guildWar", "progression"])
  const { zoneName } = useGuildWarNames()
  const visualId = season?.zones.find((zone) => zone.id === zoneId)?.visualId
  return (
    <p
      className="flex items-center gap-1.5 text-sm font-medium"
      data-testid="guild-war-log-target"
    >
      <EntityIcon
        alt=""
        className="object-contain"
        size="icon"
        src={visualId ? guildWarZoneIcon(visualId) : undefined}
      />
      {t("attack.target", {
        zone: zoneName(season, zoneId),
        rarity: t(`progression:rarities.${rarity}`),
      })}
      <EntityIcon alt="" size="icon" src={rarityIcon(rarity)} />
    </p>
  )
}

/** An edited attack's zone and defenders' rarity. */
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

/** The lineup at the defenders' cap; once there is a result, a tap marks a unit lost. */
function LineupPicker({
  lineup,
  rarity,
  lostIds,
  onLostChange,
}: {
  lineup: readonly LineupEntry[]
  rarity: Rarity | undefined
  lostIds: ReadonlySet<string> | null
  onLostChange: (unitIds: ReadonlySet<string>) => void
}) {
  const { t } = useTranslation("guildWar")
  const unitName = useUnitName()
  const units = lineup.map((entry) => ({
    id: entry.id,
    name: unitName(entry.kind === "mow" ? "Mow" : "Character", entry.id),
    portrait: (
      <TeamUnitPortrait
        className={cn(lostIds?.has(entry.id) && "opacity-60 grayscale")}
        size="portrait-md"
        unit={entry.view(rarity)}
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
 * Log attack with details, or Edit attack (a bottom sheet on phones). A new attack logs at the
 * page's zone and rarity; an edited one can change them, but not its lineup. Both note the result
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
  const initial: AttackDetails = editing ? attackDetails(editing) : NO_DETAILS
  const [details, setDetails] = useState(initial)
  const [enemyOpen, setEnemyOpen] = useState(initial.enemy !== NO_DETAILS.enemy)
  // Edit only: the attack's zone (as its kind) and its rarity, until changed.
  const [zoneId, setZoneId] = useState(() =>
    editing ? zoneKindId(season, editing.zoneId) : ""
  )
  const [picked, setPicked] = useState<Rarity | undefined>(editing?.rarityCap)

  const lineup = lineupOf(subject)
  let rarities: ZoneRarity[] = []
  let target: ZoneRarity | undefined
  if (subject.kind === "new") {
    target = subject.target
  } else {
    rarities = editRarities(season, battlefieldLevel, subject.attack, zoneId)
    target = pickRarity(rarities, picked)
  }
  const saveTarget =
    subject.kind === "new"
      ? { zoneId: subject.zoneId, slot: subject.target.slot }
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
            details,
          })
        : editedAttackFields(subject.attack, saveTarget, details)
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
        {subject.kind === "new" ? (
          <TargetSummary
            rarity={subject.target.rarity}
            season={season}
            zoneId={subject.zoneId}
          />
        ) : (
          <TargetEditor
            battlefieldLevel={battlefieldLevel}
            onRarityChange={setPicked}
            onZoneChange={setZoneId}
            rarities={rarities}
            rarity={target?.rarity}
            season={season}
            zoneId={zoneId}
          />
        )}
        <LineupPicker
          lineup={lineup}
          lostIds={details.result === "none" ? null : details.lostIds}
          onLostChange={(lostIds) => set({ lostIds })}
          rarity={target?.rarity}
        />
        <SegmentedControl
          label={t("log.result")}
          onValueChange={(result) => set({ result })}
          options={[
            { value: "none", label: t("log.resultNone") },
            { value: "won", label: t("log.resultWon") },
            { value: "lost", label: t("log.resultLost") },
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
                onChange={(enemy) => set({ enemy })}
                season={season}
                units={units}
                value={details.enemy}
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
