import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Gauge, Layers, NotebookPen } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { cn } from "@workspace/ui/lib/utils"

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
  staleTeam,
  teamRulesBroken,
  useCreateTeam,
  useTeamModeLabel,
  useUpdateTeam,
} from "@/entities/team"
import type { Team, TeamFields, TeamMode, TeamRuleCode } from "@/entities/team"
import {
  ConfirmationDialog,
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
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
  TeamPopoverButton,
  TeamRarityCapField,
} from "./team-editor-fields"
import { TeamLineupBand } from "./team-lineup-band"
import type { LineupUnitProps } from "./team-lineup-band"
import { TeamUnitPicker } from "./team-unit-picker"

/** Why the last save did not go through; a successful save closes the editor with a toast. */
type SaveMessage =
  | { kind: "stale" | "failed" | "limit" }
  | { kind: "refused"; rules: TeamRuleCode[] }

type PhoneTab = "lineup" | "character" | "mow"

/** The lineup fields Undo puts back exactly. */
const lineupOf = (draft: TeamDraft) => ({
  characterIds: draft.characterIds,
  flexStartIndex: draft.flexStartIndex,
  mowIds: draft.mowIds,
  mowFlexStartIndex: draft.mowFlexStartIndex,
})

function EditorBody({
  team,
  teams,
  data,
  draft,
  setDraft,
  nameError,
}: {
  team: Team | null
  teams: readonly Team[]
  data: TeamEditorData
  draft: TeamDraft
  setDraft: (update: (draft: TeamDraft) => TeamDraft) => void
  nameError: string | null
}) {
  const { t } = useTranslation("teams")
  const isMobile = useIsMobile()
  const unitName = useUnitName()
  const modeLabel = useTeamModeLabel()
  // The cap is saved with the team (null = none); with none, units show as they are (Mythic).
  const rarityCap = draft.rarityCap ?? DEFAULT_RARITY_CAP
  const [filters, setFilters] = useState<PickerFilters>(defaultPickerFilters)
  const [tab, setTab] = useState<PhoneTab>("lineup")
  // Where the last added or removed unit went, for screen readers on desktop (a phone shows it).
  const [announcement, setAnnouncement] = useState("")
  const { facts } = data
  const fields = draftToFields(draft)
  const concerned = charactersConcerned(fields, facts)
  const allowed = allowedFactions(fields, facts)
  const mows = takesMows(draft)
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

  // Adding or removing a unit says where it went; on a phone, with Undo restoring the lineup.
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
            setDraft((current) => ({ ...current, ...lineupOf(before) })),
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
  const modes = (
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
      units={data.units}
      usage={usage}
    />
  )

  if (isMobile) {
    const characterCount = draft.characterIds.length
    const mowCount = draft.mowIds.length
    const modeSummary = draft.modes.map(modeLabel).join(", ")
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <TeamPopoverButton
            icon={<NotebookPen data-icon="inline-start" />}
            label={t("editor.nameAndNotes")}
            markLabel={t("editor.hasNotes")}
            marked={draft.notes.trim().length > 0}
            testId="team-name-notes-button"
          >
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
          </TeamPopoverButton>
          <TeamPopoverButton
            icon={<Layers data-icon="inline-start" />}
            label={modeSummary || t("editor.modes")}
            testId="team-modes-button"
          >
            {modes}
            {context}
          </TeamPopoverButton>
          <TeamPopoverButton
            icon={<Gauge data-icon="inline-start" />}
            label={t("rarityCap.label")}
            markLabel={draft.rarityCap ?? undefined}
            marked={draft.rarityCap !== null}
            testId="team-cap-button"
          >
            {cap}
          </TeamPopoverButton>
        </div>
        <Tabs
          className="flex min-h-0 flex-1 flex-col gap-3"
          onValueChange={(value) => setTab(value as PhoneTab)}
          value={tab}
        >
          <TabsList
            aria-label={t("editor.tabsLabel")}
            className="h-auto w-full"
          >
            <TabsTrigger className="min-h-10" value="lineup">
              {t("editor.tabLineup")}
              <span className="text-muted-foreground tabular-nums">
                {characterCount + mowCount}
              </span>
            </TabsTrigger>
            <TabsTrigger className="min-h-10" value="character">
              {t("picker.characters")}
              <span className="text-muted-foreground tabular-nums">
                {characterCount}
              </span>
            </TabsTrigger>
            {mows ? (
              <TabsTrigger className="min-h-10" value="mow">
                {t("lineup.mows")}
                <span className="text-muted-foreground tabular-nums">
                  {mowCount}
                </span>
              </TabsTrigger>
            ) : null}
          </TabsList>
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
      </div>
    )
  }

  return (
    <div className="@container/editor flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-start gap-x-8 gap-y-3">
        <div className="min-w-0 flex-1 basis-96">{modes}</div>
        {cap}
      </div>
      {draft.modes.includes("campaign") || draft.modes.includes("incursion") ? (
        <div className="max-w-xl">{context}</div>
      ) : null}
      <TeamLineupBand
        draft={draft}
        mows={mows}
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
      <div
        className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground"
        data-testid="team-editor-loading"
      >
        <Spinner />
        {t("editor.loading")}
      </div>
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
  team,
}: {
  message: SaveMessage | null
  team: TeamFields
}) {
  const { t } = useTranslation("teams")
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
 * The team editor (design D6): a large centered dialog on desktop, with the name and Notes in its
 * header, the modes and cap, a lineup band that stays in view and the picker below it; a bottom
 * sheet on a phone, with Name and notes, Modes and Cap buttons and Lineup, Characters and Machines
 * of War tabs. It holds the draft, evaluates the rules after every change and keeps Save
 * unavailable, with the reasons, while any is broken. It closes only once a save succeeds; a
 * failed save keeps the draft, and a stale one keeps it on top of the team as it now stands, so
 * saving again replaces that version. The picker filters reset when it closes. Mount it only while
 * open: its data is derived once per open.
 */
export function TeamEditorDialog({
  team,
  teams,
  onClose,
}: {
  /** The team to edit, or null to create one. */
  team: Team | null
  /** Every saved team, for the same-mode flags. */
  teams: readonly Team[]
  onClose: () => void
}) {
  const { t } = useTranslation("teams")
  const isMobile = useIsMobile()
  const editorData = useTeamEditorData()
  const [draft, setDraftState] = useState<TeamDraft>(() =>
    team ? draftFromTeam(team) : emptyDraft()
  )
  // What the draft started as, so closing can tell whether anything would be lost.
  const [initialFields] = useState(() => JSON.stringify(draftToFields(draft)))
  const [confirmingDiscard, setConfirmingDiscard] = useState(false)
  const [revision, setRevision] = useState(team?.revision ?? 0)
  const [message, setMessage] = useState<SaveMessage | null>(null)
  const [nameTaken, setNameTaken] = useState(false)
  const create = useCreateTeam()
  const update = useUpdateTeam()
  const saving = create.isPending || update.isPending

  const setDraft = useCallback((change: (draft: TeamDraft) => TeamDraft) => {
    setDraftState(change)
    setNameTaken(false)
  }, [])

  const data = editorData.status === "ready" ? editorData.data : undefined
  const fields = draftToFields(draft)
  const broken = data ? evaluateTeamRules(fields, data.facts) : []
  const canSave = data !== undefined && broken.length === 0 && !saving

  const save = async () => {
    if (!canSave) return
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
      const current = staleTeam(error)
      if (current) {
        setRevision(current.revision)
        setMessage({ kind: "stale" })
      } else if (isTeamNameTaken(error)) {
        setNameTaken(true)
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
  // A new team's missing pieces are steps, not errors; a saved team that breaks a rule is an error.
  const brokenIsError = team !== null
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
      desktopClassName="h-[calc(100vh-4rem)] sm:max-w-[min(88rem,calc(100vw-4rem))]"
      onOpenChange={(open) => {
        if (!open) requestClose()
      }}
      open
      preventOutsideClose
    >
      <ResponsiveDialogHeader
        className={cn(!isMobile && "flex-row items-start gap-3 pt-5")}
      >
        {isMobile ? (
          <ResponsiveDialogTitle className="truncate">
            {draft.name.trim() || (team ? title : t("editor.newTeam"))}
          </ResponsiveDialogTitle>
        ) : (
          <>
            <ResponsiveDialogTitle className="sr-only">
              {title}
            </ResponsiveDialogTitle>
            <TeamNameField
              className="max-w-sm flex-1"
              name={draft.name}
              nameError={nameError}
              onNameChange={(name) =>
                setDraft((current) => ({ ...current, name }))
              }
            />
            <div className="pt-5">
              <TeamNotesButton
                notes={draft.notes}
                onNotesChange={(notes) =>
                  setDraft((current) => ({ ...current, notes }))
                }
              />
            </div>
          </>
        )}
      </ResponsiveDialogHeader>
      <ResponsiveDialogBody
        className={cn("py-2", !isMobile && "overflow-hidden")}
      >
        {editorData.status === "ready" ? (
          <EditorBody
            data={editorData.data}
            draft={draft}
            nameError={nameError}
            setDraft={setDraft}
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
      <ResponsiveDialogFooter className="flex-col items-stretch gap-2 border-t md:flex-col md:items-stretch">
        <SaveMessageText message={message} team={fields} />
        {data && broken.length > 0 ? (
          <div
            className="max-h-28 overflow-y-auto"
            data-kind={brokenIsError ? "error" : "steps"}
            data-testid="team-editor-issues"
          >
            <p
              className={cn(
                "text-sm font-medium",
                brokenIsError ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {brokenIsError ? t("editor.fixToSave") : t("editor.toSave")}
            </p>
            <TeamIssueList codes={broken} team={fields} />
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <span
            aria-live="polite"
            className="mr-auto text-sm text-muted-foreground tabular-nums max-md:basis-full"
            data-testid="team-editor-count"
          >
            {t("editor.lineupCharacters", { count: characters })}
            {" · "}
            {t("editor.lineupMows", { count: mows })}
          </span>
          {isMobile ? null : (
            <Button
              disabled={saving}
              onClick={requestClose}
              type="button"
              variant="outline"
            >
              {t("editor.cancel")}
            </Button>
          )}
          <Button
            className="max-md:h-12 max-md:flex-1"
            data-testid="team-editor-save"
            disabled={!canSave}
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
        </div>
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
