import { Input, Label } from '@workspace/ui'

export function Default() {
  return <Input placeholder="you@example.com" style={{ width: 280 }} />
}

export function WithLabel() {
  return (
    <div style={{ display: 'grid', gap: 6, width: 280 }}>
      <Label htmlFor="email">Email address</Label>
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
  )
}

export function States() {
  return (
    <div style={{ display: 'grid', gap: 12, width: 280 }}>
      <Input placeholder="Default" />
      <Input defaultValue="Filled value" />
      <Input placeholder="Disabled" disabled />
      <Input placeholder="Invalid" aria-invalid />
    </div>
  )
}

export function Types() {
  return (
    <div style={{ display: 'grid', gap: 12, width: 280 }}>
      <Input type="password" defaultValue="supersecret" />
      <Input type="number" defaultValue={42} />
      <Input type="file" />
    </div>
  )
}
