import { useMemo, useRef, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Check, ChevronsUpDown } from "lucide-react"
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

import { rarityRank, type Rarity } from "@workspace/game-domain"

/** Overrides an item's default rarity-based group (heading + sort position) — e.g. relic
 * equipment sorting into its own group above Mythic instead of being grouped by its raw rarity. */
type RarityComboboxGroupOverride = {
  /** Unique key for this group, distinct from any real `Rarity` string. */
  key: string
  label: string
  /** Sort rank — higher sorts first, same convention as `rarityRank`. */
  rank: number
}

export type RarityComboboxItem<TId extends string> = {
  id: TId
  name: string
  rarity: Rarity
  group?: RarityComboboxGroupOverride
  /** Optional trailing hint per item (e.g. a required-quantity badge). */
  meta?: ReactNode
}

/** Generic id/name/rarity picker — the same searchable-combobox behavior as `UnitCombobox`
 * (search, Sheet-safe portal), but grouped by rarity (highest first) instead of faction — an item
 * can override its group via `RarityComboboxItem.group` (e.g. relic equipment sorting into its own
 * group above Mythic). Shared by the Upgrade and Equipment pickers. */
export function RarityCombobox<TId extends string>({
  items,
  value,
  onChange,
  placeholder,
  emptyText,
  renderIcon,
}: {
  items: RarityComboboxItem<TId>[]
  value?: TId
  onChange: (id: TId) => void
  placeholder: string
  emptyText: string
  /** Optional per-item leading visual — the combobox reserves no fixed avatar slot itself, since
   * callers need different shapes (a layered `UpgradeIcon`, a generic fallback for Equipment, …). */
  renderIcon?: (id: TId) => ReactNode
}) {
  const { t } = useTranslation(["progression"])
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const triggerRef = useRef<HTMLButtonElement>(null)
  // Same Sheet-scroll-lock fix as UnitCombobox's own copy — see that file's doc comment.
  const [portalContainer, setPortalContainer] = useState<HTMLElement>()

  const groups = useMemo(() => {
    const byKey = new Map<
      string,
      {
        key: string
        label: string
        rank: number
        members: RarityComboboxItem<TId>[]
      }
    >()
    for (const item of items) {
      const key = item.group?.key ?? item.rarity
      const existing = byKey.get(key)
      if (existing) {
        existing.members.push(item)
        continue
      }
      byKey.set(key, {
        key,
        label:
          item.group?.label ??
          t(`rarities.${item.rarity}`, { defaultValue: item.rarity }),
        rank: item.group?.rank ?? rarityRank(item.rarity),
        members: [item],
      })
    }
    return [...byKey.values()].sort((a, b) => b.rank - a.rank)
  }, [items, t])

  const selected = useMemo(
    () => items.find((item) => item.id === value),
    [items, value]
  )

  // Same reasoning as UnitCombobox: a stable substring filter instead of cmdk's own fuzzy
  // reordering, so groups/members stay in a fixed order and only hide non-matches.
  const filteredGroups = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return groups

    return groups
      .map((group) => {
        const labelMatches = group.label.toLowerCase().includes(query)
        const members = labelMatches
          ? group.members
          : group.members.filter((item) =>
              item.name.toLowerCase().includes(query)
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
            {selected && renderIcon ? renderIcon(selected.id) : null}
            <span className="truncate">
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
              <CommandGroup key={group.key} heading={group.label}>
                {group.members.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => {
                      onChange(item.id)
                      setOpen(false)
                      setSearch("")
                    }}
                    className="gap-2"
                  >
                    {renderIcon ? renderIcon(item.id) : null}
                    <span className="min-w-0 flex-1 truncate">{item.name}</span>
                    {item.meta}
                    <Check
                      className={cn(
                        "ml-auto shrink-0",
                        value === item.id ? "opacity-100" : "opacity-0"
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
