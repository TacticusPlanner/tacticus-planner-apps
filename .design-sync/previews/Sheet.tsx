import {
  Button,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@workspace/ui'

// A right-side sheet, rendered open (defaultOpen) so the card shows the panel
// over its overlay. Single-mode card + fixed viewport keeps the portal framed.
export function Open() {
  return (
    <Sheet defaultOpen>
      <SheetTrigger asChild>
        <Button variant="outline">Open sheet</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Roster filters</SheetTitle>
          <SheetDescription>
            Narrow the roster by alliance, rarity, and rank.
          </SheetDescription>
        </SheetHeader>
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          className="px-6 text-sm text-muted-foreground"
        >
          <p>Alliance: Imperial</p>
          <p>Rarity: Legendary+</p>
          <p>Rank: Diamond 1+</p>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button>Apply filters</Button>
          </SheetClose>
          <SheetClose asChild>
            <Button variant="outline">Reset</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
