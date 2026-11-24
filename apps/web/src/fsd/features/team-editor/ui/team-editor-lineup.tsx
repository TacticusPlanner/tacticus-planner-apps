import { useTranslation } from "react-i18next"
import { Lock, X } from "lucide-react"
import type { Rarity } from "@workspace/game-domain"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { TeamUnitPortrait } from "@/entities/team"
import type { TeamRoster, TeamUnitView } from "@/entities/team"
import { DragGrip, ListDivider, SortableList } from "@/shared/ui"
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
import { useLineupMarks } from "./lineup-unit"
import { RoleSwitch } from "./role-switch"
import { UnitAbilities } from "./unit-abilities"

/**
 * The phone's Lineup tab (design D6): the characters, core then flex, then the MoWs the same way.
 * Each unit can be dragged by its grip (touch, pointer or keyboard) to reorder it or across the
 * Flex heading to change its role, switched between Core and Flex, and removed; a
 * campaign's core
 * characters cannot be removed or made flex while that campaign is chosen. Characters a rule is
 * about are marked: not allowed (faction), must be core (campaign), unknown (not in the catalog).
 */
export function TeamEditorLineup({
  draft,
  roster,
  rarityCap,
  knownUnit,
  lockedIds,
  notAllowed,
  missingCore,
  onMakeFlex,
  onMakeCore,
  onRemoveCharacter,
  onRemoveMow,
  onMakeMowFlex,
  onMakeMowCore,
  onArrangeCharacters,
  onArrangeMows,
}: {
  draft: TeamDraft
  roster: TeamRoster | null
  rarityCap: Rarity
  knownUnit: (kind: TeamUnitView["kind"], unitId: string) => boolean
  /** Characters that cannot be removed or made flex: the chosen campaign's core. */
  lockedIds: ReadonlySet<string>
  notAllowed: ReadonlySet<string>
  missingCore: ReadonlySet<string>
  onMakeFlex: (unitId: string) => void
  onMakeCore: (unitId: string) => void
  onRemoveCharacter: (unitId: string) => void
  onRemoveMow: (unitId: string) => void
  onMakeMowFlex: (unitId: string) => void
  onMakeMowCore: (unitId: string) => void
  /** A new order with `FLEX_DIVIDER` between core and flex (see `arrangeCharacters`). */
  onArrangeCharacters: (order: string[]) => void
  onArrangeMows: (order: string[]) => void
}) {
  const { t } = useTranslation(["teams", "progression"])
  const unitName = useUnitName()
  const underCapText = useUnderCapText()
  const marksOf = useLineupMarks({ knownUnit, notAllowed, missingCore })
  const { core, flex } = lineupSections(draft)
  const mows = mowSections(draft)
  const empty = draft.characterIds.length === 0 && draft.mowIds.length === 0

  const row = (
    kind: TeamUnitView["kind"],
    unitId: string,
    actions: React.ReactNode,
    section: "core" | "flex",
    sortable: SortableRenderProps
  ) => {
    const name = unitName(kind === "mow" ? "Mow" : "Character", unitId)
    const marks = marksOf(kind, unitId)
    const { capped, under } = lineupUnitCap(kind, unitId, roster, rarityCap)
    return (
      <li
        className={cn(
          "flex min-w-0 items-center gap-1 rounded-lg border bg-card p-1 data-dragging:relative data-dragging:z-10 data-dragging:border-ring data-dragging:shadow-lg",
          section === "flex" && "border-dashed",
          marks.length > 0 && "border-destructive"
        )}
        data-dragging={sortable.isDragging || undefined}
        data-kind={kind}
        data-marked={marks.length > 0 ? "true" : undefined}
        data-section={section}
        data-testid="team-lineup-unit"
        data-unit={unitId}
        key={unitId}
        ref={sortable.setNodeRef}
        style={sortable.style}
      >
        {/* Dragging is how a lineup is arranged (core vs flex), so its grip always shows. */}
        <DragGrip
          dragHandle={sortable.dragHandle}
          label={t("lineup.drag", { name })}
          reveal="always"
        />
        <TeamUnitPortrait unit={cappedView(kind, unitId, roster, rarityCap)} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium" title={name}>
            {name}
          </span>
          {/* Under the name, so the name keeps the row's width on a phone. */}
          {capped && under ? (
            <UnitAbilities
              className="mt-0.5"
              levels={capped.abilityLevels}
              under={under.abilities}
            />
          ) : null}
          {under?.any ? (
            <span
              className="text-xs text-amber-800 dark:text-amber-400"
              data-testid="team-lineup-under-cap"
            >
              {underCapText(under, rarityCap)}
            </span>
          ) : null}
          {marks.length > 0 ? (
            <span className="flex flex-wrap gap-1">
              {marks.map((mark) => (
                <Badge key={mark} variant="destructive">
                  {mark}
                </Badge>
              ))}
            </span>
          ) : null}
        </span>
        <span className="flex shrink-0 items-center gap-1">{actions}</span>
      </li>
    )
  }

  const removeButton = (
    unitId: string,
    kind: TeamUnitView["kind"],
    onRemove: (unitId: string) => void
  ) => {
    const name = unitName(kind === "mow" ? "Mow" : "Character", unitId)
    if (lockedIds.has(unitId)) {
      return (
        <span
          aria-label={t("lineup.campaignCore", { name })}
          className="grid size-8 place-items-center text-muted-foreground"
          role="img"
          title={t("lineup.campaignCore", { name })}
        >
          <Lock className="size-4" />
        </span>
      )
    }
    return (
      <Button
        aria-label={t("lineup.remove", { name })}
        onClick={() => onRemove(unitId)}
        size="icon"
        title={t("lineup.remove", { name })}
        type="button"
        variant="ghost"
      >
        <X />
      </Button>
    )
  }

  const characterActions = (unitId: string, isFlex: boolean) => (
    <>
      <RoleSwitch
        coreDisabled={isFlex && !canMakeCore(draft, unitId)}
        flexDisabled={lockedIds.has(unitId) || !canMakeFlex(draft, unitId)}
        name={unitName("Character", unitId)}
        onChange={(role) => (role === "flex" ? onMakeFlex : onMakeCore)(unitId)}
        role={isFlex ? "flex" : "core"}
      />
      {removeButton(unitId, "character", onRemoveCharacter)}
    </>
  )

  const mowActions = (unitId: string, isFlex: boolean) => (
    <>
      <RoleSwitch
        coreDisabled={isFlex && !canMakeMowCore(draft, unitId)}
        name={unitName("Mow", unitId)}
        onChange={(role) =>
          (role === "flex" ? onMakeMowFlex : onMakeMowCore)(unitId)
        }
        role={isFlex ? "flex" : "core"}
      />
      {removeButton(unitId, "mow", onRemoveMow)}
    </>
  )

  // The Flex heading is a sortable item too: what is after it is flex.
  const divider = (count: number, sortable: SortableRenderProps) => (
    <li
      className={cn(
        "flex items-center justify-center text-center",
        count === 0
          ? "my-1 min-h-14 flex-col gap-0.5 rounded-lg border-2 border-dashed border-muted-foreground/50 bg-muted/30 p-2"
          : "block"
      )}
      data-testid="team-lineup-flex-divider"
      key={FLEX_DIVIDER}
      ref={sortable.setNodeRef}
      style={sortable.style}
    >
      {count === 0 ? (
        <>
          <h5 className="text-sm font-semibold">{t("lineup.flex")}</h5>
          <span className="text-xs text-muted-foreground">
            {t("lineup.dropFlex")}
          </span>
        </>
      ) : (
        // A labelled rule: core above it, flex below.
        <ListDivider heading="h5" label={t("lineup.flex")} />
      )}
    </li>
  )
  const list = (
    kind: TeamUnitView["kind"],
    label: string,
    sections: { core: string[]; flex: string[] },
    actions: (unitId: string, isFlex: boolean) => React.ReactNode,
    onArrange: (order: string[]) => void
  ) => (
    <section aria-label={label} className="flex flex-col gap-1">
      <h4 className="text-sm font-medium">{label}</h4>
      <ul className="grid gap-1">
        <SortableList
          getId={(id) => id}
          getLabel={(id) =>
            id === FLEX_DIVIDER
              ? t("lineup.flex")
              : unitName(kind === "mow" ? "Mow" : "Character", id)
          }
          items={[...sections.core, FLEX_DIVIDER, ...sections.flex]}
          onReorder={(order) => onArrange(order)}
          renderItem={(id, sortable) => {
            if (id === FLEX_DIVIDER) {
              return divider(sections.flex.length, sortable)
            }
            const isFlex = sections.flex.includes(id)
            return row(
              kind,
              id,
              actions(id, isFlex),
              isFlex ? "flex" : "core",
              sortable
            )
          }}
        />
      </ul>
    </section>
  )

  return (
    <div className="flex flex-col gap-4" data-testid="team-editor-lineup">
      {empty ? (
        <p className="text-sm text-muted-foreground">{t("lineup.empty")}</p>
      ) : null}
      {draft.characterIds.length > 0
        ? list(
            "character",
            t("lineup.characters"),
            { core, flex },
            characterActions,
            onArrangeCharacters
          )
        : null}
      {draft.mowIds.length > 0
        ? list("mow", t("lineup.mows"), mows, mowActions, onArrangeMows)
        : null}
    </div>
  )
}
