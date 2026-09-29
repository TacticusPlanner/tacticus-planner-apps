import { useMemo, useRef, useState } from "react"
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

import { RaidBossPortrait, type RaidBossListItem } from "@/entities/raid-boss"

export type RaidBossMobilePickerGroup = {
  boss: RaidBossListItem
  primes: RaidBossListItem[]
}

/**
 * The mobile roster picker — a Popover + cmdk `Command` combobox mirroring `UnitCombobox`
 * (`shared/ui/unit-combobox.tsx`): stable substring filter (`shouldFilter={false}`), Sheet-portal
 * handling, one `CommandGroup` per boss with the boss entry followed by its primes. Raid-boss
 * `unitSetId`s are plain strings (not `UnitId`), so this is page-local rather than a widened
 * `UnitCombobox` — see design.md Decision 2.
 */
export function RaidBossMobilePicker({
  rosterGroups,
  selectedId,
  onSelect,
}: {
  rosterGroups: RaidBossMobilePickerGroup[]
  selectedId: string | undefined
  onSelect: (unitSetId: string) => void
}) {
  const { t } = useTranslation("library")
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const triggerRef = useRef<HTMLButtonElement>(null)
  // See `unit-combobox.tsx` — portals into the enclosing Sheet's content node (when there is one) so
  // the popover stays inside Radix's scroll lock instead of being a silently-unscrollable sibling.
  const [portalContainer, setPortalContainer] = useState<HTMLElement>()

  const selected = useMemo(() => {
    for (const group of rosterGroups) {
      if (group.boss.unitSetId === selectedId) return group.boss
      const prime = group.primes.find((item) => item.unitSetId === selectedId)
      if (prime) return prime
    }
    return undefined
  }, [rosterGroups, selectedId])

  // Same rationale as `UnitCombobox.filteredGroups`: a stable, case-insensitive substring filter
  // instead of cmdk's default fuzzy re-sort, so group/member order never shuffles while typing.
  const filteredGroups = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return rosterGroups.map((group) => ({
        boss: group.boss,
        members: [group.boss, ...group.primes],
      }))
    }

    return rosterGroups
      .map((group) => {
        const bossMatches = group.boss.name.toLowerCase().includes(query)
        const members = bossMatches
          ? [group.boss, ...group.primes]
          : [group.boss, ...group.primes].filter((member) =>
              member.name.toLowerCase().includes(query)
            )
        return { boss: group.boss, members }
      })
      .filter((group) => group.members.length > 0)
  }, [rosterGroups, search])

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
          aria-label={t("raidBosses.pickerPlaceholder")}
          data-testid="raid-boss-mobile-picker"
          className="w-full justify-between"
        >
          <span className="flex min-w-0 items-center gap-2">
            {selected ? (
              <RaidBossPortrait
                name={selected.name}
                src={selected.portraitSrc}
                className="size-9"
              />
            ) : null}
            <span className="truncate">
              {selected ? selected.name : t("raidBosses.pickerPlaceholder")}
            </span>
          </span>
          <ChevronsUpDown className="shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[calc(100vw-2rem)] p-0 sm:w-80"
        container={portalContainer}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t("raidBosses.pickerPlaceholder")}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>{t("raidBosses.pickerEmpty")}</CommandEmpty>
            {filteredGroups.map((group) => (
              <CommandGroup
                key={group.boss.unitSetId}
                heading={group.boss.name}
              >
                {group.members.map((member) => (
                  <CommandItem
                    key={member.unitSetId}
                    value={member.unitSetId}
                    onSelect={() => {
                      onSelect(member.unitSetId)
                      setOpen(false)
                      setSearch("")
                    }}
                    className="gap-2"
                  >
                    <RaidBossPortrait
                      name={member.name}
                      src={member.portraitSrc}
                      className="size-9"
                    />
                    <span className="truncate">{member.name}</span>
                    <Check
                      className={cn(
                        "ml-auto shrink-0",
                        member.unitSetId === selectedId
                          ? "opacity-100"
                          : "opacity-0"
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
