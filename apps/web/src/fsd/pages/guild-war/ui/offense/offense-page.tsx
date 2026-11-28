import { Suspense, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "@workspace/ui/lib/toast"
import { Flag, RefreshCw } from "lucide-react"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Spinner } from "@workspace/ui/components/spinner"

import { usePlayerDataSyncStatus } from "@/features/player-data-sync"
import {
  TEAM_EDITOR_NAMESPACES,
  TeamEditorDialog,
  usePickerUnits,
} from "@/features/team-editor"
import type { PickerUnit } from "@/features/team-editor"
import { DEFAULT_RARITY_CAP, useTeams } from "@/entities/team"
import type { Team, TeamMode, TeamRoster } from "@/entities/team"
import {
  ConfirmationDialog,
  LocalReadFailure,
  PageToolbar,
  RarityIcon,
} from "@/shared/ui"

import { maxAttempts, playedLevels } from "../../lib/season"
import { attackFields, NO_DETAILS } from "../../model/attack-draft"
import { useGuildWarContext } from "../../model/guild-war-context"
import {
  attackSaveError,
  freshAttack,
  staleGuildWar,
} from "../../model/guild-war-errors"
import {
  charactersLeftByRarity,
  deployedZones,
  freeMowCount,
  logBlock,
  offenseTeams,
  teamSelection,
  toggleSelection,
} from "../../model/offense"
import type { Selection } from "../../model/offense"
import type { GuildWarAttack, GuildWarAttackFields } from "../../model/types"
import { DEFAULT_OFFENSE_FILTERS } from "../../model/offense-filters"
import type { OffenseFilters } from "../../model/offense-filters"
import { usePageTarget } from "../../model/page-target"
import {
  useDeleteGuildWarAttack,
  useLogGuildWarAttack,
  useSetGuildWarSettings,
  useStartGuildWar,
  useUpdateGuildWarAttack,
} from "../../model/use-guild-war"
import { tokensLeft } from "../../model/war-stats"
import { useGuildWarTutorial } from "../guild-war.tutorial"
import { AttackLog } from "./attack-log"
import { LogAttackDialog } from "./log-attack-dialog"
import type { LogAttackSubject } from "../../model/use-dialog-target"
import { OffenseTeams } from "./offense-teams"
import { OffenseUnitPicker } from "./offense-unit-picker"
import { scrollToSection } from "./scroll-to-section"
import { SelectionBar } from "./selection-bar"
import { PageTargetFields } from "./target-fields"
import { WarSummary } from "./war-summary"

/** A new attack's dialog as the page keeps it: the selection it logs. Its zone and rarity are the
 *  page's, read when it renders. */
type NewAttackDialog = Pick<
  Extract<LogAttackSubject, { kind: "new" }>,
  "kind" | "selection"
>

const NO_UNITS: readonly PickerUnit[] = []
/** A team made from this page starts as a War Offense team. */
const WAR_OFFENSE: readonly TeamMode[] = ["warOffense"]

function SyncPrompt() {
  const { t } = useTranslation(["guildWar", "common"])
  const { isSyncing, statusText, syncDisabled, syncNow } =
    usePlayerDataSyncStatus()
  return (
    <Alert className="border-ring bg-info-bg" data-testid="guild-war-sync">
      <RefreshCw />
      <AlertTitle>{t("guildWar:units.noRoster")}</AlertTitle>
      <AlertDescription>
        <div className="flex flex-wrap items-center gap-3">
          <Button disabled={syncDisabled} onClick={() => syncNow()} size="sm">
            {isSyncing ? (
              <Spinner aria-hidden="true" />
            ) : (
              <RefreshCw aria-hidden="true" />
            )}
            {t("common:nav.syncWithTacticus")}
          </Button>
          <span className="text-xs text-muted-foreground" role="status">
            {statusText}
          </span>
        </div>
      </AlertDescription>
    </Alert>
  )
}

/** The characters still free for this war, counted by rarity. */
function UnitsLeft({
  roster,
  deployed,
}: {
  roster: TeamRoster | null
  deployed: ReadonlySet<string>
}) {
  const { t } = useTranslation("guildWar")
  const unitsLeft = charactersLeftByRarity(roster, deployed)
  if (unitsLeft.length === 0) return null
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">
        {t("summary.unitsLeft")}
      </dt>
      <dd className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {unitsLeft.map(({ rarity, count }) => (
          <span
            className="flex items-center gap-1 text-sm font-medium tabular-nums"
            data-testid={`guild-war-left-${rarity}`}
            key={rarity}
          >
            <RarityIcon rarity={rarity} />
            {count}
          </span>
        ))}
      </dd>
    </div>
  )
}

/** The units that can attack (see `OffenseUnitPicker`), capped at the defenders' rarity picked in
 *  the toolbar. */
function AvailableUnits({
  picker,
  ...props
}: Omit<Parameters<typeof OffenseUnitPicker>[0], "units" | "roster"> & {
  picker: ReturnType<typeof usePickerUnits>
}) {
  if (picker.status === "loading") return <Skeleton className="h-64 w-full" />
  if (picker.status === "error") {
    return <LocalReadFailure retry={picker.retry} />
  }
  return (
    <OffenseUnitPicker
      roster={picker.data.roster}
      units={picker.data.units}
      {...props}
    />
  )
}

/**
 * Guild War Offense: the toolbar with the battlefield level, zone and defenders' rarity (they cap
 * every unit shown; level and zone are picked once per war) and Start new war; the war's summary
 * with Attack log (N); the offense teams ready then blocked; the units that can attack; the
 * selection bar, where Won or Lost logs an attack in one tap; and the attack log with Edit and
 * Delete. With no current war the first logged attack (or a picked level) starts one.
 */
export function OffensePage() {
  const { t, i18n } = useTranslation("guildWar")
  const { war, season, settings, newWarSettings } = useGuildWarContext()
  const picker = usePickerUnits()
  const teamsQuery = useTeams()
  const logAttack = useLogGuildWarAttack()
  const updateAttack = useUpdateGuildWarAttack()
  const deleteAttack = useDeleteGuildWarAttack()
  const startWar = useStartGuildWar()
  const saveSettings = useSetGuildWarSettings()
  const pageTarget = usePageTarget(
    season,
    war?.id ?? null,
    settings.battlefieldLevel
  )
  const [selection, setSelection] = useState<Selection>(() => new Map())
  // Lifted here so selecting a team can show every character, its picks among them.
  const [charactersExpanded, setCharactersExpanded] = useState(false)
  const [filters, setFilters] = useState<OffenseFilters>(
    DEFAULT_OFFENSE_FILTERS
  )
  const [dialog, setDialog] = useState<
    NewAttackDialog | LogAttackSubject | null
  >(null)
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [confirmStart, setConfirmStart] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<GuildWarAttack | null>(
    null
  )
  const [newTeamOpen, setNewTeamOpen] = useState(false)
  useGuildWarTutorial("offense")
  // The picker's copy (filters, factions, traits) loads with the page.
  useEffect(() => {
    void i18n.loadNamespaces([...TEAM_EDITOR_NAMESPACES])
  }, [i18n])

  const roster = picker.status === "ready" ? picker.data.roster : null
  const units = picker.status === "ready" ? picker.data.units : NO_UNITS
  const deployed = new Set(war?.deployedUnitIds ?? [])
  const zonesOfDeployed = deployedZones(war?.attacks ?? [])
  // A unit the war lists as deployed without its attack still shows as deployed.
  const deployedWhere = new Map(
    [...deployed].map((id) => [id, zonesOfDeployed.get(id) ?? ""])
  )
  const teams = offenseTeams(teamsQuery.data?.teams ?? [], deployed)
  const left = tokensLeft(war, maxAttempts(season))
  const { zoneId, target, levelPicked } = pageTarget
  const cap = target?.rarity
  const block = logBlock({
    selection,
    deployed,
    roster,
    tokensLeft: left,
    levelPicked,
    hasTarget: zoneId !== null && target !== undefined,
  })
  // Level 0 (not taking part) is not offered; a war already stored at it still shows it.
  const played = playedLevels(season)
  const levels = played.includes(settings.battlefieldLevel)
    ? played
    : [settings.battlefieldLevel, ...played]
  const freeMows = freeMowCount(selection, roster, deployed)

  const toggle = (unit: PickerUnit) =>
    setSelection((current) => toggleSelection(current, unit.id, unit.kind))
  const changeLevel = (battlefieldLevel: number) => {
    pageTarget.markLevelPicked()
    if (war && battlefieldLevel === war.battlefieldLevel) return
    saveSettings.mutate(
      {
        settings: { ...settings, battlefieldLevel },
        revision: war?.revision ?? 0,
      },
      {
        onError: (error) =>
          toast.error(
            t(staleGuildWar(error) ? "target.levelStale" : "target.levelFailed")
          ),
      }
    )
  }
  const selectTeam = (team: Team) => {
    const picks = teamSelection(team, deployed)
    setSelection(picks)
    // A team's characters can sit past the first ones shown, so its picks show selected.
    if ([...picks.values()].includes("character")) setCharactersExpanded(true)
  }

  const saveError = (error: unknown) =>
    t(`log.errors.${attackSaveError(error)}`)
  const closeDialog = () => {
    setDialog(null)
    setDialogError(null)
  }
  const log = (fields: GuildWarAttackFields, quick: boolean) => {
    setDialogError(null)
    logAttack.mutate(
      { fields, settings },
      {
        onSuccess: () => {
          closeDialog()
          setSelection(new Map())
          toast.success(t("log.logged"))
        },
        onError: (error) => {
          if (quick) toast.error(saveError(error))
          else setDialogError(saveError(error))
        },
      }
    )
  }
  const quickLog = (result: "won" | "lost") => {
    if (zoneId === null || !target) return
    log(
      attackFields({
        selection,
        roster,
        zoneId,
        slot: target.slot,
        details: { ...NO_DETAILS, result },
      }),
      true
    )
  }
  const saveEdit = (attack: GuildWarAttack, fields: GuildWarAttackFields) => {
    if (!war) return
    setDialogError(null)
    updateAttack.mutate(
      { warId: war.id, attack, fields },
      {
        onSuccess: () => {
          closeDialog()
          toast.success(t("log.saved"))
        },
        onError: (error) => {
          // The dialog keeps the player's changes; saving again goes over the attack as it is now.
          const fresh = freshAttack(error, attack.id)
          if (fresh) setDialog({ kind: "edit", attack: fresh })
          setDialogError(saveError(error))
        },
      }
    )
  }
  const removeAttack = () => {
    const attack = confirmDelete
    setConfirmDelete(null)
    if (!war || !attack) return
    deleteAttack.mutate(
      { warId: war.id, attackId: attack.id },
      {
        onSuccess: () => toast.success(t("attackLog.deleted")),
        onError: () => toast.error(t("attackLog.deleteFailed")),
      }
    )
  }
  const start = () => {
    setConfirmStart(false)
    startWar.mutate(
      { settings: newWarSettings, currentWarId: war?.id ?? null },
      {
        onSuccess: () => {
          setSelection(new Map())
          // A new war starts with no level or zone picked.
          pageTarget.resetPicks()
          toast.success(t("startWar.started"))
        },
        onError: () => toast.error(t("startWar.failed")),
      }
    )
  }

  return (
    <div className="flex flex-col gap-5" data-testid="guild-war-offense">
      <PageToolbar
        actions={
          <Button
            disabled={!war || startWar.isPending}
            onClick={() => setConfirmStart(true)}
          >
            <Flag data-icon="inline-start" />
            {t("startWar.action")}
          </Button>
        }
        find={
          <PageTargetFields
            battlefieldLevel={settings.battlefieldLevel}
            level={levelPicked ? settings.battlefieldLevel : undefined}
            levelDisabled={!season || saveSettings.isPending}
            levels={levels}
            onLevelChange={changeLevel}
            onRarityChange={pageTarget.setRarity}
            onZoneChange={pageTarget.setZoneId}
            rarities={pageTarget.rarities}
            rarity={cap}
            season={season}
            zoneId={zoneId}
          />
        }
        label={t("toolbar.label")}
      />
      <WarSummary onShowLog={() => scrollToSection("guild-war-attack-log")}>
        <UnitsLeft roster={roster} deployed={deployed} />
      </WarSummary>
      {picker.status === "ready" && roster === null ? <SyncPrompt /> : null}
      <OffenseTeams
        cap={cap}
        deployed={deployed}
        onNewTeam={() => setNewTeamOpen(true)}
        onSelect={selectTeam}
        roster={roster}
        teams={teams}
      />
      {newTeamOpen ? (
        // Its own boundary: the editor's copy still loading suspends it, never the page.
        <Suspense fallback={null}>
          <TeamEditorDialog
            newTeamModes={WAR_OFFENSE}
            onClose={() => setNewTeamOpen(false)}
            team={null}
            teams={teamsQuery.data?.teams ?? []}
          />
        </Suspense>
      ) : null}
      <section
        aria-labelledby="guild-war-units-heading"
        className="flex flex-col gap-2"
        data-testid="guild-war-units"
      >
        <h2 className="text-sm font-medium" id="guild-war-units-heading">
          {t("units.heading")}
        </h2>
        <AvailableUnits
          cap={cap ?? DEFAULT_RARITY_CAP}
          deployed={deployedWhere}
          expanded={charactersExpanded}
          filters={filters}
          onExpandedChange={setCharactersExpanded}
          onFiltersChange={(patch) =>
            setFilters((current) => ({ ...current, ...patch }))
          }
          onToggle={toggle}
          picker={picker}
          season={season}
          selection={selection}
        />
      </section>
      {war && war.attacks.length > 0 ? (
        <AttackLog
          deleting={deleteAttack.isPending}
          onDelete={setConfirmDelete}
          onEdit={(attack) => {
            setDialogError(null)
            setDialog({ kind: "edit", attack })
          }}
          season={season}
          war={war}
        />
      ) : null}
      {selection.size > 0 ? (
        <SelectionBar
          block={block}
          cap={cap}
          mowsAvailable={freeMows}
          onShowMows={() => scrollToSection("guild-war-mows")}
          roster={roster}
          selection={selection}
          onClear={() => setSelection(new Map())}
          onLogDetails={() => {
            if (zoneId === null || !target) return
            setDialogError(null)
            setDialog({ kind: "new", selection })
          }}
          onQuickLog={quickLog}
          pending={logAttack.isPending}
        />
      ) : null}
      {dialog ? (
        <LogAttackDialog
          battlefieldLevel={settings.battlefieldLevel}
          error={dialogError}
          onOpenChange={(open) => {
            if (!open) closeDialog()
          }}
          onSave={(fields) => {
            if (dialog.kind === "edit") saveEdit(dialog.attack, fields)
            else log(fields, false)
          }}
          open
          deployed={deployed}
          pending={logAttack.isPending || updateAttack.isPending}
          roster={roster}
          season={season}
          subject={
            dialog.kind === "new"
              ? {
                  ...dialog,
                  // Bound to the page's picks: a change in the dialog changes the page's too.
                  zoneId: zoneId ?? "",
                  rarities: pageTarget.rarities,
                  target,
                  onZoneChange: pageTarget.setZoneId,
                  onRarityChange: pageTarget.setRarity,
                }
              : dialog
          }
          units={units}
        />
      ) : null}
      <ConfirmationDialog
        cancelLabel={t("startWar.cancel")}
        confirmLabel={t("startWar.confirm")}
        description={t("startWar.description", {
          count: war?.tokensUsed ?? 0,
        })}
        onCancel={() => setConfirmStart(false)}
        onConfirm={start}
        open={confirmStart}
        title={t("startWar.title")}
      />
      <ConfirmationDialog
        cancelLabel={t("attackLog.deleteCancel")}
        confirmLabel={t("attackLog.deleteConfirm")}
        description={t("attackLog.deleteDescription")}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={removeAttack}
        open={confirmDelete !== null}
        title={t("attackLog.deleteTitle")}
      />
    </div>
  )
}
