import {
  Button,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@workspace/ui'

// Mirrors apps/web/.../ui-kit/ui/overlays-showcase.tsx. Rendered open
// (defaultOpen) so the card shows the drawer panel; the card uses single mode
// + a fixed viewport so the bottom-anchored portal stays inside the frame.
export function Open() {
  return (
    <Drawer defaultOpen>
      <DrawerTrigger asChild>
        <Button variant="outline">Open drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Plan campaign energy</DrawerTitle>
          <DrawerDescription>
            Review daily energy allocation before saving the run plan.
          </DrawerDescription>
        </DrawerHeader>
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          className="px-4 pb-2 text-sm text-muted-foreground"
        >
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
  )
}
