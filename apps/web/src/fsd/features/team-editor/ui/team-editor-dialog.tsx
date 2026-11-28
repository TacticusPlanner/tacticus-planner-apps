import { useCallback, useId, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "@workspace/ui/lib/toast"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { Tabs, TabsContent } from "@workspace/ui/components/tabs"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import {
  DEFAULT_RARITY_CAP,
  SIZE_LIMITED_MODES,
  TEAM_LIMITS,
  TeamIssueList,
  allowedFactions,
  charactersConcerned,
  evaluateTeamRules,
  isTeamLimitReached,
  isTeamNameTaken,
  staleRevision,
  teamRulesBroken,
  useCreateTeam,
  useUpdateTeam,
} from "@/entities/team"
import type { Team, TeamFields, TeamMode, TeamRuleCode } from "@/entities/team"
import {
  ConfirmationDialog,
  CountBadge,
  PageTabsList,
  PageTabsTrigger,
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  PageLoading,
} from "@/shared/ui"
import { useUnitName } from "@/shared/unit-name"

import { sameModeUsage } from "../model/same-mode-usage"
import {
  addCharacter,
  arrangeCharacters,
  arrangeMows,
  chooseCampaign,
  draftFromTeam,
  draftToFields,
  emptyDraft,
  makeCore,
  makeFlex,
  makeMowCore,
  makeMowFlex,
  removeCharacter,
  removeMow,
  setIncursions,
  takesMows,
  toggleMode,
  toggleMow,
  undoToggle,
  unitPlacement,
} from "../model/team-draft"
import type { TeamDraft } from "../model/team-draft"
import { defaultPickerFilters } from "../model/unit-picker"
import type { PickerFilters, PickerUnit } from "../model/unit-picker"
import { useTeamEditorData } from "../model/use-team-editor-data"
import type { TeamEditorData } from "../model/use-team-editor-data"
import { TeamEditorLineup } from "./team-editor-lineup"
import {
  TeamContextFields,
  TeamModesField,
  TeamNameField,
  TeamNotesButton,
  TeamNotesField,
  TeamRarityCapField,
} from "./team-editor-fields"
import { TeamLineupBand } from "./team-lineup-band"
import type { LineupUnitProps } from "./lineup-unit"
import { TeamUnitPicker } from "./team-unit-picker"

/** Why the last save did not go through; a successful save closes the editor with a toast. */
type SaveMessage =
  | { kind: "stale" | "failed" | "limit" }
  | { kind: "refused"; rules: TeamRuleCode[] }

type PhoneTab = "details" | "lineup" | "character" | "mow"

function EditorBody({
  team,
  teams,
  data,
  draft,
  setDraft,
  nameError,
  tab,
  onTabChange,
}: {
  team: Team | null
  teams: readonly Team[]
  data: TeamEditorData
  draft: TeamDraft
  setDraft: (update: (draft: TeamDraft) => TeamDraft) => void
  nameError: string | null
  /** The phone tab; the dialog holds it so a refused name can show its field. */
  tab: PhoneTab
  onTabChange: (tab: PhoneTab) => void
}) {
  const { t } = useTranslation("teams")
  const isMobile = useIsMobile()
  const unitName = useUnitName()
  // The cap is saved with the team (null = none); with none, units show as they are (Mythic).
  const rarityCap = draft.rarityCap ?? DEFAULT_RARITY_CAP
  const [filters, setFilters] = useState<PickerFilters>(defaultPickerFilters)
  // Desktop shows the notes field under the name row on demand; a phone has it on Details.
  const [notesOpen, setNotesOpen] = useState(false)
  const notesId = useId()
  // Where the last added or removed unit went, for screen readers on desktop (a phone shows it).
  const [announcement, setAnnouncement] = useState("")
  const { facts } = data
  const fields = draftToFields(draft)
  const concerned = charactersConcerned(fields, facts)
  const allowed = allowedFactions(fields, facts)
  const mows = takesMows(draft, facts)
  // A Survival event's featured hero always fights and is never stored, so the picker leaves it out.
  const featuredId = draft.survivalEventKey
    ? facts.survivalEvents.get(draft.survivalEventKey)?.featuredCharacterId
    : undefined
  const pickerUnits = useMemo(
    () =>
      featuredId
        ? data.units.filter((unit) => unit.id !== featuredId)
        : data.units,
    [data.units, featuredId]
  )
  const campaignCore = useMemo(
    () =>
      new Set(
        draft.modes.includes("campaign") && draft.campaignGroupId
          ? (facts.campaigns.get(draft.campaignGroupId)?.coreCharacterIds ?? [])
          : []
      ),
    [draft.modes, draft.campaignGroupId, facts]
  )
  const usage = useMemo(
    () => sameModeUsage(teams, team?.id ?? null, draft.modes),
    [teams, team?.id, draft.modes]
  )
  const selectedIds = useMemo(
    () => new Set([...draft.characterIds, ...draft.mowIds]),
    [draft.characterIds, draft.mowIds]
  )

  // Adding or removing a unit says where it went; on a phone, with Undo reversing that change.
  const onToggle = (unit: PickerUnit) => {
    const before = draft
    const next =
      unit.kind === "mow"
        ? toggleMow(before, unit.id)
        : before.characterIds.includes(unit.id)
          ? removeCharacter(before, unit.id)
          : addCharacter(before, unit.id)
    if (next === before) return
    setDraft(() => next)
    const name = unitName(unit.kind === "mow" ? "Mow" : "Character", unit.id)
    const placement = unitPlacement(next, unit.kind, unit.id)
    const message =
      placement === "core"
        ? t("editor.addedCore", { name })
        : placement === "flex"
          ? t("editor.addedFlex", { name })
          : t("editor.removed", { name })
    if (isMobile) {
      toast(message, {
        action: {
          label: t("editor.undo"),
          onClick: () =>
            setDraft((current) => undoToggle(current, before, next, unit)),
        },
      })
    } else {
      setAnnouncement(message)
    }
  }
  const onFiltersChange = useCallback(
    (patch: Partial<PickerFilters>) =>
      setFilters((current) => ({ ...current, ...patch })),
    []
  )
  const knownUnit = (kind: "character" | "mow", unitId: string) =>
    kind === "mow"
      ? facts.mowIds.has(unitId)
      : facts.characterFactions.has(unitId)
  const unitProps: LineupUnitProps = {
    roster: data.roster,
    rarityCap,
    knownUnit,
    lockedIds: campaignCore,
    notAllowed: concerned.notAllowed,
    missingCore: concerned.missingCore,
  }
  const lineupActions = {
    onMakeCore: (unitId: string) =>
      setDraft((current) => makeCore(current, unitId)),
    onMakeFlex: (unitId: string) =>
      setDraft((current) => makeFlex(current, unitId)),
    onRemoveCharacter: (unitId: string) =>
      setDraft((current) => removeCharacter(current, unitId)),
    onRemoveMow: (unitId: string) =>
      setDraft((current) => removeMow(current, unitId)),
    onMakeMowFlex: (unitId: string) =>
      setDraft((current) => makeMowFlex(current, unitId)),
    onMakeMowCore: (unitId: string) =>
      setDraft((current) => makeMowCore(current, unitId)),
  }
  // A Survival team is a Horde team for its event: its mode is fixed, so the modes are not offered.
  const modes = draft.survivalEventKey ? null : (
    <TeamModesField
      draft={draft}
      onToggleMode={(mode: TeamMode) =>
        setDraft((current) => toggleMode(current, mode))
      }
    />
  )
  const context = (
    <TeamContextFields
      campaigns={data.campaigns}
      draft={draft}
      facts={facts}
      incursionMowIds={data.incursionMowIds}
      onChooseCampaign={(groupId) =>
        setDraft((current) => chooseCampaign(current, groupId, facts))
      }
      onSetIncursions={(mowIds) =>
        setDraft((current) => setIncursions(current, mowIds))
      }
    />
  )
  const cap = (
    <TeamRarityCapField
      onRarityCapChange={(value) =>
        setDraft((current) => ({ ...current, rarityCap: value }))
      }
      rarityCap={draft.rarityCap}
    />
  )
  const picker = (show: "all" | PickerUnit["kind"]) => (
    <TeamUnitPicker
      allowedFactions={allowed}
      filters={filters}
      lockedIds={campaignCore}
      mows={mows}
      onFiltersChange={onFiltersChange}
      onToggle={onToggle}
      rarityCap={rarityCap}
      roster={data.roster}
      selectedIds={selectedIds}
      show={show}
      units={pickerUnits}
      usage={usage}
    />
  )

  if (isMobile) {
    const characterCount = draft.characterIds.length
    const mowCount = draft.mowIds.length
    return (
      <Tabs
        className="flex min-h-0 flex-1 flex-col gap-3"
        onValueChange={(value) => onTabChange(value as PhoneTab)}
        // The Machines of War tab goes when a mode takes none; its panel goes with it.
        value={tab === "mow" && !mows ? "lineup" : tab}
      >
        <PageTabsList aria-label={t("editor.tabsLabel")}>
          <PageTabsTrigger value="details">
            {t("editor.tabDetails")}
            {nameError ? (
              <span
                aria-label={nameError}
                className="size-2 rounded-full bg-destructive"
                data-testid="team-editor-details-error"
                role="img"
              />
            ) : null}
          </PageTabsTrigger>
          <PageTabsTrigger value="lineup">
            {t("editor.tabLineup")}
            <CountBadge count={characterCount + mowCount} />
          </PageTabsTrigger>
          <PageTabsTrigger value="character">
            {t("picker.characters")}
            <CountBadge count={characterCount} />
          </PageTabsTrigger>
          {mows ? (
            <PageTabsTrigger value="mow">
              {t("lineup.mows")}
              <CountBadge count={mowCount} />
            </PageTabsTrigger>
          ) : null}
        </PageTabsList>
        {/* The details are fields to fill, so they sit in the sheet itself, never in a popover
            on top of it (ui-style-guide rule 8). */}
        <TabsContent className="flex flex-col gap-4" value="details">
          <TeamNameField
            name={draft.name}
            nameError={nameError}
            onNameChange={(name) =>
              setDraft((current) => ({ ...current, name }))
            }
          />
          <TeamNotesField
            notes={draft.notes}
            onNotesChange={(notes) =>
              setDraft((current) => ({ ...current, notes }))
            }
          />
          {modes}
          {context}
          {cap}
        </TabsContent>
        <TabsContent className="flex flex-col gap-3" value="lineup">
          <TeamEditorLineup
            draft={draft}
            knownUnit={knownUnit}
            lockedIds={campaignCore}
            missingCore={concerned.missingCore}
            notAllowed={concerned.notAllowed}
            onArrangeCharacters={(order) =>
              setDraft((current) =>
                arrangeCharacters(current, order, campaignCore)
              )
            }
            onArrangeMows={(order) =>
              setDraft((current) => arrangeMows(current, order))
            }
            rarityCap={rarityCap}
            roster={data.roster}
            {...lineupActions}
          />
        </TabsContent>
        <TabsContent className="flex min-h-0 flex-col" value="character">
          {picker("character")}
        </TabsContent>
        {mows ? (
          <TabsContent className="flex min-h-0 flex-col" value="mow">
            {picker("mow")}
          </TabsContent>
        ) : null}
      </Tabs>
    )
  }

  return (
    <div className="@container/editor flex min-h-0 flex-1 flex-col gap-4">
      {/* One grid for the three, so their labels, controls and hints share rows. */}
      <div className="grid grid-cols-[minmax(12rem,24rem)_10rem_auto] grid-rows-[auto_auto_auto] justify-start gap-x-4 gap-y-1.5">
        <TeamNameField
          className="row-span-3 grid grid-rows-subgrid"
          name={draft.name}
          nameError={nameError}
          onNameChange={(name) => setDraft((current) => ({ ...current, name }))}
        />
        <TeamRarityCapField
          className="row-span-3 grid grid-rows-subgrid"
          onRarityCapChange={(value) =>
            setDraft((current) => ({ ...current, rarityCap: value }))
          }
          rarityCap={draft.rarityCap}
        />
        <div className="col-start-3 row-start-2">
          <TeamNotesButton
            controls={notesId}
            notes={draft.notes}
            onOpenChange={setNotesOpen}
            open={notesOpen}
          />
        </div>
      </div>
      {notesOpen ? (
        <div className="max-w-xl" id={notesId}>
          <TeamNotesField
            notes={draft.notes}
            onNotesChange={(notes) =>
              setDraft((current) => ({ ...current, notes }))
            }
          />
        </div>
      ) : null}
      {modes}
      {draft.modes.includes("campaign") ||
      draft.modes.includes("incursion") ||
      draft.survivalEventKey ? (
        <div className="max-w-xl">{context}</div>
      ) : null}
      <TeamLineupBand
        draft={draft}
        onArrangeCharacters={(order) =>
          setDraft((current) => arrangeCharacters(current, order, campaignCore))
        }
        onArrangeMows={(order) =>
          setDraft((current) => arrangeMows(current, order))
        }
        props={unitProps}
        sizeLimited={draft.modes.some((mode) =>
          SIZE_LIMITED_MODES.includes(mode)
        )}
        {...lineupActions}
      />
      <p
        aria-live="polite"
        className="sr-only"
        data-testid="team-editor-announce"
      >
        {announcement}
      </p>
      {picker("all")}
    </div>
  )
}

/** The editor's data while it loads or after it failed. */
function EditorLoadState({
  status,
  onRetry,
}: {
  status: "loading" | "error"
  onRetry: () => void
}) {
  const { t } = useTranslation("teams")
  if (status === "loading") {
    return (
      <PageLoading label={t("editor.loading")} testId="team-editor-loading" />
    )
  }
  return (
    <Alert variant="destructive">
      <AlertDescription className="flex flex-wrap items-center gap-3">
        {t("editor.loadError")}
        <Button onClick={onRetry} size="sm" variant="outline">
          {t("page.retry")}
        </Button>
      </AlertDescription>
    </Alert>
  )
}

/** Why the last save did not go through, translated. */
function SaveMessageText({
  message,
  nameError,
  team,
}: {
  message: SaveMessage | null
  /** A save refused because the name is taken; said here too, as a phone shows the field on
   *  another tab. */
  nameError: string | null
  team: TeamFields
}) {
  const { t } = useTranslation("teams")
  if (nameError) {
    return (
      <div
        className="text-sm text-destructive"
        data-testid="team-editor-message"
        role="alert"
      >
        {nameError}
      </div>
    )
  }
  if (!message) return null
  const text = {
    stale: () => t("editor.stale"),
    failed: () => t("editor.saveFailed"),
    limit: () => t("editor.limitReached", { count: TEAM_LIMITS.maxTeams }),
  }
  return (
    <div
      className="text-sm text-destructive"
      data-testid="team-editor-message"
      role="alert"
    >
      {message.kind === "refused" ? (
        <>
          {t("editor.refused")}
          <TeamIssueList codes={message.rules} team={team} />
        </>
      ) : (
        text[message.kind]()
      )}
    </div>
  )
}

/**
 * The team editor (design D6): a large centered dialog on desktop, with the name, cap and Notes,
 * the modes, a lineup strip and the picker below it; a bottom sheet on a phone, with Details
 * (name, notes, modes, cap), Lineup, Characters and Machines of War tabs. It holds the draft and
 * evaluates the rules after every change. Save stays available: trying it while a rule is broken
 * lists what to fix in the footer, and the list then follows the draft. It closes only once a save succeeds; a
 * failed save keeps the draft, and a stale one keeps it on top of the team as it now stands, so
 * saving again replaces that version. The picker filters reset when it closes. Mount it only while
 * open: its data is derived once per open.
 */
export function TeamEditorDialog({
  team,
  teams,
  onClose,
  deleted = false,
  newTeamModes = [],
  newTeamName,
  newTeamSurvivalEventKey,
}: {
  /** The team to edit, or null to create one. */
  team: Team | null
  /** The modes a new team starts with, for a page that creates teams for its own mode. */
  newTeamModes?: readonly TeamMode[]
  /** The name a new team starts with. */
  newTeamName?: string
  /** The Survival event a new team is for (with the Horde mode), for the Survival page. */
  newTeamSurvivalEventKey?: string
  /** The team was deleted elsewhere while open: the editor keeps showing it, and Save is off. */
  deleted?: boolean
  /** Every saved team, for the same-mode flags. */
  teams: readonly Team[]
  onClose: () => void
}) {
  const { t } = useTranslation("teams")
  const isMobile = useIsMobile()
  const editorData = useTeamEditorData()
  const [draft, setDraftState] = useState<TeamDraft>(() =>
    team
      ? draftFromTeam(team)
      : emptyDraft(newTeamModes, {
          name: newTeamName,
          survivalEventKey: newTeamSurvivalEventKey ?? null,
        })
  )
  // What the draft started as, so closing can tell whether anything would be lost.
  const [initialFields] = useState(() => JSON.stringify(draftToFields(draft)))
  const [confirmingDiscard, setConfirmingDiscard] = useState(false)
  const [revision, setRevision] = useState(team?.revision ?? 0)
  const [message, setMessage] = useState<SaveMessage | null>(null)
  const [nameTaken, setNameTaken] = useState(false)
  // The rule list stays hidden until a save is tried; from then on it follows the draft.
  const [attempted, setAttempted] = useState(false)
  // A new team starts on its details (it needs a name); an existing one on its lineup.
  const [tab, setTab] = useState<PhoneTab>(team ? "lineup" : "details")
  const create = useCreateTeam()
  const update = useUpdateTeam()
  const saving = create.isPending || update.isPending

  const setDraft = useCallback((change: (draft: TeamDraft) => TeamDraft) => {
    setDraftState(change)
    setNameTaken(false)
  }, [])

  const data = editorData.status === "ready" ? editorData.data : undefined
  const fields = draftToFields(draft)
  const broken = data
    ? evaluateTeamRules(fields, data.facts, team?.survivalEventKey)
    : []
  const canTrySave = data !== undefined && !saving && !deleted

  const save = async () => {
    if (!canTrySave) return
    if (broken.length > 0) {
      // Save stays available; trying it with rules broken lists what to fix instead.
      setAttempted(true)
      setMessage(null)
      return
    }
    setMessage(null)
    // Chosen outside the try: React Compiler cannot compile a conditional inside one.
    const request = team
      ? update.mutateAsync({ teamId: team.id, fields, revision })
      : create.mutateAsync(fields)
    try {
      const saved = await request
      toast.success(t("editor.saved", { name: saved.name }))
      onClose()
    } catch (error) {
      const current = staleRevision(error)
      if (current !== null) {
        setRevision(current)
        setMessage({ kind: "stale" })
      } else if (isTeamNameTaken(error)) {
        setNameTaken(true)
        setTab("details")
      } else if (isTeamLimitReached(error)) {
        setMessage({ kind: "limit" })
      } else {
        const rules = teamRulesBroken(error)
        setMessage(rules ? { kind: "refused", rules } : { kind: "failed" })
      }
    }
  }

  const characters = draft.characterIds.length
  const mows = draft.mowIds.length
  const dirty = JSON.stringify(fields) !== initialFields
  const showIssues = attempted && data !== undefined && broken.length > 0
  const nameError = nameTaken ? t("editor.nameTaken") : null
  // Cancel, the close control and Escape ask before discarding changes; outside clicks never close.
  const requestClose = () => {
    if (saving) return
    if (dirty) setConfirmingDiscard(true)
    else onClose()
  }
  const title = team
    ? t("editor.editTitle", { name: team.name })
    : t("editor.createTitle")

  return (
    <ResponsiveDialog
      contentClassName="motion-reduce:data-closed:animate-none motion-reduce:data-open:animate-none"
      data-testid="team-editor"
      desktopClassName="h-[calc(100vh-4rem)]"
      onOpenChange={(open) => {
        if (!open) requestClose()
      }}
      open
      preventOutsideClose
    >
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle className="truncate">
          {isMobile
            ? draft.name.trim() || (team ? title : t("editor.newTeam"))
            : title}
        </ResponsiveDialogTitle>
      </ResponsiveDialogHeader>
      <ResponsiveDialogBody>
        {editorData.status === "ready" ? (
          <EditorBody
            data={editorData.data}
            draft={draft}
            nameError={nameError}
            onTabChange={setTab}
            setDraft={setDraft}
            tab={tab}
            team={team}
            teams={teams}
          />
        ) : (
          <EditorLoadState
            onRetry={editorData.retry}
            status={editorData.status}
          />
        )}
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        {/* The summary at the left on desktop, its own row on a phone: why a save did not go
            through, or else the lineup count. */}
        <div className="min-w-0 max-md:basis-full md:mr-auto">
          {deleted ? (
            <div
              className="text-sm text-destructive"
              data-testid="team-editor-deleted"
              role="alert"
            >
              {t("editor.deleted")}
            </div>
          ) : message || (isMobile && nameError) ? (
            <SaveMessageText
              message={message}
              // Desktop shows the name field, and its error, in the body at all times.
              nameError={isMobile ? nameError : null}
              team={fields}
            />
          ) : showIssues ? (
            <div
              aria-live="polite"
              className="max-h-28 overflow-y-auto text-sm"
              data-testid="team-editor-issues"
            >
              <p className="font-medium text-destructive">
                {t("editor.fixToSave")}
              </p>
              <TeamIssueList codes={broken} team={fields} />
            </div>
          ) : (
            <span
              aria-live="polite"
              className="text-sm text-muted-foreground tabular-nums"
              data-testid="team-editor-count"
            >
              {t("editor.lineupCharacters", { count: characters })}
              {" · "}
              {t("editor.lineupMows", { count: mows })}
            </span>
          )}
        </div>
        <Button
          disabled={saving}
          onClick={requestClose}
          type="button"
          variant="outline"
        >
          {t("editor.cancel")}
        </Button>
        <Button
          disabled={!canTrySave}
          onClick={() => void save()}
          type="button"
        >
          {saving ? (
            <>
              <Spinner data-icon="inline-start" />
              {t("editor.saving")}
            </>
          ) : (
            t("editor.save")
          )}
        </Button>
      </ResponsiveDialogFooter>
      <ConfirmationDialog
        cancelLabel={t("editor.unsaved.keep")}
        confirmLabel={t("editor.unsaved.discard")}
        description={t("editor.unsaved.description")}
        onCancel={() => setConfirmingDiscard(false)}
        onConfirm={() => {
          setConfirmingDiscard(false)
          onClose()
        }}
        open={confirmingDiscard}
        title={t("editor.unsaved.title")}
      />
    </ResponsiveDialog>
  )
}
