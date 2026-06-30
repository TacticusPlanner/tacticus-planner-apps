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

import { characterIcon } from "@workspace/game-catalog"

import type { FactionGroup } from "@/entities/faction"

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

  const selected = useMemo(() => {
    for (const group of groups) {
      const member = group.members.find((m) => m.id === value)
      if (member) return member
    }
    return undefined
  }, [groups, value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
                className="size-6 shrink-0 rounded-full"
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
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            {groups.map((group) => (
              <CommandGroup key={group.factionId} heading={group.factionName}>
                {group.members.map((member) => (
                  <CommandItem
                    key={member.id}
                    // cmdk filters by `value`; include the faction so typing a faction also matches.
                    value={`${member.name} ${group.factionName}`}
                    onSelect={() => {
                      onChange(member.id)
                      setOpen(false)
                    }}
                    className="gap-2"
                  >
                    <EntityIcon
                      src={characterIcon(member.id)}
                      alt=""
                      className="size-6 shrink-0 rounded-full"
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
