import {
  Suspense,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react"
import { Link, useLocation } from "react-router"
import { useTranslation } from "react-i18next"
import { toast } from "@workspace/ui/lib/toast"
import { Plus, RefreshCw } from "lucide-react"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { cn } from "@workspace/ui/lib/utils"
import { Spinner } from "@workspace/ui/components/spinner"

import { usePlayerDataSyncStatus } from "@/features/player-data-sync"
import {
  TEAM_EDITOR_NAMESPACES,
  TeamEditorDialog,
} from "@/features/team-editor"
import { v1ImportReturnState } from "@/features/v1-import"
import {
  TEAM_LIMITS,
  staleTeamOrder,
  useDeleteTeam,
  useReorderTeams,
  useTeamRoster,
  useTeams,
} from "@/entities/team"
import type { Team, TeamMode, TeamRoster } from "@/entities/team"
import { storedPreference, usePersistedSelection } from "@/shared/lib"
import {
  ConfirmationDialog,
  EmptyState,
  SORTABLE_ITEM_GROUP,
  SortableList,
} from "@/shared/ui"
import { useUnitName } from "@/shared/unit-name"

import {
  filterTeamsByMode,
  groupTeamsByMode,
  isTeamsGroupBy,
  isTeamsLayout,
  isTeamsModeFilter,
  reorderListedSlots,
  searchTeams,
  sharedUnitsByTeam,
} from "../../model/teams-view"
import type {
  TeamsGroupBy,
  TeamsLayout,
  TeamsModeFilter,
} from "../../model/teams-view"
import type { TeamActions } from "./team-actions"
import { TeamCard } from "./team-card"
import {
  useOpenTeamEditor,
  useTeamEditorLauncher,
} from "./team-editor-launcher"
import type { TeamEditorLauncher } from "./team-editor-launcher"
import { TeamListRow } from "./team-list-row"
import { TeamsModeSection } from "./teams-sections"
import { TeamsTable } from "./teams-table"
import { TeamsToolbar } from "./teams-toolbar"
import type { TeamsQuickFilters } from "./teams-toolbar"
import { useTeamsTutorial } from "./teams-page.tutorial"
import { useTeamStatus } from "./use-team-status"
import type { TeamStatusItem } from "./use-team-status"

/** Per device, like the app's other quick filters (#638). */
const TEAMS_MODE_STORAGE_KEY = storedPreference("teams", "mode")
const TEAMS_LAYOUT_STORAGE_KEY = storedPreference("teams", "layout")
const TEAMS_GROUP_BY_STORAGE_KEY = storedPreference("teams", "groupBy")

const NO_QUICK_FILTERS: TeamsQuickFilters = { needsFixes: false, shared: false }

function SyncPrompt() {
  const { t } = useTranslation(["teams", "common"])
  const { isSyncing, statusText, syncDisabled, syncNow } =
    usePlayerDataSyncStatus()
  return (
    <Alert className="border-ring bg-info-bg" data-testid="teams-sync-prompt">
      <RefreshCw />
      <AlertTitle>{t("teams:page.noRoster")}</AlertTitle>
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

/** The editor, mounted only while open; it alone re-renders on open and close (#620). */
function TeamEditorHost({
  launcher,
  teams,
}: {
  launcher: TeamEditorLauncher
  teams: readonly Team[]
}) {
  const editor = useOpenTeamEditor(launcher)
  if (!editor) return null
  const opened = editor.team
  // The team as it now stands (a fresher revision after a refetch). Once it has left the list
  // (deleted on another device) the editor keeps the team it opened with and says it is gone,
  // so an edit never turns into a create.
  const current =
    opened === null
      ? null
      : (teams.find((entry) => entry.id === opened.id) ?? null)
  const deleted = opened !== null && current === null
  // Its own boundary: a copy namespace still loading suspends the editor, never the page.
  return (
    <Suspense fallback={null}>
      <TeamEditorDialog
        deleted={deleted}
        key={editor.key}
        onClose={launcher.close}
        team={current ?? opened}
        teams={teams}
      />
    </Suspense>
  )
}

/** The listed teams in the chosen layout: cards, a table, or (on a phone) compact rows. */
function TeamsBody({
  teams,
  layout,
  isPhone,
  roster,
  statusOf,
  moveDisabled,
  actions,
  sectionMode,
  onReorder,
}: {
  teams: readonly Team[]
  /** Saves a dragged order of these teams (they move only among their own positions). */
  onReorder: (orderedIds: string[]) => void
  /** The mode section the teams are listed under, which they then do not repeat. */
  sectionMode?: TeamMode
  layout: TeamsLayout
  isPhone: boolean
  roster: TeamRoster | null
  statusOf: (team: Team) => TeamStatusItem[]
  moveDisabled: boolean
  actions: TeamActions
}) {
  const { t } = useTranslation("teams")
  if (layout === "table" && !isPhone) {
    return (
      <TeamsTable
        actions={actions}
        moveDisabled={moveDisabled}
        onReorder={onReorder}
        roster={roster}
        sectionMode={sectionMode}
        statusOf={statusOf}
        teams={teams}
      />
    )
  }
  const Item = layout === "table" ? TeamListRow : TeamCard
  return (
    <ul
      aria-label={t("page.listLabel")}
      className={cn(
        "grid gap-4",
        layout === "cards"
          ? "grid-cols-[repeat(auto-fill,minmax(17.5rem,1fr))]"
          : "grid-cols-1 gap-2"
      )}
      data-testid="teams-list"
    >
      <SortableList
        disabled={moveDisabled}
        getId={(team) => team.id}
        getLabel={(id) => teams.find((team) => team.id === id)?.name ?? id}
        items={[...teams]}
        onReorder={(orderedIds) => onReorder(orderedIds)}
        renderItem={(team, sortable) => {
          return (
            <li
              aria-label={team.name}
              className={cn(
                SORTABLE_ITEM_GROUP,
                "data-dragging:relative data-dragging:z-10"
              )}
              data-dragging={sortable.isDragging || undefined}
              data-team={team.id}
              data-testid="team-card"
              key={team.id}
              ref={sortable.setNodeRef}
              style={sortable.style}
            >
              <Item
                actions={actions}
                dragHandle={sortable.dragHandle}
                moveDisabled={moveDisabled}
                roster={roster}
                sectionMode={sectionMode}
                status={statusOf(team)}
                team={team}
              />
            </li>
          )
        }}
        strategy={layout === "cards" ? "grid" : "vertical"}
      />
    </ul>
  )
}

/**
 * My Game's Teams page (personal-teams): the player's teams as cards or a table, found by search,
 * Mode and quick-filter chips, and optionally grouped by mode. As on the Goals board, every team
 * shows its position and a drag grip at its top left: dragging reorders the teams shown, among the
 * positions they hold (a filter or a section moves only its own teams). Each team shows its status
 * chips and its Edit and Delete buttons; opening it edits it too.
 */
export function TeamsPage() {
  const { t, i18n } = useTranslation(["teams", "common"])
  const isPhone = useIsMobile()
  const unitName = useUnitName()
  const location = useLocation()
  const teamsQuery = useTeams()
  // The editor's copy loads with the page, so the first opening does not wait for it.
  useEffect(() => {
    void i18n.loadNamespaces([...TEAM_EDITOR_NAMESPACES])
  }, [i18n])
  const roster = useTeamRoster()
  const [mode, setMode] = usePersistedSelection<TeamsModeFilter>(
    TEAMS_MODE_STORAGE_KEY,
    isTeamsModeFilter,
    "all"
  )
  const [layout, setLayout] = usePersistedSelection<TeamsLayout>(
    TEAMS_LAYOUT_STORAGE_KEY,
    isTeamsLayout,
    "cards"
  )
  const [groupBy, setGroupBy] = usePersistedSelection<TeamsGroupBy>(
    TEAMS_GROUP_BY_STORAGE_KEY,
    isTeamsGroupBy,
    "mode"
  )
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search)
  const [quick, setQuick] = useState<TeamsQuickFilters>(NO_QUICK_FILTERS)
  const launcher = useTeamEditorLauncher()
  const reorder = useReorderTeams()
  const remove = useDeleteTeam()
  const [deleting, setDeleting] = useState<Team | null>(null)

  const teams = useMemo(() => teamsQuery.data?.teams ?? [], [teamsQuery.data])
  const rosterData = roster.status === "ready" ? roster.data : null
  const shared = useMemo(() => sharedUnitsByTeam(teams), [teams])
  const statusOf = useTeamStatus(shared, rosterData)
  // Moves happen only among the listed teams' positions (design D5).
  const byMode = useMemo(() => filterTeamsByMode(teams, mode), [teams, mode])
  const listed = useMemo(
    () =>
      searchTeams(byMode, deferredSearch, unitName, i18n.language).filter(
        (team) =>
          (!quick.needsFixes || team.issues.length > 0) &&
          (!quick.shared || shared.has(team.id))
      ),
    [byMode, deferredSearch, unitName, i18n.language, quick, shared]
  )
  const needsFixesCount = teams.filter((team) => team.issues.length > 0).length
  const atLimit = teams.length >= TEAM_LIMITS.maxTeams
  const loading = teamsQuery.isPending
  // Only a load with nothing to show fails the page; a failed background refetch keeps the cached teams.
  const failed = teamsQuery.isError && teamsQuery.data === undefined

  useTeamsTutorial({
    hasTeam: listed.length > 0,
    canReorder: listed.length > 1,
    teamTarget: layout === "table" && !isPhone ? "team-row" : "team-card",
  })

  const saveOrder = useCallback(
    (inNewOrder: string[]) => {
      const allIds = teams.map((team) => team.id)
      reorder.mutate(reorderListedSlots(allIds, inNewOrder), {
        onError: (error) =>
          toast.error(
            staleTeamOrder(error) ? t("reorder.stale") : t("reorder.failed")
          ),
      })
    },
    [reorder, teams, t]
  )
  const actions = useMemo<TeamActions>(
    () => ({
      onEdit: (team) => launcher.open(team),
      onDelete: (team) => setDeleting(team),
    }),
    [launcher]
  )

  const confirmDelete = () => {
    const team = deleting
    setDeleting(null)
    if (!team) return
    remove.mutate(team.id, {
      onSuccess: () => toast.success(t("delete.deleted", { name: team.name })),
      onError: () => toast.error(t("delete.failed", { name: team.name })),
    })
  }

  const clearFilters = () => {
    setSearch("")
    setMode("all")
    setQuick(NO_QUICK_FILTERS)
  }

  const toolbar = (
    <TeamsToolbar
      controlsDisabled={loading || failed}
      createDisabled={loading || failed || atLimit}
      groupBy={groupBy}
      isPhone={isPhone}
      layout={layout}
      mode={mode}
      needsFixesCount={needsFixesCount}
      onCreate={() => launcher.open(null)}
      onGroupBy={setGroupBy}
      onLayout={setLayout}
      onMode={setMode}
      onQuick={setQuick}
      onSearch={setSearch}
      quick={quick}
      search={search}
      sharedCount={shared.size}
      teamCount={teams.length}
    />
  )

  const body = (list: readonly Team[], sectionMode?: TeamMode) => (
    <TeamsBody
      actions={actions}
      sectionMode={sectionMode}
      isPhone={isPhone}
      layout={layout}
      moveDisabled={reorder.isPending}
      onReorder={saveOrder}
      roster={rosterData}
      statusOf={statusOf}
      teams={list}
    />
  )

  let content
  if (loading) {
    content = (
      <div
        aria-label={t("page.loading")}
        className="grid grid-cols-[repeat(auto-fill,minmax(17.5rem,1fr))] gap-4"
        role="status"
      >
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton className="h-40 w-full" key={index} />
        ))}
      </div>
    )
  } else if (failed) {
    content = (
      <Alert data-testid="teams-load-error" variant="destructive">
        <AlertDescription className="flex flex-wrap items-center gap-3">
          {t("page.loadError")}
          <Button
            onClick={() => void teamsQuery.refetch()}
            size="sm"
            variant="outline"
          >
            {t("page.retry")}
          </Button>
        </AlertDescription>
      </Alert>
    )
  } else if (teams.length === 0) {
    content = (
      <EmptyState
        actions={
          <Button onClick={() => launcher.open(null)} variant="outline">
            <Plus data-icon="inline-start" />
            {t("page.create")}
          </Button>
        }
        description={
          <>
            {t("page.importHint")}{" "}
            <Link
              className="underline underline-offset-4"
              state={v1ImportReturnState(
                `${location.pathname}${location.search}`
              )}
              to="/account/v1-import"
            >
              {t("page.importLink")}
            </Link>
          </>
        }
        testId="teams-empty"
        title={t("page.empty")}
        variant="empty"
      />
    )
  } else if (listed.length === 0) {
    // Only the search narrows the list: clearing it is the way back; otherwise clear every filter.
    const onlySearch =
      search.trim() !== "" &&
      mode === "all" &&
      !quick.needsFixes &&
      !quick.shared
    content = (
      <EmptyState
        actions={
          <Button onClick={clearFilters} variant="outline">
            {onlySearch
              ? t("common:searchField.clear")
              : t("common:filtersControl.clear")}
          </Button>
        }
        testId="teams-no-match"
        title={t("page.noMatchAny")}
        variant="no-match"
      />
    )
  } else if (groupBy === "mode") {
    content = (
      <div className="flex flex-col gap-6">
        {groupTeamsByMode(listed).map((section) => (
          <TeamsModeSection
            shared={shared}
            key={section.mode ?? "none"}
            mode={section.mode}
            teams={section.teams}
          >
            {body(section.teams, section.mode ?? undefined)}
          </TeamsModeSection>
        ))}
      </div>
    )
  } else {
    content = body(listed)
  }

  return (
    <div className="flex flex-col gap-5" data-testid="teams-page">
      {toolbar}
      {!loading &&
      !failed &&
      teams.length > 0 &&
      roster.status === "ready" &&
      roster.data === null ? (
        <SyncPrompt />
      ) : null}
      {content}
      <TeamEditorHost launcher={launcher} teams={teams} />
      <ConfirmationDialog
        cancelLabel={t("delete.cancel")}
        confirmLabel={t("delete.confirm")}
        confirmVariant="destructive"
        description={t("delete.description", { name: deleting?.name ?? "" })}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
        open={deleting !== null}
        title={t("delete.title", { name: deleting?.name ?? "" })}
      />
    </div>
  )
}
