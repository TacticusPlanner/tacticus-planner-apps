import { Checkbox, Input, Label } from '@workspace/ui'

export function Default() {
  return <Label>Email address</Label>
}

export function WithInput() {
  return (
    <div style={{ display: 'grid', gap: 6, width: 280 }}>
      <Label htmlFor="username">Username</Label>
      <Input id="username" placeholder="tacticus" />
    </div>
  )
}

export function WithControl() {
  return (
    <Label htmlFor="newsletter" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Checkbox id="newsletter" defaultChecked />
      Subscribe to the newsletter
    </Label>
  )
}
