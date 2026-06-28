import { useState } from "react"
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

import { characterIcon } from "@/entities/character"

import { EntityIcon } from "./entity-icon"

export type CharacterOption = { id: string; name: string }

export function CharacterCombobox({
  options,
  value,
  onChange,
  placeholder,
  emptyText,
}: {
  options: CharacterOption[]
  value?: string
  onChange: (id: string) => void
  placeholder: string
  emptyText: string
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.id === value)

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
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.name}
                  onSelect={() => {
                    onChange(option.id)
                    setOpen(false)
                  }}
                  className="gap-2"
                >
                  <EntityIcon
                    src={characterIcon(option.id)}
                    alt=""
                    className="size-6 shrink-0 rounded-full"
                  />
                  <span className="truncate">{option.name}</span>
                  <Check
                    className={cn(
                      "ml-auto shrink-0",
                      value === option.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
