import { Label, Switch } from '@workspace/ui'

const row = { display: 'flex', gap: 10, alignItems: 'center' }

export function States() {
  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={row}>
        <Switch id="s1" />
        <Label htmlFor="s1">Off</Label>
      </div>
      <div style={row}>
        <Switch id="s2" defaultChecked />
        <Label htmlFor="s2">On</Label>
      </div>
      <div style={row}>
        <Switch id="s3" disabled />
        <Label htmlFor="s3">Disabled</Label>
      </div>
    </div>
  )
}

export function SettingRow() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: 340,
        gap: 16,
      }}
    >
      <div style={{ display: 'grid', gap: 2 }}>
        <Label htmlFor="2fa">Two-factor authentication</Label>
        <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
          Require a code at sign-in.
        </span>
      </div>
      <Switch id="2fa" defaultChecked />
    </div>
  )
}
