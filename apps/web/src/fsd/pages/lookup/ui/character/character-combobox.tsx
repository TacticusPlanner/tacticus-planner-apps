import { useMemo, useState } from "react"
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

import { characterIcon, type FactionGroup } from "@workspace/game-catalog"

import { EntityIcon } from "@/shared/ui"

export function CharacterCombobox({
  groups,
  value,
  onChange,
  placeholder,
  emptyText,
}: {
  groups: FactionGroup[]
  value?: string
  onChange: (id: string) => void
  placeholder: string
  emptyText: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

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
        if (!next) setSearch("")
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={placeholder}
          className="w-full justify-between sm:w-72"
        >
          <span className="flex min-w-0 items-center gap-2">
            {selected && (
              <EntityIcon
                src={characterIcon(selected.id)}
                alt=""
                className="size-9 shrink-0 rounded-full"
              />
            )}
            <span className="truncate">
              {selected ? selected.name : placeholder}
            </span>
          </span>
          <ChevronsUpDown className="shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0">
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
                    <EntityIcon
                      src={characterIcon(member.id)}
                      alt=""
                      className="size-9 shrink-0 rounded-full"
                    />
                    <span className="truncate">{member.name}</span>
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
