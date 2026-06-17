import {
  Button,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@workspace/ui'

export function Open() {
  return (
    <Popover defaultOpen>
      <PopoverTrigger asChild>
        <Button variant="outline">Open settings</Button>
      </PopoverTrigger>
      <PopoverContent align="start">
        <PopoverHeader>
          <PopoverTitle>Dimensions</PopoverTitle>
          <PopoverDescription>Set the layout dimensions.</PopoverDescription>
        </PopoverHeader>
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Label htmlFor="w" style={{ width: 64 }}>
              Width
            </Label>
            <Input id="w" defaultValue="100%" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Label htmlFor="h" style={{ width: 64 }}>
              Height
            </Label>
            <Input id="h" defaultValue="24px" />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
