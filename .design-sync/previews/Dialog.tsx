import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
} from '@workspace/ui'

export function Open() {
  return (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button variant="outline">Edit profile</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div style={{ display: 'grid', gap: 12, padding: '4px 0' }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <Label htmlFor="dlg-name">Name</Label>
            <Input id="dlg-name" defaultValue="Ada Lovelace" />
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <Label htmlFor="dlg-user">Username</Label>
            <Input id="dlg-user" defaultValue="@ada" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
