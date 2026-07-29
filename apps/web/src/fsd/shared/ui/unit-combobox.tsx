import { useMemo, useRef, useState } from "react"
import { Bot, Check, ChevronsUpDown, Lock } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"

import { characterIcon } from "@workspace/game-catalog"
import type { FactionGroup, UnitId } from "@workspace/game-domain"

// Fixed-size avatar slot shared by the trigger and every list item, so Character and MoW rows line
// up identically regardless of entity type — rather than leaving a gap when an icon fails to resolve
// (the previous behavior), this always reserves the circle and falls back to a generic glyph, which
// covers a portrait 404ing (e.g. a MoW id whose slug needs its own override, see `mowIcon`) as well.
function ComboboxAvatar({
  src,
  className,
  locked,
}: {
  src?: string
  className?: string
  // Dims the portrait and overlays a lock glyph — purely visual, callers still decide whether a
  // locked unit is selectable (e.g. goal creation wants it pickable, to set up its Unlock goal).
  locked?: boolean
}) {
  const [failed, setFailed] = useState(false)

  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted",
        className
      )}
    >
      {src && !failed ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          className={cn("size-full object-cover", locked && "opacity-40")}
          onError={() => setFailed(true)}
        />
      ) : (
        <Bot
          aria-hidden
          className={cn(
            "size-1/2 text-muted-foreground",
            locked && "opacity-40"
          )}
        />
      )}
      {locked ? (
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/50">
          <Lock aria-hidden className="size-1/2 text-foreground/80" />
        </span>
      ) : null}
    </span>
  )
}

export function UnitCombobox({
  groups,
  value,
  onChange,
  placeholder,
  emptyText,
  // Defaults to the Character icon resolver; pass `mowIcon` (or any other) to reuse this same
  // combobox for a different entity type — it's otherwise generic over {id, name, faction} groups.
  icon = characterIcon,
  // Opt-in (undefined by default, e.g. Character Lookup never passes it): ids in this set render
  // dimmed with a lock overlay in both the trigger and the list, for callers (goal creation) where
  // knowing a unit isn't owned yet matters. Does not affect selectability.
  lockedIds,
}: {
  groups: FactionGroup[]
  value?: UnitId
  onChange: (id: UnitId) => void
  placeholder: string
  emptyText: string
  icon?: (id: UnitId) => string | undefined
  lockedIds?: ReadonlySet<UnitId>
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const triggerRef = useRef<HTMLButtonElement>(null)
  // Radix Dialog/Sheet's scroll lock only allows wheel/touch scroll inside its own content node —
  // a popover portaled to the default `document.body` is a sibling it doesn't recognize, so every
  // scroll attempt inside the list gets silently swallowed while a Sheet is open (see
  // `PopoverContent`'s `container` prop). Resolving the nearest enclosing Sheet content node (if
  // any) at open time and portaling into it keeps the popover inside the lock's own subtree; outside
  // a Sheet (e.g. the standalone lookup page) `closest` finds nothing and Radix falls back to its
  // own default.
  const [portalContainer, setPortalContainer] = useState<HTMLElement>()

  const selected = useMemo(() => {
    for (const group of groups) {
      const member = group.members.find((m) => m.id === value)
      if (member) return member
    }
    return undefined
  }, [groups, value])

  // cmdk's default filter fuzzy-scores every item on each keystroke and reorders the DOM to match
  // (it's built for VSCode-style command palettes) — for a plain "find this character" list that
  // reshuffles items unpredictably as you type and breaks the curated faction order. Filtering
  // ourselves with a stable, case-insensitive substring match (and `shouldFilter={false}` below to
  // stop cmdk from doing its own pass) keeps groups/members in a fixed order and only hides
  // non-matches.
  const filteredGroups = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return groups

    return groups
      .map((group) => {
        const factionMatches = group.factionName.toLowerCase().includes(query)
        const members = factionMatches
          ? group.members
          : group.members.filter((member) =>
              member.name.toLowerCase().includes(query)
            )
        return { ...group, members }
      })
      .filter((group) => group.members.length > 0)
  }, [groups, search])

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          setPortalContainer(
            (triggerRef.current?.closest(
              '[data-slot="sheet-content"]'
            ) as HTMLElement | null) ?? undefined
          )
        } else {
          setSearch("")
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={placeholder}
          className="w-full justify-between sm:w-72"
        >
          <span className="flex min-w-0 items-center gap-2">
            {selected && (
              <ComboboxAvatar
                src={icon(selected.id)}
                className="size-9"
                locked={lockedIds?.has(selected.id)}
              />
            )}
            <span
              className={cn(
                "truncate",
                selected &&
                  lockedIds?.has(selected.id) &&
                  "text-muted-foreground"
              )}
            >
              {selected ? selected.name : placeholder}
            </span>
          </span>
          <ChevronsUpDown className="shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" container={portalContainer}>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            {filteredGroups.map((group) => (
              <CommandGroup key={group.factionId} heading={group.factionName}>
                {group.members.map((member) => (
                  <CommandItem
                    key={member.id}
                    value={member.id}
                    onSelect={() => {
                      onChange(member.id)
                      setOpen(false)
                      setSearch("")
                    }}
                    className="gap-2"
                  >
                    <ComboboxAvatar
                      src={icon(member.id)}
                      className="size-9"
                      locked={lockedIds?.has(member.id)}
                    />
                    <span
                      className={cn(
                        "truncate",
                        lockedIds?.has(member.id) && "text-muted-foreground"
                      )}
                    >
                      {member.name}
                    </span>
                    <Check
                      className={cn(
                        "ml-auto shrink-0",
                        value === member.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
