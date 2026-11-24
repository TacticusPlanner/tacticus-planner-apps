import {
  Archive,
  ChevronsUpDown,
  Info,
  PanelLeftOpen,
  Pencil,
} from "lucide-react"

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
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@workspace/ui/components/drawer"
import { IconButton } from "@workspace/ui/components/icon-button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

import {
  energyIconUrl,
  EntityIcon,
  HintTrigger,
  SegmentedControl,
  TruncatedText,
} from "@/shared/ui"

import { UiKitShowcaseCard } from "./ui-kit-showcase-card"

const LONG_TEAM_NAME =
  "Ultramarines and friends for the Tyranid mythic boss, second phase"

export function OverlaysShowcase() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <UiKitShowcaseCard title="Tooltip and dialog">
        <div className="flex flex-wrap gap-3" data-testid="overlay-dialogs">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Hover for details</Button>
            </TooltipTrigger>
            <TooltipContent>Tooltips describe compact controls.</TooltipContent>
          </Tooltip>

          <Dialog>
            <DialogTrigger asChild>
              <Button>Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm action</DialogTitle>
                <DialogDescription>
                  Dialogs include a title and description for accessibility.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button>Save</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </UiKitShowcaseCard>

      <UiKitShowcaseCard
        description="Hover or focus on desktop. On touch, a tap does what the control is for: an icon button runs its action (long-press shows its name), a disabled reason shows on tap, and a hint opens a popover."
        title="Tooltips"
      >
        <div className="flex flex-col gap-4" data-testid="overlay-tooltips">
          <div className="flex flex-wrap items-center gap-3">
            <IconButton label="Edit team">
              <Pencil />
            </IconButton>
            <IconButton label="Expand navigation" shortcut="Ctrl+B">
              <PanelLeftOpen />
            </IconButton>
            <IconButton
              disabledReason="Move or delete its goals first."
              label="Archive project"
              variant="destructive"
            >
              <Archive />
            </IconButton>
            <HintTrigger label="Energy">
              <EntityIcon alt="" size="inline" src={energyIconUrl} />
              <span className="text-sm tabular-nums">120</span>
            </HintTrigger>
            <HintTrigger label="Counts only goals in active projects.">
              <Info className="size-icon-sm text-muted-foreground" />
            </HintTrigger>
          </div>
          <div className="w-48 text-sm">
            <TruncatedText>{LONG_TEAM_NAME}</TruncatedText>
          </div>
          <SegmentedControl
            label="Layout"
            onValueChange={() => {}}
            options={[
              { value: "cards", label: "Cards", hint: "One card per team" },
              { value: "table", label: "Table", hint: "One row per team" },
              {
                value: "map",
                label: "Map",
                disabledReason: "Needs a synced roster.",
              },
            ]}
            value="cards"
          />
        </div>
      </UiKitShowcaseCard>

      <UiKitShowcaseCard title="Popover command">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              aria-expanded="false"
              className="w-56 justify-between"
              data-testid="popover-command-trigger"
              role="combobox"
              variant="outline"
            >
              Select component
              <ChevronsUpDown data-icon="inline-end" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-0">
            <Command>
              <CommandInput placeholder="Search components..." />
              <CommandList>
                <CommandEmpty>No component found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem>Button</CommandItem>
                  <CommandItem>Dialog</CommandItem>
                  <CommandItem>Table</CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </UiKitShowcaseCard>

      <UiKitShowcaseCard title="Drawer">
        <div className="flex flex-col gap-3" data-testid="overlay-drawer">
          <p className="text-sm text-muted-foreground">
            Drawers work well for mobile-first task panels.
          </p>
          <Drawer>
            <DrawerTrigger asChild>
              <Button data-testid="drawer-trigger" variant="outline">
                Open drawer
              </Button>
            </DrawerTrigger>
            <DrawerContent data-testid="drawer-content">
              <DrawerHeader>
                <DrawerTitle>Plan campaign energy</DrawerTitle>
                <DrawerDescription>
                  Review daily energy allocation before saving the run plan.
                </DrawerDescription>
              </DrawerHeader>
              <div className="flex flex-col gap-3 px-4 pb-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-1.5">
                  <EntityIcon
                    size="inline"
                    alt=""
                    className="shrink-0"
                    src={energyIconUrl}
                  />
                  Indomitus: 120 energy
                </p>
                <p className="flex items-center gap-1.5">
                  <EntityIcon
                    size="inline"
                    alt=""
                    className="shrink-0"
                    src={energyIconUrl}
                  />
                  Octarius Mirror: 60 energy
                </p>
                <p className="flex items-center gap-1.5">
                  <EntityIcon
                    size="inline"
                    alt=""
                    className="shrink-0"
                    src={energyIconUrl}
                  />
                  Event nodes: 50 energy
                </p>
              </div>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button>Save plan</Button>
                </DrawerClose>
                <DrawerClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </UiKitShowcaseCard>
    </div>
  )
}
