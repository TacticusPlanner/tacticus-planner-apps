import { ChevronsUpDown } from "lucide-react"

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

import { UiKitShowcaseCard } from "./ui-kit-showcase-card"

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
                <p>Indomitus: 120 energy</p>
                <p>Octarius Mirror: 60 energy</p>
                <p>Event nodes: 50 energy</p>
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
