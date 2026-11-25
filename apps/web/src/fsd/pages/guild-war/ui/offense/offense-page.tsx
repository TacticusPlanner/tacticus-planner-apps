import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Flag, RefreshCw } from "lucide-react"
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
  TeamUnitPicker,
  defaultPickerFilters,
  usePickerUnits,
} from "@/features/team-editor"
import type { PickerFilters, PickerUnit } from "@/features/team-editor"
import { DEFAULT_RARITY_CAP, useTeams } from "@/entities/team"
import type { TeamRoster } from "@/entities/team"
import { ConfirmationDialog, LocalReadFailure, RarityIcon } from "@/shared/ui"

import { maxAttempts } from "../../lib/season"
import { useGuildWarContext } from "../../model/guild-war-context"
import { guildWarAttackRule } from "../../model/guild-war-errors"
import {
  charactersLeftByRarity,
  logBlock,
  offenseTeams,
} from "../../model/offense"
import type { Selection, UnitKind } from "../../model/offense"
import type { GuildWarAttack, GuildWarAttackFields } from "../../model/types"
import {
  useLogGuildWarAttack,
  useStartGuildWar,
  useUndoGuildWarAttack,
} from "../../model/use-guild-war"
import { tokensLeft } from "../../model/war-stats"
import { useGuildWarTutorial } from "../guild-war.tutorial"
import { AttackLog } from "./attack-log"
import { LogAttackDialog } from "./log-attack-dialog"
import { OffenseTeams } from "./offense-teams"
import { SelectionBar } from "./selection-bar"
import { WarSummary } from "./war-summary"

const NO_UNITS: readonly PickerUnit[] = []
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

/** The units that have not attacked, in the team editor's picker, at their own progression (the
 *  defenders' cap is picked when the attack is logged). */
function AvailableUnits({
  picker,
  units,
  filters,
  onFiltersChange,
  selectedIds,
  onToggle,
}: {
  picker: ReturnType<typeof usePickerUnits>
  units: readonly PickerUnit[]
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
        rarityCap={DEFAULT_RARITY_CAP}
        roster={picker.data.roster}
        selectedIds={selectedIds}
        units={units}
        usage={NO_USAGE}
      />
    </div>
  )
}

/**
 * Guild War Offense: the current war's summary, the offense teams ready then blocked, the units
 * that have not attacked, the selection bar with Log attack (where the zone and rarity are picked),
 * and the attack log with Undo. With no current war the first logged attack starts one.
 */
export function OffensePage() {
  const { t, i18n } = useTranslation("guildWar")
  const { war, season, settings } = useGuildWarContext()
  const picker = usePickerUnits()
  const teamsQuery = useTeams()
  const logAttack = useLogGuildWarAttack()
  const undo = useUndoGuildWarAttack()
  const startWar = useStartGuildWar()
  const [selection, setSelection] = useState<Selection>(() => new Map())
  const [filters, setFilters] = useState<PickerFilters>(OWNED_ONLY)
  const [logOpen, setLogOpen] = useState(false)
  const [logError, setLogError] = useState<string | null>(null)
  const [confirmStart, setConfirmStart] = useState(false)
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
  const block = logBlock({
    selection,
    deployed,
    roster,
    tokensLeft: left,
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

  const save = (fields: GuildWarAttackFields) => {
    setLogError(null)
    logAttack.mutate(
      { fields, settings },
      {
        onSuccess: () => {
          setLogOpen(false)
          setSelection(new Map())
          toast.success(t("log.logged"))
        },
        onError: (error) => {
          const rule = guildWarAttackRule(error)
          setLogError(t(rule ? `log.errors.${rule}` : "log.errors.failed"))
        },
      }
    )
  }
  const undoAttack = (attack: GuildWarAttack) => {
    if (!war) return
    undo.mutate(
      { warId: war.id, attackId: attack.id },
      {
        onSuccess: () => toast.success(t("attackLog.undone")),
        onError: () => toast.error(t("attackLog.undoFailed")),
      }
    )
  }
  const start = () => {
    setConfirmStart(false)
    startWar.mutate(
      { settings, currentWarId: war?.id ?? null },
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
      <WarSummary>
        <UnitsLeft roster={roster} deployed={deployed} />
        <div className="ml-auto self-center">
          <Button
            data-testid="guild-war-start"
            disabled={!war || startWar.isPending}
            onClick={() => setConfirmStart(true)}
            variant="outline"
          >
            <Flag data-icon="inline-start" />
            {t("startWar.action")}
          </Button>
        </div>
      </WarSummary>
      {picker.status === "ready" && roster === null ? <SyncPrompt /> : null}
      {teams.length > 0 ? (
        <OffenseTeams onSelect={selectTeam} roster={roster} teams={teams} />
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
          onUndo={undoAttack}
          season={season}
          undoingId={undo.isPending ? undo.variables.attackId : null}
          war={war}
        />
      ) : null}
      {selection.size > 0 ? (
        <SelectionBar
          block={block}
          count={selection.size}
          onClear={() => setSelection(new Map())}
          onLog={() => {
            setLogError(null)
            setLogOpen(true)
          }}
        />
      ) : null}
      {logOpen ? (
        <LogAttackDialog
          battlefieldLevel={settings.battlefieldLevel}
          error={logError}
          onOpenChange={setLogOpen}
          onSave={save}
          open
          pending={logAttack.isPending}
          roster={roster}
          season={season}
          selection={selection}
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
    </div>
  )
}
