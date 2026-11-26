import { useId, useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown, Pencil, Skull, Trophy } from "lucide-react"
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
import {
  attackPicks,
  editedLineup,
  lineupHasCharacter,
  loggedUnit,
  takenByOtherAttacks,
} from "../../model/lineup-edit"
import { useDialogTarget } from "../../model/use-dialog-target"
import type { LogAttackSubject } from "../../model/use-dialog-target"
import { zoneOwnBuff } from "../../model/zone-buffs"
import type { ZoneRarity } from "../../model/attack-target"
import { cappedView, lineupUnitView } from "../../model/capped-view"
import type { Selection, UnitKind } from "../../model/offense"
import type { GuildWarAttackFields } from "../../model/types"
import { useOverlayContainer } from "../use-overlay-container"
import { EnemyDetails } from "./enemy-details"
import { LineupEditor } from "./lineup-editor"
import { ZoneOptions } from "./target-fields"

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
 *  same rows show disabled, so switching the result never changes the dialog's height. Change
 *  lineup opens the `LineupEditor`. */
function LineupPicker({
  picks,
  view,
  rarity,
  lostIds,
  disabled,
  onLostChange,
  onEdit,
}: {
  picks: Selection
  view: (id: string, kind: UnitKind, cap: Rarity | undefined) => TeamUnitView
  rarity: Rarity | undefined
  lostIds: ReadonlySet<string>
  disabled: boolean
  onLostChange: (unitIds: ReadonlySet<string>) => void
  onEdit: () => void
}) {
  const { t } = useTranslation("guildWar")
  const unitName = useUnitName()
  return (
    <div className="flex flex-col gap-2" data-testid="guild-war-log-lineup">
      <div className="flex items-center justify-between gap-2">
        <p
          className={cn(
            "text-sm text-muted-foreground",
            disabled && "opacity-50"
          )}
        >
          {t("log.tapLost")}
        </p>
        <Button onClick={onEdit} size="sm" variant="ghost">
          <Pencil data-icon="inline-start" />
          {t("log.changeLineup")}
        </Button>
      </div>
      <ToggleGroup
        aria-label={t("log.tapLost")}
        className="flex-wrap"
        disabled={disabled}
        onValueChange={(ids) => onLostChange(new Set(ids))}
        spacing={2}
        type="multiple"
        value={disabled ? [] : [...lostIds]}
      >
        {[...picks].map(([id, kind]) => {
          const name = unitName(kind === "mow" ? "Mow" : "Character", id)
          const lost = !disabled && lostIds.has(id)
          return (
            <ToggleGroupItem
              aria-label={t("log.markLost", { name })}
              className="relative h-auto p-0.5"
              key={id}
              value={id}
            >
              <TeamUnitPortrait
                className={cn(lost && "opacity-60 grayscale")}
                size="portrait-md"
                unit={view(id, kind, rarity)}
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
 * page's zone and rarity and changes them for the page; an edited one changes only its own. Both
 * can change the lineup (units another attack of the war used cannot join it) and note the result
 * with the units lost, a short note, and the optional Enemy details.
 */
export function LogAttackDialog({
  open,
  onOpenChange,
  subject,
  units,
  roster,
  deployed,
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
  roster: TeamRoster | null
  /** Every unit that attacked in the war. */
  deployed: ReadonlySet<string>
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
  const [buffsTouched, setBuffsTouched] = useState(editing !== null)
  const dialogTarget = useDialogTarget(subject, season, battlefieldLevel)
  const { target, saveTarget } = dialogTarget

  const [picks, setPicks] = useState<Selection>(() =>
    subject.kind === "edit" ? attackPicks(subject.attack) : subject.selection
  )
  const [lineupOpen, setLineupOpen] = useState(false)
  // A unit the attack logged shows as logged; one added here, from the roster.
  const unitView = (id: string, kind: UnitKind, cap: Rarity | undefined) => {
    const logged = loggedUnit(editing, id)
    return logged && editing
      ? lineupUnitView(kind, logged, cap ?? editing.rarityCap)
      : cappedView(kind, id, roster, cap)
  }
  // A new attack's Enemy details start with the zone's own buff ticked, following the zone until
  // a buff is changed by hand; an edited attack keeps what it logged.
  const ownBuff = zoneOwnBuff(season, dialogTarget.zoneId)
  const enemy =
    buffsTouched || !enemyOpen
      ? details.enemy
      : { ...details.enemy, buffIds: ownBuff ? [ownBuff] : [] }
  // Noted enemies stay within the defenders' cap, even after it is lowered here.
  const capped = { ...details, enemy: capEnemy(enemy, target?.rarity) }
  const set = (patch: Partial<AttackDetails>) =>
    setDetails((current) => ({ ...current, ...patch }))

  const save = () => {
    if (!saveTarget) return
    onSave(
      subject.kind === "new"
        ? attackFields({
            selection: picks,
            roster,
            zoneId: saveTarget.zoneId,
            slot: saveTarget.slot,
            details: capped,
          })
        : editedAttackFields(
            subject.attack,
            saveTarget,
            capped,
            editedLineup(subject.attack, picks, roster)
          )
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
          onRarityChange={dialogTarget.onRarityChange}
          onZoneChange={dialogTarget.onZoneChange}
          rarities={dialogTarget.rarities}
          rarity={target?.rarity}
          season={season}
          zoneId={dialogTarget.zoneId}
        />
        {lineupOpen ? (
          <LineupEditor
            onDone={() => setLineupOpen(false)}
            onPicksChange={setPicks}
            picks={picks}
            rarity={target?.rarity}
            taken={takenByOtherAttacks(deployed, editing)}
            units={units}
            view={unitView}
          />
        ) : (
          <LineupPicker
            disabled={details.result === "none"}
            lostIds={details.lostIds}
            onEdit={() => setLineupOpen(true)}
            onLostChange={(lostIds) => set({ lostIds })}
            picks={picks}
            rarity={target?.rarity}
            view={unitView}
          />
        )}
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
                zoneId={dialogTarget.zoneId || null}
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
        <Button
          disabled={pending || !saveTarget || !lineupHasCharacter(picks)}
          onClick={save}
        >
          {editing ? t("log.saveEdit") : t("log.save")}
        </Button>
      </ResponsiveDialogFooter>
    </ResponsiveDialog>
  )
}
