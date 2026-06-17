import { Checkbox, Label } from '@workspace/ui'

const row = { display: 'flex', gap: 10, alignItems: 'center' }

export function States() {
  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={row}>
        <Checkbox id="c1" />
        <Label htmlFor="c1">Unchecked</Label>
      </div>
      <div style={row}>
        <Checkbox id="c2" defaultChecked />
        <Label htmlFor="c2">Checked</Label>
      </div>
      <div style={row}>
        <Checkbox id="c3" disabled />
        <Label htmlFor="c3">Disabled</Label>
      </div>
      <div style={row}>
        <Checkbox id="c4" disabled defaultChecked />
        <Label htmlFor="c4">Disabled checked</Label>
      </div>
    </div>
  )
}

export function WithDescription() {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', maxWidth: 360 }}>
      <Checkbox id="terms" defaultChecked />
      <div style={{ display: 'grid', gap: 4 }}>
        <Label htmlFor="terms">Accept terms and conditions</Label>
        <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: 0 }}>
          You agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
