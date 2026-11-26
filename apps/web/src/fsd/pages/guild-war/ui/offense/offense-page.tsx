import { Suspense, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Flag, RefreshCw } from "lucide-react"
import type { Rarity } from "@workspace/game-domain"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { usePlayerDataSyncStatus } from "@/features/player-data-sync"
import {
  TEAM_EDITOR_NAMESPACES,
  TeamEditorDialog,
  TeamUnitPicker,
  defaultPickerFilters,
  usePickerUnits,
} from "@/features/team-editor"
import type { PickerFilters, PickerUnit } from "@/features/team-editor"
import { DEFAULT_RARITY_CAP, useTeams } from "@/entities/team"
import type { TeamMode, TeamRoster } from "@/entities/team"
import {
  ConfirmationDialog,
  LocalReadFailure,
  PageToolbar,
  RarityIcon,
} from "@/shared/ui"

import { maxAttempts } from "../../lib/season"
import { attackFields, NO_DETAILS } from "../../model/attack-draft"
import { useGuildWarContext } from "../../model/guild-war-context"
import { attackSaveError, freshAttack } from "../../model/guild-war-errors"
import {
  charactersLeftByRarity,
  logBlock,
  offenseTeams,
} from "../../model/offense"
import type { Selection, UnitKind } from "../../model/offense"
import type { GuildWarAttack, GuildWarAttackFields } from "../../model/types"
import { usePageTarget } from "../../model/page-target"
import {
  useDeleteGuildWarAttack,
  useLogGuildWarAttack,
  useStartGuildWar,
  useUpdateGuildWarAttack,
} from "../../model/use-guild-war"
import { tokensLeft } from "../../model/war-stats"
import { useGuildWarTutorial } from "../guild-war.tutorial"
import { AttackLog } from "./attack-log"
import { LogAttackDialog } from "./log-attack-dialog"
import type { LogAttackSubject } from "./log-attack-dialog"
import { OffenseTeams } from "./offense-teams"
import { SelectionBar } from "./selection-bar"
import { PageTargetFields } from "./target-fields"
import { WarSummary } from "./war-summary"

const NO_UNITS: readonly PickerUnit[] = []
/** A team made from this page starts as a War Offense team. */
const WAR_OFFENSE: readonly TeamMode[] = ["warOffense"]
const EMPTY_SET: ReadonlySet<string> = new Set()
const NO_USAGE: ReadonlyMap<string, string[]> = new Map()
const OWNED_ONLY: PickerFilters = { ...defaultPickerFilters, ownedOnly: true }

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
            <RefreshCw
              aria-hidden="true"
              className={isSyncing ? "motion-safe:animate-spin" : undefined}
            />
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

/** The units that have not attacked, in the team editor's picker, capped at the defenders' rarity
 *  picked in the toolbar. */
function AvailableUnits({
  picker,
  units,
  cap,
  filters,
  onFiltersChange,
  selectedIds,
  onToggle,
}: {
  picker: ReturnType<typeof usePickerUnits>
  units: readonly PickerUnit[]
  cap: Rarity | undefined
  filters: PickerFilters
  onFiltersChange: (patch: Partial<PickerFilters>) => void
  selectedIds: ReadonlySet<string>
  onToggle: (unit: PickerUnit) => void
}) {
  if (picker.status === "loading") return <Skeleton className="h-64 w-full" />
  if (picker.status === "error") {
    return <LocalReadFailure retry={picker.retry} />
  }
  return (
    // The picker lays out by the room it gets, as in the team editor.
    <div className="@container/editor">
      <TeamUnitPicker
        allowedFactions={undefined}
        filters={filters}
        lockedIds={EMPTY_SET}
        mows
        onFiltersChange={onFiltersChange}
        onToggle={onToggle}
        rarityCap={cap ?? DEFAULT_RARITY_CAP}
        roster={picker.data.roster}
        selectedIds={selectedIds}
        units={units}
        usage={NO_USAGE}
      />
    </div>
  )
}

/**
 * Guild War Offense: the toolbar with the zone and defenders' rarity (they cap every unit shown) and
 * Start new war; the war's summary; the offense teams ready then blocked; the units that have not
 * attacked; the selection bar, where Won or Lost logs an attack in one tap; and the attack log with
 * Edit and Delete. With no current war the first logged attack starts one.
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
  const pageTarget = usePageTarget(season, settings.battlefieldLevel)
  const [selection, setSelection] = useState<Selection>(() => new Map())
  const [filters, setFilters] = useState<PickerFilters>(OWNED_ONLY)
  const [dialog, setDialog] = useState<LogAttackSubject | null>(null)
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
  const available = units.filter((unit) => !deployed.has(unit.id))
  const teams = offenseTeams(teamsQuery.data?.teams ?? [], deployed)
  const left = tokensLeft(war, maxAttempts(season))
  const { zoneId, target } = pageTarget
  const cap = target?.rarity
  const block = logBlock({
    selection,
    deployed,
    roster,
    tokensLeft: left,
    hasTarget: zoneId !== null && target !== undefined,
  })

  const toggle = (unit: PickerUnit) =>
    setSelection((current) => {
      const next = new Map(current)
      if (next.has(unit.id)) next.delete(unit.id)
      else next.set(unit.id, unit.kind)
      return next
    })
  const selectTeam = (core: { id: string; kind: UnitKind }[]) =>
    setSelection(new Map(core.map((unit) => [unit.id, unit.kind])))

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
      <WarSummary>
        <UnitsLeft roster={roster} deployed={deployed} />
      </WarSummary>
      {picker.status === "ready" && roster === null ? <SyncPrompt /> : null}
      <OffenseTeams
        cap={cap}
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
          cap={cap}
          filters={filters}
          onFiltersChange={(patch) =>
            setFilters((current) => ({ ...current, ...patch }))
          }
          onToggle={toggle}
          picker={picker}
          selectedIds={new Set(selection.keys())}
          units={available}
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
          count={selection.size}
          onClear={() => setSelection(new Map())}
          onLogDetails={() => {
            if (zoneId === null || !target) return
            setDialogError(null)
            setDialog({ kind: "new", selection, roster, zoneId, target })
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
          pending={logAttack.isPending || updateAttack.isPending}
          season={season}
          subject={dialog}
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
