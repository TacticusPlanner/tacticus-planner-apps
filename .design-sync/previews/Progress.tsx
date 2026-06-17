import { Progress } from '@workspace/ui'

export function Steps() {
  return (
    <div style={{ display: 'grid', gap: 16, width: 320 }}>
      <Progress value={0} />
      <Progress value={33} />
      <Progress value={66} />
      <Progress value={100} />
    </div>
  )
}

export function Labeled() {
  return (
    <div style={{ display: 'grid', gap: 6, width: 320 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
        <span>Uploading…</span>
        <span style={{ color: 'var(--muted-foreground)' }}>72%</span>
      </div>
      <Progress value={72} />
    </div>
  )
}
