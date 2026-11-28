import { useTranslation } from "react-i18next"
import { GripVertical, Lock, X } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { IconButton } from "@workspace/ui/components/icon-button"
import { cn } from "@workspace/ui/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { Pressable } from "@workspace/ui/components/pressable"

import { TEAM_LIMITS, TeamUnitPortrait } from "@/entities/team"
import type { TeamUnitView } from "@/entities/team"
import { SortableList, TruncatedText } from "@/shared/ui"
import type { SortableRenderProps } from "@/shared/ui"
import { useUnitName } from "@/shared/unit-name"

import { cappedView, lineupUnitCap } from "../model/capped-view"
import {
  FLEX_DIVIDER,
  canMakeCore,
  canMakeFlex,
  canMakeMowCore,
  lineupSections,
  mowSections,
} from "../model/team-draft"
import type { TeamDraft } from "../model/team-draft"
import { useUnderCapText } from "../model/use-under-cap-text"
import { useLineupMarks } from "../model/lineup-unit"
import type { LineupUnitProps } from "../model/lineup-unit"
import { RoleSwitch } from "./role-switch"
import { UnitAbilities } from "./unit-abilities"

type Kind = TeamUnitView["kind"]

/** One lineup slot: the portrait (the drag handle), name, ability levels, marks and actions. */
function BandSlot({
  kind,
  unitId,
  section,
  nodeRef,
  style,
  isDragging,
  dragHandle,
  props,
  canFlex,
  canCore,
  onToggleRole,
  onRemove,
}: {
  kind: Kind
  unitId: string
  section: "core" | "flex"
  nodeRef: SortableRenderProps["setNodeRef"]
  style: SortableRenderProps["style"]
  isDragging: boolean
  dragHandle: SortableRenderProps["dragHandle"]
  props: LineupUnitProps
  canFlex: boolean
  canCore: boolean
  onToggleRole: () => void
  onRemove: () => void
}) {
  const { t } = useTranslation(["teams", "progression"])
  const unitName = useUnitName()
  const underCapText = useUnderCapText()
  const marksOf = useLineupMarks(props)
  const { roster, rarityCap, lockedIds } = props
  const name = unitName(kind === "mow" ? "Mow" : "Character", unitId)
  const marks = marksOf(kind, unitId)
  const { capped, under } = lineupUnitCap(kind, unitId, roster, rarityCap)
  const locked = lockedIds.has(unitId)
  const isFlex = section === "flex"
  const { ref, attributes, listeners } = dragHandle
  return (
    <li
      className={cn(
        "relative flex w-28 shrink-0 flex-col items-center gap-1 rounded-lg border bg-card p-1.5 text-center data-dragging:z-10 data-dragging:border-ring data-dragging:shadow-lg",
        isFlex && "border-dashed",
        marks.length > 0 && "border-destructive"
      )}
      data-dragging={isDragging || undefined}
      data-kind={kind}
      data-marked={marks.length > 0 ? "true" : undefined}
      data-section={section}
      data-testid="team-lineup-unit"
      data-unit={unitId}
      ref={nodeRef}
      style={style}
    >
      <Pressable
        variant="art"
        {...attributes}
        {...listeners}
        aria-label={t("lineup.drag", { name })}
        className="group relative cursor-grab touch-none rounded-full active:cursor-grabbing"
        ref={ref}
      >
        <TeamUnitPortrait
          size="portrait-sm"
          unit={cappedView(kind, unitId, roster, rarityCap)}
        />
        <GripVertical
          aria-hidden="true"
          className="absolute top-0 -left-2 size-icon text-muted-foreground opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
        />
      </Pressable>
      <TruncatedText className="w-full text-xs font-medium">
        {name}
      </TruncatedText>
      {capped && under ? (
        <UnitAbilities levels={capped.abilityLevels} under={under.abilities} />
      ) : null}
      {under?.any ? (
        <TruncatedText
          className="w-full text-xs text-warning-foreground"
          data-testid="team-lineup-under-cap"
          lines={2}
        >
          {underCapText(under, rarityCap) ?? ""}
        </TruncatedText>
      ) : null}
      {marks.map((mark) => (
        <Badge className="max-w-full truncate" key={mark} variant="destructive">
          {mark}
        </Badge>
      ))}
      <RoleSwitch
        className="mt-auto w-full"
        coreDisabled={!canCore}
        flexDisabled={locked || !canFlex}
        name={name}
        onChange={(next) => {
          if ((next === "flex") !== isFlex) onToggleRole()
        }}
        role={isFlex ? "flex" : "core"}
      />
      {locked ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              aria-label={t("lineup.campaignCore", { name })}
              className="absolute top-0.5 right-0.5 grid size-6 place-items-center text-muted-foreground"
              role="img"
            >
              <Lock className="size-icon-xs" />
            </span>
          </TooltipTrigger>
          <TooltipContent>{t("lineup.campaignCore", { name })}</TooltipContent>
        </Tooltip>
      ) : (
        <IconButton
          className="absolute top-0.5 right-0.5 size-6 text-muted-foreground hover:text-foreground"
          label={t("lineup.remove", { name })}
          onClick={onRemove}
          type="button"
        >
          <X />
        </IconButton>
      )}
    </li>
  )
}

/** The divider between core and flex: drop a unit after it to make it flex. */
function FlexDivider({
  nodeRef,
  style,
  empty,
}: {
  nodeRef: SortableRenderProps["setNodeRef"]
  style: SortableRenderProps["style"]
  empty: boolean
}) {
  const { t } = useTranslation("teams")
  return (
    <li
      aria-hidden={empty ? undefined : "true"}
      className={cn(
        "flex shrink-0 flex-col items-center justify-center gap-1 self-stretch text-center text-xs text-muted-foreground",
        empty
          ? "w-20 rounded-lg border-2 border-dashed border-muted-foreground/50 bg-muted/30 p-1.5"
          : "w-8"
      )}
      data-testid="team-lineup-flex-divider"
      ref={nodeRef}
      style={style}
    >
      {empty ? (
        <>
          <span className="text-sm font-semibold text-foreground">
            {t("lineup.flex")}
          </span>
          <span>{t("lineup.dropFlex")}</span>
        </>
      ) : (
        <>
          <span className="w-px flex-1 bg-border" />
          <span className="font-medium [writing-mode:vertical-rl]">
            {t("lineup.flex")}
          </span>
          <span className="w-px flex-1 bg-border" />
        </>
      )}
    </li>
  )
}

/** One sortable row of slots, core then the divider then flex. */
function BandRow({
  kind,
  label,
  count,
  core,
  flex,
  props,
  canFlex,
  canCore,
  onArrange,
  onToggleRole,
  onRemove,
  className,
}: {
  className?: string
  kind: Kind
  label: string
  count: string
  core: readonly string[]
  flex: readonly string[]
  props: LineupUnitProps
  canFlex: (unitId: string) => boolean
  canCore: (unitId: string) => boolean
  onArrange: (order: string[]) => void
  onToggleRole: (unitId: string, section: "core" | "flex") => void
  onRemove: (unitId: string) => void
}) {
  const { t } = useTranslation("teams")
  const unitName = useUnitName()
  const items = [...core, FLEX_DIVIDER, ...flex]
  const sectionOf = (id: string) => (flex.includes(id) ? "flex" : "core")
  return (
    <section
      aria-label={label}
      className={cn("flex min-w-0 flex-col gap-1.5", className)}
    >
      <h4 className="flex items-baseline gap-2 text-sm font-medium">
        {label}
        <span className="text-xs font-normal text-muted-foreground tabular-nums">
          {count}
        </span>
      </h4>
      {/* One row that scrolls sideways, so a full lineup never pushes the picker down. */}
      <ul
        className="flex gap-2 overflow-x-auto p-1"
        data-testid={
          kind === "mow" ? "team-lineup-mow-row" : "team-lineup-character-row"
        }
      >
        <SortableList
          getId={(id) => id}
          getLabel={(id) =>
            id === FLEX_DIVIDER
              ? t("lineup.flex")
              : unitName(kind === "mow" ? "Mow" : "Character", id)
          }
          items={items}
          onReorder={(order) => onArrange(order)}
          renderItem={(id, sortable) =>
            id === FLEX_DIVIDER ? (
              <FlexDivider
                empty={flex.length === 0}
                key={id}
                nodeRef={sortable.setNodeRef}
                style={sortable.style}
              />
            ) : (
              <BandSlot
                canCore={canCore(id)}
                canFlex={canFlex(id)}
                key={id}
                kind={kind}
                onRemove={() => onRemove(id)}
                onToggleRole={() => onToggleRole(id, sectionOf(id))}
                props={props}
                section={sectionOf(id)}
                dragHandle={sortable.dragHandle}
                isDragging={sortable.isDragging}
                nodeRef={sortable.setNodeRef}
                style={sortable.style}
                unitId={id}
              />
            )
          }
          strategy="grid"
        />
      </ul>
    </section>
  )
}

/**
 * The desktop lineup band (design D6): the characters and the MoWs as rows of slots that stay in
 * view above the picker, each one row that scrolls sideways once it is full. A divider splits core from flex; dragging a slot across it changes its
 * role, and dragging within a side reorders it, by pointer, touch or keyboard. Each slot also has
 * a Core/Flex switch and Remove, and shows the rule marks and what is under the cap.
 */
export function TeamLineupBand({
  draft,
  sizeLimited,
  props,
  onArrangeCharacters,
  onArrangeMows,
  onMakeFlex,
  onMakeCore,
  onMakeMowFlex,
  onMakeMowCore,
  onRemoveCharacter,
  onRemoveMow,
}: {
  draft: TeamDraft
  /** Whether a selected mode caps the core, for the "5 of 5" count. */
  sizeLimited: boolean
  props: LineupUnitProps
  onArrangeCharacters: (order: string[]) => void
  onArrangeMows: (order: string[]) => void
  onMakeFlex: (unitId: string) => void
  onMakeCore: (unitId: string) => void
  onMakeMowFlex: (unitId: string) => void
  onMakeMowCore: (unitId: string) => void
  onRemoveCharacter: (unitId: string) => void
  onRemoveMow: (unitId: string) => void
}) {
  const { t } = useTranslation("teams")
  const characters = lineupSections(draft)
  const mowLineup = mowSections(draft)
  const empty = draft.characterIds.length === 0 && draft.mowIds.length === 0
  const coreCount = (core: number, max: number) =>
    sizeLimited
      ? t("lineup.coreOfMax", { count: core, max })
      : t("lineup.coreCount", { count: core })
  return (
    <div
      className="flex shrink-0 flex-col gap-3 rounded-xl border bg-muted/30 p-3"
      data-testid="team-editor-lineup"
    >
      {empty ? (
        <p className="text-sm text-muted-foreground">{t("lineup.empty")}</p>
      ) : (
        <div className="flex items-start gap-6">
          {draft.characterIds.length > 0 ? (
            <BandRow
              className="flex-1"
              canCore={(unitId) => canMakeCore(draft, unitId)}
              canFlex={(unitId) => canMakeFlex(draft, unitId)}
              core={characters.core}
              count={coreCount(
                characters.core.length,
                TEAM_LIMITS.maxWarCoreCharacters
              )}
              flex={characters.flex}
              kind="character"
              label={t("lineup.characters")}
              onArrange={onArrangeCharacters}
              onRemove={onRemoveCharacter}
              onToggleRole={(unitId, section) =>
                (section === "flex" ? onMakeCore : onMakeFlex)(unitId)
              }
              props={props}
            />
          ) : null}
          {/* Shown whenever there are MoWs, also an imported team's in a mode that takes none, so they can be removed. */}
          {draft.mowIds.length > 0 ? (
            <BandRow
              className={
                draft.characterIds.length > 0 ? "max-w-1/3 shrink-0" : "flex-1"
              }
              canCore={(unitId) => canMakeMowCore(draft, unitId)}
              canFlex={() => true}
              core={mowLineup.core}
              count={coreCount(
                mowLineup.core.length,
                TEAM_LIMITS.maxWarCoreMows
              )}
              flex={mowLineup.flex}
              kind="mow"
              label={t("lineup.mows")}
              onArrange={onArrangeMows}
              onRemove={onRemoveMow}
              onToggleRole={(unitId, section) =>
                (section === "flex" ? onMakeMowCore : onMakeMowFlex)(unitId)
              }
              props={props}
            />
          ) : null}
        </div>
      )}
    </div>
  )
}
