import { useId, useState } from "react"
import { useTranslation } from "react-i18next"
import { NotebookPen, TriangleAlert, X } from "lucide-react"
import { factionIcon, mowIcon, rarityIcon } from "@workspace/game-catalog"
import { rarityOrder } from "@workspace/game-domain"
import type { Rarity, UnitId } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { cn } from "@workspace/ui/lib/utils"

import {
  TEAM_LIMITS,
  TEAM_MODES,
  allowedFactions,
  sharedIncursionFactions,
  teamModeIcon,
  useTeamModeLabel,
} from "@/entities/team"
import type { TeamMode, TeamRuleFacts } from "@/entities/team"
import { EntityIcon, FILTER_CHIP_CLASS_NAME } from "@/shared/ui"
import { useUnitName } from "@/shared/unit-name"

import { modeBlock } from "../model/team-draft"
import type { ModeBlock, TeamDraft } from "../model/team-draft"

import type { CampaignOption } from "../model/use-team-editor-data"
import { useOverlayPortal } from "./use-overlay-portal"

/** The cap select's value for a team with no cap. */
const NO_CAP = "none"

/**
 * Every reason a mode is unavailable holds for several modes at once (the exclusive modes, or the
 * size-limited war and Tournament Arena modes), so each is said once, under the mode list.
 */
const isExclusiveReason = (block: ModeBlock | null) =>
  block?.reason === "exclusive" || block?.reason === "exclusiveBlocked"

/** The allowed factions, each with its icon, for a campaign or the chosen Incursions. */
function FactionNote({
  factions,
  labelKey,
}: {
  factions: ReadonlySet<string> | undefined
  labelKey: "campaign.allowed" | "incursion.allowed"
}) {
  const { t } = useTranslation(["teams", "factions"])
  const labelId = useId()
  if (!factions || factions.size === 0) return null
  const named = [...factions]
    .map((faction) => ({
      faction,
      name: t(`factions:${faction}`, { defaultValue: faction }),
    }))
    .toSorted((a, b) => a.name.localeCompare(b.name))
  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground"
      data-testid="team-allowed-factions"
    >
      <span id={labelId}>{t(labelKey)}</span>
      <ul aria-labelledby={labelId} className="contents">
        {named.map(({ faction, name }) => (
          <li className="flex items-center gap-1" key={faction}>
            <EntityIcon alt="" size="inline" src={factionIcon(faction)} />
            {name}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** The name, with its limits or the server's message (another team has it). */
export function TeamNameField({
  name,
  nameError,
  onNameChange,
  className,
}: {
  name: string
  nameError: string | null
  onNameChange: (name: string) => void
  className?: string
}) {
  const { t } = useTranslation("teams")
  const id = useId()
  const hintId = useId()
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <Label htmlFor={id}>{t("editor.name")}</Label>
      <Input
        aria-describedby={hintId}
        aria-invalid={nameError !== null}
        autoComplete="off"
        id={id}
        maxLength={TEAM_LIMITS.maxNameLength}
        onChange={(event) => onNameChange(event.target.value)}
        value={name}
      />
      <p
        className={cn(
          "text-xs",
          nameError ? "text-destructive" : "text-muted-foreground"
        )}
        id={hintId}
      >
        {nameError ??
          t("editor.nameHint", {
            min: TEAM_LIMITS.minNameLength,
            max: TEAM_LIMITS.maxNameLength,
          })}
      </p>
    </div>
  )
}

/** The notes, with their count against the limit. */
export function TeamNotesField({
  notes,
  onNotesChange,
}: {
  notes: string
  onNotesChange: (notes: string) => void
}) {
  const { t } = useTranslation("teams")
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{t("editor.notes")}</Label>
      <Textarea
        id={id}
        maxLength={TEAM_LIMITS.maxNotesLength}
        onChange={(event) => onNotesChange(event.target.value)}
        rows={3}
        value={notes}
      />
      <p className="text-right text-xs text-muted-foreground tabular-nums">
        {t("editor.notesCount", {
          count: notes.length,
          max: TEAM_LIMITS.maxNotesLength,
        })}
      </p>
    </div>
  )
}

/**
 * The Notes button: shows or hides the notes field in the editor itself (no overlay opens on top
 * of the dialog, ui-style-guide rule 8), marked when the team has notes.
 */
export function TeamNotesButton({
  notes,
  open,
  onOpenChange,
  controls,
}: {
  notes: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The id of the notes field's panel. */
  controls: string
}) {
  const { t } = useTranslation("teams")
  return (
    <Button
      aria-controls={controls}
      aria-expanded={open}
      data-testid="team-notes-button"
      onClick={() => onOpenChange(!open)}
      type="button"
      variant="outline"
    >
      <NotebookPen data-icon="inline-start" />
      {t("editor.notes")}
      {notes.trim().length > 0 ? (
        <span
          aria-label={t("editor.hasNotes")}
          className="size-2 rounded-full bg-primary"
          role="img"
        />
      ) : null}
    </Button>
  )
}

/**
 * The modes as a multi-select toggle group, with the reason any of them is unavailable said once
 * under it (touch has no tooltips). A mode an exclusive one blocks stays focusable and pressable
 * (`aria-disabled`), so trying it says why instead of doing nothing.
 */
export function TeamModesField({
  draft,
  onToggleMode,
}: {
  draft: TeamDraft
  onToggleMode: (mode: TeamMode) => void
}) {
  const { t, i18n } = useTranslation("teams")
  const modeLabel = useTeamModeLabel()
  const labelId = useId()
  const exclusiveReasonId = useId()
  const sizeReasonId = useId()
  // The exclusive-mode note is said only once the player tries a mode it blocks, and only until
  // the modes change; screen readers always have it through the mode's description.
  const [explainedFor, setExplainedFor] = useState<string | null>(null)
  const modesKey = draft.modes.join(",")
  const explainExclusive = explainedFor === modesKey
  const exclusiveMode = draft.modes.find(
    (mode) => mode === "campaign" || mode === "incursion"
  )
  const blockedExclusive = TEAM_MODES.filter(
    (mode) => modeBlock(draft, mode)?.reason === "exclusiveBlocked"
  )
  const sizeBlock = TEAM_MODES.map((mode) => modeBlock(draft, mode)).find(
    (block) =>
      block?.reason === "tooManyCore" || block?.reason === "tooManyCoreMows"
  )
  const sizeReason = sizeBlock ? t(`modeReasons.${sizeBlock.reason}`) : null
  const exclusiveReason = exclusiveMode
    ? t("modeReasons.exclusive", { mode: modeLabel(exclusiveMode) })
    : blockedExclusive.length > 0
      ? t("modeReasons.exclusiveBlocked", {
          modes: new Intl.ListFormat(i18n.language, {
            type: "conjunction",
          }).format(blockedExclusive.map(modeLabel)),
        })
      : null
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-sm font-medium" id={labelId}>
        {t("editor.modes")}
      </span>
      <ToggleGroup
        aria-labelledby={labelId}
        className="flex-wrap justify-start"
        onValueChange={(values: string[]) => {
          const mode = TEAM_MODES.find(
            (candidate) =>
              values.includes(candidate) !== draft.modes.includes(candidate)
          )
          if (!mode) return
          if (isExclusiveReason(modeBlock(draft, mode))) {
            setExplainedFor(modesKey)
            return
          }
          onToggleMode(mode)
        }}
        spacing={1}
        type="multiple"
        value={draft.modes}
        variant="outline"
      >
        {TEAM_MODES.map((mode) => {
          const block = modeBlock(draft, mode)
          const exclusiveBlock = isExclusiveReason(block)
          return (
            <ToggleGroupItem
              aria-describedby={
                block
                  ? exclusiveBlock
                    ? exclusiveReasonId
                    : sizeReasonId
                  : undefined
              }
              aria-disabled={exclusiveBlock || undefined}
              className={cn(
                FILTER_CHIP_CLASS_NAME,
                exclusiveBlock && "opacity-50"
              )}
              data-testid={`team-mode-${mode}`}
              disabled={block !== null && !exclusiveBlock}
              key={mode}
              value={mode}
            >
              <EntityIcon alt="" size="inline" src={teamModeIcon(mode)} />
              {modeLabel(mode)}
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>
      {sizeReason ? (
        // The lineup itself keeps these modes out: a warning, with how to fix it.
        <p
          className="flex items-start gap-1.5 text-xs text-amber-800 dark:text-amber-400"
          data-testid="team-modes-size-reason"
          id={sizeReasonId}
        >
          <TriangleAlert
            aria-hidden="true"
            className="mt-px size-3.5 shrink-0"
          />
          {sizeReason}
        </p>
      ) : null}
      {exclusiveReason ? (
        <p
          className={cn(
            "text-xs text-muted-foreground",
            !explainExclusive && "sr-only"
          )}
          data-testid="team-modes-exclusive-reason"
          id={exclusiveReasonId}
        >
          {exclusiveReason}
        </p>
      ) : null}
    </div>
  )
}

/** The rarity cap: None or a rarity, saved with the team; a set cap says how units are shown. */
export function TeamRarityCapField({
  rarityCap,
  onRarityCapChange,
}: {
  rarityCap: Rarity | null
  onRarityCapChange: (rarity: Rarity | null) => void
}) {
  const { t } = useTranslation(["teams", "progression"])
  const labelId = useId()
  const {
    triggerRef: capTrigger,
    container: capContainer,
    onOpenChange: capOpenChange,
  } = useOverlayPortal()
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium" id={labelId}>
        {t("rarityCap.label")}
      </span>
      <Select
        onOpenChange={capOpenChange}
        onValueChange={(value) =>
          onRarityCapChange(value === NO_CAP ? null : (value as Rarity))
        }
        value={rarityCap ?? NO_CAP}
      >
        <SelectTrigger
          aria-labelledby={labelId}
          className="w-40"
          data-testid="team-rarity-cap"
          ref={capTrigger}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent container={capContainer} position="popper">
          <SelectItem value={NO_CAP}>{t("rarityCap.none")}</SelectItem>
          {rarityOrder.map((rarity) => (
            <SelectItem key={rarity} value={rarity}>
              <EntityIcon alt="" size="inline" src={rarityIcon(rarity)} />
              {t(`progression:rarities.${rarity}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {rarityCap ? (
        <p
          className="text-xs text-muted-foreground"
          data-testid="team-rarity-cap-hint"
        >
          {t("rarityCap.hint", {
            rarity: t(`progression:rarities.${rarityCap}`),
          })}
        </p>
      ) : null}
    </div>
  )
}

/** A Campaign team's campaign, or an Incursion team's Incursions; nothing for other modes. */
export function TeamContextFields({
  draft,
  facts,
  campaigns,
  incursionMowIds,
  onChooseCampaign,
  onSetIncursions,
}: {
  draft: TeamDraft
  facts: TeamRuleFacts
  campaigns: readonly CampaignOption[]
  incursionMowIds: readonly string[]
  onChooseCampaign: (groupId: string) => void
  onSetIncursions: (mowIds: string[]) => void
}) {
  const { t } = useTranslation("teams")
  const unitName = useUnitName()
  const ids = { campaign: useId(), incursion: useId() }
  const campaignSelected = draft.modes.includes("campaign")
  const incursionSelected = draft.modes.includes("incursion")
  const shared = sharedIncursionFactions(draft.incursionMowIds, facts)
  // Once a MoW is chosen, only MoWs sharing an allowed faction with every chosen one are offered.
  const incursionChoices = incursionMowIds.filter((mowId) => {
    if (draft.incursionMowIds.includes(mowId)) return false
    if (!shared) return true
    const factions = facts.incursionFactionsByMowId.get(mowId)
    return [...shared].some((faction) => factions?.has(faction))
  })
  const mowName = (mowId: string) => unitName("Mow", mowId)
  const {
    triggerRef: campaignTrigger,
    container: campaignContainer,
    onOpenChange: campaignOpenChange,
  } = useOverlayPortal()
  const {
    triggerRef: incursionTrigger,
    container: incursionContainer,
    onOpenChange: incursionOpenChange,
  } = useOverlayPortal()
  if (!campaignSelected && !incursionSelected) return null
  return (
    <div className="flex min-w-0 flex-col gap-4">
      {campaignSelected ? (
        <div className="flex flex-col gap-1.5">
          <Label id={ids.campaign}>{t("campaign.label")}</Label>
          <Select
            onOpenChange={campaignOpenChange}
            onValueChange={onChooseCampaign}
            value={draft.campaignGroupId ?? undefined}
          >
            <SelectTrigger
              aria-labelledby={ids.campaign}
              className="w-full"
              data-testid="team-campaign-select"
              ref={campaignTrigger}
            >
              <SelectValue placeholder={t("campaign.placeholder")} />
            </SelectTrigger>
            <SelectContent container={campaignContainer} position="popper">
              {campaigns.map((campaign) => (
                <SelectItem key={campaign.groupId} value={campaign.groupId}>
                  <EntityIcon alt="" size="inline" src={campaign.icon} />
                  {campaign.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {t("campaign.replaces")}
          </p>
          <FactionNote
            factions={allowedFactions(draft, facts)}
            labelKey="campaign.allowed"
          />
        </div>
      ) : null}

      {incursionSelected ? (
        <div className="flex flex-col gap-1.5" data-testid="team-incursions">
          <Label id={ids.incursion}>{t("incursion.label")}</Label>
          {draft.incursionMowIds.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {draft.incursionMowIds.map((mowId) => (
                <li
                  className="flex items-center gap-1.5 rounded-full border bg-muted/30 p-0.5 text-sm"
                  data-testid="team-incursion-chip"
                  key={mowId}
                >
                  <EntityIcon
                    alt=""
                    size="portrait-sm"
                    src={mowIcon(mowId as UnitId)}
                  />
                  {mowName(mowId)}
                  <Button
                    aria-label={t("incursion.remove", { name: mowName(mowId) })}
                    onClick={() =>
                      onSetIncursions(
                        draft.incursionMowIds.filter((id) => id !== mowId)
                      )
                    }
                    size="icon-xs"
                    type="button"
                    variant="ghost"
                  >
                    <X />
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
          <Select
            onOpenChange={incursionOpenChange}
            onValueChange={(mowId) =>
              onSetIncursions([...draft.incursionMowIds, mowId])
            }
            value=""
          >
            <SelectTrigger
              aria-labelledby={ids.incursion}
              className="w-full"
              data-testid="team-incursion-add"
              ref={incursionTrigger}
            >
              <SelectValue placeholder={t("incursion.addPlaceholder")} />
            </SelectTrigger>
            <SelectContent container={incursionContainer} position="popper">
              {incursionChoices.map((mowId) => (
                <SelectItem key={mowId} value={mowId}>
                  <EntityIcon
                    alt=""
                    size="row"
                    src={mowIcon(mowId as UnitId)}
                  />
                  {mowName(mowId)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {t("incursion.clears")}
          </p>
          {shared && shared.size === 0 ? (
            <p className="text-sm text-destructive">
              {t("incursion.noShared")}
            </p>
          ) : (
            <FactionNote factions={shared} labelKey="incursion.allowed" />
          )}
        </div>
      ) : null}
    </div>
  )
}
